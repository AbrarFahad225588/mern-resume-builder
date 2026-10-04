import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";
import { AppError } from "../shared/AppError.js";

/**
 * Multer configuration for resume profile pictures.
 *
 * Files land in public/uploads/ and are served at /uploads/<filename> by the
 * existing express.static("public") mount in app.js.
 *
 * A random hex name means two users uploading "photo.jpg" never collide. The
 * extension comes from the validated MIME type, never from the client's
 * filename: otherwise "evil.html" sent as image/png would be stored and served
 * back as HTML.
 */
const EXTENSION_BY_MIME = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

// Matches the random names `storage` produces, so a resume can only ever point
// at a file this server stored — not an arbitrary or external URL. The
// extension is left open because older uploads kept the client's extension
// (e.g. ".jpeg") and resumes referencing them must stay saveable.
const PICTURE_URL_PATTERN = /^\/uploads\/[a-f0-9]{32}(\.[a-z0-9]+)?$/;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(import.meta.dirname, "../public/uploads"));
  },
  filename: (req, file, cb) => {
    const unique = crypto.randomBytes(16).toString("hex");
    cb(null, `${unique}${EXTENSION_BY_MIME[file.mimetype]}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (EXTENSION_BY_MIME[file.mimetype]) {
    cb(null, true);
  } else {
    cb(AppError.badRequest("Only JPEG, PNG, WebP and GIF images are allowed"), false);
  }
};

export const uploadPicture = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB
    files: 1,
  },
}).single("picture");

/** Public URL path for a stored upload, relative to the static root. */
export const pictureUrlFor = (file) => `/uploads/${file.filename}`;

export const isUploadedPictureUrl = (value) =>
  typeof value === "string" && PICTURE_URL_PATTERN.test(value);
