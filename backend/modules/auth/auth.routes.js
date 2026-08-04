import express from "express";
import { authMiddleware } from "../../middleware/auth.js";
import { validate } from "../../middleware/validate.js";
import * as authController from "./auth.controller.js";
import { loginRules, registerRules } from "./auth.validation.js";

/**
 * Auth routing table. Paths are mounted at /api/auth and are unchanged from
 * the previous implementation, so the frontend needs no edits.
 *
 * Each route reads as: rules -> validate -> controller, which makes the
 * request pipeline obvious at a glance.
 */
const router = express.Router();

router.post("/register", registerRules, validate, authController.register);
router.post("/login", loginRules, validate, authController.login);
router.post("/logout", authMiddleware, authController.logout);
router.get("/me", authMiddleware, authController.getMe);

export default router;
