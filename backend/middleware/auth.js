import jwt from "jsonwebtoken";
import { config, isProduction } from "../config/env.js";
import * as authService from "../modules/auth/auth.service.js";

/**
 * Verifies the caller's token and attaches the account to `req.user`.
 *
 * The account is re-read on every request rather than trusted from the token
 * payload, so a deleted user cannot keep acting on a still-valid token.
 */
export const authMiddleware = async (req, res, next) => {
  try {
    // Accept either transport. The cookie covers normal browser navigation,
    // while the Bearer header is what services/api.js actually sends (and the
    // only thing that works for non-browser clients). Supporting the cookie
    // alone made every authenticated request fail with a 401.
    const header = req.headers.authorization || "";
    const bearerToken = header.startsWith("Bearer ") ? header.slice(7).trim() : null;
    const token = req.cookies?.token || bearerToken;

    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, config.jwt.secret);
    // Public projection: the password hash never enters the request object,
    // so a handler cannot accidentally serialise it.
    const user = await authService.getUserById(decoded.id);

    if (!user) {
      return res
        .status(401)
        .json({ message: "User not found, authorization denied" });
    }

    req.user = user;
    next();
  } catch (error) {
    // An invalid/expired/malformed token is a client auth problem, not a
    // server fault, so it must answer 401 rather than 500.
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError" ||
      error.name === "NotBeforeError"
    ) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: isProduction,
        sameSite: "lax",
      });
      return res
        .status(401)
        .json({ message: "Invalid or expired token, authorization denied" });
    }
    // Anything else (e.g. the database being down) is a real fault: hand it to
    // the central error handler rather than misreporting it as an auth failure.
    return next(error);
  }
};
