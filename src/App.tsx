import { useRef, useEffect } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTodoStore } from "./store/useTodoStore";
import Bubble from "./components/Bubble";
import FloatingPanel from "./components/FloatingPanel";
import { invoke } from "@tauri-apps/api/core";

export default function App() {
  const view = useTodoStore((s) => s.view);
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
      invoke("resize_window", { width: 92, height: 44 });
    } else {
      invoke("resize_window", { width: 310, height: 480 });
    }
  }, [view]);

  return (
    <div ref={containerRef} className="w-screen h-screen flex items-center justify-center"
         style={{ opacity: 0, background: "transparent" }}>
      {view === "bubble" ? <Bubble /> : <FloatingPanel />}
    </div>
  );
}