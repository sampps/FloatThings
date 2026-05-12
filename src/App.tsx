import { useEffect, useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTodoStore } from "./store/useTodoStore";
import Bubble from "./components/Bubble";
import FloatingPanel from "./components/FloatingPanel";

export default function App() {
  const view = useTodoStore((s) => s.view);
  const containerRef = useRef<HTMLDivElement>(null);

  // Resize window when switching views
  useEffect(() => {
    const resizeWindow = async () => {
      try {
        const { getCurrentWindow, LogicalSize } = await import("@tauri-apps/api/window");
        const win = getCurrentWindow();
        if (view === "bubble") {
          await win.setSize(new LogicalSize(110, 56));
        } else {
          await win.setSize(new LogicalSize(310, 500));
        }
        await win.center();
      } catch {
        // Running in browser, ignore
      }
    };
    resizeWindow();
  }, [view]);

  // Global view transition
  useGSAP(
    () => {
      gsap.to(containerRef.current, {
        opacity: 1,
        duration: 0.15,
        ease: "power2.out",
      });
    },
    { dependencies: [view], scope: containerRef }
  );

  return (
    <div
      ref={containerRef}
      className="w-screen h-screen flex items-center justify-center bg-transparent"
      style={{ opacity: 0 }}
    >
      {view === "bubble" ? <Bubble /> : <FloatingPanel />}
    </div>
  );
}
