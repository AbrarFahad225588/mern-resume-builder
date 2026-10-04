import { DEFAULT_TEMPLATE_ID } from "./templates";

// Blank rows for each repeatable section. Exposed individually so the editor
// can append a fresh row without duplicating the field list.
export const EMPTY_ROWS = {
  experiences:    { company: "", role: "", duration: "", summary: "" },
  education:      { school: "", degree: "", duration: "" },
  projects:       { title: "", tech: "", details: "" },
  certifications: { name: "", issuer: "", year: "" },
  languages:      { name: "", level: "" },
  customSections: { title: "", details: "" },
  skills:         { skill_name: "", summary: "" },
};

export const createEmptyRow = (section) => ({ ...EMPTY_ROWS[section] });

/**
 * Build a brand new, empty resume for `templateId`.
 *
 * personalInfo  — identity only (fullname, role, about)
 * contact       — all communication & social fields (separate DB table)
 * pictureUrl    — null until a photo is uploaded via the dedicated endpoint
 */
export const createEmptyResume = (templateId = DEFAULT_TEMPLATE_ID) => ({
  templateId: templateId || DEFAULT_TEMPLATE_ID,
  title: "Untitled Resume",
  pictureUrl: null,
  personalInfo: {
    fullname: "",
    role: "",
    about: "",
  },
  contact: {
    email: "",
    phone: "",
    location: "",
    address: "",
    website: "",
    linkedin: "",
    twitter: "",
    github: "",
  },
  summary: "",
  skills: [],
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
 * Guarantees every key exists and is the right type before it reaches React,
 * so components never crash on undefined.map() or undefined.trim().
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
    templateId:  resume.templateId || base.templateId,
    title:       resume.title      || base.title,
    pictureUrl:  resume.pictureUrl ?? null,
    personalInfo: { ...base.personalInfo, ...(resume.personalInfo || {}) },
    contact:      { ...base.contact,      ...(resume.contact      || {}) },
    summary:      resume.summary ?? "",
    skills:         asArray(resume.skills),
    experiences:    asArray(resume.experiences),
    education:      asArray(resume.education),
    projects:       asArray(resume.projects),
    certifications: asArray(resume.certifications),
    languages:      asArray(resume.languages),
    customSections: asArray(resume.customSections),
  };
};

/** True when a repeatable row is still completely blank. */
export const isEmptyRow = (row) =>
  Object.values(row || {}).every((value) => !String(value || "").trim());
