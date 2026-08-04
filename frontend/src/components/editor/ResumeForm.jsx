import { memo, useCallback, useState } from "react";
import {
  FaUser,
  FaAlignLeft,
  FaBriefcase,
  FaGraduationCap,
  FaTools,
  FaLightbulb,
  FaCertificate,
  FaLanguage,
  FaLayerGroup,
} from "react-icons/fa";
import Field from "./Field";
import SectionCard, { EmptyHint, RepeatableRow } from "./SectionCard";

/**
 * Every editable section of the resume.
 *
 * The component is deliberately controlled and stateless with respect to the
 * resume itself: it renders `resume` and reports changes upward. Only the
 * open/closed accordion state is local, because it is pure UI and must not end
 * up being persisted with the document.
 */
const ResumeForm = memo(function ResumeForm({
  resume,
  onFieldChange,
  onPersonalInfoChange,
  onRowChange,
  onAddRow,
  onRemoveRow,
  onMoveRow,
}) {
  const [open, setOpen] = useState({ personal: true, summary: true, experiences: true });
  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  // Which markdown fields are currently showing their rendered preview. Keyed
  // by field path (e.g. "experiences.2.summary") so each row toggles on its
  // own, and kept local because it is transient UI, not resume data.
  const [previews, setPreviews] = useState({});
  const togglePreview = useCallback((key) => {
    setPreviews((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  return (
    <div className="space-y-4">
      <SectionCard
        title="Personal Information"
        icon={<FaUser className="text-blue-600" />}
        isOpen={open.personal}
        onToggle={() => toggle("personal")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Full name"
            value={resume.personalInfo.fullname}
            onChange={(v) => onPersonalInfoChange("fullname", v)}
            placeholder="Jane Doe"
          />
          <Field
            label="Job title"
            value={resume.personalInfo.role}
            onChange={(v) => onPersonalInfoChange("role", v)}
            placeholder="Senior Product Designer"
          />
          <Field
            label="Email"
            type="email"
            value={resume.personalInfo.email}
            onChange={(v) => onPersonalInfoChange("email", v)}
            placeholder="jane@example.com"
          />
          <Field
            label="Phone"
            value={resume.personalInfo.phone}
            onChange={(v) => onPersonalInfoChange("phone", v)}
            placeholder="+86 138 0000 0000"
          />
          <Field
            label="Location"
            value={resume.personalInfo.location}
            onChange={(v) => onPersonalInfoChange("location", v)}
            placeholder="Shanghai, China"
          />
          <Field
            label="Website"
            value={resume.personalInfo.website}
            onChange={(v) => onPersonalInfoChange("website", v)}
            placeholder="linkedin.com/in/jane"
          />
        </div>
      </SectionCard>

      <SectionCard
        title="Professional Summary"
        icon={<FaAlignLeft className="text-blue-600" />}
        isOpen={open.summary}
        onToggle={() => toggle("summary")}
      >
        <Field
          value={resume.summary}
          onChange={(v) => onFieldChange("summary", v)}
          rows={4}
          markdown
          isPreview={previews.summary}
          onTogglePreview={() => togglePreview("summary")}
          placeholder="Two or three sentences describing your experience and strengths."
        />
      </SectionCard>

      <SectionCard
        title="Experience"
        icon={<FaBriefcase className="text-blue-600" />}
        isOpen={open.experiences}
        onToggle={() => toggle("experiences")}
        onAdd={() => onAddRow("experiences")}
      >
        {resume.experiences.length === 0 ? (
          <EmptyHint>No experience yet — use Add to create your first role.</EmptyHint>
        ) : (
          resume.experiences.map((item, index) => (
            <RepeatableRow
              key={index}
              index={index}
              total={resume.experiences.length}
              onRemove={(i) => onRemoveRow("experiences", i)}
              onMove={(from, to) => onMoveRow("experiences", from, to)}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Company"
                  value={item.company}
                  onChange={(v) => onRowChange("experiences", index, "company", v)}
                  placeholder="Acme Inc."
                />
                <Field
                  label="Role"
                  value={item.role}
                  onChange={(v) => onRowChange("experiences", index, "role", v)}
                  placeholder="Product Manager"
                />
              </div>
              <Field
                label="Duration"
                value={item.duration}
                onChange={(v) => onRowChange("experiences", index, "duration", v)}
                placeholder="Jan 2022 — Present"
              />
              <Field
                label="Summary"
                rows={3}
                markdown
                isPreview={previews[`experiences.${index}.summary`]}
                onTogglePreview={() => togglePreview(`experiences.${index}.summary`)}
                value={item.summary}
                onChange={(v) => onRowChange("experiences", index, "summary", v)}
                placeholder={"- Led X, cutting Y by **30%**\n- Shipped Z to 10k users"}
              />
            </RepeatableRow>
          ))
        )}
      </SectionCard>

      <SectionCard
        title="Education"
        icon={<FaGraduationCap className="text-blue-600" />}
        isOpen={open.education}
        onToggle={() => toggle("education")}
        onAdd={() => onAddRow("education")}
      >
        {resume.education.length === 0 ? (
          <EmptyHint>No education entries yet.</EmptyHint>
        ) : (
          resume.education.map((item, index) => (
            <RepeatableRow
              key={index}
              index={index}
              total={resume.education.length}
              onRemove={(i) => onRemoveRow("education", i)}
              onMove={(from, to) => onMoveRow("education", from, to)}
            >
              <Field
                label="School"
                value={item.school}
                onChange={(v) => onRowChange("education", index, "school", v)}
                placeholder="Tsinghua University"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Degree"
                  value={item.degree}
                  onChange={(v) => onRowChange("education", index, "degree", v)}
                  placeholder="BSc Computer Science"
                />
                <Field
                  label="Duration"
                  value={item.duration}
                  onChange={(v) => onRowChange("education", index, "duration", v)}
                  placeholder="2016 — 2020"
                />
              </div>
            </RepeatableRow>
          ))
        )}
      </SectionCard>

      <SectionCard
        title="Skills"
        icon={<FaTools className="text-blue-600" />}
        isOpen={open.skills}
        onToggle={() => toggle("skills")}
      >
        <Field
          label="Comma separated"
          value={resume.skills}
          onChange={(v) => onFieldChange("skills", v)}
          placeholder="React, Node.js, Figma, SQL"
        />
        <p className="text-xs text-slate-400">
          Separate each skill with a comma — they render as individual badges.
        </p>
      </SectionCard>

      <SectionCard
        title="Projects"
        icon={<FaLightbulb className="text-blue-600" />}
        isOpen={open.projects}
        onToggle={() => toggle("projects")}
        onAdd={() => onAddRow("projects")}
      >
        {resume.projects.length === 0 ? (
          <EmptyHint>No projects yet.</EmptyHint>
        ) : (
          resume.projects.map((item, index) => (
            <RepeatableRow
              key={index}
              index={index}
              total={resume.projects.length}
              onRemove={(i) => onRemoveRow("projects", i)}
              onMove={(from, to) => onMoveRow("projects", from, to)}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Title"
                  value={item.title}
                  onChange={(v) => onRowChange("projects", index, "title", v)}
                  placeholder="Realtime dashboard"
                />
                <Field
                  label="Tech"
                  value={item.tech}
                  onChange={(v) => onRowChange("projects", index, "tech", v)}
                  placeholder="React, WebSockets"
                />
              </div>
              <Field
                label="Details"
                rows={3}
                markdown
                isPreview={previews[`projects.${index}.details`]}
                onTogglePreview={() => togglePreview(`projects.${index}.details`)}
                value={item.details}
                onChange={(v) => onRowChange("projects", index, "details", v)}
                placeholder="What it does and your role in it."
              />
            </RepeatableRow>
          ))
        )}
      </SectionCard>

      <SectionCard
        title="Certifications"
        icon={<FaCertificate className="text-blue-600" />}
        isOpen={open.certifications}
        onToggle={() => toggle("certifications")}
        onAdd={() => onAddRow("certifications")}
      >
        {resume.certifications.length === 0 ? (
          <EmptyHint>No certifications yet.</EmptyHint>
        ) : (
          resume.certifications.map((item, index) => (
            <RepeatableRow
              key={index}
              index={index}
              total={resume.certifications.length}
              onRemove={(i) => onRemoveRow("certifications", i)}
              onMove={(from, to) => onMoveRow("certifications", from, to)}
            >
              <Field
                label="Name"
                value={item.name}
                onChange={(v) => onRowChange("certifications", index, "name", v)}
                placeholder="AWS Solutions Architect"
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Issuer"
                  value={item.issuer}
                  onChange={(v) => onRowChange("certifications", index, "issuer", v)}
                  placeholder="Amazon Web Services"
                />
                <Field
                  label="Year"
                  value={item.year}
                  onChange={(v) => onRowChange("certifications", index, "year", v)}
                  placeholder="2024"
                />
              </div>
            </RepeatableRow>
          ))
        )}
      </SectionCard>

      <SectionCard
        title="Languages"
        icon={<FaLanguage className="text-blue-600" />}
        isOpen={open.languages}
        onToggle={() => toggle("languages")}
        onAdd={() => onAddRow("languages")}
      >
        {resume.languages.length === 0 ? (
          <EmptyHint>No languages yet.</EmptyHint>
        ) : (
          resume.languages.map((item, index) => (
            <RepeatableRow
              key={index}
              index={index}
              total={resume.languages.length}
              onRemove={(i) => onRemoveRow("languages", i)}
              onMove={(from, to) => onMoveRow("languages", from, to)}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <Field
                  label="Language"
                  value={item.name}
                  onChange={(v) => onRowChange("languages", index, "name", v)}
                  placeholder="Mandarin"
                />
                <Field
                  label="Level"
                  value={item.level}
                  onChange={(v) => onRowChange("languages", index, "level", v)}
                  placeholder="Native"
                />
              </div>
            </RepeatableRow>
          ))
        )}
      </SectionCard>

      <SectionCard
        title="Custom Sections"
        icon={<FaLayerGroup className="text-blue-600" />}
        isOpen={open.customSections}
        onToggle={() => toggle("customSections")}
        onAdd={() => onAddRow("customSections")}
      >
        {resume.customSections.length === 0 ? (
          <EmptyHint>Add awards, publications, volunteering — anything you need.</EmptyHint>
        ) : (
          resume.customSections.map((item, index) => (
            <RepeatableRow
              key={index}
              index={index}
              total={resume.customSections.length}
              onRemove={(i) => onRemoveRow("customSections", i)}
              onMove={(from, to) => onMoveRow("customSections", from, to)}
            >
              <Field
                label="Section title"
                value={item.title}
                onChange={(v) => onRowChange("customSections", index, "title", v)}
                placeholder="Awards"
              />
              <Field
                label="Details"
                rows={3}
                markdown
                isPreview={previews[`customSections.${index}.details`]}
                onTogglePreview={() => togglePreview(`customSections.${index}.details`)}
                value={item.details}
                onChange={(v) => onRowChange("customSections", index, "details", v)}
                placeholder="Employee of the year, 2023"
              />
            </RepeatableRow>
          ))
        )}
      </SectionCard>
    </div>
  );
});

export default ResumeForm;
