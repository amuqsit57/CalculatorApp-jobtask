import { LoanCalculator } from "@/components/calculator/loan-calculator";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-8 lg:py-12">
      <header className="mb-10 max-w-3xl">
        <p className="eyebrow">Car loan worksheet</p>
        <h1 className="mt-2 text-4xl leading-[1.05] font-extrabold tracking-tight sm:text-6xl">
          What will this car really cost you?
        </h1>
        <p className="mt-4 max-w-prose text-lg text-muted-foreground">
          The monthly payment is only part of the answer. Put in the numbers from your quote and see
          the whole bill before you sign.
        </p>
      </header>

      <LoanCalculator />

      <footer className="mt-16 max-w-prose border-t border-border pt-4 text-sm text-muted-foreground">
        Estimates only, in US dollars. Assumes a fixed rate and equal monthly payments, and leaves
        out sales tax, dealer fees and insurance. Your lender&apos;s contract is what counts.
      </footer>
    </main>
  );
}
