import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useResume } from "../contex/resumeContext";
import { TEMPLATES } from "../utils/templates";
import { FaPalette, FaStar } from "react-icons/fa";

// ---------------------------------------------------------------------------
// Filter sidebar configuration
// ---------------------------------------------------------------------------

const OCCUPATION_OPTIONS = [
  "Management & Executive",
  "Office & Administrative Support",
  "Business & Finance",
  "Retail & Sales",
  "Healthcare & Medical",
];

const INITIAL_FILTERS = { headshot: [], columns: [], style: [], occupation: [] };

// ---------------------------------------------------------------------------
// FilterGroup — collapsible section with checkboxes
// ---------------------------------------------------------------------------

const FilterGroup = ({ label, options, selected, onChange }) => {
  const toggle = (value) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  return (
    <div className="mb-5">
      <p className="font-semibold text-sm text-slate-800 mb-2">{label}</p>
      <div className="space-y-1.5">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
              className="accent-blue-600 w-3.5 h-3.5 shrink-0"
            />
            <span className="text-sm text-slate-600 leading-snug">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// OccupationFilterGroup — like FilterGroup but with "Show more" toggle
// ---------------------------------------------------------------------------

const OccupationFilterGroup = ({ selected, onChange }) => {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? OCCUPATION_OPTIONS : OCCUPATION_OPTIONS.slice(0, 5);

  const toggle = (value) => {
    onChange(
      selected.includes(value)
        ? selected.filter((v) => v !== value)
        : [...selected, value]
    );
  };

  return (
    <div className="mb-5">
      <p className="font-semibold text-sm text-slate-800 mb-2">Occupation</p>
      <div className="space-y-1.5">
        {visible.map((opt) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => toggle(opt)}
              className="accent-blue-600 w-3.5 h-3.5 shrink-0"
            />
            <span className="text-sm text-slate-600 leading-snug">{opt}</span>
          </label>
        ))}
      </div>
      {OCCUPATION_OPTIONS.length > 5 && (
        <button
          onClick={() => setShowAll((s) => !s)}
          className="mt-2 text-blue-600 text-sm font-medium cursor-pointer hover:underline"
        >
          {showAll ? "Show less" : `Show more`}
        </button>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const Templates = () => {
  const navigate = useNavigate();
  const { templates, isAuthenticated, loading } = useResume();

  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [searchTerm, setSearchTerm] = useState("");

  const setGroup = (group) => (values) =>
    setFilters((prev) => ({ ...prev, [group]: values }));

  const clearFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSearchTerm("");
  };

  const hasActiveFilters =
    searchTerm.trim() ||
    Object.values(filters).some((arr) => arr.length > 0);

  // Build the base list from API data when available, otherwise fall back to
  // the bundled catalogue.
  const templateList = useMemo(() => {
    if (templates.length > 0) {
      return templates.filter((t) => t.isActive !== false);
    }
    return Object.values(TEMPLATES);
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let result = templateList;

    // --- headshot ---
    if (filters.headshot.length > 0) {
      result = result.filter((t) => {
        const withPhoto = filters.headshot.includes("With photo");
        const withoutPhoto = filters.headshot.includes("Without photo");
        if (withPhoto && withoutPhoto) return true;
        if (withPhoto) return t.hasPhoto === true;
        if (withoutPhoto) return t.hasPhoto === false;
        return true;
      });
    }

    // --- columns ---
    if (filters.columns.length > 0) {
      result = result.filter((t) => {
        return filters.columns.some((opt) => {
          if (opt === "1 Column") return t.columns === 1;
          if (opt === "2 Columns") return t.columns === 2;
          return false;
        });
      });
    }

    // --- style ---
    if (filters.style.length > 0) {
      result = result.filter((t) =>
        filters.style.some((opt) => t.style === opt.toLowerCase())
      );
    }

    // --- occupation ---
    if (filters.occupation.length > 0) {
      result = result.filter((t) => filters.occupation.includes(t.occupation));
    }

    // --- search ---
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          t.category.toLowerCase().includes(term) ||
          (t.tags && t.tags.some((tag) => tag.toLowerCase().includes(term))) ||
          (t.description && t.description.toLowerCase().includes(term))
      );
    }

    // Sort by popularity (most popular first)
    return result.slice().sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [templateList, filters, searchTerm]);

  // Templates are loaded once by ResumeProvider on mount, so this page only
  // needs to navigate. `encodeURIComponent` keeps ids containing reserved
  // characters from corrupting the query string.
  const handleSelectTemplate = (templateId) => {
    const target = `/editor/new?template=${encodeURIComponent(templateId)}`;
    if (isAuthenticated) {
      navigate(target);
    } else {
      navigate("/login", { state: { from: target } });
    }
  };

  // Loading state
  if (loading && templates.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
          <p className="mt-4 text-slate-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
      {/* Page heading */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-3">
          <FaPalette className="text-blue-600" />
          Choose Your Template
        </h2>
        <p className="text-slate-500 mt-2">
          {filteredTemplates.length} templates available • Click any to start editing
        </p>
      </div>

      {/* Layout: sidebar + main */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ------------------------------------------------------------------ */}
        {/* Sidebar filters                                                     */}
        {/* ------------------------------------------------------------------ */}
        <aside className="w-full lg:w-65 shrink-0 lg:sticky lg:top-6 lg:self-start bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-blue-600 text-sm font-medium cursor-pointer hover:underline"
              >
                Clear Filters
              </button>
            )}
          </div>

          <FilterGroup
            label="Headshot"
            options={["With photo", "Without photo"]}
            selected={filters.headshot}
            onChange={setGroup("headshot")}
          />

          <FilterGroup
            label="Columns"
            options={["1 Column", "2 Columns"]}
            selected={filters.columns}
            onChange={setGroup("columns")}
          />

          <FilterGroup
            label="Style"
            options={["Traditional", "Creative", "Contemporary"]}
            selected={filters.style}
            onChange={setGroup("style")}
          />

          <OccupationFilterGroup
            selected={filters.occupation}
            onChange={setGroup("occupation")}
          />
        </aside>

        {/* ------------------------------------------------------------------ */}
        {/* Main content                                                        */}
        {/* ------------------------------------------------------------------ */}
        <div className="flex-1 min-w-0">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <input
                type="text"
                placeholder="Search templates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 pl-10 rounded-full border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
              />
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Template Grid */}
          {filteredTemplates.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-slate-500 text-lg">
                No templates found matching your criteria.
              </p>
              <button
                onClick={clearFilters}
                className="mt-4 text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer hover:-translate-y-1 relative"
                  onClick={() => handleSelectTemplate(tpl.id)}
                >
                  {/* Popularity Badge */}
                  {(tpl.popularity || 0) > 0 && (
                    <div className="absolute top-3 right-3 z-10 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-md">
                      <FaStar className="w-3 h-3" />
                      {tpl.popularity}
                    </div>
                  )}

                  {/* Miniature of the real layout. `styling.name` / `styling.role`
                      hold Tailwind class names, so they are applied as classNames
                      here rather than printed as text like they were before. */}
                  <div className="relative aspect-[1/1.35] bg-slate-100 p-4 overflow-hidden">
                    <div
                      className={`w-full h-full rounded-lg shadow-md overflow-hidden ${tpl.styling?.canvas || ""}`}
                    >
                      {/* Tailwind v4 puts the important modifier at the END
                          (`p-3!`); the v3 prefix form `!p-3` is no longer parsed.
                          It is needed so these miniature sizes beat the padding and
                          font sizes baked into the template's own classes. */}
                      <div className={`${tpl.styling?.header || ""} p-3!`}>
                        <div className={`${tpl.styling?.name || ""} text-[9px]! truncate`}>
                          John Doe
                        </div>
                        <div className={`${tpl.styling?.role || ""} text-[6px]! mt-0.5! truncate`}>
                          Software Developer
                        </div>
                      </div>
                      <div className="p-3">
                        <div className={`${tpl.styling?.heading || ""} text-[6px]! pb-0.5!`}>
                          Experience
                        </div>
                        <div className="mt-1.5 space-y-1">
                          <div className="h-0.5 w-full rounded bg-slate-200" />
                          <div className="h-0.5 w-5/6 rounded bg-slate-200" />
                          <div className="h-0.5 w-4/6 rounded bg-slate-200" />
                        </div>
                        <div className={`${tpl.styling?.skillContainer || ""} mt-2!`}>
                          {["React", "Node", "SQL"].map((skill) => (
                            <span
                              key={skill}
                              className={`${tpl.styling?.skillBadge || ""} text-[5px]! px-1! py-0!`}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Template Info */}
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition">
                          {tpl.name}
                        </h3>
                        <span className="inline-block mt-1 text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                          {tpl.category || "General"}
                        </span>
                      </div>
                      <span className="text-xs text-slate-400">
                        v{tpl.version || 1}
                      </span>
                    </div>
                    {tpl.description && (
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {tpl.description}
                      </p>
                    )}
                    {tpl.tags && tpl.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {tpl.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full"
                          >
                            #{tag}
                          </span>
                        ))}
                        {tpl.tags.length > 3 && (
                          <span className="text-[10px] text-slate-400">
                            +{tpl.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl pointer-events-none" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Templates;
