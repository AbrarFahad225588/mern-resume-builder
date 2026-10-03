import { query, withTransaction } from "../../db/pool.js";
import {
  SECTIONS,
  newResumeId,
  normalizeSectionRow,
  toResumeDocument,
  toResumeRow,
} from "./resume.model.js";

/**
 * Data access for resumes — raw parameterised SQL over seven tables.
 *
 * Every multi-table write runs in a transaction so a resume can never be left
 * with a saved parent row but stale or partially written sections.
 */

const RESUME_COLUMNS = `id, user_id, template_id, title, summary, skills,
  pi_fullname, pi_email, pi_phone, pi_location, pi_website, pi_about, pi_role,
  created_at, updated_at`;

/**
 * Loads all sections for a set of resumes.
 *
 * One query per section table for the whole page rather than per resume:
 * fetching sections inside a loop over N resumes is the classic N+1 that turns
 * a 10-resume list into 61 round trips.
 *
 * The `IN (...)` placeholders are generated from the array length only — never
 * from user input — so this stays fully parameterised.
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

/** Replaces every section row for one resume, preserving array order. */
const replaceSections = async (connection, resumeId, payload) => {
  for (const section of SECTIONS) {
    const incoming = payload[section.key];
    // `undefined` means "not supplied" — leave the existing rows untouched so a
    // partial update (e.g. renaming a resume) cannot wipe its sections.
    if (incoming === undefined) continue;

    await connection.execute(
      `DELETE FROM ${section.table} WHERE resume_id = ?`,
      [resumeId],
    );

    const rows = Array.isArray(incoming) ? incoming : [];
    if (rows.length === 0) continue;

    // Delete-then-insert rather than diffing: the editor sends the whole array
    // and rows carry no stable id, so a positional rewrite is both simpler and
    // exactly what makes drag-and-drop order durable.
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

export const findAllByUser = async (userId) => {
  const rows = await query(
    `SELECT ${RESUME_COLUMNS}
       FROM resumes
      WHERE user_id = ?
      ORDER BY updated_at DESC`,
    [userId],
  );
  if (rows.length === 0) return [];

  const sections = await loadSectionsFor(rows.map((r) => r.id));
  return rows.map((row) => toResumeDocument(row, sections.get(row.id)));
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

  const sections = await loadSectionsFor([id]);
  return toResumeDocument(rows[0], sections.get(id));
};

export const create = async (userId, payload) => {
  const id = newResumeId();
  const row = toResumeRow(payload);

  await withTransaction(async (connection) => {
    await connection.execute(
      `INSERT INTO resumes
         (id, user_id, template_id, title, summary, skills,
          pi_fullname, pi_email, pi_phone, pi_location, pi_website,
          pi_about, pi_role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        userId,
        row.template_id,
        row.title,
        row.summary,
        row.skills,
        row.pi_fullname,
        row.pi_email,
        row.pi_phone,
        row.pi_location,
        row.pi_website,
        row.pi_about,
        row.pi_role,
      ],
    );

    // Sections default to [] on create so a new resume starts with all six
    // arrays present, matching the old document defaults.
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

  // Merged against the current document so a partial payload behaves like the
  // old `$set`: unspecified fields keep their stored value.
  const row = toResumeRow(payload, existing);

  await withTransaction(async (connection) => {
    await connection.execute(
      `UPDATE resumes
          SET template_id = ?, title = ?, summary = ?, skills = ?,
              pi_fullname = ?, pi_email = ?, pi_phone = ?, pi_location = ?,
              pi_website = ?, pi_about = ?, pi_role = ?,
              -- Refreshed on every write. The old schema needed a Mongoose
              -- hook for this; here it is simply part of the statement, so the
              -- "most recently edited first" ordering cannot silently break.
              updated_at = CURRENT_TIMESTAMP(3)
        WHERE id = ? AND user_id = ?`,
      [
        row.template_id,
        row.title,
        row.summary,
        row.skills,
        row.pi_fullname,
        row.pi_email,
        row.pi_phone,
        row.pi_location,
        row.pi_website,
        row.pi_about,
        row.pi_role,
        id,
        userId,
      ],
    );

    await replaceSections(connection, id, payload);
  });

  return findByIdForUser(id, userId);
};

/**
 * Deletes a resume. Section rows disappear via ON DELETE CASCADE, so there is
 * no chance of orphaned rows if this is interrupted.
 */
export const remove = async (id, userId) => {
  const result = await query(
    `DELETE FROM resumes WHERE id = ? AND user_id = ?`,
    [id, userId],
  );
  return result.affectedRows > 0;
};
