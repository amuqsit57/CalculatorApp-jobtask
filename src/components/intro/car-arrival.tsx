"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Plays the car's arrival, then keeps it parked as the logo. The canvas scrolls with
 * the page and ignores the pointer, so everything underneath it stays usable.
 */
export function CarArrival({
  animate,
  slot,
}: {
  animate: boolean;
  slot: RefObject<HTMLElement | null>;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    let stop: (() => void) | undefined;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    import("./arrival-scene")
      .then(({ playArrival }) => {
        if (cancelled || !canvas.current) return;
        stop = playArrival(canvas.current, {
          getSlot: () => slot.current,
          animate: animate && !reduceMotion,
        });
      })
      // No WebGL, or the script failed to load: the car is decoration, so carry on without it.
      .catch(() => {});

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [animate, slot]);

  return (
    <canvas
      ref={canvas}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-40 h-dvh min-h-[560px] w-full"
    />
  );
}
