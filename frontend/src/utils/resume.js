import { DEFAULT_TEMPLATE_ID } from "./templates";

// Blank rows for each repeatable section. Exposed individually so the editor
// can append a fresh row without duplicating the field list.
export const EMPTY_ROWS = {
  experiences: { company: "", role: "", duration: "", summary: "" },
  education: { school: "", degree: "", duration: "" },
  projects: { title: "", tech: "", details: "" },
  certifications: { name: "", issuer: "", year: "" },
  languages: { name: "", level: "" },
  customSections: { title: "", details: "" },
};

export const createEmptyRow = (section) => ({ ...EMPTY_ROWS[section] });

/**
 * Build a brand new, empty resume for `templateId`.
 *
 * Content always starts blank; only `templateId` carries the chosen design.
 * That split is what lets the template be swapped later without touching a
 * single character the user typed.
 */
export const createEmptyResume = (templateId = DEFAULT_TEMPLATE_ID) => ({
  templateId: templateId || DEFAULT_TEMPLATE_ID,
  title: "Untitled Resume",
  personalInfo: {
    fullname: "",
    email: "",
    phone: "",
    location: "",
    website: "",
    role: "",
    about: "",
  },
  summary: "",
  skills: "",
  experiences: [],
  education: [],
  projects: [],
  certifications: [],
  languages: [],
  customSections: [],
});

/**
 * Normalise a resume coming from the API.
 *
 * Documents saved before a field existed come back without it, and rendering
 * `undefined.map(...)` would crash the preview. This guarantees every section
 * is present and array-typed before it reaches React.
 */
export const normalizeResume = (resume, fallbackTemplateId) => {
  const base = createEmptyResume(
    resume?.templateId || fallbackTemplateId || DEFAULT_TEMPLATE_ID,
  );
  if (!resume) return base;

  const asArray = (value) => (Array.isArray(value) ? value : []);

  return {
    ...base,
    ...resume,
    templateId: resume.templateId || base.templateId,
    title: resume.title || base.title,
    personalInfo: { ...base.personalInfo, ...(resume.personalInfo || {}) },
    summary: resume.summary ?? "",
    skills: resume.skills ?? "",
    experiences: asArray(resume.experiences),
    education: asArray(resume.education),
    projects: asArray(resume.projects),
    certifications: asArray(resume.certifications),
    languages: asArray(resume.languages),
    customSections: asArray(resume.customSections),
  };
};

/** Comma separated skills -> chips, ignoring stray blanks. */
export const parseSkills = (skills) =>
  (skills || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

/** True when a repeatable row is still completely blank. */
export const isEmptyRow = (row) =>
  Object.values(row || {}).every((value) => !String(value || "").trim());
