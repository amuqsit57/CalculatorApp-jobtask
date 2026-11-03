"use client";

import { useEffect, useRef, useState } from "react";
import { LoanCalculator } from "@/components/calculator/loan-calculator";
import { CarArrival } from "@/components/intro/car-arrival";
import { Intro } from "@/components/intro/intro";

export function AppShell() {
  const [opened, setOpened] = useState<"calculate" | "skip" | null>(null);
  const main = useRef<HTMLElement>(null);
  const logoSlot = useRef<HTMLDivElement>(null);

  // Move keyboard and screen reader users to the calculator without opening a phone keyboard.
  useEffect(() => {
    if (opened) main.current?.focus({ preventScroll: true });
  }, [opened]);

  if (!opened) {
    return <Intro onCalculate={() => setOpened("calculate")} onSkip={() => setOpened("skip")} />;
  }

  return (
    <div className="relative flex flex-1 flex-col overflow-x-clip">
      <div className="calc-enter flex flex-1 flex-col">
        <header className="panel-green">
          <div className="relative mx-auto w-full max-w-6xl px-4 pt-10 pb-24 sm:px-8 sm:pb-32 xl:py-14">
            <p className="eyebrow">Car loan calculator</p>
            <h1 className="mt-2 max-w-3xl text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
              What will this car really cost you?
            </h1>
            <p className="mt-4 max-w-prose text-lg text-muted-foreground">
              The monthly payment is only part of the answer. Put in the numbers from your quote and
              see the whole bill before you sign.
            </p>
            {/* The car parks here, with its wheels on the stripes below the header. */}
            <div
              ref={logoSlot}
              aria-hidden="true"
              className="absolute right-4 bottom-0 h-16 w-36 sm:right-8 sm:h-24 sm:w-56 xl:h-28 xl:w-72"
            />
          </div>
        </header>
        <div aria-hidden="true" className="livery-stripes" />

        <main
          ref={main}
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 outline-none sm:px-8 lg:py-12"
        >
          <LoanCalculator />

          <footer className="mt-16 max-w-prose border-t border-border pt-4 text-sm text-muted-foreground">
            Estimates only, in US dollars. Assumes a fixed rate and equal monthly payments, and leaves
            out sales tax, dealer fees and insurance. Your lender&apos;s contract is what counts.
          </footer>
        </main>
      </div>

      <CarArrival animate={opened === "calculate"} slot={logoSlot} />
    </div>
  );
}
