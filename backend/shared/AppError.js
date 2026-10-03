/**
 * An error the API deliberately raises, carrying the HTTP status it should
 * produce.
 *
 * This is what lets the service layer stay free of `req`/`res`: it can signal
 * "not found" or "invalid credentials" by throwing, and the single error
 * handler translates that into a response. Anything thrown that is *not* an
 * AppError is treated as an unexpected fault and reported as a generic 500,
 * so internal details (SQL text, stack traces) never leak to clients.
 */
export class AppError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.details = details;
    // Marks this as a known, handled condition rather than a crash.
    this.isOperational = true;
    Error.captureStackTrace?.(this, AppError);
  }

  static badRequest(message, details) {
    return new AppError(400, message, details);
  }

  static unauthorized(message = "Unauthorized") {
    return new AppError(401, message);
  }

  static forbidden(message = "Forbidden") {
    return new AppError(403, message);
  }

  static notFound(message = "Not found") {
    return new AppError(404, message);
  }

  static conflict(message) {
    return new AppError(409, message);
  }
}
