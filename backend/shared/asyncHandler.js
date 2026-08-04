/**
 * Wraps an async route handler so a rejected promise reaches Express.
 *
 * Express 5 forwards rejections from async handlers automatically, but relying
 * on that silently couples every controller to that behaviour. Wrapping keeps
 * the intent explicit and lets controllers drop their try/catch blocks
 * entirely, which is what removes the repeated
 * `catch (e) { res.status(500)... }` from the old routes.
 */
export const asyncHandler = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);
