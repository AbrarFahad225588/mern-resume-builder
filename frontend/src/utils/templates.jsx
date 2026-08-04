// Template catalogue.
//
// The map is keyed by the SAME value as each entry's `id`, and those ids match
// the ones seeded in the backend (backend/data/templatesData.js). Previously
// the keys and ids disagreed ("modern" -> id "modern", "china-tech-002" -> id
// "charcoal"), so a URL such as /editor/new?template=china-executive-001 could
// never be resolved. Keep the key and the id identical when adding templates.
//
// Colours use real Tailwind palette entries only. Classes like `bg-maroon-800`
// or `bg-navy-900` do not exist, so they used to compile away to nothing and
// left white text on a transparent header.
export const TEMPLATES = {
  "china-executive-001": {
    id: "china-executive-001",
    name: "China Executive Elite",
    layoutStyle: "Modern • C-Suite",
    category: "Executive",
    tags: ["executive", "professional", "minimal", "dark-accent"],
    description:
      "Sophisticated template for C-suite executives with dark accent colors, perfect for senior management positions in China's top corporations.",
    styling: {
      canvas: "bg-white shadow-2xl font-sans",
      header: "bg-gray-900 text-white p-8",
      name: "text-4xl font-bold tracking-wide",
      role: "text-xl font-light text-gray-300 mt-2",
      heading:
        "text-lg font-semibold text-gray-800 border-b-2 border-gray-900 pb-2",
      skillContainer: "flex flex-wrap gap-2 mt-3",
      skillBadge: "bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm",
    },
    previewImage: null,
    isActive: true,
    version: 1,
    popularity: 95,
  },
  "china-tech-002": {
    id: "china-tech-002",
    name: "China Tech Innovator",
    layoutStyle: "Modern • Gradient Accent",
    category: "Tech",
    tags: ["tech", "startup", "innovative", "gradient"],
    description:
      "Dynamic template with gradient accents designed for software engineers, data scientists, and tech innovators in China's booming digital economy.",
    styling: {
      canvas: "bg-gradient-to-br from-blue-50 to-purple-50 shadow-xl font-sans",
      header: "bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8",
      name: "text-4xl font-bold tracking-tight",
      role: "text-xl font-light text-blue-100 mt-2",
      heading:
        "text-lg font-semibold text-gray-800 border-b-2 border-blue-500 pb-2",
      skillContainer: "flex flex-wrap gap-2 mt-3",
      skillBadge:
        "bg-blue-100 text-blue-800 px-3 py-1 rounded-lg text-sm font-medium",
    },
    previewImage: null,
    isActive: true,
    version: 1,
    popularity: 92,
  },
  "china-corporate-003": {
    id: "china-corporate-003",
    name: "China Corporate Standard",
    layoutStyle: "Classic • Blue Tones",
    category: "Corporate",
    tags: ["corporate", "traditional", "reliable", "blue"],
    description:
      "Clean corporate template with classic blue tones, widely accepted in Chinese state-owned enterprises and established corporations.",
    styling: {
      canvas: "bg-white shadow-lg font-sans",
      header: "bg-blue-800 text-white p-6",
      name: "text-3xl font-bold",
      role: "text-lg font-light text-blue-200 mt-1",
      heading:
        "text-base font-semibold text-gray-700 border-b-2 border-blue-600 pb-1",
      skillContainer: "flex flex-wrap gap-1 mt-2",
      skillBadge: "bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs",
    },
    previewImage: null,
    isActive: true,
    version: 1,
    popularity: 88,
  },
  "china-creative-004": {
    id: "china-creative-004",
    name: "China Creative Portfolio",
    layoutStyle: "Creative • Vibrant",
    category: "Creative",
    tags: ["creative", "design", "portfolio", "colorful"],
    description:
      "Vibrant template for designers, artists, and creative professionals in China's advertising and entertainment industries.",
    styling: {
      canvas: "bg-white shadow-2xl rounded-2xl overflow-hidden font-sans",
      header: "bg-gradient-to-r from-pink-500 to-orange-400 text-white p-10",
      name: "text-5xl font-black tracking-wider",
      role: "text-xl font-light text-pink-100 mt-2",
      heading: "text-xl font-bold text-gray-800 border-l-4 border-pink-500 pl-3",
      skillContainer: "flex flex-wrap gap-3 mt-4",
      skillBadge:
        "bg-pink-100 text-pink-700 px-4 py-2 rounded-full text-sm font-medium",
    },
    previewImage: null,
    isActive: true,
    version: 1,
    popularity: 85,
  },
  "china-finance-005": {
    id: "china-finance-005",
    name: "China Financial Professional",
    layoutStyle: "Modern • Elegant",
    category: "Corporate",
    tags: ["finance", "banking", "professional", "green"],
    description:
      "Elegant template with forest green accents, tailored for banking, finance, and investment professionals in China's financial hubs.",
    styling: {
      canvas: "bg-gray-50 shadow-xl font-serif",
      header: "bg-green-800 text-white p-7",
      name: "text-3xl font-serif font-bold",
      role: "text-lg font-light text-green-200 mt-1",
      heading:
        "text-lg font-semibold text-gray-800 border-b-2 border-green-700 pb-2",
      skillContainer: "flex flex-wrap gap-2 mt-3",
      skillBadge: "bg-green-100 text-green-800 px-3 py-1 rounded-md text-sm",
    },
    previewImage: null,
    isActive: true,
    version: 1,
    popularity: 87,
  },
  "china-academic-006": {
    id: "china-academic-006",
    name: "China Academic Scholar",
    layoutStyle: "Classic • Formal",
    category: "Executive",
    tags: ["academic", "research", "education", "maroon"],
    description:
      "Formal academic template for professors, researchers, and educators in Chinese universities and research institutions.",
    styling: {
      canvas: "bg-white shadow-lg font-serif",
      header: "bg-red-900 text-white p-6",
      name: "text-3xl font-serif font-bold",
      role: "text-lg font-light text-red-200 mt-1",
      heading:
        "text-base font-semibold text-gray-700 border-b-2 border-red-800 pb-1",
      skillContainer: "flex flex-wrap gap-1 mt-2",
      skillBadge: "bg-red-50 text-red-900 px-2 py-1 rounded-sm text-xs",
    },
    previewImage: null,
    isActive: true,
    version: 1,
    popularity: 82,
  },
  "china-sales-007": {
    id: "china-sales-007",
    name: "China Sales Achiever",
    layoutStyle: "Modern • High-Impact",
    category: "Corporate",
    tags: ["sales", "marketing", "dynamic", "orange"],
    description:
      "High-impact template with orange accents for sales managers, marketing directors, and business development professionals.",
    styling: {
      canvas: "bg-white shadow-xl font-sans",
      header: "bg-gradient-to-r from-orange-600 to-red-600 text-white p-8",
      name: "text-4xl font-bold",
      role: "text-xl font-light text-orange-100 mt-2",
      heading:
        "text-lg font-bold text-gray-800 border-b-4 border-orange-500 pb-2",
      skillContainer: "flex flex-wrap gap-2 mt-3",
      skillBadge:
        "bg-orange-100 text-orange-800 px-3 py-1 rounded-lg text-sm font-medium",
    },
    previewImage: null,
    isActive: true,
    version: 1,
    popularity: 83,
  },
  "china-minimal-008": {
    id: "china-minimal-008",
    name: "China Minimal Professional",
    layoutStyle: "Minimal • Clean",
    category: "Tech",
    tags: ["minimal", "clean", "modern", "monochrome"],
    description:
      "Ultra-minimalist template with monochrome design, popular among China's tech startups and modern professionals.",
    styling: {
      canvas: "bg-white shadow-lg font-sans",
      header: "bg-gray-50 border-b-2 border-gray-900 p-6 text-gray-900",
      name: "text-4xl font-light tracking-wider",
      role: "text-lg font-light text-gray-600 mt-1",
      heading:
        "text-sm font-bold text-gray-900 uppercase tracking-widest border-t-2 border-gray-900 pt-2",
      skillContainer: "flex flex-wrap gap-2 mt-2",
      skillBadge:
        "bg-gray-100 text-gray-700 px-2 py-1 text-xs uppercase tracking-wide",
    },
    previewImage: null,
    isActive: true,
    version: 1,
    popularity: 90,
  },
  "china-healthcare-009": {
    id: "china-healthcare-009",
    name: "China Healthcare Professional",
    layoutStyle: "Modern • Trustworthy",
    category: "Executive",
    tags: ["healthcare", "medical", "trust", "teal"],
    description:
      "Trustworthy template with teal accents for medical professionals, healthcare administrators, and pharmaceutical executives.",
    styling: {
      canvas: "bg-white shadow-xl font-sans",
      header: "bg-teal-700 text-white p-8",
      name: "text-4xl font-bold",
      role: "text-xl font-light text-teal-200 mt-2",
      heading:
        "text-lg font-semibold text-gray-800 border-b-2 border-teal-600 pb-2",
      skillContainer: "flex flex-wrap gap-2 mt-3",
      skillBadge: "bg-teal-50 text-teal-800 px-3 py-1 rounded-full text-sm",
    },
    previewImage: null,
    isActive: true,
    version: 1,
    popularity: 80,
  },
  "china-legal-010": {
    id: "china-legal-010",
    name: "China Legal Counsel",
    layoutStyle: "Classic • Authoritative",
    category: "Executive",
    tags: ["legal", "law", "formal", "navy"],
    description:
      "Authoritative template with navy blue styling, designed for lawyers, legal professionals, and compliance officers.",
    styling: {
      canvas: "bg-white shadow-2xl font-serif",
      header: "bg-blue-950 text-white p-6",
      name: "text-3xl font-serif font-bold tracking-wide",
      role: "text-lg font-light text-gray-300 mt-1",
      heading:
        "text-base font-semibold text-gray-700 border-b-2 border-blue-900 pb-1",
      skillContainer: "flex flex-wrap gap-1 mt-2",
      skillBadge:
        "bg-blue-50 text-blue-900 px-2 py-1 rounded text-xs font-medium",
    },
    previewImage: null,
    isActive: true,
    version: 1,
    popularity: 78,
  },
};

// Used whenever the requested template is missing or unknown.
export const DEFAULT_TEMPLATE_ID = "china-executive-001";

// Styling fallbacks. A template coming from the API may omit individual keys,
// and an undefined className would otherwise render as the string "undefined".
const FALLBACK_STYLING = {
  canvas: "bg-white shadow-lg font-sans",
  header: "bg-gray-900 text-white p-8",
  name: "text-4xl font-bold",
  role: "text-lg font-light text-gray-300 mt-1",
  heading: "text-lg font-semibold text-gray-800 border-b-2 border-gray-900 pb-2",
  skillContainer: "flex flex-wrap gap-2 mt-3",
  skillBadge: "bg-gray-200 text-gray-800 px-3 py-1 rounded-full text-sm",
};

/**
 * Resolve a template id to a template object.
 *
 * `apiTemplates` (when supplied) wins over the bundled catalogue so seeded or
 * newly added server-side designs are picked up without a redeploy. Unknown or
 * missing ids fall back to the default template rather than throwing, which is
 * what keeps a hand-edited URL from blanking the editor.
 */
export const resolveTemplate = (templateId, apiTemplates = []) => {
  const fromApi = Array.isArray(apiTemplates)
    ? apiTemplates.find((t) => t?.id === templateId)
    : null;

  const template = fromApi || TEMPLATES[templateId] || TEMPLATES[DEFAULT_TEMPLATE_ID];

  return {
    ...template,
    styling: { ...FALLBACK_STYLING, ...(template?.styling || {}) },
  };
};

/** True when the id maps to a real template. Used to warn on bad URLs. */
export const isKnownTemplate = (templateId, apiTemplates = []) => {
  if (!templateId) return false;
  if (TEMPLATES[templateId]) return true;
  return Array.isArray(apiTemplates)
    ? apiTemplates.some((t) => t?.id === templateId)
    : false;
};
