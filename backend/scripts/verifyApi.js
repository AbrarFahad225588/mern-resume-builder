import assert from "node:assert/strict";
import { createApp } from "../app.js";
import { closePool, query } from "../db/pool.js";
import { runMigrations } from "../db/migrate.js";

/**
 * End-to-end check that every endpoint still behaves as it did before the
 * MySQL migration.
 *
 *   node scripts/verifyApi.js
 *
 * It drives the real app over HTTP against the real database, so it exercises
 * routing, middleware, services and SQL together — the layers where a
 * regression would actually hide.
 */

let passed = 0;
const check = (label, fn) => {
  try {
    fn();
    console.log(`  PASS  ${label}`);
    passed += 1;
  } catch (error) {
    console.error(`  FAIL  ${label}\n        ${error.message}`);
    process.exitCode = 1;
  }
};

const main = async () => {
  await runMigrations();

  // Port 0 lets the OS pick a free port, so this cannot collide with a dev
  // server the user already has running.
  const server = createApp().listen(0);
  const { port } = server.address();
  const base = `http://127.0.0.1:${port}`;

  // Unique email per run keeps repeated invocations idempotent.
  const email = `verify_${Date.now()}@example.com`;
  const password = "secret123";
  let token = "";
  let resumeId = "";

  const call = async (method, path, { body, auth = true } = {}) => {
    const response = await fetch(`${base}${path}`, {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await response.text();
    return {
      status: response.status,
      data: text ? JSON.parse(text) : null,
    };
  };

  try {
    console.log("\nTemplates (public)");
    const templates = await call("GET", "/api/templates", { auth: false });
    check("GET /api/templates -> 200 with catalogue", () => {
      assert.equal(templates.status, 200);
      assert.equal(templates.data.success, true);
      assert.ok(templates.data.templates.length > 0);
    });
    check("template keeps its nested styling + tags shape", () => {
      const t = templates.data.templates[0];
      assert.equal(typeof t.id, "string");
      assert.ok(Array.isArray(t.tags), "tags must be an array");
      assert.equal(typeof t.styling, "object");
      assert.equal(t.isActive, true, "isActive must be a real boolean");
    });

    const single = await call("GET", `/api/templates/${templates.data.templates[0].id}`, {
      auth: false,
    });
    check("GET /api/templates/:id -> 200", () => {
      assert.equal(single.status, 200);
      assert.equal(single.data.template.id, templates.data.templates[0].id);
    });

    const missingTemplate = await call("GET", "/api/templates/does-not-exist", {
      auth: false,
    });
    check("GET /api/templates/:id (unknown) -> 404", () => {
      assert.equal(missingTemplate.status, 404);
      assert.equal(missingTemplate.data.message, "Template not found");
    });

    console.log("\nAuth");
    const unauth = await call("GET", "/api/resumes", { auth: false });
    check("GET /api/resumes without token -> 401", () => {
      assert.equal(unauth.status, 401);
    });

    const badRegister = await call("POST", "/api/auth/register", {
      auth: false,
      body: { name: "X", email: "not-an-email", password: "123" },
    });
    check("POST /api/auth/register (invalid) -> 400 with errors[]", () => {
      assert.equal(badRegister.status, 400);
      assert.ok(Array.isArray(badRegister.data.errors));
      assert.ok(badRegister.data.errors[0].msg);
    });

    const registered = await call("POST", "/api/auth/register", {
      auth: false,
      body: { name: "Verify User", email, password },
    });
    check("POST /api/auth/register -> 201 with user + token", () => {
      assert.equal(registered.status, 201);
      assert.equal(registered.data.success, true);
      assert.ok(registered.data.token);
      assert.ok(registered.data.user._id);
      assert.equal(registered.data.user.email, email);
      assert.equal(registered.data.user.password, undefined, "hash must not leak");
    });
    token = registered.data.token;

    const duplicate = await call("POST", "/api/auth/register", {
      auth: false,
      body: { name: "Verify User", email, password },
    });
    check("duplicate email -> 400 'User already exists'", () => {
      assert.equal(duplicate.status, 400);
      assert.equal(duplicate.data.message, "User already exists");
    });

    const wrongPassword = await call("POST", "/api/auth/login", {
      auth: false,
      body: { email, password: "wrong-password" },
    });
    check("login with wrong password -> 400 'Invalid credentials'", () => {
      assert.equal(wrongPassword.status, 400);
      assert.equal(wrongPassword.data.message, "Invalid credentials");
    });

    const loggedIn = await call("POST", "/api/auth/login", {
      auth: false,
      body: { email, password },
    });
    check("POST /api/auth/login -> 201 with token", () => {
      assert.equal(loggedIn.status, 201);
      assert.ok(loggedIn.data.token);
    });
    token = loggedIn.data.token;

    const me = await call("GET", "/api/auth/me");
    check("GET /api/auth/me -> 200 with current user", () => {
      assert.equal(me.status, 200);
      assert.equal(me.data.user.email, email);
      assert.equal(me.data.user.password, undefined);
    });

    console.log("\nResumes");
    const emptyList = await call("GET", "/api/resumes");
    check("GET /api/resumes (new account) -> empty array", () => {
      assert.equal(emptyList.status, 200);
      assert.deepEqual(emptyList.data.resumes, []);
    });

    const created = await call("POST", "/api/resumes", {
      body: {
        title: "Staff Engineer",
        templateId: "china-executive-001",
        summary: "Builds reliable systems.",
        skills: "SQL, Node.js, React",
        personalInfo: {
          fullname: "Verify User",
          email,
          phone: "+880123456789",
          location: "Dhaka",
          website: "https://example.com",
          about: "About me",
          role: "Engineer",
        },
        experiences: [
          { company: "First Co", role: "Dev", duration: "2020", summary: "A" },
          { company: "Second Co", role: "Lead", duration: "2023", summary: "B" },
        ],
        education: [{ school: "Uni", degree: "BSc", duration: "2019" }],
        projects: [{ title: "Proj", tech: "Node", details: "D" }],
        certifications: [{ name: "Cert", issuer: "Org", year: "2024" }],
        languages: [{ name: "Bangla", level: "Native" }],
        customSections: [{ title: "Awards", details: "Some award" }],
      },
    });
    check("POST /api/resumes -> 201 with full nested document", () => {
      assert.equal(created.status, 201);
      const r = created.data.resume;
      assert.ok(r._id);
      assert.equal(r.title, "Staff Engineer");
      assert.equal(r.personalInfo.fullname, "Verify User");
      assert.equal(r.skills, "SQL, Node.js, React");
      assert.equal(r.experiences.length, 2);
      assert.equal(r.education.length, 1);
      assert.equal(r.customSections[0].title, "Awards");
    });
    resumeId = created.data.resume._id;

    check("section order is preserved on write", () => {
      const [first, second] = created.data.resume.experiences;
      assert.equal(first.company, "First Co");
      assert.equal(second.company, "Second Co");
    });

    const fetched = await call("GET", `/api/resumes/${resumeId}`);
    check("GET /api/resumes/:id -> 200, order intact after reload", () => {
      assert.equal(fetched.status, 200);
      assert.equal(fetched.data.resume.experiences[0].company, "First Co");
      assert.equal(fetched.data.resume.experiences[1].company, "Second Co");
    });

    const reordered = await call("PUT", `/api/resumes/${resumeId}`, {
      body: {
        title: "Principal Engineer",
        experiences: [
          { company: "Second Co", role: "Lead", duration: "2023", summary: "B" },
          { company: "First Co", role: "Dev", duration: "2020", summary: "A" },
        ],
      },
    });
    check("PUT /api/resumes/:id -> 200, reorder persists", () => {
      assert.equal(reordered.status, 200);
      assert.equal(reordered.data.resume.title, "Principal Engineer");
      assert.equal(reordered.data.resume.experiences[0].company, "Second Co");
      assert.equal(reordered.data.resume.experiences[1].company, "First Co");
    });
    check("partial update leaves untouched fields intact", () => {
      // `skills` and `education` were not in the PUT body.
      assert.equal(reordered.data.resume.skills, "SQL, Node.js, React");
      assert.equal(reordered.data.resume.education.length, 1);
      assert.equal(reordered.data.resume.personalInfo.fullname, "Verify User");
    });

    const clearedSections = await call("PUT", `/api/resumes/${resumeId}`, {
      body: { languages: [] },
    });
    check("explicitly emptying a section clears it", () => {
      assert.deepEqual(clearedSections.data.resume.languages, []);
      assert.equal(clearedSections.data.resume.experiences.length, 2);
    });

    const notFound = await call("GET", "/api/resumes/00000000-0000-0000-0000-000000000000");
    check("GET /api/resumes/:id (unknown) -> 404 not 500", () => {
      assert.equal(notFound.status, 404);
      assert.equal(notFound.data.message, "Resume not found");
    });

    const malformed = await call("GET", "/api/resumes/!!!not-a-valid-id!!!");
    check("GET /api/resumes/:id (malformed) -> 404 not 500", () => {
      assert.equal(malformed.status, 404);
    });

    console.log("\nOwnership isolation");
    const other = await call("POST", "/api/auth/register", {
      auth: false,
      body: { name: "Other", email: `other_${Date.now()}@example.com`, password },
    });
    const ownerToken = token;
    token = other.data.token;

    const stolen = await call("GET", `/api/resumes/${resumeId}`);
    check("another user cannot read someone else's resume -> 404", () => {
      assert.equal(stolen.status, 404);
    });
    const stolenDelete = await call("DELETE", `/api/resumes/${resumeId}`);
    check("another user cannot delete it -> 404", () => {
      assert.equal(stolenDelete.status, 404);
    });

    token = ownerToken;

    console.log("\nPayload tampering");
    const tampered = await call("PUT", `/api/resumes/${resumeId}`, {
      body: { user: other.data.user._id, _id: "hacked", title: "Still Mine" },
    });
    check("client-supplied user/_id are ignored", () => {
      assert.equal(tampered.status, 200);
      assert.equal(tampered.data.resume._id, resumeId);
      assert.equal(tampered.data.resume.user, registered.data.user._id);
    });

    console.log("\nPersistence");
    const rows = await query(
      `SELECT position, company FROM resume_experiences
        WHERE resume_id = ? ORDER BY position`,
      [resumeId],
    );
    check("section rows are stored relationally with positions", () => {
      assert.equal(rows.length, 2);
      assert.equal(rows[0].position, 0);
      assert.equal(rows[0].company, "Second Co");
      assert.equal(rows[1].position, 1);
    });

    console.log("\nCleanup / cascade");
    const deleted = await call("DELETE", `/api/resumes/${resumeId}`);
    check("DELETE /api/resumes/:id -> 200", () => {
      assert.equal(deleted.status, 200);
      assert.equal(deleted.data.success, true);
    });

    const orphans = await query(
      `SELECT COUNT(*) AS n FROM resume_experiences WHERE resume_id = ?`,
      [resumeId],
    );
    check("child rows are removed by ON DELETE CASCADE", () => {
      assert.equal(Number(orphans[0].n), 0);
    });

    const logout = await call("POST", "/api/auth/logout");
    check("POST /api/auth/logout -> 200", () => {
      assert.equal(logout.status, 200);
    });

    // Test accounts are removed so repeated runs do not accumulate rows.
    await query(`DELETE FROM users WHERE email LIKE 'verify_%@example.com'`);
    await query(`DELETE FROM users WHERE email LIKE 'other_%@example.com'`);

    console.log(
      `\n${passed} checks passed${process.exitCode ? " (with failures above)" : ""}`,
    );
  } finally {
    server.close();
    await closePool();
  }
};

main();
