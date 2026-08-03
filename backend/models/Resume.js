import mongoose from "mongoose";

const resumeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    templateId: {
        type: String,
        default: "modern"
    },
    title: {
        type: String,
        default: "My Resume"
    },
    personalInfo: {
        fullname: {
            type: String,
            default: ""
        },
        email: {
            type: String,
            default: ""
        },
        phone: {
            type: String,
            default: ""
        },
        about: {
            type: String,
            default: ""
        },
        role: {
            type: String,
            default: ""
        }
    },
    experiences: [
        {
            company: {
                type: String,
                default: ""
            },
            role: {
                type: String,
                default: ""
            },
            duration: {
                type: String,
                default: ""
            },
            summary: {
                type: String,
                default: ""
            }
        }
    ],
    education: [
    {
      school: { type: String, required: true },
      degree: { type: String, required: true },
      duration: { type: String, required: true },
    },
  ],
  projects: [
    {
      title: { type: String, required: true },
      tech: { type: String, required: true },
      details: { type: String, required: true },
    },
  ],
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
  }
});
resumeSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});
const Resume = mongoose.model("Resume", resumeSchema);
export default Resume;