import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "node:path";
import { config } from "./config/env.js";
import authRoutes from "./modules/auth/auth.routes.js";
import resumeRoutes from "./modules/resume/resume.routes.js";
import templateRoutes from "./modules/template/template.routes.js";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler.js";

/**
 * Builds the Express application.
 *
 * Kept separate from server.js so the app can be imported and exercised
 * without binding a port — the listener is the one part that makes an
 * application awkward to test.
 */
export const createApp = () => {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true, // Allow cookies to be sent
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );
  app.use(cookieParser());
  // express.json/urlencoded replace body-parser, which has been built into
  // Express since 4.16; both were previously registered, parsing every body
  // twice.
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Static assets: public/templates/<id>.png is served at /templates/<id>.png,
  // matching the `previewImage` paths stored on each template.
  app.use(express.static(path.join(import.meta.dirname, "public")));

  app.get("/", (req, res) => {
    res.send("Hello World!");
  });

  // Lets a load balancer or `npm run dev` check confirm the process is up.
  app.get("/health", (req, res) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });

  app.use("/api/templates", templateRoutes);
  app.use("/api/resumes", resumeRoutes);
  app.use("/api/auth", authRoutes);

  // Both must be registered last: Express runs middleware in order, so a 404
  // handler placed earlier would intercept every real route below it.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
