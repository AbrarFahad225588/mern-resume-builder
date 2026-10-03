import { query, withTransaction } from "../../db/pool.js";
import { toTemplateDocument, toTemplateRow } from "./template.model.js";

/**
 * Data access for templates — raw parameterised SQL.
 */

const TEMPLATE_COLUMNS = `id, slug, name, layout_style, category, description,
  tags, styling, preview_image, has_photo, columns, style, occupation,
  is_active, version, popularity,
  created_at, updated_at`;

export const findAllActive = async () => {
  const rows = await query(
    `SELECT ${TEMPLATE_COLUMNS}
       FROM templates
      WHERE is_active = 1
      ORDER BY name DESC`,
    [],
  );
  return rows.map(toTemplateDocument);
};

/**
 * Looks up an active template by surrogate id *or* slug.
 *
 * Accepting both keeps older links working: the previous API matched on
 * Mongo's `_id`, while the UI navigates using the slug.
 */
export const findActiveByIdOrSlug = async (identifier) => {
  const rows = await query(
    `SELECT ${TEMPLATE_COLUMNS}
       FROM templates
      WHERE (id = ? OR slug = ?) AND is_active = 1
      LIMIT 1`,
    [identifier, identifier],
  );
  return toTemplateDocument(rows[0]);
};

/**
 * Replaces the whole catalogue in one transaction.
 *
 * Matching the previous deleteMany + insertMany semantics, but atomically: if
 * an insert fails the old catalogue is rolled back intact, rather than leaving
 * the app with zero templates.
 */
export const replaceAll = async (templates) => {
  const rows = templates.map(toTemplateRow);

  await withTransaction(async (connection) => {
    // DELETE, not TRUNCATE: TRUNCATE performs an implicit commit, which would
    // silently end the transaction and make a rollback impossible.
    await connection.execute(`DELETE FROM templates`);

    for (const row of rows) {
      await connection.execute(
        `INSERT INTO templates
           (id, slug, name, layout_style, category, description,
            tags, styling, preview_image, has_photo, columns, style, occupation,
            is_active, version, popularity)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id,
          row.slug,
          row.name,
          row.layout_style,
          row.category,
          row.description,
          row.tags,
          row.styling,
          row.preview_image,
          row.has_photo,
          row.columns,
          row.style,
          row.occupation,
          row.is_active,
          row.version,
          row.popularity,
        ],
      );
    }
  });

  return rows.length;
};

export const countAll = async () => {
  const rows = await query(`SELECT COUNT(*) AS total FROM templates`, []);
  return Number(rows[0]?.total ?? 0);
};
