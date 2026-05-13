import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTodoStore } from "./store/useTodoStore";
import Bubble from "./components/Bubble";
import FloatingPanel from "./components/FloatingPanel";
import { invoke } from "@tauri-apps/api/core";

export default function App() {
  const view = useTodoStore((s) => s.view);
  const theme = useTodoStore((s) => s.theme);
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      gsap.fromTo(containerRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25, ease: "power2.out" });
    },
    { dependencies: [view], scope: containerRef }
  );

  // Resize window after view switch (React has rendered new component)
  useEffect(() => {
    if (view === "bubble") {
      invoke("resize_window", { width: 52, height: 52 });
    } else {
      invoke("resize_window", { width: 310, height: 480 });
    }
  }, [view]);

  const isDark = theme === "dark";
  // Bubble needs non-transparent corners; panel can be transparent (corners are tiny)
  const containerBg = view === "bubble" ? (isDark ? "#0d1520" : "#e8ecf2") : "transparent";
  const borderRadius = view === "bubble" ? "50%" : "22px";
  const overflow = view === "bubble" ? "hidden" : "visible";

  return (
    <div ref={containerRef}
         className="flex items-center justify-center"
         style={{
           width: "100%",
           height: "100%",
           opacity: 0,
           background: containerBg,
           borderRadius: borderRadius,
           overflow: overflow,
         }}>
      {view === "bubble" ? <Bubble /> : <FloatingPanel />}
    </div>
  );
}