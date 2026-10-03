import { AppError } from "../../shared/AppError.js";
import * as templateRepository from "./template.repository.js";
import { TEMPLATE_CATEGORIES } from "./template.model.js";

/**
 * Business rules for the template catalogue.
 */

export const listActive = () => templateRepository.findAllActive();

export const getActive = async (identifier) => {
  const template = await templateRepository.findActiveByIdOrSlug(identifier);
  if (!template) {
    throw AppError.notFound("Template not found");
  }
  return template;
};

/**
 * Validates then replaces the catalogue.
 *
 * The checks run over the whole batch *before* any write, so an invalid entry
 * halfway down the list cannot leave the catalogue partially replaced. The
 * category check is done here as well as by the column ENUM so the caller gets
 * a precise 400 naming the offending template, rather than a driver error.
 */
export const seed = async (templates) => {
  if (!Array.isArray(templates) || templates.length === 0) {
    throw AppError.badRequest("Templates array is required");
  }

  const seenSlugs = new Set();
  for (const template of templates) {
    const slug = String(template?.id ?? "").trim();
    if (!slug) {
      throw AppError.badRequest("Every template needs an id");
    }
    if (!String(template?.name ?? "").trim()) {
      throw AppError.badRequest(`Template "${slug}" is missing a name`);
    }
    if (!TEMPLATE_CATEGORIES.includes(template?.category)) {
      throw AppError.badRequest(
        `Template "${slug}" has an invalid category: ${template?.category}`,
      );
    }
    // The UNIQUE index would reject this too, but only after the DELETE has
    // already run inside the transaction.
    if (seenSlugs.has(slug)) {
      throw AppError.badRequest(`Duplicate template id: ${slug}`);
    }
    seenSlugs.add(slug);
  }

  const count = await templateRepository.replaceAll(templates);
  return { count };
};

export const count = () => templateRepository.countAll();
