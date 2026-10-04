import multer from "multer";
import { AppError } from "../shared/AppError.js";
import { isProduction } from "../config/env.js";

/** 404 for unmatched routes, so they join the normal error path. */
export const notFoundHandler = (req, res, next) => {
  next(AppError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
};

/**
 * The single place where an error becomes a response.
 *
 * Centralising this is what keeps the response shape consistent with the
 * previous implementation ({ message } on failure) no matter which layer
 * failed, and guarantees an unexpected fault can never serialise a stack trace
 * or raw SQL to the client.
 */
// eslint-disable-next-line no-unused-vars -- Express identifies error
// middleware by arity: all four parameters must be declared or it is treated
// as a normal handler and never runs.
export const errorHandler = (error, req, res, next) => {
  if (error instanceof AppError) {
    const body = { success: false, message: error.message };
    // express-validator details are surfaced as `errors`, matching what the
    // frontend's register form already reads.
    if (error.details) {
      body.errors = error.details;
    }
    return res.status(error.statusCode).json(body);
  }

  // Upload limits (file too large, too many files) are client mistakes too.
  if (error instanceof multer.MulterError) {
    const message =
      error.code === "LIMIT_FILE_SIZE" ? "Image must be 5 MB or smaller" : error.message;
    return res.status(400).json({ success: false, message });
  }

  // Translate the few driver errors that are really client mistakes.
  if (error?.code === "ER_DUP_ENTRY") {
    return res.status(409).json({ success: false, message: "Already exists" });
  }
  // A dropped/unavailable database is an infrastructure fault; answering 503
  // tells the caller it is worth retrying, unlike a 500.
  if (["ECONNREFUSED", "PROTOCOL_CONNECTION_LOST", "ER_CON_COUNT_ERROR"].includes(error?.code)) {
    console.error("Database unavailable:", error.code);
    return res
      .status(503)
      .json({ success: false, message: "Service temporarily unavailable" });
  }

  // Anything reaching here is a genuine bug: log it in full for the operator,
  // return nothing revealing to the client.
  console.error("Unhandled error:", error);
  return res.status(500).json({
    success: false,
    message: "Server error",
    ...(isProduction ? {} : { debug: error?.message }),
  });
};
