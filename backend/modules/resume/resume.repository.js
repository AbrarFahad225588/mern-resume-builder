import { query, withTransaction } from "../../db/pool.js";
import {
  SECTIONS,
  newResumeId,
  normalizeSectionRow,
  toContactRow,
  toResumeDocument,
  toResumeRow,
} from "./resume.model.js";

/**
 * Data access for resumes — raw parameterised SQL over the resumes parent
 * table, the resume_contact child table, and the seven repeatable-section tables.
 *
 * Every multi-table write runs in a transaction so a resume can never be left
 * with a saved parent row but stale or partially written contact / sections.
 */

const RESUME_COLUMNS = `id, user_id, template_id, title, summary, picture_url,
  pi_fullname, pi_role, pi_about,
  created_at, updated_at`;

const CONTACT_COLUMNS = `resume_id,
  email, phone, location, address, website, linkedin, twitter, github`;

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Loads all sections for a set of resumes in one query per section table.
 *
 * One query per section table for the whole page rather than per resume:
 * fetching sections inside a loop over N resumes is the classic N+1 that turns
 * a 10-resume list into 61 round trips.
 */
const loadSectionsFor = async (resumeIds, runner = query) => {
  const byResume = new Map(resumeIds.map((id) => [id, {}]));
  if (resumeIds.length === 0) return byResume;

  const placeholders = resumeIds.map(() => "?").join(", ");

  for (const section of SECTIONS) {
    const columns = section.fields.join(", ");
    const rows = await runner(
      `SELECT resume_id, ${columns}
         FROM ${section.table}
        WHERE resume_id IN (${placeholders})
        ORDER BY resume_id, position ASC`,
      resumeIds,
    );

    for (const id of resumeIds) {
      byResume.get(id)[section.key] = [];
    }
    for (const row of rows) {
      byResume.get(row.resume_id)?.[section.key].push(row);
    }
  }

  return byResume;
};

/**
 * Loads the contact row for each resume id in one query.
 * Returns a Map<resumeId, contactRow|null>.
 */
const loadContactFor = async (resumeIds, runner = query) => {
  const byResume = new Map(resumeIds.map((id) => [id, null]));
  if (resumeIds.length === 0) return byResume;

  const placeholders = resumeIds.map(() => "?").join(", ");
  const rows = await runner(
    `SELECT ${CONTACT_COLUMNS}
       FROM resume_contact
      WHERE resume_id IN (${placeholders})`,
    resumeIds,
  );

  for (const row of rows) {
    byResume.set(row.resume_id, row);
  }

  return byResume;
};

/**
 * Upserts the contact row for one resume inside an open transaction.
 *
 * INSERT ... ON DUPLICATE KEY UPDATE is safe here because (resume_id) has a
 * UNIQUE constraint, so at most one row is ever matched.
 */
const replaceContact = async (connection, resumeId, payload, existing = null) => {
  // If the payload carries no contact key at all, leave the existing row untouched
  // so a partial update (e.g. renaming a resume) cannot wipe contact details.
  if (payload.contact === undefined) return;

  const c = toContactRow(payload, existing);

  await connection.execute(
    `INSERT INTO resume_contact
       (resume_id, email, phone, location, address, website, linkedin, twitter, github)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
       email    = VALUES(email),
       phone    = VALUES(phone),
       location = VALUES(location),
       address  = VALUES(address),
       website  = VALUES(website),
       linkedin = VALUES(linkedin),
       twitter  = VALUES(twitter),
       github   = VALUES(github)`,
    [
      resumeId,
      c.email, c.phone, c.location, c.address,
      c.website, c.linkedin, c.twitter, c.github,
    ],
  );
};

/** Replaces every section row for one resume, preserving array order. */
const replaceSections = async (connection, resumeId, payload) => {
  for (const section of SECTIONS) {
    const incoming = payload[section.key];
    // `undefined` means "not supplied" — leave the existing rows untouched so a
    // partial update cannot wipe sections.
    if (incoming === undefined) continue;

    await connection.execute(
      `DELETE FROM ${section.table} WHERE resume_id = ?`,
      [resumeId],
    );

    const rows = Array.isArray(incoming) ? incoming : [];
    if (rows.length === 0) continue;

    const columns = ["resume_id", "position", ...section.fields];
    const tuple = `(${columns.map(() => "?").join(", ")})`;
    const values = [];
    for (const [index, row] of rows.entries()) {
      const clean = normalizeSectionRow(section, row);
      values.push(resumeId, index, ...section.fields.map((f) => clean[f]));
    }

    await connection.query(
      `INSERT INTO ${section.table} (${columns.join(", ")})
       VALUES ${rows.map(() => tuple).join(", ")}`,
      values,
    );
  }
};

// ---------------------------------------------------------------------------
// Public repository functions
// ---------------------------------------------------------------------------

export const findAllByUser = async (userId) => {
  const rows = await query(
    `SELECT ${RESUME_COLUMNS}
       FROM resumes
      WHERE user_id = ?
      ORDER BY updated_at DESC`,
    [userId],
  );
  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.id);
  const [sections, contacts] = await Promise.all([
    loadSectionsFor(ids),
    loadContactFor(ids),
  ]);

  return rows.map((row) =>
    toResumeDocument(row, contacts.get(row.id), sections.get(row.id)),
  );
};

/**
 * Fetches one resume, scoped to its owner.
 *
 * `user_id` is part of the WHERE clause rather than checked afterwards: that
 * way another user's resume is indistinguishable from a missing one, so the
 * endpoint cannot be used to probe which ids exist.
 */
export const findByIdForUser = async (id, userId) => {
  const rows = await query(
    `SELECT ${RESUME_COLUMNS}
       FROM resumes
      WHERE id = ? AND user_id = ?
      LIMIT 1`,
    [id, userId],
  );
  if (rows.length === 0) return null;

  const [sections, contacts] = await Promise.all([
    loadSectionsFor([id]),
    loadContactFor([id]),
  ]);

  return toResumeDocument(rows[0], contacts.get(id), sections.get(id));
};

export const create = async (userId, payload) => {
  const id = newResumeId();
  const row = toResumeRow(payload);

  await withTransaction(async (connection) => {
    await connection.execute(
      `INSERT INTO resumes
         (id, user_id, template_id, title, summary,
          pi_fullname, pi_role, pi_about)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, userId,
        row.template_id, row.title, row.summary,
        row.pi_fullname, row.pi_role, row.pi_about,
      ],
    );

    // Always write a contact row on create (even if all fields are blank) so
    // the UNIQUE constraint is satisfied and subsequent upserts always hit
    // the UPDATE branch rather than failing on a missing row.
    await replaceContact(connection, id, { contact: payload.contact ?? {} });

    const sectionPayload = {};
    for (const section of SECTIONS) {
      sectionPayload[section.key] = payload[section.key] ?? [];
    }
    await replaceSections(connection, id, sectionPayload);
  });

  return findByIdForUser(id, userId);
};

export const update = async (id, userId, payload) => {
  const existing = await findByIdForUser(id, userId);
  if (!existing) return null;

  const row = toResumeRow(payload, existing);

  await withTransaction(async (connection) => {
    await connection.execute(
      `UPDATE resumes
          SET template_id = ?, title = ?, summary = ?,
              pi_fullname = ?, pi_role = ?, pi_about = ?,
              updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ? AND user_id = ?`,
      [
        row.template_id, row.title, row.summary,
        row.pi_fullname, row.pi_role, row.pi_about,
        id, userId,
      ],
    );

    await replaceContact(connection, id, payload, existing);
    await replaceSections(connection, id, payload);
  });

  return findByIdForUser(id, userId);
};

/**
 * Stores the uploaded picture URL for a resume.
 *
 * Deliberately a separate statement from the main update: the file upload
 * endpoint is the only path that may change picture_url, so mixing it into
 * the regular save would let any save clear a photo if the client omits the
 * field.
 */
export const updatePicture = async (id, userId, pictureUrl) => {
  const result = await query(
    `UPDATE resumes
        SET picture_url = ?, updated_at = CURRENT_TIMESTAMP(3)
      WHERE id = ? AND user_id = ?`,
    [pictureUrl, id, userId],
  );
  if (result.affectedRows === 0) return null;
  return findByIdForUser(id, userId);
};

/**
 * Deletes a resume. The contact row and all section rows disappear via
 * ON DELETE CASCADE, so there is no chance of orphaned rows.
 */
export const remove = async (id, userId) => {
  const result = await query(
    `DELETE FROM resumes WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
  return result.affectedRows > 0;
};
