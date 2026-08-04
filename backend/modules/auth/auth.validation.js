import { body } from "express-validator";

/**
 * Request validation rules, declared apart from the routes so the contract is
 * readable in one place and reusable if another entry point needs it.
 *
 * Messages are byte-identical to the previous implementation because the
 * frontend surfaces `errors[0].msg` verbatim in the registration form.
 */

export const registerRules = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

export const loginRules = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
];
