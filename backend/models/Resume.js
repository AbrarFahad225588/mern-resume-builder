import mongoose from "mongoose";

// Sub-documents intentionally declare `_id: false`. Without it Mongoose stamps
// an ObjectId onto every row, which then round-trips into the editor state and
// makes list re-ordering/diffing noisier than it needs to be.
const subDoc = { _id: false };

const experienceSchema = new mongoose.Schema(
  {
    company: { type: String, default: "" },
    role: { type: String, default: "" },
    duration: { type: String, default: "" },
    summary: { type: String, default: "" },
  },
  subDoc,
);

// None of these fields are `required`. A resume is edited incrementally, so the
// user must be able to save a half-filled row; a required sub-field would make
// the whole save fail with a validation error mid-draft.
const educationSchema = new mongoose.Schema(
  {
    school: { type: String, default: "" },
    degree: { type: String, default: "" },
    duration: { type: String, default: "" },
  },
  subDoc,
);

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    tech: { type: String, default: "" },
    details: { type: String, default: "" },
  },
  subDoc,
);

const certificationSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    issuer: { type: String, default: "" },
    year: { type: String, default: "" },
  },
  subDoc,
);

const languageSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    level: { type: String, default: "" },
  },
  subDoc,
);

const customSectionSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    details: { type: String, default: "" },
  },
  subDoc,
);

const resumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  // The design the resume was authored with. Stored on the resume so reopening
  // it restores the same look without relying on the URL.
  templateId: {
    type: String,
    default: "china-executive-001",
  },
  title: {
    type: String,
    default: "Untitled Resume",
  },
  personalInfo: {
    fullname: { type: String, default: "" },
    email: { type: String, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    website: { type: String, default: "" },
    about: { type: String, default: "" },
    role: { type: String, default: "" },
  },
  summary: {
    type: String,
    default: "",
  },
  experiences: [experienceSchema],
  education: [educationSchema],
  projects: [projectSchema],
  certifications: [certificationSchema],
  languages: [languageSchema],
  customSections: [customSectionSchema],
  // Comma separated. Kept as a string to stay compatible with documents that
  // were written before the editor existed; the UI splits it into chips.
  skills: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

resumeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// `pre("save")` never fires for findOneAndUpdate, so edits made through the
// update route would keep their original updatedAt and break the
// "most recently edited first" ordering used by the resume list.
resumeSchema.pre("findOneAndUpdate", function (next) {
  this.set({ updatedAt: Date.now() });
  next();
});

const Resume = mongoose.model("Resume", resumeSchema);
export default Resume;
