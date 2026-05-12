import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { useTodoStore } from "../store/useTodoStore";

export default function Bubble() {
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const setView = useTodoStore((s) => s.setView);

  useGSAP(
    () => {
      // Continuous iridescent shimmer
      const shimmerTl = gsap.timeline({ repeat: -1, yoyo: true });
      shimmerTl.to(glowRef.current, {
        "--shimmer-pos": "100%",
        duration: 3,
        ease: "sine.inOut",
      });
      shimmerTl.to(glowRef.current, {
        "--shimmer-pos": "0%",
        duration: 3,
        ease: "sine.inOut",
      });

      // Breathing pulse
      gsap.to(containerRef.current, {
        scale: 1.03,
        duration: 2.5,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
      });

      // Subtle hue rotation
      gsap.to(containerRef.current, {
        "--hue": "360",
        duration: 6,
        ease: "none",
        repeat: -1,
      });
    },
    { scope: containerRef }
  );

  const handleClick = () => {
    const tl = gsap.timeline();

    // Quick bounce before expand
    tl.to(containerRef.current, {
      scale: 0.9,
      duration: 0.1,
      ease: "power2.in",
    })
      .to(containerRef.current, {
        scale: 1.15,
        duration: 0.45,
        ease: "elastic.out(1, 0.4)",
        onComplete: () => setView("panel"),
      });
  };

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className="relative flex items-center justify-center cursor-pointer select-none"
      style={{
        width: 92,
        height: 36,
        filter: "drop-shadow(0 0 18px rgba(168,85,247,0.45)) drop-shadow(0 0 6px rgba(99,102,241,0.3))",
        "--hue": "0deg",
      } as React.CSSProperties}
    >
      {/* Glass background */}
      <div className="absolute inset-0 rounded-full bg-white/5 backdrop-blur-xl border border-white/10" />

      {/* Shimmer sweep */}
      <div
        ref={glowRef}
        className="absolute inset-0 rounded-full opacity-70"
        style={{
          background:
            "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.15) 47%, rgba(255,255,255,0.25) 50%, rgba(168,85,247,0.4) 53%, transparent 70%)",
          backgroundSize: "200% 100%",
          backgroundPositionX: "var(--shimmer-pos, 0%)",
          "--shimmer-pos": "0%",
        } as React.CSSProperties}
      />

      {/* Rainbow edge glow */}
      <div
        className="absolute inset-[-2px] rounded-full -z-10 opacity-60"
        style={{
          background: `conic-gradient(
            from var(--hue, 0deg),
            #a855f7, #6366f1, #3b82f6, #06b6d4,
            #10b981, #a855f7, #6366f1
          )`,
          filter: "blur(8px)",
        } as React.CSSProperties}
      />

      {/* Inner glow overlay */}
      <div
        className="absolute inset-[1px] rounded-full opacity-30"
        style={{
          background: `radial-gradient(ellipse at center, rgba(168,85,247,0.5) 0%, transparent 70%)`,
        }}
      />

      {/* Text */}
      <span
        ref={textRef}
        className="relative z-10 text-xs font-medium tracking-wider"
        style={{
          background: "linear-gradient(135deg, #e0d5ff 0%, #c4b5fd 40%, #a5b4fc 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textShadow: "0 0 8px rgba(168,85,247,0.5)",
        }}
      >
        浮事
      </span>
    </div>
  );
}
