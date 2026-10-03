import { isProduction } from "../../config/env.js";
import { config } from "../../config/env.js";
import { asyncHandler } from "../../shared/asyncHandler.js";
import * as authService from "./auth.service.js";

/**
 * HTTP adapter for the auth module: reads the request, calls the service,
 * shapes the response. It contains no business rules, so changing a status code
 * or payload never risks changing behaviour.
 *
 * The response bodies below intentionally match the previous implementation
 * field for field (including the 201 on login), because the frontend reads
 * `data.user`, `data.token` and `data.message` directly.
 */

const cookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: "lax",
});

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  const { user, token } = await authService.register({ name, email, password });

  res.cookie("token", token, {
    ...cookieOptions(),
    maxAge: config.jwt.cookieMaxAge,
  });

  res.status(201).json({
    message: "User registered successfully",
    success: true,
    user,
    token,
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const { user, token } = await authService.login({ email, password });

  res.cookie("token", token, {
    ...cookieOptions(),
    maxAge: config.jwt.cookieMaxAge,
  });

  // 201 preserved from the original route. It is not the conventional status
  // for a login, but the frontend already treats it as success and changing it
  // would be a behavioural change.
  res.status(201).json({
    message: "User logged in successfully",
    success: true,
    user,
    token,
  });
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie("token", cookieOptions());
  res.status(200).json({ message: "User logged out successfully", success: true });
});

export const getMe = asyncHandler(async (req, res) => {
  // Populated by authMiddleware; already a public projection with no hash.
  res.status(200).json({ user: req.user });
});
