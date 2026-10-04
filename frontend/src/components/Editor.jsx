import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { FaSave, FaArrowLeft, FaPalette } from "react-icons/fa";
import { useResume } from "../contex/resumeContext";
import { resumeApi } from "../services/api";
import ResumeForm from "./editor/ResumeForm";
import ResumePreview from "./editor/ResumePreview";
import {
  DEFAULT_TEMPLATE_ID,
  TEMPLATES,
  isKnownTemplate,
  resolveTemplate,
} from "../utils/templates";
import { createEmptyResume, createEmptyRow, normalizeResume } from "../utils/resume";

const EditorContent = ({ id, templateParam, isNew }) => {
  const navigate = useNavigate();
  const {
    templates,
    isAuthenticated,
    authchecked,
    fetchResume,
    createResume,
    updateResume,
  } = useResume();

  // Draft lives here rather than in context so keystrokes re-render only the
  // editor, and an abandoned draft never leaks into the rest of the app.
  const [resume, setResume] = useState(() =>
    createEmptyResume(templateParam || DEFAULT_TEMPLATE_ID),
  );
  const [resumeId, setResumeId] = useState(isNew ? null : id);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);

  // Warn once per bad id. Doing this in render would fire on every keystroke.
  const warnedRef = useRef(false);
  useEffect(() => {
    if (isNew && templateParam && !isKnownTemplate(templateParam, templates) && !warnedRef.current) {
      warnedRef.current = true;
      toast.error("Unknown template — using the default design.");
    }
  }, [isNew, templateParam, templates]);

  // Guard the route. `authchecked` prevents redirecting a signed-in user during
  // the initial /auth/me round trip, which would otherwise bounce them on
  // refresh. The full URL is preserved so login can return here.
  useEffect(() => {
    if (authchecked && !isAuthenticated) {
      const from = `/editor/${isNew ? "new" : id}${templateParam ? `?template=${templateParam}` : ""}`;
      navigate("/login", { replace: true, state: { from } });
    }
  }, [authchecked, isAuthenticated, navigate, id, isNew, templateParam]);

  // Load an existing resume. New drafts skip the request entirely.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (isNew || !isAuthenticated) return;
      setIsLoading(true);
      const data = await fetchResume(id);
      if (cancelled) return;

      // fetchResume resolves to [] when the request fails or 404s.
      if (!data || Array.isArray(data)) {
        toast.error("Resume not found.");
        navigate("/my-resumes", { replace: true });
        return;
      }
      // The saved templateId wins, so reopening restores the chosen design.
      setResume(normalizeResume(data, templateParam));
      setResumeId(data._id);
      setIsLoading(false);
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [id, isNew, isAuthenticated, fetchResume, navigate, templateParam]);

  const template = useMemo(
    () => resolveTemplate(resume.templateId, templates),
    [resume.templateId, templates],
  );

  const templateOptions = useMemo(() => {
    const list = templates?.length ? templates : Object.values(TEMPLATES);
    return list.filter((t) => t?.isActive !== false);
  }, [templates]);

  // All mutators use the functional form of setState so they never depend on
  // `resume`; that keeps their identity stable and stops the memoised form and
  // preview from re-rendering unnecessarily.
  const handleFieldChange = useCallback((field, value) => {
    setResume((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handlePersonalInfoChange = useCallback((field, value) => {
    setResume((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value },
    }));
  }, []);

  const handleContactChange = useCallback((field, value) => {
    setResume((prev) => ({
      ...prev,
      contact: { ...prev.contact, [field]: value },
    }));
  }, []);

  // The upload is independent of the resume, so it works on an unsaved draft.
  // Only the returned URL goes into the draft; it is persisted on Save along
  // with every other field.
  const handlePictureUpload = useCallback(async (file) => {
    const formData = new FormData();
    formData.append("picture", file);
    try {
      const response = await resumeApi.uploadPicture(formData);
      setResume((prev) => ({ ...prev, pictureUrl: response.data.pictureUrl }));
      toast.success("Picture uploaded — save to keep it.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to upload picture.");
    }
  }, []);

  const handleRowChange = useCallback((section, index, field, value) => {
    setResume((prev) => ({
      ...prev,
      [section]: prev[section].map((row, i) =>
        i === index ? { ...row, [field]: value } : row,
      ),
    }));
  }, []);

  const handleAddRow = useCallback((section) => {
    setResume((prev) => ({
      ...prev,
      [section]: [...prev[section], createEmptyRow(section)],
    }));
  }, []);

  const handleRemoveRow = useCallback((section, index) => {
    setResume((prev) => ({
      ...prev,
      [section]: prev[section].filter((_, i) => i !== index),
    }));
  }, []);

  // Moves one row to a new position. Splice order matters: remove first, then
  // insert, so dragging downwards does not land one slot short.
  const handleMoveRow = useCallback((section, from, to) => {
    setResume((prev) => {
      const rows = prev[section];
      if (from === to || from < 0 || to < 0 || from >= rows.length || to >= rows.length) {
        return prev;
      }
      const next = [...rows];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return { ...prev, [section]: next };
    });
  }, []);

  // Switching templates only ever touches templateId — content is untouched.
  const handleTemplateChange = useCallback((nextTemplateId) => {
    setResume((prev) => ({ ...prev, templateId: nextTemplateId }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // templateId travels with the payload, so the design is persisted
      // alongside the content.
      if (resumeId) {
        await updateResume(resumeId, resume);
      } else {
        const created = await createResume(resume);
        if (created?._id) {
          setResumeId(created._id);
          // Swap the URL to the real id so a refresh reloads the saved resume
          // instead of silently starting a second empty draft.
          navigate(`/editor/${created._id}`, { replace: true });
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (!authchecked || isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-slate-600">Loading editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
            aria-label="Go back"
          >
            <FaArrowLeft />
          </button>
          <input
            value={resume.title}
            onChange={(e) => handleFieldChange("title", e.target.value)}
            className="rounded-lg border border-transparent px-2 py-1 text-2xl font-black tracking-tight text-slate-900 outline-none transition hover:border-slate-200 focus:border-blue-500"
            aria-label="Resume title"
          />
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm">
            <FaPalette className="text-blue-600" />
            <select
              value={resume.templateId}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-blue-500"
            >
              {templateOptions.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FaSave />
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto lg:pr-2">
          <ResumeForm
            resume={resume}
            onFieldChange={handleFieldChange}
            onPersonalInfoChange={handlePersonalInfoChange}
            onContactChange={handleContactChange}
            onPictureUpload={handlePictureUpload}
            onRowChange={handleRowChange}
            onAddRow={handleAddRow}
            onRemoveRow={handleRemoveRow}
            onMoveRow={handleMoveRow}
          />
        </div>

        <div className="lg:sticky lg:top-6 lg:max-h-[calc(100vh-10rem)] lg:overflow-y-auto">
          <ResumePreview resume={resume} template={template} />
        </div>
      </div>
    </div>
  );
};

/**
 * Remounts the editor whenever the target resume or the requested template
 * changes. Keying here resets the draft declaratively; the alternative -
 * syncing state from an effect - causes an extra cascading render and would
 * silently clobber edits made before the URL changed.
 */
const Editor = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const templateParam = searchParams.get("template");
  const isNew = !id || id === "new";

  return (
    <EditorContent
      key={`${id || "new"}:${templateParam || ""}`}
      id={id}
      templateParam={templateParam}
      isNew={isNew}
    />
  );
};

export default Editor;
