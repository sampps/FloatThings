import { useRef, useState, useEffect } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useTodoStore } from "../store/useTodoStore";
import { Plus, Trash2, Sun, Moon, Pin, PinOff } from "lucide-react";
import type { TodoItem } from "../types";
import TodoCard from "./TodoCard";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { invoke } from "@tauri-apps/api/core";
import { themes } from "../theme";

export default function FloatingPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [inputVisible, setInputVisible] = useState(false);
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [pinned, setPinned] = useState(false);

  const togglePin = async () => {
    const next = !pinned;
    setPinned(next);
    await getCurrentWindow().setAlwaysOnTop(next);
  };

  const addTodo = useTodoStore((s) => s.addTodo);
  const setView = useTodoStore((s) => s.setView);
  const tab = useTodoStore((s) => s.tab);
  const setTab = useTodoStore((s) => s.setTab);
  const showDiscardPool = useTodoStore((s) => s.showDiscardPool);
  const setShowDiscardPool = useTodoStore((s) => s.setShowDiscardPool);
  const todos = useTodoStore((s) => s.todos);
  const themeMode = useTodoStore((s) => s.theme);
  const toggleTheme = useTodoStore((s) => s.toggleTheme);

  const t = themes[themeMode];
  const textShadow = t.textShadow;
  const subtleTextShadow = t.subtleTextShadow;

  const activeCount = todos.filter((t) => t.status === "active").length;
  const discardedCount = todos.filter((t) => t.status === "discarded").length;

  const handleAdd = () => {
    if (inputText.trim()) {
      addTodo(inputText);
      setInputText("");
      setInputVisible(false);
      setShowDiscardPool(false);
      setTab("todo");
    }
  };

  useGSAP(
    () => {
      const tl = gsap.timeline();
      tl.from(panelRef.current, {
        scale: 0.65,
        opacity: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.45)",
      }).from(
        headerRef.current,
        { opacity: 0, y: -10, duration: 0.25 },
        "-=0.2"
      );
    },
    { scope: panelRef }
  );

  const handleBackToBubble = () => {
    if (panelRef.current) panelRef.current.style.pointerEvents = "none";
    const tl = gsap.timeline();
    tl.to(panelRef.current, {
      scale: 0.7,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => {
        setView("bubble");
      },
    });
  };

  // Reset pointer-events on mount (in case stale from exit animation)
  useEffect(() => {
    if (panelRef.current) panelRef.current.style.pointerEvents = "auto";
  }, []);

  // Intercept double-click: collapse to bubble (only on panel, not shadow area)
  useEffect(() => {
    getCurrentWindow().setMaximizable(false);
    const onDblClick = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest("button, input, [data-no-collapse]")) return;
      // Only trigger if clicking within the panel bounds
      if (!panelRef.current?.contains(e.target as HTMLElement)) return;
      handleBackToBubble();
    };
    document.addEventListener("dblclick", onDblClick);
    return () => document.removeEventListener("dblclick", onDblClick);
  }, []);

  // Header drag: only start dragging when mouse moves > 2px
  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, input")) return;
    const startX = e.clientX;
    const startY = e.clientY;
    let dragging = false;

    const onMove = (ev: MouseEvent) => {
      if (!dragging && (Math.abs(ev.clientX - startX) > 2 || Math.abs(ev.clientY - startY) > 2)) {
        dragging = true;
        invoke("start_dragging");
        cleanup();
      }
    };

    const onUp = () => cleanup();

    const cleanup = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") {
      setInputVisible(false);
      setInputText("");
    }
  };

  // Accent: cyan/water-blue
  const accent = "rgba(6,182,212,0.3)";
  const accentBright = "rgba(34,211,238,0.5)";

  // Resize grip — uses window-level events for smooth tracking
  const resizeRef = useRef({ x: 0, y: 0, w: 310, h: 480 });
  const isResizing = useRef(false);
  const setPanelSize = useTodoStore((s) => s.setPanelSize);
  const panelW = useTodoStore((s) => s.panelWidth);
  const panelH = useTodoStore((s) => s.panelHeight);

  const handleGripDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    resizeRef.current = { x: e.clientX, y: e.clientY, w: panelW, h: panelH };
    window.addEventListener("mousemove", onGripMove);
    window.addEventListener("mouseup", onGripUp);
  };

  const onGripMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const dx = e.clientX - resizeRef.current.x;
    const dy = e.clientY - resizeRef.current.y;
    const newW = Math.max(260, Math.round(resizeRef.current.w + dx));
    const newH = Math.max(200, Math.round(resizeRef.current.h + dy));
    invoke("resize_window", { width: newW, height: newH, keepTopLeft: true });
  };

  const onGripUp = (e: MouseEvent) => {
    if (!isResizing.current) return;
    isResizing.current = false;
    window.removeEventListener("mousemove", onGripMove);
    window.removeEventListener("mouseup", onGripUp);
    const dx = e.clientX - resizeRef.current.x;
    const dy = e.clientY - resizeRef.current.y;
    const newW = Math.max(260, Math.round(resizeRef.current.w + dx));
    const newH = Math.max(200, Math.round(resizeRef.current.h + dy));
    setPanelSize(newW, newH);
  };

  return (
    <div
      ref={panelRef}
      className="relative flex flex-col overflow-hidden"
      style={{
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        borderRadius: 22,
        background: t.panelBg,
        border: t.panelBorder,
        boxShadow: t.panelShadow,
        pointerEvents: "auto",
        transition: "background 0.7s ease, border-color 0.6s ease, box-shadow 0.6s ease",
      }}
    >
      {/* Warm caustic — upper */}
      <div className="absolute pointer-events-none" style={{
        width: "90%", height: "42%", top: "2%", left: "3%",
        background: t.causticTop,
        filter: "blur(42px)",
      }} />

      {/* Water-blue caustic — mid accent */}
      <div className="absolute pointer-events-none" style={{
        width: "80%", height: "40%", top: "28%", left: "12%",
        background: t.causticMid,
        filter: "blur(44px)",
      }} />

      {/* Deeper blue caustic — lower */}
      <div className="absolute pointer-events-none" style={{
        width: "80%", height: "40%", top: "50%", left: "-3%",
        background: t.causticLow,
        filter: "blur(38px)",
      }} />

      {/* ── Edge Layer 1: Prismatic rim with water-blue accent ── */}
      <div
        className="absolute inset-0 rounded-[22px] pointer-events-none"
        style={{
          border: "1.5px solid transparent",
          background: t.prismGradient,
          WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
        }}
      />

      {/* ── Edge Layer 2: Soft top-left 45° specular sweep ── */}
      <div
        className="absolute inset-0 rounded-[22px] pointer-events-none"
        style={{
          background: t.specularEdge,
        }}
      />

      {/* Bright inner edge ring */}
      <div
        className="absolute inset-[1.5px] rounded-[21px] pointer-events-none"
        style={{
          border: "1px solid rgba(255,255,255,0.22)",
          boxShadow: "inset 0 1px 3px rgba(255,255,255,0.15)",
        }}
      />

      {/* Specular sweep — soft diagonal, top-left origin */}
      <div
        className="absolute inset-0 rounded-[22px] pointer-events-none"
        style={{
          background: t.specularSweep,
        }}
      />

      {/* Top rim light — soft */}
      <div
        className="absolute inset-0 rounded-[22px] pointer-events-none"
        style={{
          background: t.rimLight,
        }}
      />

      {/* Bottom-right subtle dark gradient — opposite of top-left light */}
      <div
        className="absolute inset-0 rounded-[22px] pointer-events-none"
        style={{
          background: "linear-gradient(-45deg, rgba(0,0,0,0.04) 0%, transparent 25%)",
        }}
      />

      {/* ── Header ── */}
      <div
        ref={headerRef}
        className="relative flex items-center justify-between px-4 pt-4 pb-1"
        onMouseDown={handleHeaderMouseDown}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={() => setInputVisible(true)}
            className={`flex items-center justify-center w-7 h-7 rounded-full border transition-colors cursor-pointer ${themeMode === "dark" ? "bg-white/15 hover:bg-white/25 border-white/18" : "bg-black/6 hover:bg-black/12 border-black/10"}`}
          >
            <Plus size={14} color={themeMode === "dark" ? "rgba(255,255,255,0.95)" : "rgba(15,23,42,0.9)"} />
          </button>
          <button
            onClick={() => setShowDiscardPool(!showDiscardPool)}
            className="relative flex items-center justify-center w-7 h-7 rounded-full border transition-all cursor-pointer"
            style={{
              background: showDiscardPool
                ? (themeMode === "dark" ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.15)")
                : (themeMode === "dark" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.06)"),
              borderColor: showDiscardPool
                ? (themeMode === "dark" ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.2)")
                : (themeMode === "dark" ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.1)"),
            }}
          >
            <Trash2 size={12} color={showDiscardPool
              ? (themeMode === "dark" ? "rgba(255,255,255,1)" : "rgba(15,23,42,1)")
              : (themeMode === "dark" ? "rgba(255,255,255,0.85)" : "rgba(15,23,42,0.7)")} />
          </button>
          <button
            onClick={toggleTheme}
            className={`flex items-center justify-center w-7 h-7 rounded-full border transition-colors cursor-pointer ${themeMode === "dark" ? "bg-white/15 hover:bg-white/25 border-white/18" : "bg-black/6 hover:bg-black/12 border-black/10"}`}
            title={themeMode === "dark" ? "切换亮色主题" : "切换暗色主题"}
          >
            {themeMode === "dark"
              ? <Sun size={13} color="rgba(251,191,36,0.85)" />
              : <Moon size={13} color="rgba(15,23,42,0.7)" />
            }
          </button>
          <button
            onClick={togglePin}
            className={`flex items-center justify-center w-7 h-7 rounded-full border transition-colors cursor-pointer ${pinned
              ? (themeMode === "dark" ? "bg-cyan-400/30 hover:bg-cyan-400/45 border-cyan-400/40" : "bg-cyan-500/20 hover:bg-cyan-500/35 border-cyan-500/30")
              : (themeMode === "dark" ? "bg-white/15 hover:bg-white/25 border-white/18" : "bg-black/6 hover:bg-black/12 border-black/10")
            }`}
            title={pinned ? "取消置顶" : "置顶显示"}
          >
            {pinned
              ? <Pin size={13} color={themeMode === "dark" ? "rgba(34,211,238,0.95)" : "rgba(6,182,212,0.9)"} />
              : <PinOff size={13} color={themeMode === "dark" ? "rgba(255,255,255,0.7)" : "rgba(15,23,42,0.5)"} />
            }
          </button>
        </div>

        <div className={`flex gap-0 rounded-full p-0.5 ${themeMode === "dark" ? "bg-white/10" : "bg-black/6"}`}>
          <button
            onClick={() => { setTab("todo"); setShowDiscardPool(false); }}
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer"
            style={{
              background: tab === "todo" ? t.tabActiveBg : t.tabInactiveBg,
              color: tab === "todo" ? t.tabActiveColor : t.tabInactiveColor,
              textShadow: tab === "todo" ? textShadow : "none",
            }}
          >
            待办{activeCount > 0 && <span className="ml-1 text-[10px] opacity-50">{activeCount}</span>}
          </button>
          <button
            onClick={() => { setTab("completed"); setShowDiscardPool(false); }}
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer"
            style={{
              background: tab === "completed" ? t.tabActiveBg : t.tabInactiveBg,
              color: tab === "completed" ? t.tabActiveColor : t.tabInactiveColor,
              textShadow: tab === "completed" ? textShadow : "none",
            }}
          >
            已完成
          </button>
        </div>
      </div>

      {/* Input */}
      {inputVisible && (
        <div className="px-4 pt-2 relative">
          <input
            ref={inputRef}
            autoFocus
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (inputText.trim()) { handleAdd(); } else { setInputVisible(false); }
            }}
            placeholder="输入一句话待办..."
            className={`w-full px-3 py-2 text-[13px] rounded-xl outline-none font-semibold ${themeMode === "dark" ? "placeholder:text-white/35" : "placeholder:text-slate-700/30"}`}
            style={{
              background: t.inputBg,
              border: `1px solid ${t.inputBorder}`,
              color: t.textColor,
              caretColor: "#22d3ee",
              textShadow: "0 1px 1px rgba(0,0,0,0.15)",
            }}
          />
        </div>
      )}

      {/* Content */}
      <div ref={listRef} className={`flex-1 overflow-y-auto px-3 pt-3 pb-3 relative ${showDiscardPool ? (themeMode === "dark" ? "bg-red-950/15" : "bg-red-100/40") : ""}`} style={{ transition: "background 0.4s" }}>
        {showDiscardPool ? (
          <DiscardPoolView />
        ) : tab === "todo" ? (
          <ActiveTodoList />
        ) : (
          <CompletedListView />
        )}
      </div>

      {/* Resize grip — bottom-right corner */}
      <div
        onMouseDown={handleGripDown}
        className="absolute bottom-2 right-2 flex items-center justify-center w-8 h-8 cursor-nwse-resize opacity-20 hover:opacity-55 transition-opacity z-10 rounded-br-[18px]"
        style={{ touchAction: "none" }}
        title="拖拽调整窗口大小"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.5 1v11.5H1" stroke="currentColor" strokeWidth="1.8" opacity="0.7" />
          <path d="M12.5 5v7.5H5" stroke="currentColor" strokeWidth="1.4" opacity="0.45" />
          <path d="M12.5 9v3.5H9" stroke="currentColor" strokeWidth="1" opacity="0.25" />
        </svg>
      </div>
    </div>
  );
}

function ActiveTodoList() {
  const todos = useTodoStore((s) => s.todos);
  const reorderTodos = useTodoStore((s) => s.reorderTodos);
  const themeMode = useTodoStore((s) => s.theme);
  const activeTodos = todos.filter((t) => t.status === "active");
  const textShadow = themes[themeMode].textShadow;

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const finalOrderRef = useRef<string[]>([]);

  const dragSrcId = useRef<string | null>(null);
  const dragSrcBulb = useRef<string>("");
  const ghostRef = useRef<HTMLDivElement>(null);
  const ghostLeft = useRef(0);
  const ghostHeight = useRef(44);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const offsetsRef = useRef<Map<string, number>>(new Map());
  const logicalOrder = useRef<string[]>([]);
  const rafId = useRef<number | null>(null);
  const snapshotRef = useRef<Map<string, { top: number; height: number }>>(new Map());
  const ghostDropY = useRef(0);

  const baseSorted = getSortedTodos(activeTodos);

  const setCardRef = (id: string, el: HTMLDivElement | null) => {
    if (el) cardRefs.current.set(id, el);
    else cardRefs.current.delete(id);
  };

  const applyOffset = (id: string, dy: number) => {
    const el = cardRefs.current.get(id);
    if (!el) return;
    const prev = offsetsRef.current.get(id) ?? 0;
    if (prev === dy) return;
    offsetsRef.current.set(id, dy);
    el.style.transition = "transform 0.8s cubic-bezier(0.22, 1, 0.36, 1)";
    el.style.transform = dy !== 0 ? `translateY(${dy}px)` : "";
  };

  const handleSortDragStart = (id: string, startY: number) => {
    const el = cardRefs.current.get(id);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const item = activeTodos.find((t) => t.id === id);
    if (!item) return;

    // Snapshot all cards
    const snap = new Map<string, { top: number; height: number }>();
    cardRefs.current.forEach((cardEl, cardId) => {
      const r = cardEl.getBoundingClientRect();
      snap.set(cardId, { top: r.top, height: r.height });
    });
    snapshotRef.current = snap;

    dragSrcId.current = id;
    dragSrcBulb.current = item.bulbState;
    ghostLeft.current = rect.left;
    ghostHeight.current = rect.height;
    logicalOrder.current = baseSorted.map((t) => t.id);
    offsetsRef.current = new Map(baseSorted.map((t) => [t.id, 0]));
    finalOrderRef.current = [...logicalOrder.current];

    if (ghostRef.current) {
      ghostRef.current.style.display = "block";
      ghostRef.current.style.width = `${rect.width}px`;
      ghostRef.current.style.opacity = "0";
      ghostRef.current.style.transition = "none";
      ghostRef.current.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0) scale(1)`;
      requestAnimationFrame(() => {
        if (!ghostRef.current) return;
        ghostRef.current.style.opacity = "0.92";
        ghostRef.current.style.transition =
          "transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.1s ease";
        ghostRef.current.style.transform =
          `translate3d(${rect.left}px, ${startY - rect.height / 2}px, 0) scale(1.02)`;
      });
    }

    setDraggingId(id);
  };

  const handleSortDragMove = (currentY: number, _currentX: number) => {
    if (!dragSrcId.current) return;

    if (rafId.current !== null) cancelAnimationFrame(rafId.current);
    rafId.current = requestAnimationFrame(() => {
      rafId.current = null;
      ghostDropY.current = currentY - ghostHeight.current / 2;

      // Ghost follows pointer
      if (ghostRef.current) {
        ghostRef.current.style.transition = "none";
        ghostRef.current.style.transform =
          `translate3d(${ghostLeft.current}px, ${currentY - ghostHeight.current / 2}px, 0) scale(1.02)`;
      }

      const srcId = dragSrcId.current!;
      const srcBulb = dragSrcBulb.current;
      const origIds = baseSorted.map((t) => t.id);
      const GAP = 8;
      const slotH = ghostHeight.current + GAP;

      // Only consider same-priority items for insertion
      const groupItems: { id: string; origIdx: number; snapTop: number; snapH: number }[] = [];
      origIds.forEach((oid, idx) => {
        if (oid === srcId) return;
        const t = activeTodos.find((t) => t.id === oid);
        if (!t || t.bulbState !== srcBulb) return;
        const s = snapshotRef.current.get(oid);
        if (!s) return;
        groupItems.push({ id: oid, origIdx: idx, snapTop: s.top, snapH: s.height });
      });
      groupItems.sort((a, b) => a.snapTop - b.snapTop);

      let insertIdx = groupItems.length;
      for (let i = 0; i < groupItems.length; i++) {
        const mid = groupItems[i].snapTop + groupItems[i].snapH * 0.5;
        if (currentY < mid) { insertIdx = i; break; }
      }

      // Build new order: non-src-priority items stay in place, group items are reordered
      const groupOrder = groupItems.map((o) => o.id);
      groupOrder.splice(insertIdx, 0, srcId);
      const newOrder: string[] = [];
      let gi = 0;
      for (const oid of origIds) {
        const t = activeTodos.find((t) => t.id === oid);
        if (t && t.bulbState === srcBulb) {
          newOrder.push(groupOrder[gi++]);
        } else {
          newOrder.push(oid);
        }
      }

      if (newOrder.join(",") === logicalOrder.current.join(",")) return;
      logicalOrder.current = newOrder;
      finalOrderRef.current = newOrder;

      // Apply translateY offsets only to same-group items
      const srcOrigIdx = origIds.indexOf(srcId);
      groupItems.forEach(({ id, origIdx }) => {
        const newIdx = newOrder.indexOf(id);
        const srcNewIdx = newOrder.indexOf(srcId);
        let dy = 0;
        if (origIdx < srcOrigIdx && newIdx > srcNewIdx) {
          dy = slotH;
        } else if (origIdx > srcOrigIdx && newIdx < srcNewIdx) {
          dy = -slotH;
        }
        applyOffset(id, dy);
      });
    });
  };

  const handleSortDragEnd = () => {
    if (rafId.current !== null) { cancelAnimationFrame(rafId.current); rafId.current = null; }

    const finalOrder = [...finalOrderRef.current];
    const srcId = dragSrcId.current;

    const FLY_MS = 500;

    // Hard-clear translateY on all other cards immediately
    cardRefs.current.forEach((el, id) => {
      if (id === srcId) return;
      el.style.transition = "none";
      el.style.transform = "";
    });
    offsetsRef.current = new Map();

    // Commit reorder
    dragSrcId.current = null;
    snapshotRef.current = new Map();
    if (srcId && finalOrder.length) reorderTodos(finalOrder);

    // Freeze ghost at current position
    const ghost = ghostRef.current;
    if (ghost) {
      const m = ghost.style.transform.match(/translate3d\([^,]+,\s*([\d.-]+)px/);
      const curY = m ? parseFloat(m[1]) : ghostDropY.current;
      ghost.style.transition = "none";
      ghost.style.transform = `translate3d(${ghostLeft.current}px, ${curY}px, 0) scale(1)`;
    }

    // Wait two rAFs for React to re-render (real card now at final DOM position)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const realEl = srcId ? cardRefs.current.get(srcId) : null;
        if (!ghost || !realEl) {
          if (ghost) ghost.style.display = "none";
          setDraggingId(null);
          return;
        }

        const targetRect = realEl.getBoundingClientRect();
        const ghostM = ghost.style.transform.match(/translate3d\([^,]+,\s*([\d.-]+)px/);
        const ghostCurY = ghostM ? parseFloat(ghostM[1]) : ghostDropY.current;
        const realDy = ghostCurY - targetRect.top;

        realEl.style.transition = "none";
        realEl.style.transform = Math.abs(realDy) >= 1 ? `translateY(${realDy}px)` : "";
        realEl.style.opacity = "0";

        // Fly ghost to target
        ghost.style.transition = `transform ${FLY_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        ghost.style.transform = `translate3d(${ghostLeft.current}px, ${targetRect.top}px, 0) scale(1)`;

        // Fly real card in sync
        if (Math.abs(realDy) >= 1) {
          void realEl.offsetHeight;
          realEl.style.transition = `transform ${FLY_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
          realEl.style.transform = "translateY(0)";
        }

        // Crossfade
        setTimeout(() => {
          requestAnimationFrame(() => {
            const XFADE = 80;
            realEl.style.transition = "none";
            realEl.style.transform = "";
            realEl.style.opacity = "0";
            void realEl.offsetHeight;
            realEl.style.transition = `opacity ${XFADE}ms ease`;
            realEl.style.opacity = "1";

            ghost.style.transition = `opacity ${XFADE}ms ease`;
            ghost.style.opacity = "0";

            setTimeout(() => {
              ghost.style.display = "none";
              ghost.style.opacity = "";
              ghost.style.transition = "";
              realEl.style.transition = "";
              realEl.style.opacity = "";
              setDraggingId(null);
            }, XFADE + 20);
          });
        }, FLY_MS);
      });
    });
  };

  if (activeTodos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 opacity-50">
        <div className={`text-2xl ${themeMode === "dark" ? "text-white/70" : "text-slate-700/70"}`}>✦</div>
        <span className={`text-[11px] font-medium ${themeMode === "dark" ? "text-white/60" : "text-slate-700/60"}`} style={{ textShadow }}>点击 + 添加待办</span>
      </div>
    );
  }

  const draggingTodo = draggingId ? baseSorted.find((t) => t.id === draggingId) : null;

  return (
    <div className="flex flex-col gap-2" style={{ position: "relative" }}>
      {baseSorted.map((todo) => (
        <div
          key={todo.id}
          ref={(el) => setCardRef(todo.id, el)}
          style={{
            opacity: draggingId === todo.id ? 0 : 1,
            transition: draggingId === todo.id ? "opacity 0.1s" : "opacity 0.2s",
            willChange: draggingId ? "transform" : "auto",
          }}
        >
          <TodoCard
            todo={todo}
            variant="active"
            onSortDragStart={handleSortDragStart}
            onSortDragMove={handleSortDragMove}
            onSortDragEnd={handleSortDragEnd}
          />
        </div>
      ))}

      <div
        ref={ghostRef}
        style={{
          display: "none",
          position: "fixed",
          top: 0,
          left: 0,
          pointerEvents: "none",
          zIndex: 9999,
          filter: "none",
          willChange: "transform, opacity",
          transformOrigin: "center center",
        }}
      >
        {draggingTodo && <TodoCard todo={draggingTodo} variant="active" />}
      </div>
    </div>
  );
}

function getSortedTodos(activeTodos: TodoItem[]) {
  const urgencyOrder: Record<string, number> = { red: 0, yellow: 1, green: 2 };
  return [...activeTodos].sort((a, b) => {
    const ua = urgencyOrder[a.bulbState];
    const ub = urgencyOrder[b.bulbState];
    if (ua !== ub) return ua - ub;
    return (a.order ?? 0) - (b.order ?? 0);
  });
}

function DiscardPoolView() {
  const todos = useTodoStore((s) => s.todos);
  const themeMode = useTodoStore((s) => s.theme);
  const discarded = todos.filter((t) => t.status === "discarded");
  const restoreTodo = useTodoStore((s) => s.restoreTodo);
  const deleteTodo = useTodoStore((s) => s.deleteTodo);
  const t = themes[themeMode];

  return (
    <div className="flex flex-col gap-2 h-full">
      {/* Header indicator */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-2 ${themeMode === "dark" ? "bg-amber-950/30 border border-amber-800/20" : "bg-amber-50/80 border border-amber-200/60"}`}>
        <Trash2 size={14} className={themeMode === "dark" ? "text-amber-400/80" : "text-amber-600/80"} />
        <span className={`text-[12px] font-semibold ${themeMode === "dark" ? "text-amber-200/80" : "text-amber-800/80"}`}>
          废纸篓
        </span>
        <span className={`text-[11px] ml-auto ${themeMode === "dark" ? "text-amber-300/50" : "text-amber-700/50"}`}>
          {discarded.length} 条 · 点击恢复 · ✕ 彻底删除
        </span>
      </div>

      {discarded.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 opacity-40">
          <span className={`text-[11px] font-medium ${themeMode === "dark" ? "text-white/45" : "text-slate-600/50"}`}>没有已删除的待办</span>
        </div>
      ) : (
        discarded.map((todo) => (
          <div
            key={todo.id}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border opacity-65 hover:opacity-100 transition-opacity ${themeMode === "dark" ? "bg-amber-950/25 border-amber-800/30" : "bg-amber-100/60 border-amber-300/40"}`}
            style={{ borderLeft: "3px solid #f59e0b", boxShadow: t.cardShadow }}
          >
            <span
              onClick={() => restoreTodo(todo.id)}
              className={`text-[12px] line-through truncate flex-1 cursor-pointer ${themeMode === "dark" ? "text-white/60" : "text-slate-700/60"}`}
              style={{ textShadow: t.subtleTextShadow }}
            >
              {todo.text}
            </span>
            <button
              onClick={() => deleteTodo(todo.id)}
              className="flex items-center justify-center w-5 h-5 rounded-full hover:bg-red-500/30 border hover:border-red-500/30 transition-colors cursor-pointer flex-shrink-0"
              style={{
                background: t.btnBg,
                borderColor: t.btnBorder,
              }}
              title="彻底删除"
            >
              <span className={`text-[10px] transition-colors ${themeMode === "dark" ? "text-white/50 hover:text-red-400" : "text-slate-600/60 hover:text-red-500"}`}>✕</span>
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function CompletedListView() {
  const todos = useTodoStore((s) => s.todos);
  const themeMode = useTodoStore((s) => s.theme);
  const completed = todos.filter((t) => t.status === "completed");
  const textShadow = themes[themeMode].textShadow;

  if (completed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full opacity-50">
        <span className={`text-[11px] font-medium ${themeMode === "dark" ? "text-white/60" : "text-slate-700/60"}`} style={{ textShadow }}>暂无已完成</span>
      </div>
    );
  }

  const groups = new Map<string, TodoItem[]>();
  const sorted = [...completed].sort(
    (a, b) => (b.completedAt || 0) - (a.completedAt || 0)
  );

  for (const t of sorted) {
    const date = new Date(t.completedAt || t.createdAt);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(t);
  }

  const weekdays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="flex flex-col gap-4">
      {Array.from(groups.entries()).map(([key, items]) => {
        const d = new Date(key);
        const label = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 星期${weekdays[d.getDay()]}`;
        return (
          <div key={key}>
            <div className={`text-[10px] px-1 mb-2 ${themeMode === "dark" ? "text-white/40" : "text-slate-500/60"}`} style={{ textShadow }}>{label}</div>
            <div className="flex flex-col gap-2">
              {items.map((todo) => (
                <TodoCard key={todo.id} todo={todo} variant="completed" />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}