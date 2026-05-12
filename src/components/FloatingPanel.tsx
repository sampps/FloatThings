import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useTodoStore } from "../store/useTodoStore";
import { Plus, Trash2 } from "lucide-react";
import type { TodoItem } from "../types";
import TodoCard from "./TodoCard";

export default function FloatingPanel() {
  const panelRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const [inputVisible, setInputVisible] = useState(false);
  const [inputText, setInputText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const addTodo = useTodoStore((s) => s.addTodo);
  const setView = useTodoStore((s) => s.setView);
  const tab = useTodoStore((s) => s.tab);
  const setTab = useTodoStore((s) => s.setTab);
  const showDiscardPool = useTodoStore((s) => s.showDiscardPool);
  const setShowDiscardPool = useTodoStore((s) => s.setShowDiscardPool);
  const todos = useTodoStore((s) => s.todos);

  const activeCount = todos.filter((t) => t.status === "active").length;
  const discardedCount = todos.filter((t) => t.status === "discarded").length;

  // Panel entrance animation
  useGSAP(
    () => {
      const tl = gsap.timeline();
      tl.from(panelRef.current, {
        scale: 0.65,
        opacity: 0,
        duration: 0.5,
        ease: "elastic.out(1, 0.45)",
      })
        .from(
          headerRef.current,
          { opacity: 0, y: -10, duration: 0.25 },
          "-=0.2"
        );
    },
    { scope: panelRef }
  );

  const handleAdd = () => {
    if (inputText.trim()) {
      addTodo(inputText);
      setInputText("");
      setInputVisible(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAdd();
    if (e.key === "Escape") {
      setInputVisible(false);
      setInputText("");
    }
  };

  const handleBackToBubble = () => {
    const tl = gsap.timeline();
    tl.to(panelRef.current, {
      scale: 0.7,
      opacity: 0,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => setView("bubble"),
    });
  };

  return (
    <div
      ref={panelRef}
      className="relative flex flex-col overflow-hidden"
      style={{
        width: 310,
        height: 480,
        borderRadius: 22,
        background: "rgba(14,14,24,0.82)",
        backdropFilter: "blur(32px) saturate(1.4)",
        WebkitBackdropFilter: "blur(32px) saturate(1.4)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow:
          "0 8px 40px rgba(0,0,0,0.6), 0 0 80px rgba(139,92,246,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* Rainbow edge glow */}
      <div
        className="absolute inset-0 rounded-[22px] pointer-events-none -z-10"
        style={{
          background:
            "conic-gradient(from 0deg, #a855f7, #6366f1, #3b82f6, #06b6d4, #10b981, #a855f7)",
          filter: "blur(18px)",
          opacity: 0.25,
        }}
      />

      {/* Header */}
      <div
        ref={headerRef}
        className="flex items-center justify-between px-4 pt-4 pb-1"
      >
        {/* Left: + and trash */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setInputVisible(true)}
            className="flex items-center justify-center w-7 h-7 rounded-full bg-white/5 hover:bg-white/12 border border-white/8 transition-colors cursor-pointer"
          >
            <Plus size={14} color="rgba(200,180,255,0.9)" />
          </button>
          <button
            onClick={() => setShowDiscardPool(!showDiscardPool)}
            className="relative flex items-center justify-center w-7 h-7 rounded-full bg-white/5 hover:bg-white/12 border border-white/8 transition-colors cursor-pointer"
          >
            <Trash2 size={12} color="rgba(200,180,255,0.7)" />
            {discardedCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-red-500/80 text-[8px] flex items-center justify-center text-white font-medium">
                {discardedCount}
              </span>
            )}
          </button>
        </div>

        {/* Title */}
        <span
          className="text-xs font-medium tracking-wider"
          style={{
            background:
              "linear-gradient(135deg, #c4b5fd, #a5b4fc)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          浮事
        </span>

        {/* Right: tabs */}
        <div className="flex gap-0 bg-white/3 rounded-full p-0.5">
          <button
            onClick={() => setTab("todo")}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer"
            style={{
              background:
                tab === "todo" ? "rgba(139,92,246,0.35)" : "transparent",
              color:
                tab === "todo"
                  ? "rgba(220,210,255,1)"
                  : "rgba(255,255,255,0.35)",
            }}
          >
            待办
            {activeCount > 0 && (
              <span className="ml-1 text-[10px] opacity-60">{activeCount}</span>
            )}
          </button>
          <button
            onClick={() => setTab("completed")}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer"
            style={{
              background:
                tab === "completed" ? "rgba(139,92,246,0.35)" : "transparent",
              color:
                tab === "completed"
                  ? "rgba(220,210,255,1)"
                  : "rgba(255,255,255,0.35)",
            }}
          >
            已完成
          </button>
        </div>
      </div>

      {/* Input area */}
      {inputVisible && (
        <div className="px-4 pt-2">
          <input
            ref={inputRef}
            autoFocus
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              if (!inputText.trim()) {
                setInputVisible(false);
              }
            }}
            placeholder="输入一句话待办..."
            className="w-full px-3 py-2 text-[13px] bg-white/5 border border-white/10 rounded-xl outline-none text-white/90 placeholder:text-white/20"
            style={{ caretColor: "#a78bfa" }}
          />
        </div>
      )}

      {/* Content */}
      <div ref={listRef} className="flex-1 overflow-y-auto px-3 pt-3 pb-3">
        {tab === "todo" && !showDiscardPool && <ActiveTodoList />}
        {tab === "todo" && showDiscardPool && <DiscardPoolView />}
        {tab === "completed" && <CompletedListView />}
      </div>

      {/* Back to bubble */}
      <div className="flex justify-center pb-2">
        <button
          onClick={handleBackToBubble}
          className="w-5 h-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors cursor-pointer"
        />
      </div>
    </div>
  );
}

// Sub-components
function ActiveTodoList() {
  const activeTodos = useTodoStore(
    (s) => s.todos.filter((t) => t.status === "active")
  );

  if (activeTodos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 opacity-30">
        <div
          className="text-2xl"
          style={{ filter: "grayscale(1) blur(1px)" }}
        >
          ✦
        </div>
        <span className="text-[11px] text-white/40">点击 + 添加待办</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {activeTodos.map((todo, i) => (
        <TodoCard key={todo.id} todo={todo} />
      ))}
    </div>
  );
}

function DiscardPoolView() {
  const discarded = useTodoStore(
    (s) => s.todos.filter((t) => t.status === "discarded")
  );
  const restoreTodo = useTodoStore((s) => s.restoreTodo);

  if (discarded.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full opacity-30">
        <span className="text-[11px] text-white/40">废弃池为空</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] text-white/25 px-1">废弃池</span>
      {discarded.map((todo) => (
        <div
          key={todo.id}
          onClick={() => restoreTodo(todo.id)}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white/3 border border-white/5 cursor-pointer hover:bg-white/6 transition-colors opacity-60 hover:opacity-100"
        >
          <span className="text-[12px] text-white/40 line-through truncate flex-1">
            {todo.text}
          </span>
          <span className="text-[10px] text-white/20 flex-shrink-0">恢复</span>
        </div>
      ))}
    </div>
  );
}

function CompletedListView() {
  const completed = useTodoStore(
    (s) => s.todos.filter((t) => t.status === "completed")
  );

  if (completed.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full opacity-30">
        <span className="text-[11px] text-white/40">暂无已完成</span>
      </div>
    );
  }

  // Group by day
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
            <div className="text-[10px] text-white/25 px-1 mb-2">
              {label}
            </div>
            <div className="flex flex-col gap-1.5">
              {items.map((todo) => (
                <div
                  key={todo.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/3 border border-white/5 opacity-50"
                >
                  <span className="text-[10px] text-green-400/60">✓</span>
                  <span className="text-[12px] text-white/40 line-through truncate flex-1">
                    {todo.text}
                  </span>
                  {todo.completedAt && (
                    <span className="text-[10px] text-white/15 flex-shrink-0">
                      {new Date(todo.completedAt).toLocaleTimeString("zh-CN", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
