import crypto from "node:crypto";

/**
 * The Resume model: table/column definitions plus the mapping between the
 * relational rows and the nested JSON document the API exposes.
 *
 * The frontend contract is a single nested object (personalInfo + six arrays).
 * Storing that relationally is the right call — it lets the database enforce
 * ownership and row order — but it means the shape must be assembled on read
 * and decomposed on write. Both directions live here so the two can never
 * drift apart.
 */

export const newResumeId = () => crypto.randomUUID();

export const DEFAULT_TEMPLATE_ID = "china-executive-001";
export const DEFAULT_TITLE = "Untitled Resume";

/**
 * Section table metadata, driving every section read/write generically.
 *
 * Declaring these once removes six near-identical copies of the same
 * insert/select logic; adding a seventh section becomes a single entry here.
 */
export const SECTIONS = Object.freeze([
  {
    key: "experiences",
    table: "resume_experiences",
    fields: ["company", "role", "duration", "summary"],
  },
  {
    key: "education",
    table: "resume_education",
    fields: ["school", "degree", "duration"],
  },
  {
    key: "projects",
    table: "resume_projects",
    fields: ["title", "tech", "details"],
  },
  {
    key: "certifications",
    table: "resume_certifications",
    fields: ["name", "issuer", "year"],
  },
  {
    key: "languages",
    table: "resume_languages",
    fields: ["name", "level"],
  },
  {
    key: "customSections",
    table: "resume_custom_sections",
    fields: ["title", "details"],
  },
]);

const str = (value, fallback = "") =>
  value === undefined || value === null ? fallback : String(value);

/**
 * Normalises one section row to exactly its declared fields.
 *
 * Anything extra the client sends is dropped rather than passed to SQL, and
 * missing fields default to "" — mirroring the old schema, where no sub-field
 * was required so a half-filled row could still be saved mid-draft.
 */
export const normalizeSectionRow = (section, row = {}) => {
  const clean = {};
  for (const field of section.fields) {
    clean[field] = str(row?.[field]);
  }
  return clean;
};

/** Parent-table columns from a (already sanitised) payload. */
export const toResumeRow = (payload = {}, existing = null) => {
  const personalInfo = payload.personalInfo ?? {};
  const fallback = existing ?? {};

  // `??` rather than `||` throughout: a deliberately cleared field arrives as
  // "" and must be saved as "", not silently replaced by the previous value.
  return {
    template_id: str(payload.templateId ?? fallback.templateId, DEFAULT_TEMPLATE_ID),
    title: str(payload.title ?? fallback.title, DEFAULT_TITLE),
    summary: str(payload.summary ?? fallback.summary),
    skills: str(payload.skills ?? fallback.skills),
    pi_fullname: str(personalInfo.fullname ?? fallback.personalInfo?.fullname),
    pi_email: str(personalInfo.email ?? fallback.personalInfo?.email),
    pi_phone: str(personalInfo.phone ?? fallback.personalInfo?.phone),
    pi_location: str(personalInfo.location ?? fallback.personalInfo?.location),
    pi_website: str(personalInfo.website ?? fallback.personalInfo?.website),
    pi_about: str(personalInfo.about ?? fallback.personalInfo?.about),
    pi_role: str(personalInfo.role ?? fallback.personalInfo?.role),
  };
};

/**
 * Rows -> the nested resume document the API returns.
 *
 * Field names (`_id`, `user`, `templateId`, `personalInfo`, `createdAt`) are
 * kept exactly as the Mongoose version produced them so no frontend code has
 * to change.
 */
export const toResumeDocument = (row, sectionRows = {}) => {
  if (!row) return null;

  const document = {
    _id: row.id,
    user: row.user_id,
    templateId: row.template_id,
    title: row.title,
    personalInfo: {
      fullname: row.pi_fullname ?? "",
      email: row.pi_email ?? "",
      phone: row.pi_phone ?? "",
      location: row.pi_location ?? "",
      website: row.pi_website ?? "",
      about: row.pi_about ?? "",
      role: row.pi_role ?? "",
    },
    summary: row.summary ?? "",
    skills: row.skills ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  // Sections always appear, as arrays, even when empty. The editor indexes into
  // them directly, so a missing key would throw on render.
  for (const section of SECTIONS) {
    document[section.key] = (sectionRows[section.key] ?? []).map((sectionRow) => {
      const item = {};
      for (const field of section.fields) {
        item[field] = sectionRow[field] ?? "";
      }
      return item;
    });
  }

  return document;
};
