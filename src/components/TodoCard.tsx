import { useRef, useCallback, useState } from "react";
import gsap from "gsap";
import type { TodoItem } from "../types";
import { useTodoStore } from "../store/useTodoStore";
import BulbButton from "./BulbButton";
import { themes } from "../theme";

interface Props {
  todo: TodoItem;
  variant?: "active" | "completed";
  onSortDragStart?: (id: string, startY: number) => void;
  onSortDragMove?: (currentY: number, currentX: number) => void;
  onSortDragEnd?: () => void;
}

const bulbAccent: Record<string, { border: string; bg: string; bar: string }> = {
  green: {
    border: "rgba(96,165,250,0.45)",
    bg: "rgba(96,165,250,0.14)",
    bar: "#60a5fa",
  },
  yellow: {
    border: "rgba(250,204,21,0.45)",
    bg: "rgba(250,204,21,0.14)",
    bar: "#facc15",
  },
  red: {
    border: "rgba(248,113,113,0.45)",
    bg: "rgba(248,113,113,0.14)",
    bar: "#f87171",
  },
};

const completedAccent: Record<string, { border: string; bg: string; bar: string }> = {
  green:  { border: "rgba(96,165,250,0.3)",  bg: "rgba(96,165,250,0.07)",  bar: "#60a5fa" },
  yellow: { border: "rgba(250,204,21,0.3)", bg: "rgba(250,204,21,0.07)", bar: "#facc15" },
  red:    { border: "rgba(248,113,113,0.3)", bg: "rgba(248,113,113,0.07)", bar: "#f87171" },
};

export default function TodoCard({ todo, variant = "active", onSortDragStart, onSortDragMove, onSortDragEnd }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const completeTodo = useTodoStore((s) => s.completeTodo);
  const discardTodo = useTodoStore((s) => s.discardTodo);
  const restoreTodo = useTodoStore((s) => s.restoreTodo);
  const editTodo = useTodoStore((s) => s.editTodo);
  const cycleBulb = useTodoStore((s) => s.cycleBulb);
  const themeMode = useTodoStore((s) => s.theme);
  const t = themes[themeMode];

  const [isDragging, setIsDragging] = useState(false);
  const [dragX, setDragX] = useState(0);
  const dragStartX = useRef(0);
  const cardWidth = useRef(0);
  const swipeActive = useRef(false);

  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");

  const colors = variant === "completed" ? completedAccent[todo.bulbState] : bulbAccent[todo.bulbState];

  const absDrag = Math.abs(dragX);
  const cardW = cardWidth.current || 280;
  const thresholdPx = cardW * 0.35;
  const isPastThreshold = absDrag > thresholdPx;
  const direction = dragX > 0 ? "right" : "left";
  const indicatorOpacity = Math.min(absDrag / thresholdPx, 1);

  const animateOut = useCallback(
    (dir: "left" | "right") => {
      const x = dir === "right" ? 200 : -200;
      gsap.to(cardRef.current, {
        x,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => {
          if (variant === "completed") {
            if (dir === "right") restoreTodo(todo.id);
            else discardTodo(todo.id);
          } else {
            if (dir === "right") completeTodo(todo.id);
            else discardTodo(todo.id);
          }
        },
      });
    },
    [todo.id, variant, completeTodo, discardTodo, restoreTodo]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (cardRef.current) {
      cardWidth.current = cardRef.current.offsetWidth;
    }
    dragStartX.current = e.clientX;
    swipeActive.current = false;
    setIsDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX.current;
    if (!swipeActive.current && Math.abs(dx) > 4) {
      swipeActive.current = true;
    }
    if (swipeActive.current) {
      setDragX(dx * 0.6);
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    if (swipeActive.current && isPastThreshold) {
      animateOut(direction);
    } else if (swipeActive.current) {
      gsap.to(cardRef.current, {
        x: 0,
        duration: 0.35,
        ease: "elastic.out(1, 0.5)",
      });
    }
    setDragX(0);
    swipeActive.current = false;
  };

  const handleDoubleClick = () => {
    if (variant !== "completed") {
      setEditText(todo.text);
      setEditing(true);
      setTimeout(() => inputRef.current?.select(), 50);
    }
  };

  const commitEdit = () => {
    if (editText.trim() && editText.trim() !== todo.text) {
      editTodo(todo.id, editText.trim());
    }
    setEditing(false);
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitEdit();
    if (e.key === "Escape") setEditing(false);
  };

  const isCompleted = variant === "completed";

  const barColor = isCompleted
    ? completedAccent[todo.bulbState].bar
    : isPastThreshold
      ? (direction === "right" ? "#4ade80" : "#f87171")
      : bulbAccent[todo.bulbState].bar;

  // Drag handle for vertical reorder
  const handleHandlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    onSortDragStart?.(todo.id, e.clientY);
  };

  const handleHandlePointerMove = (e: React.PointerEvent) => {
    e.stopPropagation();
    onSortDragMove?.(e.clientY, e.clientX);
  };

  const handleHandlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch { /* ignore */ }
    onSortDragEnd?.();
  };

  return (
    <div className="relative overflow-hidden rounded-xl select-none" data-no-collapse>
      {/* Left background fill */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: isCompleted
            ? "linear-gradient(90deg, rgba(34,197,94,0.3) 0%, rgba(34,197,94,0.08) 50%, transparent 100%)"
            : "linear-gradient(90deg, rgba(34,197,94,0.3) 0%, rgba(34,197,94,0.08) 50%, transparent 100%)",
          opacity: direction === "right" ? indicatorOpacity : 0,
          transition: isDragging ? "none" : "opacity 0.25s",
        }}
      />

      {/* Right background fill */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none"
        style={{
          background: isCompleted
            ? "linear-gradient(270deg, rgba(239,68,68,0.3) 0%, rgba(239,68,68,0.08) 50%, transparent 100%)"
            : "linear-gradient(270deg, rgba(239,68,68,0.3) 0%, rgba(239,68,68,0.08) 50%, transparent 100%)",
          opacity: direction === "left" ? indicatorOpacity : 0,
          transition: isDragging ? "none" : "opacity 0.25s",
        }}
      />

      {/* Left label — 完成/恢复 */}
      <div
        className="absolute left-0 top-0 bottom-0 flex items-center pointer-events-none"
        style={{
          paddingLeft: 14,
          opacity: direction === "right" ? indicatorOpacity : 0,
          transition: isDragging ? "none" : "opacity 0.15s",
        }}
      >
        <div className="flex items-center gap-1.5">
          <div
            className="flex items-center justify-center rounded-full transition-all"
            style={{
              width: isPastThreshold && direction === "right" ? 24 : 16,
              height: isPastThreshold && direction === "right" ? 24 : 16,
              background: isPastThreshold && direction === "right"
                ? "rgba(34,197,94,0.4)"
                : "rgba(34,197,94,0.1)",
              boxShadow: isPastThreshold && direction === "right"
                ? "0 0 20px rgba(34,197,94,0.7)"
                : "none",
              transform: isPastThreshold && direction === "right" ? "scale(1.15)" : "scale(1)",
            }}
          >
            <span style={{
              color: isPastThreshold && direction === "right" ? "#4ade80" : "rgba(34,197,94,0.5)",
              fontSize: isPastThreshold && direction === "right" ? 13 : 10,
              fontWeight: 700,
            }}>✓</span>
          </div>
          {isPastThreshold && direction === "right" && (
            <span
              className="transition-all"
              style={{
                color: "#4ade80",
                fontSize: 13,
                fontWeight: 700,
                textShadow: "0 0 12px rgba(34,197,94,0.6)",
                transform: "scale(1.05)",
              }}
            >
              {isCompleted ? "恢复" : "完成"}
            </span>
          )}
        </div>
      </div>

      {/* Right label — 删除 */}
      <div
        className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none"
        style={{
          paddingRight: 14,
          opacity: direction === "left" ? indicatorOpacity : 0,
          transition: isDragging ? "none" : "opacity 0.15s",
        }}
      >
        <div className="flex items-center gap-1.5">
          {isPastThreshold && direction === "left" && (
            <span
              className="transition-all"
              style={{
                color: "#f87171",
                fontSize: 13,
                fontWeight: 700,
                textShadow: "0 0 12px rgba(239,68,68,0.6)",
                transform: "scale(1.05)",
              }}
            >
              删除
            </span>
          )}
          <div
            className="flex items-center justify-center rounded-full transition-all"
            style={{
              width: isPastThreshold && direction === "left" ? 24 : 16,
              height: isPastThreshold && direction === "left" ? 24 : 16,
              background: isPastThreshold && direction === "left"
                ? "rgba(239,68,68,0.4)"
                : "rgba(239,68,68,0.1)",
              boxShadow: isPastThreshold && direction === "left"
                ? "0 0 20px rgba(239,68,68,0.7)"
                : "none",
              transform: isPastThreshold && direction === "left" ? "scale(1.15)" : "scale(1)",
            }}
          >
            <span style={{
              color: isPastThreshold && direction === "left" ? "#f87171" : "rgba(239,68,68,0.5)",
              fontSize: isPastThreshold && direction === "left" ? 13 : 10,
              fontWeight: 700,
            }}>✕</span>
          </div>
        </div>
      </div>

      {/* Card body */}
      <div
        ref={cardRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-grab active:cursor-grabbing touch-none"
        style={{
          border: `1px solid ${isPastThreshold
            ? direction === "right"
              ? "rgba(34,197,94,0.6)"
              : "rgba(239,68,68,0.6)"
            : colors.border}`,
          borderLeft: `3px solid ${barColor}`,
          background: isPastThreshold
            ? direction === "right"
              ? "rgba(34,197,94,0.08)"
              : "rgba(239,68,68,0.08)"
            : colors.bg,
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          boxShadow: isPastThreshold
            ? direction === "right"
              ? "0 0 16px rgba(34,197,94,0.25)"
              : "0 0 16px rgba(239,68,68,0.25)"
            : t.cardShadow,
          transform: dragX !== 0 ? `translateX(${dragX}px)` : undefined,
          transition: isDragging
            ? "border-color 0.15s, background 0.15s, box-shadow 0.15s"
            : "border-color 0.6s, background 0.6s, box-shadow 0.6s, transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <div className="flex items-center w-full" style={{ gap: 13 }}>
          {isCompleted ? (
            <div
              className="flex items-center justify-center w-5 h-5 rounded-full flex-shrink-0"
              style={{
                background: `${completedAccent[todo.bulbState].bar}22`,
                border: `1px solid ${completedAccent[todo.bulbState].bar}44`,
              }}
            >
              <span style={{ color: completedAccent[todo.bulbState].bar, fontSize: 10, fontWeight: 700 }}>✓</span>
            </div>
          ) : (
            <BulbButton state={todo.bulbState} onClick={() => cycleBulb(todo.id)} />
          )}
          <span
            className="flex-1 text-[13px] leading-tight"
            onDoubleClick={handleDoubleClick}
            style={{
              color: t.textColor,
              textShadow: t.textShadow,
              cursor: variant !== "completed" ? "text" : "default",
            }}
          >
            {editing ? (
              <input
                ref={inputRef}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                onKeyDown={handleEditKeyDown}
                onBlur={commitEdit}
                className="w-full rounded px-2 py-0.5 text-[13px] outline-none"
                style={{
                  background: t.inputBg,
                  border: `1px solid ${t.inputBorder}`,
                  color: t.textColor,
                  caretColor: "#22d3ee",
                }}
              />
            ) : (
              todo.text
            )}
          </span>

          {/* Drag handle for reorder — only for active todos */}
          {variant === "active" && (
            <div
              onPointerDown={handleHandlePointerDown}
              onPointerMove={handleHandlePointerMove}
              onPointerUp={handleHandlePointerUp}
              onPointerCancel={handleHandlePointerUp}
              className="flex-shrink-0 flex items-center justify-center w-5 h-5 rounded cursor-ns-resize opacity-30 hover:opacity-70 transition-opacity"
              title="拖拽排序"
              style={{ touchAction: "none" }}
            >
              <svg width="10" height="14" viewBox="0 0 10 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="2.5" cy="2.5" r="1.5" fill="currentColor" />
                <circle cx="7.5" cy="2.5" r="1.5" fill="currentColor" />
                <circle cx="2.5" cy="7" r="1.5" fill="currentColor" />
                <circle cx="7.5" cy="7" r="1.5" fill="currentColor" />
                <circle cx="2.5" cy="11.5" r="1.5" fill="currentColor" />
                <circle cx="7.5" cy="11.5" r="1.5" fill="currentColor" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
