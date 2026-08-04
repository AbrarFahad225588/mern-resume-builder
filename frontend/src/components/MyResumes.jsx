import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useResume } from "../contex/resumeContext";
import { resolveTemplate } from "../utils/templates";
import { FaFileAlt, FaPlus, FaTrash, FaEdit, FaPalette } from "react-icons/fa";

// Dates come back as ISO strings; guard against missing/invalid values so a
// legacy document without timestamps cannot render "Invalid Date".
const formatDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

const MyResumes = () => {
  const navigate = useNavigate();
  const { resumes, templates, isAuthenticated, authchecked, deleteResume, loading } =
    useResume();

  // Same guard as the editor: wait for the auth check to finish so a refresh
  // does not bounce a signed-in user to the login page.
  useEffect(() => {
    if (authchecked && !isAuthenticated) {
      navigate("/login", { replace: true, state: { from: "/my-resumes" } });
    }
  }, [authchecked, isAuthenticated, navigate]);

  if (!authchecked || (loading && resumes.length === 0)) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="mt-4 text-slate-600">Loading your resumes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-3 text-4xl font-black tracking-tight text-slate-900">
            <FaFileAlt className="text-blue-600" />
            My Resumes
          </h1>
          <p className="mt-2 text-slate-500">
            {resumes.length} {resumes.length === 1 ? "resume" : "resumes"} saved
          </p>
        </div>
        <Link
          to="/templates"
          className="flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-blue-200 transition hover:bg-blue-700"
        >
          <FaPlus />
          New Resume
        </Link>
      </div>

      {resumes.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/60 py-20 text-center">
          <FaFileAlt className="mx-auto h-12 w-12 text-slate-300" />
          <h2 className="mt-4 text-lg font-semibold text-slate-800">No resumes yet</h2>
          <p className="mt-1 text-sm text-slate-500">
            Pick a template to create your first resume.
          </p>
          <Link
            to="/templates"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            <FaPalette />
            Browse Templates
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {resumes.map((resume) => {
            // Resolve so the card shows the design the resume was saved with.
            const template = resolveTemplate(resume.templateId, templates);
            return (
              <div
                key={resume._id}
                className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                onClick={() => navigate(`/editor/${resume._id}`)}
              >
                <div className={`${template.styling.header} p-4`}>
                  <div className={`${template.styling.name} text-lg! truncate`}>
                    {resume.personalInfo?.fullname || "Untitled"}
                  </div>
                  <div className={`${template.styling.role} text-xs! mt-0.5! truncate`}>
                    {resume.personalInfo?.role || "No title yet"}
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="truncate font-semibold text-slate-900 transition group-hover:text-blue-600">
                    {resume.title || "Untitled Resume"}
                  </h3>
                  <p className="mt-1 text-xs text-slate-400">
                    {template.name} • Updated {formatDate(resume.updatedAt)}
                  </p>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        // The whole card navigates, so stop the bubble.
                        e.stopPropagation();
                        navigate(`/editor/${resume._id}`);
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                    >
                      <FaEdit className="h-3 w-3" />
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteResume(resume._id);
                      }}
                      aria-label="Delete resume"
                      className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <FaTrash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyResumes;
