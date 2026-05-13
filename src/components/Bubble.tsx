import { useRef, useMemo } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useTodoStore } from "../store/useTodoStore";
import { invoke } from "@tauri-apps/api/core";

type BubbleColors = {
  glassGradient: string;
  glassShadow: string;
  innerShadow: string;
  glowGradient: string;
  edgeGradient: string;
  edgeBorder: string;
  textColor: string;
  textShadow: string;
  specularPrimary: string;
  specularSecondary: string;
};

const darkBubble: BubbleColors = {
  glassGradient: `
    radial-gradient(circle at 35% 30%,
      rgba(255,255,255,0.28) 0%,
      rgba(167,243,248,0.18) 12%,
      rgba(34,211,238,0.15) 28%,
      rgba(14,116,144,0.35) 55%,
      rgba(8,51,68,0.7) 78%,
      rgba(4,20,32,0.85) 100%
    )
  `,
  glassShadow: `
    0 2px 12px rgba(0,0,0,0.3),
    0 0 20px rgba(6,182,212,0.12),
    inset 0 1px 0 rgba(255,255,255,0.15)
  `,
  innerShadow: "inset 0 2px 8px rgba(0,0,0,0.35), inset 0 -2px 4px rgba(0,0,0,0.2)",
  glowGradient: "radial-gradient(circle, rgba(34,211,238,0.25) 0%, rgba(6,182,212,0.1) 40%, transparent 70%)",
  edgeGradient: `
    linear-gradient(160deg,
      rgba(255,255,255,0.35) 0%,
      rgba(167,243,248,0.28) 20%,
      rgba(34,211,238,0.18) 50%,
      rgba(6,182,212,0.15) 75%,
      rgba(255,255,255,0.25) 100%
    ) border-box
  `,
  edgeBorder: "1.2px solid transparent",
  textColor: "rgba(255,255,255,0.92)",
  textShadow: `
    0 0 6px rgba(34,211,238,0.4),
    0 0 12px rgba(6,182,212,0.2),
    0 1px 3px rgba(0,0,0,0.5)
  `,
  specularPrimary: "radial-gradient(ellipse 60% 50%, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.3) 40%, transparent 100%)",
  specularSecondary: "radial-gradient(ellipse 60% 50%, rgba(255,255,255,0.15) 0%, rgba(167,243,248,0.08) 50%, transparent 100%)",
};

const lightBubble: BubbleColors = {
  glassGradient: `
    radial-gradient(circle at 35% 30%,
      rgba(255,255,255,0.55) 0%,
      rgba(224,242,254,0.4) 12%,
      rgba(56,189,248,0.25) 28%,
      rgba(14,165,233,0.18) 55%,
      rgba(2,132,199,0.35) 78%,
      rgba(3,105,161,0.5) 100%
    )
  `,
  glassShadow: `
    0 2px 10px rgba(0,0,0,0.1),
    0 0 16px rgba(56,189,248,0.15),
    inset 0 1px 0 rgba(255,255,255,0.35)
  `,
  innerShadow: "inset 0 2px 6px rgba(0,0,0,0.1), inset 0 -2px 3px rgba(0,0,0,0.06)",
  glowGradient: "radial-gradient(circle, rgba(56,189,248,0.3) 0%, rgba(14,165,233,0.12) 40%, transparent 70%)",
  edgeGradient: `
    linear-gradient(160deg,
      rgba(255,255,255,0.7) 0%,
      rgba(224,242,254,0.5) 20%,
      rgba(56,189,248,0.35) 50%,
      rgba(14,165,233,0.25) 75%,
      rgba(255,255,255,0.5) 100%
    ) border-box
  `,
  edgeBorder: "1px solid transparent",
  textColor: "rgba(3,105,161,0.9)",
  textShadow: `
    0 0 4px rgba(56,189,248,0.3),
    0 1px 2px rgba(255,255,255,0.4)
  `,
  specularPrimary: "radial-gradient(ellipse 60% 50%, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.4) 40%, transparent 100%)",
  specularSecondary: "radial-gradient(ellipse 60% 50%, rgba(255,255,255,0.2) 0%, rgba(224,242,254,0.12) 50%, transparent 100%)",
};

export default function Bubble() {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const setView = useTodoStore((s) => s.setView);
  const activeCount = useTodoStore((s) => s.todos.filter((t) => t.status === "active").length);
  const theme = useTodoStore((s) => s.theme);

  const c = useMemo(() => theme === "dark" ? darkBubble : lightBubble, [theme]);

  // Breathing glow
  useGSAP(
    () => {
      gsap.to(glowRef.current, {
        opacity: 0.55,
        duration: 3.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });
    },
    { scope: containerRef }
  );

  const handleClick = () => {
    const tl = gsap.timeline();
    tl.to(containerRef.current, {
      scale: 0.92,
      duration: 0.08,
      ease: "power2.in",
    }).to(containerRef.current, {
      scale: 1,
      duration: 0.35,
      ease: "elastic.out(1, 0.5)",
      onComplete: () => setView("panel"),
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
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

    const onUp = () => {
      cleanup();
    };

    const cleanup = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onDoubleClick={handleClick}
      className="relative flex items-center justify-center cursor-pointer select-none"
      style={{ width: 52, height: 52, pointerEvents: "auto" } as React.CSSProperties}
      onMouseDown={handleMouseDown}
    >
      {/* Outer glow ring */}
      <div
        ref={glowRef}
        className="absolute rounded-full pointer-events-none"
        style={{
          inset: -10,
          background: c.glowGradient,
          opacity: 0.35,
          filter: "blur(6px)",
        }}
      />

      {/* Glass sphere body */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: c.glassGradient,
          boxShadow: c.glassShadow,
        }}
      />

      {/* Inner shadow for depth */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          boxShadow: c.innerShadow,
        }}
      />

      {/* Prismatic edge ring */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: c.edgeBorder,
          background: c.edgeGradient,
          WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
        }}
      />

      {/* Bright specular highlight */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 10,
          height: 8,
          top: "24%",
          left: "26%",
          background: c.specularPrimary,
          filter: "blur(0.5px)",
        }}
      />

      {/* Secondary reflection */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 16,
          height: 10,
          bottom: "22%",
          right: "16%",
          background: c.specularSecondary,
          filter: "blur(1.5px)",
        }}
      />

      {/* Count number */}
      <span
        className="relative z-10 text-[13px] font-extrabold"
        style={{
          color: c.textColor,
          textShadow: c.textShadow,
          transform: "translateY(-0.5px)",
        }}
      >
        {activeCount}
      </span>
    </div>
  );
}