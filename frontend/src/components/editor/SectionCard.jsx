import { memo, useState } from "react";
import {
  FaChevronDown,
  FaPlus,
  FaTrash,
  FaGripVertical,
  FaArrowUp,
  FaArrowDown,
} from "react-icons/fa";

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

/**
 * A single repeatable row: drag to reorder, or use the arrow buttons.
 *
 * Reordering uses native HTML5 drag events rather than a library — the rows are
 * a simple vertical list, so the whole interaction is a dragstart/dragover/drop
 * triple and needs no extra dependency.
 *
 * Only the grip is draggable. Making the entire row draggable would hijack
 * text selection inside its inputs, which is far more disruptive than the
 * convenience of a larger drag target.
 */
export const RepeatableRow = memo(function RepeatableRow({
  index,
  total,
  onRemove,
  onMove,
  children,
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dropEdge, setDropEdge] = useState(null); // "top" | "bottom" | null
  const canReorder = typeof onMove === "function" && total > 1;

  const handleDragStart = (e) => {
    // The index travels in the payload so the drop target can compute the move
    // without any shared module-level state.
    e.dataTransfer.setData("text/plain", String(index));
    e.dataTransfer.effectAllowed = "move";
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    if (!canReorder) return;
    // Required: without preventDefault the browser rejects the drop outright.
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    // Show the indicator on the half the cursor is nearest, so the user can see
    // whether the row will land above or below this one.
    const { top, height } = e.currentTarget.getBoundingClientRect();
    setDropEdge(e.clientY < top + height / 2 ? "top" : "bottom");
  };

  const handleDrop = (e) => {
    if (!canReorder) return;
    e.preventDefault();
    const from = Number(e.dataTransfer.getData("text/plain"));
    setDropEdge(null);
    if (Number.isNaN(from) || from === index) return;

    // Dropping on the lower half means "after this row". Removing the dragged
    // row first shifts everything below it up by one, so only compensate when
    // moving downwards.
    const dropAfter = dropEdge === "bottom";
    let to = dropAfter ? index + 1 : index;
    if (from < to) to -= 1;
    onMove(from, to);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={() => setDropEdge(null)}
      onDrop={handleDrop}
      onDragEnd={() => {
        setIsDragging(false);
        setDropEdge(null);
      }}
      className={`relative rounded-lg border bg-slate-50/60 p-3 transition ${
        isDragging ? "border-blue-400 opacity-50" : "border-slate-200"
      } ${dropEdge === "top" ? "border-t-2 border-t-blue-500" : ""} ${
        dropEdge === "bottom" ? "border-b-2 border-b-blue-500" : ""
      }`}
    >
      <div className="absolute right-2 top-2 flex items-center gap-0.5">
        {canReorder && (
          <>
            {/* Keyboard/touch equivalent of dragging: HTML5 drag events fire on
                neither, so the arrows are the accessible path, not a nicety. */}
            <button
              type="button"
              onClick={() => onMove(index, index - 1)}
              disabled={index === 0}
              aria-label="Move entry up"
              title="Move up"
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <FaArrowUp className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={() => onMove(index, index + 1)}
              disabled={index === total - 1}
              aria-label="Move entry down"
              title="Move down"
              className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <FaArrowDown className="h-3 w-3" />
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onRemove(index)}
          aria-label="Remove entry"
          title="Remove"
          className="rounded-full p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
        >
          <FaTrash className="h-3 w-3" />
        </button>
      </div>

      <div className="flex gap-2">
        {canReorder && (
          <div
            draggable
            onDragStart={handleDragStart}
            title="Drag to reorder"
            aria-hidden="true"
            className="-ml-1 flex w-5 shrink-0 cursor-grab items-start justify-center pt-1 text-slate-300 transition hover:text-slate-500 active:cursor-grabbing"
          >
            <FaGripVertical className="h-3.5 w-3.5" />
          </div>
        )}
        <div className={`flex-1 space-y-3 ${canReorder ? "pr-24" : "pr-8"}`}>{children}</div>
      </div>
    </div>
  );
});

export const EmptyHint = ({ children }) => (
  <p className="rounded-lg border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-400">
    {children}
  </p>
);

export default SectionCard;
