import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import type { BulbState } from "../types";

const bulbColors: Record<BulbState, { fill: string; glow: string; shadow: string }> = {
  green: {
    fill: "#22c55e",
    glow: "rgba(34,197,94,0.6)",
    shadow: "0 0 10px rgba(34,197,94,0.45)",
  },
  yellow: {
    fill: "#eab308",
    glow: "rgba(234,179,8,0.6)",
    shadow: "0 0 10px rgba(234,179,8,0.45)",
  },
  red: {
    fill: "#ef4444",
    glow: "rgba(239,68,68,0.6)",
    shadow: "0 0 10px rgba(239,68,68,0.45)",
  },
};

interface Props {
  state: BulbState;
  onClick: () => void;
}

export default function BulbButton({ state, onClick }: Props) {
  const bulbRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const { fill, glow, shadow } = bulbColors[state];

  useGSAP(
    () => {
      gsap.to(glowRef.current, {
        boxShadow: shadow,
        duration: 0.6,
        ease: "power2.out",
      });
    },
    { dependencies: [state], scope: bulbRef }
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const tl = gsap.timeline();
    tl.to(bulbRef.current, {
      scale: 1.4,
      duration: 0.12,
      ease: "power2.out",
    }).to(bulbRef.current, {
      scale: 1,
      duration: 0.35,
      ease: "elastic.out(1, 0.4)",
    });
    onClick();
  };

  return (
    <div ref={bulbRef} className="relative flex-shrink-0 cursor-pointer" onClick={handleClick}>
      {/* Glow ring */}
      <div
        ref={glowRef}
        className="absolute inset-[-4px] rounded-full transition-[box-shadow]"
        style={{ boxShadow: shadow }}
      />
      {/* Bulb SVG */}
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        className="relative z-10"
      >
        <defs>
          <radialGradient id={`bulbGrad-${state}`} cx="40%" cy="35%">
            <stop offset="0%" stopColor="white" stopOpacity="0.9" />
            <stop offset="40%" stopColor={fill} stopOpacity="0.8" />
            <stop offset="100%" stopColor={fill} stopOpacity="0.4" />
          </radialGradient>
        </defs>
        <path
          d="M12 2C9.24 2 7 4.24 7 7c0 2.05 1.23 3.81 3 4.58V16h4v-4.42c1.77-.77 3-2.53 3-4.58 0-2.76-2.24-5-5-5z"
          fill={`url(#bulbGrad-${state})`}
          stroke={fill}
          strokeWidth="1"
        />
        <path
          d="M10 18h4v2h-4zM10 21h4v1h-4z"
          fill={fill}
          opacity="0.6"
        />
      </svg>
    </div>
  );
}
