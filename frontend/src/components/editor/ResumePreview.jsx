import { memo } from "react";
import { parseSkills } from "../../utils/resume";

// A section only appears once it has content, so an untouched resume stays
// clean instead of showing a wall of empty headings.
const Block = ({ title, headingClass, children, show }) =>
  show ? (
    <section className="mt-6">
      <h2 className={headingClass}>{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  ) : null;

const hasText = (value) => Boolean(String(value || "").trim());
const rowHasContent = (row) => Object.values(row || {}).some(hasText);

/**
 * Renders the resume using the supplied template.
 *
 * The component reads styling exclusively from `template.styling`, so swapping
 * templates changes the design without touching any content.
 */
const ResumePreview = memo(function ResumePreview({ resume, template }) {
  const s = template.styling;
  const { personalInfo } = resume;
  const skills = parseSkills(resume.skills);

  const contactLine = [
    personalInfo.email,
    personalInfo.phone,
    personalInfo.location,
    personalInfo.website,
  ].filter(hasText);

  const experiences = resume.experiences.filter(rowHasContent);
  const education = resume.education.filter(rowHasContent);
  const projects = resume.projects.filter(rowHasContent);
  const certifications = resume.certifications.filter(rowHasContent);
  const languages = resume.languages.filter(rowHasContent);
  const customSections = resume.customSections.filter(rowHasContent);

  return (
    <article className={`${s.canvas} mx-auto w-full max-w-3xl`}>
      <header className={s.header}>
        <h1 className={s.name}>{personalInfo.fullname || "Your Name"}</h1>
        <p className={s.role}>{personalInfo.role || "Your Professional Title"}</p>
        {contactLine.length > 0 && (
          <p className="mt-3 text-xs opacity-90">{contactLine.join("  •  ")}</p>
        )}
      </header>

      <div className="p-8 text-gray-700">
        <Block title="Summary" headingClass={s.heading} show={hasText(resume.summary)}>
          <p className="text-sm leading-relaxed whitespace-pre-line">{resume.summary}</p>
        </Block>

        <Block title="Experience" headingClass={s.heading} show={experiences.length > 0}>
          {experiences.map((item, i) => (
            <div key={i}>
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-sm font-semibold text-gray-900">
                  {item.role}
                  {hasText(item.role) && hasText(item.company) ? " — " : ""}
                  {item.company}
                </h3>
                <span className="text-xs text-gray-500">{item.duration}</span>
              </div>
              {hasText(item.summary) && (
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">{item.summary}</p>
              )}
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
            {skills.map((skill) => (
              <span key={skill} className={s.skillBadge}>
                {skill}
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
              {hasText(item.details) && (
                <p className="mt-1 text-sm leading-relaxed whitespace-pre-line">{item.details}</p>
              )}
            </div>
          ))}
        </Block>

        <Block title="Certifications" headingClass={s.heading} show={certifications.length > 0}>
          {certifications.map((item, i) => (
            <div key={i} className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="text-sm font-semibold text-gray-900">
                {item.name}
                {hasText(item.issuer) ? ` — ${item.issuer}` : ""}
              </h3>
              <span className="text-xs text-gray-500">{item.year}</span>
            </div>
          ))}
        </Block>

        <Block title="Languages" headingClass={s.heading} show={languages.length > 0}>
          <div className={s.skillContainer}>
            {languages.map((item, i) => (
              <span key={i} className={s.skillBadge}>
                {item.name}
                {hasText(item.level) ? ` (${item.level})` : ""}
              </span>
            ))}
          </div>
        </Block>

        {customSections.map((item, i) => (
          <Block
            key={i}
            title={item.title || "Additional"}
            headingClass={s.heading}
            show={hasText(item.title) || hasText(item.details)}
          >
            <p className="text-sm leading-relaxed whitespace-pre-line">{item.details}</p>
          </Block>
        ))}
      </div>
    </article>
  );
});

export default ResumePreview;
