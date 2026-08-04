import { asyncHandler } from "../../shared/asyncHandler.js";
import * as resumeService from "./resume.service.js";

/**
 * HTTP adapter for resumes. Response shapes are unchanged from the previous
 * implementation ({ success, resume|resumes, message }) because the frontend
 * reads `response.data.resume` and `response.data.resumes` directly.
 *
 * The owner id always comes from `req.user`, never from the request body or
 * query, so a caller cannot address another account's data.
 */

export const list = asyncHandler(async (req, res) => {
  const resumes = await resumeService.listForUser(req.user._id);
  res.json({ success: true, resumes, message: "Resumes fetched successfully" });
});

export const getById = asyncHandler(async (req, res) => {
  const resume = await resumeService.getForUser(req.params.id, req.user._id);
  res.json({ success: true, resume, message: "Resume fetched successfully" });
});

export const create = asyncHandler(async (req, res) => {
  const resume = await resumeService.createForUser(req.user._id, req.body);
  res
    .status(201)
    .json({ success: true, resume, message: "Resume created successfully" });
});

export const update = asyncHandler(async (req, res) => {
  const resume = await resumeService.updateForUser(
    req.params.id,
    req.user._id,
    req.body,
  );
  res.json({ success: true, resume, message: "Resume updated successfully" });
});

export const remove = asyncHandler(async (req, res) => {
  await resumeService.deleteForUser(req.params.id, req.user._id);
  res.json({ success: true, message: "Resume deleted successfully" });
});
