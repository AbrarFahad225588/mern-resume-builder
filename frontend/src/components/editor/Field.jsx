import { memo, useCallback, useRef } from "react";
import { FaBold, FaItalic, FaListUl, FaLink, FaEye, FaPen } from "react-icons/fa";
import Markdown from "./Markdown";

const baseClasses =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

// Each button wraps the selection with a prefix/suffix, or prefixes whole lines
// for list-style marks. Declaring them as data keeps the click handler generic.
const TOOLBAR = [
  { key: "bold", icon: FaBold, title: "Bold (Ctrl+B)", prefix: "**", suffix: "**" },
  { key: "italic", icon: FaItalic, title: "Italic (Ctrl+I)", prefix: "_", suffix: "_" },
  { key: "list", icon: FaListUl, title: "Bullet list", linePrefix: "- " },
  { key: "link", icon: FaLink, title: "Link", prefix: "[", suffix: "](url)" },
];

/**
 * Labelled text input / textarea.
 *
 * Textareas support markdown: a formatting toolbar plus a preview toggle. The
 * stored value stays plain markdown text, so nothing about the data model or
 * the API payload changes.
 *
 * Memoised because the editor re-renders on every keystroke; without this each
 * character would re-render every field of every section.
 */
const Field = memo(function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  rows,
  className = "",
  markdown = false,
  isPreview = false,
  onTogglePreview,
}) {
  const isTextarea = Boolean(rows);
  const showMarkdownUI = isTextarea && markdown;
  const textareaRef = useRef(null);

  const applyMark = useCallback(
    ({ prefix = "", suffix = "", linePrefix }) => {
      const el = textareaRef.current;
      if (!el) return;

      const { selectionStart: start, selectionEnd: end } = el;
      const text = value ?? "";
      const selected = text.slice(start, end);

      let replacement;
      let nextStart;
      let nextEnd;

      if (linePrefix) {
        // Operate on whole lines so toggling a list does not split a line in
        // the middle of the selection.
        const lineStart = text.lastIndexOf("\n", start - 1) + 1;
        const lineEndIdx = text.indexOf("\n", end);
        const lineEnd = lineEndIdx === -1 ? text.length : lineEndIdx;
        const block = text.slice(lineStart, lineEnd) || "";
        const alreadyMarked = block
          .split("\n")
          .every((line) => line.startsWith(linePrefix));

        replacement = block
          .split("\n")
          .map((line) =>
            alreadyMarked ? line.slice(linePrefix.length) : `${linePrefix}${line}`,
          )
          .join("\n");

        onChange(text.slice(0, lineStart) + replacement + text.slice(lineEnd));
        nextStart = lineStart;
        nextEnd = lineStart + replacement.length;
      } else {
        replacement = `${prefix}${selected}${suffix}`;
        onChange(text.slice(0, start) + replacement + text.slice(end));
        // Put the caret inside the marks when nothing was selected, so typing
        // continues in the newly formatted range.
        nextStart = selected ? start : start + prefix.length;
        nextEnd = selected ? start + replacement.length : nextStart;
      }

      // The value is applied by React on the next render, so restore focus and
      // selection afterwards or the caret jumps to the end of the field.
      requestAnimationFrame(() => {
        el.focus();
        el.setSelectionRange(nextStart, nextEnd);
      });
    },
    [onChange, value],
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (!showMarkdownUI || !(e.ctrlKey || e.metaKey)) return;
      const key = e.key.toLowerCase();
      if (key === "b") {
        e.preventDefault();
        applyMark({ prefix: "**", suffix: "**" });
      } else if (key === "i") {
        e.preventDefault();
        applyMark({ prefix: "_", suffix: "_" });
      }
    },
    [applyMark, showMarkdownUI],
  );

  return (
    <label className={`block ${className}`}>
      {(label || showMarkdownUI) && (
        <span className="mb-1 flex items-center justify-between gap-2">
          {label ? (
            <span className="block text-xs font-semibold uppercase tracking-wide text-slate-500">
              {label}
            </span>
          ) : (
            <span />
          )}

          {showMarkdownUI && (
            <span className="flex items-center gap-0.5">
              {!isPreview &&
                TOOLBAR.map(({ key, icon: Icon, title, ...mark }) => (
                  <button
                    key={key}
                    type="button"
                    title={title}
                    aria-label={title}
                    // Keeps focus (and the selection) in the textarea; a normal
                    // click would blur it first and lose the selected range.
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyMark(mark)}
                    className="rounded p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  >
                    <Icon className="h-3 w-3" />
                  </button>
                ))}
              <button
                type="button"
                title={isPreview ? "Back to editing" : "Preview markdown"}
                aria-label={isPreview ? "Back to editing" : "Preview markdown"}
                onMouseDown={(e) => e.preventDefault()}
                onClick={onTogglePreview}
                className={`ml-1 flex items-center gap-1 rounded px-2 py-1 text-[11px] font-semibold transition ${
                  isPreview
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                }`}
              >
                {isPreview ? <FaPen className="h-2.5 w-2.5" /> : <FaEye className="h-2.5 w-2.5" />}
                {isPreview ? "Edit" : "Preview"}
              </button>
            </span>
          )}
        </span>
      )}

      {showMarkdownUI && isPreview ? (
        <div
          className="min-h-[5rem] rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 text-slate-700"
          style={{ minHeight: `${(rows || 3) * 1.6 + 1}rem` }}
        >
          {value?.trim() ? (
            <Markdown>{value}</Markdown>
          ) : (
            <p className="text-sm text-slate-400">Nothing to preview yet.</p>
          )}
        </div>
      ) : isTextarea ? (
        <textarea
          ref={textareaRef}
          rows={rows}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          className={`${baseClasses} resize-y ${showMarkdownUI ? "font-mono text-[13px]" : ""}`}
        />
      ) : (
        <input
          type={type}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={baseClasses}
        />
      )}

      {showMarkdownUI && !isPreview && (
        <span className="mt-1 block text-[11px] text-slate-400">
          Markdown supported — **bold**, _italic_, - lists, [links](url)
        </span>
      )}
    </label>
  );
});

export default Field;
