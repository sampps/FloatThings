import { useRef, useCallback, useState } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { TodoItem } from "../types";
import { useTodoStore } from "../store/useTodoStore";
import BulbButton from "./BulbButton";

const bulbAccent: Record<string, { border: string; bg: string; text: string }> = {
  green: {
    border: "rgba(34,197,94,0.2)",
    bg: "rgba(34,197,94,0.04)",
    text: "rgba(34,197,94,0.3)",
  },
  yellow: {
    border: "rgba(234,179,8,0.2)",
    bg: "rgba(234,179,8,0.04)",
    text: "rgba(234,179,8,0.3)",
  },
  red: {
    border: "rgba(239,68,68,0.2)",
    bg: "rgba(239,68,68,0.04)",
    text: "rgba(239,68,68,0.3)",
  },
};

interface Props {
  todo: TodoItem;
}

export default function TodoCard({ todo }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const completeTodo = useTodoStore((s) => s.completeTodo);
  const discardTodo = useTodoStore((s) => s.discardTodo);
  const cycleBulb = useTodoStore((s) => s.cycleBulb);

  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragCurrentX = useRef(0);

  const colors = bulbAccent[todo.bulbState];

  // Entrance animation
  useGSAP(
    () => {
      gsap.from(cardRef.current, {
        y: 20,
        opacity: 0,
        scale: 0.92,
        duration: 0.45,
        ease: "back.out(1.4)",
      });
    },
    { scope: cardRef }
  );

  const animateOut = useCallback(
    (direction: "left" | "right") => {
      const x = direction === "right" ? 160 : -160;
      gsap.to(cardRef.current, {
        x,
        opacity: 0,
        scale: 0.9,
        duration: 0.35,
        ease: "power2.in",
        onComplete: () => {
          if (direction === "right") completeTodo(todo.id);
          else discardTodo(todo.id);
        },
      });
    },
    [todo.id, completeTodo, discardTodo]
  );

  // Pointer-based swipe
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartX.current = e.clientX;
    dragCurrentX.current = 0;
    setIsDragging(true);
    gsap.set(cardRef.current, { transition: "none" });
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX.current;
    dragCurrentX.current = dx;
    // Resistance
    const resisted = dx * 0.6;
    gsap.set(cardRef.current, { x: resisted });
    gsap.set(innerRef.current, { opacity: 1 - Math.abs(dx) / 180 });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    const dx = dragCurrentX.current;

    if (Math.abs(dx) > 60) {
      animateOut(dx > 0 ? "right" : "left");
    } else {
      // Spring back
      gsap.to(cardRef.current, {
        x: 0,
        duration: 0.4,
        ease: "elastic.out(1, 0.5)",
      });
      gsap.to(innerRef.current, {
        opacity: 1,
        duration: 0.2,
      });
    }
  };

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className="relative flex items-center gap-2 px-3 py-2.5 rounded-xl cursor-grab active:cursor-grabbing touch-none"
      style={{
        border: `1px solid ${colors.border}`,
        background: colors.bg,
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: "border-color 0.6s, background-color 0.6s",
      }}
    >
      {/* Swipe hint: left discard indicator */}
      <div className="absolute left-0 top-0 bottom-0 flex items-center pl-2 pointer-events-none opacity-0"
        style={{ color: "#ef4444", fontSize: 10 }}>
        ✕
      </div>
      {/* Swipe hint: right complete indicator */}
      <div className="absolute right-0 top-0 bottom-0 flex items-center pr-2 pointer-events-none opacity-0"
        style={{ color: "#22c55e", fontSize: 10 }}>
        ✓
      </div>

      <div ref={innerRef} className="flex items-center gap-2 w-full">
        {/* Bulb indicator */}
        <BulbButton state={todo.bulbState} onClick={() => cycleBulb(todo.id)} />

        {/* Text */}
        <span
          className="flex-1 text-[13px] leading-tight truncate"
          style={{
            color: "rgba(228,228,241,0.9)",
            textShadow: "0 0 6px rgba(168,85,247,0.2)",
          }}
        >
          {todo.text}
        </span>
      </div>
    </div>
  );
}
