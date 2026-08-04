import crypto from "node:crypto";

/**
 * The Template model. Templates are read-heavy reference data: the catalogue is
 * seeded, then only ever listed and fetched by the UI.
 */

export const newTemplateId = () => crypto.randomUUID();

export const TEMPLATE_CATEGORIES = Object.freeze([
  "Corporate",
  "Executive",
  "Tech",
  "Creative",
]);

/**
 * MySQL returns JSON columns already parsed, but a column written as a JSON
 * *string* comes back as a string. Normalising both cases here stops a
 * `tags.map is not a function` crash in the UI.
 */
const parseJson = (value, fallback) => {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

/**
 * Row -> the template document the API returns.
 *
 * `id` carries the slug, not the primary key, because the frontend matches
 * templates by slug (`resume.templateId === template.id`). `_id` exposes the
 * surrogate key alongside it, preserving the previous Mongo response shape.
 */
export const toTemplateDocument = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.slug,
    name: row.name,
    layoutStyle: row.layout_style,
    category: row.category,
    tags: parseJson(row.tags, []),
    description: row.description ?? "",
    styling: parseJson(row.styling, {}),
    previewImage: row.preview_image ?? null,
    // MySQL has no native boolean: TINYINT(1) arrives as 0/1 and must be cast,
    // or the UI's `isActive !== false` filter would treat 0 as truthy.
    isActive: Boolean(row.is_active),
    version: row.version,
    popularity: row.popularity,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
};

/** Template document -> row values, for seeding. */
export const toTemplateRow = (template = {}) => ({
  id: newTemplateId(),
  slug: String(template.id ?? "").trim(),
  name: String(template.name ?? "").trim(),
  layout_style: String(template.layoutStyle ?? "modern"),
  category: template.category,
  description: template.description ?? null,
  // Stringified explicitly: passing a JS array as a bound parameter would be
  // coerced to "[object Object]" rather than valid JSON.
  tags: JSON.stringify(template.tags ?? []),
  styling: JSON.stringify(template.styling ?? {}),
  preview_image: template.previewImage ?? null,
  is_active: template.isActive === false ? 0 : 1,
  version: Number(template.version ?? 1),
  popularity: Number(template.popularity ?? 0),
});
