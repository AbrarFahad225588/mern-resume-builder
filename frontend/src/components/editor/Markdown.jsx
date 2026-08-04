import { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

// Every element is mapped explicitly. react-markdown emits bare tags, and
// Tailwind's preflight strips default margins/bullets, so without these the
// output would collapse into an undifferentiated block of text.
//
// Sizes stay in the resume's `text-sm` scale on purpose: a markdown "# Heading"
// inside a bullet point must not compete with the real section headings that
// the template controls.
const components = {
  p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-2 list-disc space-y-1 pl-5 last:mb-0">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-2 list-decimal space-y-1 pl-5 last:mb-0">{children}</ol>
  ),
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }) => (
    <strong className="font-semibold text-gray-900">{children}</strong>
  ),
  em: ({ children }) => <em className="italic">{children}</em>,
  h1: ({ children }) => (
    <h4 className="mt-2 mb-1 text-sm font-bold text-gray-900 first:mt-0">{children}</h4>
  ),
  h2: ({ children }) => (
    <h4 className="mt-2 mb-1 text-sm font-bold text-gray-900 first:mt-0">{children}</h4>
  ),
  h3: ({ children }) => (
    <h4 className="mt-2 mb-1 text-sm font-semibold text-gray-900 first:mt-0">{children}</h4>
  ),
  a: ({ children, href }) => (
    // Printed resumes are also read on screen, so keep links clickable but
    // safe: noreferrer prevents the target page from seeing the opener.
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline underline-offset-2"
    >
      {children}
    </a>
  ),
  code: ({ children }) => (
    <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[0.85em]">
      {children}
    </code>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-gray-300 pl-3 italic">{children}</blockquote>
  ),
  hr: () => <hr className="my-2 border-gray-200" />,
  table: ({ children }) => (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-b border-gray-300 pb-1 font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border-b border-gray-100 py-1">{children}</td>,
};

/**
 * Renders user-authored resume copy as markdown.
 *
 * react-markdown does not use dangerouslySetInnerHTML and raw HTML is not
 * enabled, so user input cannot inject markup — important here because this
 * text is saved to the database and rendered back verbatim.
 */
const Markdown = memo(function Markdown({ children, className = "" }) {
  const text = String(children || "");
  if (!text.trim()) return null;

  return (
    <div className={`text-sm ${className}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {text}
      </ReactMarkdown>
    </div>
  );
});

export default Markdown;
