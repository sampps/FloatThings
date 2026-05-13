import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useTodoStore } from "../store/useTodoStore";
import { invoke } from "@tauri-apps/api/core";

export default function Bubble() {
  const containerRef = useRef<HTMLDivElement>(null);
  const setView = useTodoStore((s) => s.setView);
  const activeCount = useTodoStore((s) => s.todos.filter((t) => t.status === "active").length);

  useGSAP(
    () => {
      gsap.to(containerRef.current, {
        scale: 1.008,
        duration: 4,
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
      scale: 0.95,
      duration: 0.06,
      ease: "power2.in",
    }).to(containerRef.current, {
      scale: 1,
      duration: 0.25,
      ease: "power2.out",
      onComplete: () => setView("panel"),
    });
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      onDoubleClick={handleClick}
      className="relative flex items-center justify-center cursor-pointer select-none"
      style={{ width: 92, height: 36, pointerEvents: "auto" } as React.CSSProperties}
      onMouseDown={() => invoke("start_dragging")}
    >
      {/* Opaque dark base — matching panel */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background: "linear-gradient(170deg, #1a1f2e 0%, #151d2b 35%, #182230 70%, #131b28 100%)",
          border: "1px solid rgba(255,255,255,0.12)",
          boxShadow: `
            4px 6px 18px rgba(0,0,0,0.25),
            2px 3px 6px rgba(0,0,0,0.12)
          `,
        }}
      />

      {/* Caustic: warm amber */}
      <div className="absolute inset-0 rounded-full pointer-events-none overflow-hidden">
        <div style={{
          width: 55, height: 35,
          position: "absolute", top: "-30%", left: "5%",
          background: "radial-gradient(ellipse 60% 55%, rgba(251,191,36,0.12) 0%, transparent 65%)",
          filter: "blur(10px)",
        }} />
      </div>

      {/* Caustic: cyan accent */}
      <div className="absolute inset-0 rounded-full pointer-events-none overflow-hidden">
        <div style={{
          width: 45, height: 30,
          position: "absolute", bottom: "-20%", right: "0%",
          background: "radial-gradient(ellipse 55% 50%, rgba(6,182,212,0.12) 0%, transparent 65%)",
          filter: "blur(8px)",
        }} />
      </div>

      {/* Prismatic rim — water-blue accent */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: "1px solid transparent",
          background: `
            linear-gradient(180deg,
              rgba(255,255,255,0.25) 0%,
              rgba(167,243,248,0.18) 25%,
              rgba(34,211,238,0.15) 55%,
              rgba(255,255,255,0.22) 100%
            ) border-box
          `,
          WebkitMask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          mask: "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
          maskComposite: "exclude",
        }}
      />

      {/* Specular sweep — top-left */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.03) 30%, transparent 55%)",
        }}
      />

      {/* Top rim light */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, transparent 22%)",
        }}
      />

      {/* Bright inner edge ring */}
      <div
        className="absolute inset-[1px] rounded-full pointer-events-none"
        style={{
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "inset 0 1px 2px rgba(255,255,255,0.1)",
        }}
      />

      {/* Count number */}
      <span
        className="relative z-10 text-xs font-bold tracking-wider"
        style={{
          color: "rgba(255,255,255,0.95)",
          textShadow: "0 1px 4px rgba(0,0,0,0.5), 0 0 8px rgba(34,211,238,0.15)",
        }}
      >
        {activeCount}
      </span>
    </div>
  );
}