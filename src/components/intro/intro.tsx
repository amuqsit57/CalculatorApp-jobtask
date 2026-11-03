"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/** If the fly-by hasn't finished by then, move on without it. */
const FLY_BY_TIME_LIMIT_MS = 7000;
const TITLE_WORDS = ["Car", "Loan", "Calculator"];

export function Intro({ onCalculate, onSkip }: { onCalculate: () => void; onSkip: () => void }) {
  const [showTitle, setShowTitle] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const paper = useRef<HTMLDivElement>(null);
  const edge = useRef<HTMLDivElement>(null);
  const calculate = useRef<HTMLButtonElement>(null);

  // Runs every frame, so it writes to the DOM directly instead of through state.
  const paintSweep = useCallback((share: number) => {
    if (paper.current) paper.current.style.clipPath = `inset(0 ${(1 - share) * 100}% 0 0)`;
    if (edge.current) {
      edge.current.style.transform = `translateX(${share * 100}vw)`;
      edge.current.style.opacity = share > 0 && share < 1 ? "1" : "0";
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    let stopScene: (() => void) | undefined;

    const finish = () => {
      if (cancelled) return;
      paintSweep(1);
      setShowTitle(true);
    };

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const limit = setTimeout(finish, reduceMotion ? 0 : FLY_BY_TIME_LIMIT_MS);

    if (!reduceMotion) {
      import("./fly-by-scene")
        .then(({ playFlyBy }) => {
          if (cancelled || !canvas.current) return;
          stopScene = playFlyBy(canvas.current, {
            onSweep: paintSweep,
            onDone: () => {
              clearTimeout(limit);
              finish();
            },
          });
        })
        // No WebGL, or the script failed to load: the title and button still work.
        .catch(() => {
          clearTimeout(limit);
          finish();
        });
    }

    return () => {
      cancelled = true;
      clearTimeout(limit);
      stopScene?.();
    };
  }, [paintSweep]);

  useEffect(() => {
    if (showTitle) calculate.current?.focus({ preventScroll: true });
  }, [showTitle]);

  useEffect(() => {
    const markKeyboard = (event: KeyboardEvent) => {
      if (event.key === "Tab") document.documentElement.dataset.keyboard = "";
    };
    window.addEventListener("keydown", markKeyboard);
    return () => window.removeEventListener("keydown", markKeyboard);
  }, []);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#0b1411]">
      <div
        ref={paper}
        className="absolute inset-0 bg-background"
        style={{ clipPath: "inset(0 100% 0 0)" }}
      />
      <div
        ref={edge}
        aria-hidden="true"
        className="sweep-edge absolute inset-y-0 -left-[7vw] w-[7vw] opacity-0"
      />
      <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 size-full" />

      {showTitle ? (
        <div className="title-stage absolute inset-0 flex flex-col items-center justify-center gap-10 px-4 text-center">
          <h1 className="flex flex-wrap items-baseline justify-center gap-x-[0.28em] text-[clamp(3rem,10vw,8.5rem)] leading-[0.98] font-extrabold tracking-tight">
            {TITLE_WORDS.map((word, index) => (
              <span
                key={word}
                className={index === 1 ? "fall-in title-twitch" : "fall-in"}
                style={{ animationDelay: `${index * 140}ms` }}
              >
                {word}
              </span>
            ))}
          </h1>
          <Button
            ref={calculate}
            type="button"
            onClick={onCalculate}
            className="rise-in press-3d h-14 rounded-none px-10 text-lg font-bold"
          >
            Calculate
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={onSkip}
          className="absolute top-4 right-4 h-10 px-4"
        >
          Skip intro
        </Button>
      )}
    </div>
  );
}
