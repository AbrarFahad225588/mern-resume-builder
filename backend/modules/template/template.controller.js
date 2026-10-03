import { asyncHandler } from "../../shared/asyncHandler.js";
import * as templateService from "./template.service.js";

/**
 * HTTP adapter for templates. Response shapes match the previous
 * implementation, which the Templates page and the editor's design picker
 * both read directly.
 */

export const list = asyncHandler(async (req, res) => {
  const templates = await templateService.listActive();
  res.json({
    success: true,
    templates,
    message: "Templates fetched successfully",
  });
});

export const getById = asyncHandler(async (req, res) => {
  const template = await templateService.getActive(req.params.id);
  res.json({ success: true, template, message: "Template fetched successfully" });
});

export const seed = asyncHandler(async (req, res) => {
  const { count } = await templateService.seed(req.body.templates);
  res.json({
    success: true,
    message: "Templates seeded successfully",
    count,
  });
});
