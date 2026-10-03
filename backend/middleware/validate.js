import { validationResult } from "express-validator";
import { AppError } from "../shared/AppError.js";

/**
 * Turns accumulated express-validator failures into a 400.
 *
 * Running this as its own middleware keeps the check out of every controller,
 * where forgetting it would let unvalidated input reach the service layer.
 *
 * The `errors` array is passed through unchanged: the register form reads
 * `data.errors[0].msg`, so reshaping it here would break that message.
 */
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  return next(
    AppError.badRequest(
      errors.array()[0]?.msg || "Invalid request",
      errors.array(),
    ),
  );
};
