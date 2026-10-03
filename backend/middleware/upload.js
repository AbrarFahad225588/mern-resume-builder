import multer from "multer";
import path from "node:path";
import crypto from "node:crypto";

/**
 * Multer configuration for resume profile pictures.
 *
 * Files land in public/uploads/ and are served at /uploads/<filename> by the
 * existing express.static("public") mount in app.js.
 *
 * A random hex prefix is prepended so two users uploading "photo.jpg" never
 * collide, and the original extension is preserved so browsers can infer the
 * MIME type from the URL without a Content-Type header from the static server.
 */
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(import.meta.dirname, "../public/uploads"));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = crypto.randomBytes(16).toString("hex");
    cb(null, `${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = /^image\/(jpeg|png|webp|gif)$/;
  if (allowed.test(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPEG, PNG, WebP and GIF images are allowed"), false);
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
