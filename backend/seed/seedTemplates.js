import { templateData } from "../data/templatesData.js";
import { assertConnection, closePool } from "../db/pool.js";
import { runMigrations } from "../db/migrate.js";
import * as templateService from "../modules/template/template.service.js";

/**
 * Seeds the template catalogue from data/templatesData.js.
 *
 *   npm run seed
 *
 * The script goes through the service layer rather than issuing its own SQL,
 * so seeded rows pass exactly the same validation as anything written through
 * the API — a malformed template cannot enter by the back door.
 */
const seedTemplates = async () => {
  try {
    await assertConnection();
    // The schema may not exist yet on a fresh checkout where the server has
    // never been started.
    await runMigrations();

    if (templateData.length === 0) {
      console.warn("No template data found to seed");
      return;
    }

    const { count } = await templateService.seed(templateData);
    console.log(`Seeded ${count} templates`);
  } catch (error) {
    console.error("Error seeding templates:", error.message);
    process.exitCode = 1;
  } finally {
    // The pool holds the event loop open; without this the script hangs after
    // printing its result.
    await closePool();
  }
};

seedTemplates();
