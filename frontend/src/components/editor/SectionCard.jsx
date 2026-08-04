import { memo } from "react";
import { FaChevronDown, FaPlus, FaTrash } from "react-icons/fa";

/**
 * Collapsible wrapper shared by every editor section. Keeping the chrome here
 * means a new section only has to supply its fields.
 */
const SectionCard = memo(function SectionCard({
  title,
  icon,
  isOpen,
  onToggle,
  onAdd,
  addLabel = "Add",
  children,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <header
        className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 hover:bg-slate-50"
        onClick={onToggle}
      >
        <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
          {icon}
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {onAdd && isOpen && (
            <button
              type="button"
              // The header is itself a toggle, so a click on this button would
              // otherwise bubble up and immediately collapse the section.
              onClick={(e) => {
                e.stopPropagation();
                onAdd();
              }}
              className="flex items-center gap-1 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
            >
              <FaPlus className="h-2.5 w-2.5" />
              {addLabel}
            </button>
          )}
          <FaChevronDown
            className={`h-3 w-3 text-slate-400 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </header>
      {isOpen && <div className="space-y-4 border-t border-slate-100 p-4">{children}</div>}
    </section>
  );
});

/** A single repeatable row with a remove control. */
export const RepeatableRow = memo(function RepeatableRow({
  index,
  onRemove,
  children,
}) {
  return (
    <div className="relative rounded-lg border border-slate-200 bg-slate-50/60 p-3">
      <button
        type="button"
        onClick={() => onRemove(index)}
        aria-label="Remove entry"
        className="absolute right-2 top-2 rounded-full p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
      >
        <FaTrash className="h-3 w-3" />
      </button>
      <div className="space-y-3 pr-8">{children}</div>
    </div>
  );
});

export const EmptyHint = ({ children }) => (
  <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-400">
    {children}
  </p>
);

export default SectionCard;
