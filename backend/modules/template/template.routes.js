import express from "express";
import { authMiddleware } from "../../middleware/auth.js";
import * as templateController from "./template.controller.js";

/**
 * Template routes, mounted at /api/templates.
 *
 * Listing is public: the landing and Templates pages show the catalogue to
 * signed-out visitors. Seeding rewrites the catalogue, so it stays behind
 * authentication exactly as before.
 *
 * `/seed` is declared before `/:id`; Express matches in order, so the reverse
 * would let the parameterised route swallow "seed" as an id.
 */
const router = express.Router();

router.get("/", templateController.list);
router.post("/seed", authMiddleware, templateController.seed);
router.get("/:id", templateController.getById);

export default router;
