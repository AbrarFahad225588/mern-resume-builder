import express from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { uploadPicture } from "../../middleware/upload.js";
import * as resumeController from "./resume.controller.js";

/**
 * Resume routes, mounted at /api/resumes.
 *
 * `authMiddleware` is applied router-wide rather than per route: every resume
 * endpoint is private, and a blanket guard means a newly added route cannot
 * accidentally ship unauthenticated.
 */
const router = express.Router();

router.use(authMiddleware);

router.get("/", resumeController.list);
router.post("/", resumeController.create);
router.get("/:id", resumeController.getById);
router.put("/:id", resumeController.update);
router.delete("/:id", resumeController.remove);
router.post("/:id/picture", uploadPicture, resumeController.uploadPicture);

export default router;
