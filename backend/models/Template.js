import mongoose from "mongoose";

const templateSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  layoutStyle: {
    type: String,
    default: "modern",
  },
  category: {
    type: String,
    enum: ["Corporate", "Executive", "Tech", "Creative"],
    required: true,
    index: true,
  },
  tags: [String],
  description: {
    type: String,
    maxlength: 500,
  },
  styling: {
    canvas: String,
    header: String,
    name: String,
    role: String,
    heading: String,
    skillContainer: String,
    skillBadge: String,
  },
  previewImage: {
    type: String,
    default: null,
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  version: {
    type: Number,
    default: 1,
  },
  popularity: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Compound index for common queries
templateSchema.index({ category: 1, isActive: 1, popularity: -1 });
const Template = mongoose.model("Template", templateSchema);
export default Template;