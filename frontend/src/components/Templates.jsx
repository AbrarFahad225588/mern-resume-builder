import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useResume } from "../contex/ResumeContex";
import { TEMPLATES } from "../utils/templates";
import { FaPalette, FaStar } from "react-icons/fa";

const Templates = () => {
  const navigate = useNavigate();
  const { templates, isAuthenticated, loading } = useResume();

  const [activeFilter, setActiveFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const categories = useMemo(() => {
    const uniqueCategories = ["All", ...new Set(templates.map(t => t.category))];
    return uniqueCategories.length > 1 ? uniqueCategories : ["All", "Corporate", "Executive", "Tech", "Creative"];
  }, [templates]);

  const templateList = useMemo(() => {
    if (templates.length > 0) {
      return templates.filter(t => t.isActive !== false);
    }
    return Object.values(TEMPLATES);
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let result = templateList;
    
    if (activeFilter !== "All") {
      result = result.filter((t) => t.category === activeFilter);
    }
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter((t) => 
        t.name.toLowerCase().includes(term) ||
        t.category.toLowerCase().includes(term) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(term))) ||
        (t.description && t.description.toLowerCase().includes(term))
      );
    }
    
    // Sort by popularity (most popular first)
    return result.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
  }, [templateList, activeFilter, searchTerm]);

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
      <div className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center justify-center gap-3">
          <FaPalette className="text-blue-600" />
          Choose Your Template
        </h2>
        <p className="text-slate-500 mt-2">
          {filteredTemplates.length} templates available • Click any to start editing
        </p>
      </div>

      {/* Search Bar */}
      <div className="max-w-md mx-auto mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-10 rounded-full border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition"
          />
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === cat
                ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                : "bg-slate-200 text-slate-700 hover:bg-slate-300"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Template Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-slate-500 text-lg">No templates found matching your criteria.</p>
          <button
            onClick={() => { setActiveFilter("All"); setSearchTerm(""); }}
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
                      <span className="text-[10px] text-slate-400">+{tpl.tags.length - 3}</span>
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
  );
};

export default Templates;