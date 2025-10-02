"use client";

import { useEffect, useState } from "react";

export default function LandscapePrompt() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkOrientation = () => {
      const isMobilePortrait = window.matchMedia(
        "(max-width: 640px) and (orientation: portrait)"
      ).matches;
      setShow(isMobilePortrait);
    };

    checkOrientation();
    window.addEventListener("resize", checkOrientation);
    window.addEventListener("orientationchange", checkOrientation);

    return () => {
      window.removeEventListener("resize", checkOrientation);
      window.removeEventListener("orientationchange", checkOrientation);
    };
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="text-center max-w-sm">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 border-4 border-cyan-400/30 rounded-2xl animate-pulse" />
          <div className="absolute inset-2 border-4 border-cyan-400 rounded-xl flex items-center justify-center">
            <svg
              className="w-10 h-10 text-cyan-400 animate-spin"
              style={{ animationDuration: "3s" }}
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M4 12h16M12 4v16"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M7 7l10 10M17 7L7 17"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.3"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-3 text-white">
          Rotate Your Device
        </h2>
        <p className="text-slate-300 text-lg leading-relaxed">
          This 3D experience is optimized for landscape orientation
        </p>
        <div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>Rotate to continue</span>
        </div>
      </div>
    </div>
  );
}
