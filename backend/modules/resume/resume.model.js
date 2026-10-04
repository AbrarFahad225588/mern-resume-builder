import crypto from "node:crypto";

/**
 * The Resume model: table/column definitions plus the mapping between the
 * relational rows and the nested JSON document the API exposes.
 *
 * The frontend contract is a single nested object (personalInfo + contact + sections).
 * Storing that relationally lets the database enforce ownership and referential
 * integrity. Both the decompose (write) and assemble (read) directions live here
 * so they can never drift apart.
 */

export const newResumeId = () => crypto.randomUUID();

export const DEFAULT_TEMPLATE_ID = "china-executive-001";
export const DEFAULT_TITLE = "Untitled Resume";

/**
 * Section table metadata, driving every section read/write generically.
 *
 * Declaring these once removes near-identical copies of the same
 * insert/select logic; adding a new section is a single entry here.
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
  {
    key: "skills",
    table: "resume_skills",
    fields: ["skill_name", "summary"],
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

/**
 * Maps the payload to the resumes parent-table columns.
 * contact fields are intentionally excluded — they live in resume_contact
 * and are written by toContactRow / replaceContact in the repository.
 */
export const toResumeRow = (payload = {}, existing = null) => {
  const personalInfo = payload.personalInfo ?? {};
  const fallback = existing ?? {};

  // `??` rather than `||` throughout: a deliberately cleared field arrives as
  // "" and must be saved as "", not silently replaced by the previous value.
  return {
    template_id: str(payload.templateId ?? fallback.templateId, DEFAULT_TEMPLATE_ID),
    title: str(payload.title ?? fallback.title, DEFAULT_TITLE),
    summary: str(payload.summary ?? fallback.summary),
    // Omitted keeps the current photo; null/"" removes it. The URL itself was
    // validated by the service and points at a file the upload endpoint stored.
    picture_url:
      payload.pictureUrl === undefined
        ? fallback.pictureUrl ?? null
        : payload.pictureUrl || null,
    pi_fullname: str(personalInfo.fullname ?? fallback.personalInfo?.fullname),
    pi_role: str(personalInfo.role ?? fallback.personalInfo?.role),
    pi_about: str(personalInfo.about ?? fallback.personalInfo?.about),
  };
};

/**
 * Maps the payload contact object to the resume_contact table columns.
 * Falls back to existing contact values so a partial update never clears fields.
 */
export const toContactRow = (payload = {}, existing = null) => {
  const contact = payload.contact ?? {};
  const fallback = existing?.contact ?? {};

  return {
    email:    str(contact.email    ?? fallback.email),
    phone:    str(contact.phone    ?? fallback.phone),
    location: str(contact.location ?? fallback.location),
    address:  str(contact.address  ?? fallback.address),
    website:  str(contact.website  ?? fallback.website),
    linkedin: str(contact.linkedin ?? fallback.linkedin),
    twitter:  str(contact.twitter  ?? fallback.twitter),
    github:   str(contact.github   ?? fallback.github),
  };
};

/**
 * Assembles the full resume document returned by the API.
 *
 * Accepts the resumes row, the contact row (may be null for legacy rows),
 * and the pre-loaded section rows map.
 */
export const toResumeDocument = (row, contactRow = null, sectionRows = {}) => {
  if (!row) return null;

  const document = {
    _id: row.id,
    user: row.user_id,
    templateId: row.template_id,
    title: row.title,
    pictureUrl: row.picture_url ?? null,
    personalInfo: {
      fullname: row.pi_fullname ?? "",
      role: row.pi_role ?? "",
      about: row.pi_about ?? "",
    },
    contact: {
      email:    contactRow?.email    ?? "",
      phone:    contactRow?.phone    ?? "",
      location: contactRow?.location ?? "",
      address:  contactRow?.address  ?? "",
      website:  contactRow?.website  ?? "",
      linkedin: contactRow?.linkedin ?? "",
      twitter:  contactRow?.twitter  ?? "",
      github:   contactRow?.github   ?? "",
    },
    summary: row.summary ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  // Sections always appear as arrays, even when empty. The editor indexes into
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
