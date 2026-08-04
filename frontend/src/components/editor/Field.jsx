import { memo } from "react";

const baseClasses =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

/**
 * Labelled text input / textarea.
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
}) {
  const isTextarea = Boolean(rows);

  return (
    <label className={`block ${className}`}>
      {label && (
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
          {label}
        </span>
      )}
      {isTextarea ? (
        <textarea
          rows={rows}
          value={value ?? ""}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${baseClasses} resize-y`}
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
    </label>
  );
});

export default Field;
