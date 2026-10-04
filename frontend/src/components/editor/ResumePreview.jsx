import { memo } from "react";
import Markdown from "./Markdown";

const hasText = (value) => Boolean(String(value || "").trim());
const rowHasContent = (row) => Object.values(row || {}).some(hasText);

// A section only appears once it has content.
const Block = ({ title, headingClass, children, show }) =>
  show ? (
    <section className="mt-5">
      <h2 className={headingClass}>{title}</h2>
      <div className="mt-2 space-y-3">{children}</div>
    </section>
  ) : null;

// ─── One-column layout (existing behaviour) ──────────────────────────────────
const SingleColumnLayout = ({ resume, s }) => {
  const { personalInfo, contact } = resume;

  const contactLine = [contact.email, contact.phone, contact.location, contact.website].filter(hasText);
  const socialLine  = [
    contact.linkedin && `LinkedIn: ${contact.linkedin}`,
    contact.github   && `GitHub: ${contact.github}`,
    contact.twitter  && `Twitter: ${contact.twitter}`,
  ].filter(Boolean);

  const pictureUrl     = resume.pictureUrl ? `http://localhost:3000${resume.pictureUrl}` : null;
  const skills         = (resume.skills         ?? []).filter(rowHasContent);
  const experiences    = (resume.experiences     ?? []).filter(rowHasContent);
  const education      = (resume.education       ?? []).filter(rowHasContent);
  const projects       = (resume.projects        ?? []).filter(rowHasContent);
  const certifications = (resume.certifications  ?? []).filter(rowHasContent);
  const languages      = (resume.languages       ?? []).filter(rowHasContent);
  const customSections = (resume.customSections  ?? []).filter(rowHasContent);

  return (
    <article className={`${s.canvas} mx-auto w-full max-w-3xl`}>
      <header className={s.header}>
        <div className="flex items-center gap-4">
          {pictureUrl && (
            <img src={pictureUrl} alt={personalInfo.fullname || "Profile"}
              className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-white/60" />
          )}
          <div>
            <h1 className={s.name}>{personalInfo.fullname || "Your Name"}</h1>
            <p className={s.role}>{personalInfo.role || "Your Professional Title"}</p>
            {contactLine.length > 0 && (
              <p className="mt-2 text-xs opacity-90">{contactLine.join("  •  ")}</p>
            )}
            {socialLine.length > 0 && (
              <p className="mt-1 text-xs opacity-75">{socialLine.join("  •  ")}</p>
            )}
          </div>
        </div>
      </header>

      <div className="p-8 text-gray-700">
        <Block title="Summary" headingClass={s.heading} show={hasText(resume.summary)}>
          <Markdown>{resume.summary}</Markdown>
        </Block>
        <Block title="Experience" headingClass={s.heading} show={experiences.length > 0}>
          {experiences.map((item, i) => (
            <div key={i}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  {item.role}{hasText(item.role) && hasText(item.company) ? " — " : ""}{item.company}
                </h3>
                <span className="text-xs text-gray-500">{item.duration}</span>
              </div>
              {hasText(item.summary) && <Markdown className="mt-1">{item.summary}</Markdown>}
            </div>
          ))}
        </Block>
        <Block title="Education" headingClass={s.heading} show={education.length > 0}>
          {education.map((item, i) => (
            <div key={i} className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{item.school}</h3>
                <p className="text-sm">{item.degree}</p>
              </div>
              <span className="text-xs text-gray-500">{item.duration}</span>
            </div>
          ))}
        </Block>
        <Block title="Skills" headingClass={s.heading} show={skills.length > 0}>
          <div className={s.skillContainer}>
            {skills.map((item, i) => (
              <span key={i} className={s.skillBadge}>
                {item.skill_name}{hasText(item.summary) ? ` — ${item.summary}` : ""}
              </span>
            ))}
          </div>
        </Block>
        <Block title="Projects" headingClass={s.heading} show={projects.length > 0}>
          {projects.map((item, i) => (
            <div key={i}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                <span className="text-xs text-gray-500">{item.tech}</span>
              </div>
              {hasText(item.details) && <Markdown className="mt-1">{item.details}</Markdown>}
            </div>
          ))}
        </Block>
        <Block title="Certifications" headingClass={s.heading} show={certifications.length > 0}>
          {certifications.map((item, i) => (
            <div key={i} className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {item.name}{hasText(item.issuer) ? ` — ${item.issuer}` : ""}
              </h3>
              <span className="text-xs text-gray-500">{item.year}</span>
            </div>
          ))}
        </Block>
        <Block title="Languages" headingClass={s.heading} show={languages.length > 0}>
          <div className={s.skillContainer}>
            {languages.map((item, i) => (
              <span key={i} className={s.skillBadge}>
                {item.name}{hasText(item.level) ? ` (${item.level})` : ""}
              </span>
            ))}
          </div>
        </Block>
        {customSections.map((item, i) => (
          <Block key={i} title={item.title || "Additional"} headingClass={s.heading}
            show={hasText(item.title) || hasText(item.details)}>
            <Markdown>{item.details}</Markdown>
          </Block>
        ))}
      </div>
    </article>
  );
};

// ─── Two-column layout ────────────────────────────────────────────────────────
// Sidebar: photo, contact, skills, languages
// Main:    summary, experience, education, projects, certifications, custom
const TwoColumnLayout = ({ resume, s }) => {
  const { personalInfo, contact } = resume;

  const pictureUrl     = resume.pictureUrl ? `http://localhost:3000${resume.pictureUrl}` : null;
  const skills         = (resume.skills         ?? []).filter(rowHasContent);
  const experiences    = (resume.experiences     ?? []).filter(rowHasContent);
  const education      = (resume.education       ?? []).filter(rowHasContent);
  const projects       = (resume.projects        ?? []).filter(rowHasContent);
  const certifications = (resume.certifications  ?? []).filter(rowHasContent);
  const languages      = (resume.languages       ?? []).filter(rowHasContent);
  const customSections = (resume.customSections  ?? []).filter(rowHasContent);

  const SideBlock = ({ title, children, show }) =>
    show ? (
      <div className="mt-5">
        <h3 className={s.sidebarHeading}>{title}</h3>
        {children}
      </div>
    ) : null;

  const MainBlock = ({ title, children, show }) =>
    show ? (
      <div className="mt-5">
        <h3 className={s.mainHeading}>{title}</h3>
        <div className="mt-2 space-y-3">{children}</div>
      </div>
    ) : null;

  return (
    <article className={`${s.canvas} mx-auto w-full max-w-4xl`}>
      {/* Sidebar */}
      <aside className={s.sidebar}>
        {/* Photo */}
        {pictureUrl && (
          <div className="mb-5 flex justify-center">
            <img src={pictureUrl} alt={personalInfo.fullname || "Profile"}
              className="h-24 w-24 rounded-full object-cover ring-2 ring-white/40" />
          </div>
        )}

        {/* Name + role in sidebar header */}
        <div className={`${s.header} -mx-6 -mt-6 mb-5 px-6 pt-6 pb-4`}>
          <h1 className={s.name}>{personalInfo.fullname || "Your Name"}</h1>
          <p className={s.role}>{personalInfo.role || "Your Professional Title"}</p>
        </div>

        {/* Contact */}
        <SideBlock title="Contact" show={true}>
          <ul className="space-y-1 text-xs opacity-90">
            {hasText(contact.email)    && <li>✉ {contact.email}</li>}
            {hasText(contact.phone)    && <li>📞 {contact.phone}</li>}
            {hasText(contact.location) && <li>📍 {contact.location}</li>}
            {hasText(contact.address)  && <li>🏠 {contact.address}</li>}
            {hasText(contact.website)  && <li>🌐 {contact.website}</li>}
            {hasText(contact.linkedin) && <li>in {contact.linkedin}</li>}
            {hasText(contact.github)   && <li>gh {contact.github}</li>}
            {hasText(contact.twitter)  && <li>𝕏 {contact.twitter}</li>}
          </ul>
        </SideBlock>

        {/* Skills */}
        <SideBlock title="Skills" show={skills.length > 0}>
          <div className={s.skillContainer}>
            {skills.map((item, i) => (
              <span key={i} className={s.skillBadge}>
                {item.skill_name}
              </span>
            ))}
          </div>
        </SideBlock>

        {/* Languages */}
        <SideBlock title="Languages" show={languages.length > 0}>
          <ul className="space-y-1 text-xs opacity-90">
            {languages.map((item, i) => (
              <li key={i}>{item.name}{hasText(item.level) ? ` — ${item.level}` : ""}</li>
            ))}
          </ul>
        </SideBlock>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 text-gray-700 overflow-hidden">
        {hasText(resume.summary) && (
          <div className="mb-5">
            <h3 className={s.mainHeading}>Summary</h3>
            <Markdown className="mt-2 text-sm">{resume.summary}</Markdown>
          </div>
        )}

        <MainBlock title="Experience" show={experiences.length > 0}>
          {experiences.map((item, i) => (
            <div key={i}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-900">
                  {item.role}{hasText(item.role) && hasText(item.company) ? " — " : ""}{item.company}
                </h4>
                <span className="text-xs text-gray-500">{item.duration}</span>
              </div>
              {hasText(item.summary) && <Markdown className="mt-1">{item.summary}</Markdown>}
            </div>
          ))}
        </MainBlock>

        <MainBlock title="Education" show={education.length > 0}>
          {education.map((item, i) => (
            <div key={i} className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">{item.school}</h4>
                <p className="text-sm">{item.degree}</p>
              </div>
              <span className="text-xs text-gray-500">{item.duration}</span>
            </div>
          ))}
        </MainBlock>

        <MainBlock title="Projects" show={projects.length > 0}>
          {projects.map((item, i) => (
            <div key={i}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-900">{item.title}</h4>
                <span className="text-xs text-gray-500">{item.tech}</span>
              </div>
              {hasText(item.details) && <Markdown className="mt-1">{item.details}</Markdown>}
            </div>
          ))}
        </MainBlock>

        <MainBlock title="Certifications" show={certifications.length > 0}>
          {certifications.map((item, i) => (
            <div key={i} className="flex flex-wrap items-baseline justify-between gap-2">
              <h4 className="text-sm font-semibold text-gray-900">
                {item.name}{hasText(item.issuer) ? ` — ${item.issuer}` : ""}
              </h4>
              <span className="text-xs text-gray-500">{item.year}</span>
            </div>
          ))}
        </MainBlock>

        {customSections.map((item, i) => (
          <MainBlock key={i} title={item.title || "Additional"}
            show={hasText(item.title) || hasText(item.details)}>
            <Markdown>{item.details}</Markdown>
          </MainBlock>
        ))}
      </main>
    </article>
  );
};

// ─── Root component ───────────────────────────────────────────────────────────
const ResumePreview = memo(function ResumePreview({ resume, template }) {
  const s = template.styling;
  const isTwoColumn = s?.layout === "two-column";

  return isTwoColumn
    ? <TwoColumnLayout resume={resume} s={s} />
    : <SingleColumnLayout resume={resume} s={s} />;
});

export default ResumePreview;
