import { memo, useCallback, useRef, useState } from "react";
import {
  FaUser,
  FaAddressCard,
  FaAlignLeft,
  FaBriefcase,
  FaGraduationCap,
  FaTools,
  FaLightbulb,
  FaCertificate,
  FaLanguage,
  FaLayerGroup,
  FaCamera,
  FaTrash,
} from "react-icons/fa";
import Field from "./Field";
import SectionCard, { EmptyHint, RepeatableRow } from "./SectionCard";

/**
 * Every editable section of the resume.
 *
 * Deliberately controlled and stateless with respect to the resume itself:
 * it renders `resume` and reports changes upward via callbacks.
 * Only accordion open/closed state and markdown preview toggles are local.
 */
const ResumeForm = memo(function ResumeForm({
  resume,
  onFieldChange,
  onPersonalInfoChange,
  onContactChange,
  onPictureUpload,
  onRowChange,
  onAddRow,
  onRemoveRow,
  onMoveRow,
}) {
  const [open, setOpen] = useState({
    personal: true,
    contact: true,
    summary: true,
    experiences: true,
  });
  const toggle = (key) => setOpen((prev) => ({ ...prev, [key]: !prev[key] }));

  const [previews, setPreviews] = useState({});
  const togglePreview = useCallback((key) => {
    setPreviews((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // Picture upload — hidden file input triggered by the visible button
  const pictureInputRef = useRef(null);
  const handlePictureChange = (e) => {
    const file = e.target.files?.[0];
    if (file) onPictureUpload(file);
    // Reset so the same file can be re-selected after removal
    e.target.value = "";
  };

  const pictureUrl = resume.pictureUrl
    ? `http://localhost:3000${resume.pictureUrl}`
    : null;

  return (
    <div className="space-y-4">

      {/* ── Personal Information ─────────────────────────────────────── */}
      <SectionCard
        title="Personal Information"
        icon={<FaUser className="text-blue-600" />}
        isOpen={open.personal}
        onToggle={() => toggle("personal")}
      >
        {/* Picture upload */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {pictureUrl ? (
              <img
                src={pictureUrl}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover ring-2 ring-blue-200"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-100 ring-2 ring-slate-200">
                <FaCamera className="h-7 w-7 text-slate-400" />
              </div>
            )}
            {pictureUrl && (
              <button
                type="button"
                onClick={() => onFieldChange("pictureUrl", null)}
                className="absolute -right-1 -top-1 rounded-full bg-red-500 p-1 text-white hover:bg-red-600"
                title="Remove picture"
              >
                <FaTrash className="h-2.5 w-2.5" />
              </button>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <button
              type="button"
              onClick={() => pictureInputRef.current?.click()}
              className="rounded-full border border-blue-300 px-4 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50"
            >
              {pictureUrl ? "Change photo" : "Upload photo"}
            </button>
            <p className="text-xs text-slate-400">JPEG, PNG, WebP — max 5 MB</p>
            <input
              ref={pictureInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handlePictureChange}
            />
          </div>
        </div>

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
        </div>
        <Field
          label="About"
          value={resume.personalInfo.about}
          onChange={(v) => onPersonalInfoChange("about", v)}
          rows={3}
          placeholder="Short bio shown at the top of the resume."
        />
      </SectionCard>

      {/* ── Contact Information ──────────────────────────────────────── */}
      <SectionCard
        title="Contact Information"
        icon={<FaAddressCard className="text-blue-600" />}
        isOpen={open.contact}
        onToggle={() => toggle("contact")}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Email"
            type="email"
            value={resume.contact.email}
            onChange={(v) => onContactChange("email", v)}
            placeholder="jane@example.com"
          />
          <Field
            label="Phone"
            value={resume.contact.phone}
            onChange={(v) => onContactChange("phone", v)}
            placeholder="+1 555 000 0000"
          />
          <Field
            label="Location"
            value={resume.contact.location}
            onChange={(v) => onContactChange("location", v)}
            placeholder="New York, USA"
          />
          <Field
            label="Address"
            value={resume.contact.address}
            onChange={(v) => onContactChange("address", v)}
            placeholder="123 Main St"
          />
          <Field
            label="Website"
            value={resume.contact.website}
            onChange={(v) => onContactChange("website", v)}
            placeholder="janedoe.dev"
          />
          <Field
            label="LinkedIn"
            value={resume.contact.linkedin}
            onChange={(v) => onContactChange("linkedin", v)}
            placeholder="linkedin.com/in/jane"
          />
          <Field
            label="GitHub"
            value={resume.contact.github}
            onChange={(v) => onContactChange("github", v)}
            placeholder="github.com/jane"
          />
          <Field
            label="Twitter / X"
            value={resume.contact.twitter}
            onChange={(v) => onContactChange("twitter", v)}
            placeholder="@janedoe"
          />
        </div>
      </SectionCard>

      {/* ── Professional Summary ─────────────────────────────────────── */}
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

      {/* ── Experience ───────────────────────────────────────────────── */}
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

      {/* ── Education ────────────────────────────────────────────────── */}
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

      {/* ── Skills ───────────────────────────────────────────────────── */}
      <SectionCard
        title="Skills"
        icon={<FaTools className="text-blue-600" />}
        isOpen={open.skills}
        onToggle={() => toggle("skills")}
        onAdd={() => onAddRow("skills")}
      >
        {resume.skills.length === 0 ? (
          <EmptyHint>No skills yet — use Add to create your first skill.</EmptyHint>
        ) : (
          resume.skills.map((item, index) => (
            <RepeatableRow
              key={index}
              index={index}
              total={resume.skills.length}
              onRemove={(i) => onRemoveRow("skills", i)}
              onMove={(from, to) => onMoveRow("skills", from, to)}
            >
              <Field
                label="Skill name"
                value={item.skill_name}
                onChange={(v) => onRowChange("skills", index, "skill_name", v)}
                placeholder="React, Node.js, Figma…"
              />
              <Field
                label="Summary (optional)"
                rows={2}
                markdown
                isPreview={previews[`skills.${index}.summary`]}
                onTogglePreview={() => togglePreview(`skills.${index}.summary`)}
                value={item.summary}
                onChange={(v) => onRowChange("skills", index, "summary", v)}
                placeholder="Brief description or proficiency level"
              />
            </RepeatableRow>
          ))
        )}
      </SectionCard>

      {/* ── Projects ─────────────────────────────────────────────────── */}
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

      {/* ── Certifications ───────────────────────────────────────────── */}
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

      {/* ── Languages ────────────────────────────────────────────────── */}
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

      {/* ── Custom Sections ───────────────────────────────────────────── */}
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
