"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { duration, money, moneyInput, plural } from "@/lib/format";
import {
  buildPlan,
  comparePayment,
  effectiveYearlyRate,
  summarizeByYear,
  type Compounding,
  type Plan,
  type WhatIf,
} from "@/lib/loan";
import { cn } from "@/lib/utils";
import { parsePayment, validateLoan, type LoanForm, type ValidLoan } from "@/lib/validate";
import { BalanceChart, type ChartSeries } from "./balance-chart";
import { MoneyField } from "./money-field";

const STARTING_FORM: LoanForm = {
  price: "28,000",
  down: "3,000",
  apr: "7.5",
  years: "5",
  compounding: "monthly",
};

const COMPARED_YEARS = [3, 4, 5, 6, 7];
const STEPS = [-100, -50, 50, 100];

export function LoanCalculator() {
  const [form, setForm] = useState(STARTING_FORM);
  const [paymentText, setPaymentText] = useState<string | null>(null);

  const { loan, errors } = useMemo(() => validateLoan(form), [form]);
  const plan = useMemo(
    () => (loan ? buildPlan(loan.principal, loan.apr, loan.years, loan.compounding) : null),
    [loan],
  );

  // Any change to the loan itself makes an earlier "what if" payment meaningless.
  function update(changes: Partial<LoanForm>) {
    setForm((current) => ({ ...current, ...changes }));
    setPaymentText(null);
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] items-start gap-x-12 gap-y-10 lg:grid-cols-[20rem_minmax(0,1fr)]">
      <form
        aria-label="Your loan"
        onSubmit={(event) => event.preventDefault()}
        className="grid gap-5 border-t-4 border-foreground pt-4 lg:sticky lg:top-6"
      >
        <h2 className="eyebrow">Your loan</h2>
        <MoneyField
          id="price"
          label="Car price"
          prefix="$"
          value={form.price}
          onChange={(price) => update({ price })}
          error={errors.price}
        />
        <MoneyField
          id="down"
          label="Down payment"
          prefix="$"
          value={form.down}
          onChange={(down) => update({ down })}
          error={errors.down}
          hint={loan ? `You'd borrow ${money(loan.principal)}.` : undefined}
        />
        <MoneyField
          id="apr"
          label="Interest rate (APR)"
          suffix="% a year"
          value={form.apr}
          onChange={(apr) => update({ apr })}
          error={errors.apr}
        />
        <MoneyField
          id="years"
          label="Loan length"
          suffix="years"
          inputMode="numeric"
          value={form.years}
          onChange={(years) => update({ years })}
          error={errors.years}
          hint="Whole years, from 1 to 10."
        />
        <fieldset className="grid gap-2">
          <legend className="mb-1.5 text-sm font-semibold">Interest compounds</legend>
          {(
            [
              ["monthly", "Monthly", "How most calculators and many lenders quote it"],
              ["daily", "Daily", "Check your contract: many car loans work this way"],
            ] as [Compounding, string, string][]
          ).map(([value, label, note]) => (
            <label key={value} className="flex cursor-pointer items-start gap-2.5 text-sm">
              <input
                type="radio"
                name="compounding"
                value={value}
                checked={form.compounding === value}
                onChange={() => update({ compounding: value })}
                className="mt-0.5 size-4 accent-primary"
              />
              <span>
                <span className="font-medium">{label}</span>
                <span className="block text-muted-foreground">{note}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </form>

      <div className="min-w-0">
        {loan && plan ? (
          <Results
            loan={loan}
            plan={plan}
            paymentText={paymentText}
            onPaymentChange={setPaymentText}
            onChooseYears={(years) => update({ years: String(years) })}
          />
        ) : (
          <p role="status" className="border-t-4 border-destructive pt-4 text-lg font-medium">
            Fix the marked fields to see your numbers.
          </p>
        )}
      </div>
    </div>
  );
}

function Results({
  loan,
  plan,
  paymentText,
  onPaymentChange,
  onChooseYears,
}: {
  loan: ValidLoan;
  plan: Plan;
  paymentText: string | null;
  onPaymentChange: (text: string | null) => void;
  onChooseYears: (years: number) => void;
}) {
  const shownPayment = paymentText ?? moneyInput(plan.payment);
  const parsedPayment = parsePayment(shownPayment);
  const whatIf = parsedPayment.ok ? comparePayment(plan, parsedPayment.value) : null;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-14">
      <Summary loan={loan} plan={plan} />
      <LengthComparison loan={loan} plan={plan} onChooseYears={onChooseYears} />
      <PaymentExperiment
        plan={plan}
        shownPayment={shownPayment}
        paymentError={parsedPayment.ok ? undefined : parsedPayment.error}
        paymentCents={parsedPayment.ok ? parsedPayment.value : null}
        whatIf={whatIf}
        onPaymentChange={onPaymentChange}
      />
      <InterestBreakdown loan={loan} plan={plan} whatIf={whatIf} />
    </div>
  );
}

function Summary({ loan, plan }: { loan: ValidLoan; plan: Plan }) {
  const carCost = plan.totalPaid + loan.downCents;

  return (
    <section aria-label="What it costs" className="border-t-4 border-foreground pt-4">
      <p className="eyebrow">Monthly payment</p>
      <p className="figure mt-1 text-[clamp(2.75rem,8vw,5rem)] leading-none font-medium break-words">
        {money(plan.payment)}
      </p>
      <p aria-live="polite" className="mt-3 max-w-prose text-lg leading-snug">
        Borrow {money(plan.principal)} for {plural(loan.years, "year")} and you pay back{" "}
        <strong className="font-semibold">{money(plan.totalPaid)}</strong>.{" "}
        {plan.totalInterest > 0
          ? `${money(plan.totalInterest)} of that is interest.`
          : "None of that is interest."}
      </p>
      {plan.finalPayment !== plan.payment && (
        <p className="mt-1 text-sm text-muted-foreground">
          Rounding to the cent makes your last payment {money(plan.finalPayment)}.
        </p>
      )}

      <dl className="mt-6 grid border border-foreground sm:grid-cols-3">
        {[
          ["Total interest", plan.totalInterest, "What borrowing costs you"],
          ["Total repayments", plan.totalPaid, `${plan.months} payments, with interest`],
          ["Total car cost", carCost, "Repayments plus down payment"],
        ].map(([label, value, note], index) => (
          <div
            key={label}
            className={cn(
              "bg-card p-4",
              index > 0 && "border-t border-foreground sm:border-t-0 sm:border-l",
            )}
          >
            <dt className="text-sm font-semibold">{label}</dt>
            <dd className="figure my-1 text-xl break-words">{money(value as number)}</dd>
            <dd className="text-sm text-muted-foreground">{note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function LengthComparison({
  loan,
  plan,
  onChooseYears,
}: {
  loan: ValidLoan;
  plan: Plan;
  onChooseYears: (years: number) => void;
}) {
  const years = [...new Set([...COMPARED_YEARS, loan.years])].sort((a, b) => a - b);
  const longest = buildPlan(loan.principal, loan.apr, 7, loan.compounding);
  const shortest = buildPlan(loan.principal, loan.apr, 3, loan.compounding);
  const monthlyDrop = shortest.payment - longest.payment;
  const extraInterest = longest.totalInterest - shortest.totalInterest;

  return (
    <section aria-labelledby="lengths-heading">
      <SectionHeading id="lengths-heading" title="Longer loan, smaller payment, bigger bill">
          {extraInterest > 0
            ? `Going from 3 years to 7 takes ${money(monthlyDrop)} off each month and adds ${money(extraInterest)} in interest.`
            : `At 0% a longer loan lowers the payment and costs nothing extra. Going from 3 years to 7 takes ${money(monthlyDrop)} off each month.`}{" "}
          Pick a row to use that length.
        </SectionHeading>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Length</TableHead>
            <TableHead className="text-right">Monthly</TableHead>
            <TableHead className="text-right">Total interest</TableHead>
            <TableHead className="text-right">Total repayments</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {years.map((length) => {
            const option =
              length === loan.years
                ? plan
                : buildPlan(loan.principal, loan.apr, length, loan.compounding);
            const chosen = length === loan.years;
            return (
              <TableRow key={length} className={cn(chosen && "bg-accent font-semibold")}>
                <TableCell className="p-0">
                  <button
                    type="button"
                    aria-pressed={chosen}
                    onClick={() => onChooseYears(length)}
                    className="w-full cursor-pointer px-2 py-2.5 text-left underline decoration-border underline-offset-4 hover:decoration-foreground aria-pressed:no-underline"
                  >
                    {plural(length, "year")}
                    {chosen && <span className="ml-2 text-xs font-medium">Your choice</span>}
                  </button>
                </TableCell>
                <TableCell className="figure text-right">{money(option.payment)}</TableCell>
                <TableCell className="figure text-right">{money(option.totalInterest)}</TableCell>
                <TableCell className="figure text-right">{money(option.totalPaid)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </section>
  );
}

function PaymentExperiment({
  plan,
  shownPayment,
  paymentError,
  paymentCents,
  whatIf,
  onPaymentChange,
}: {
  plan: Plan;
  shownPayment: string;
  paymentError?: string;
  paymentCents: number | null;
  whatIf: WhatIf | null;
  onPaymentChange: (text: string | null) => void;
}) {
  const series: ChartSeries[] = [
    { name: "Agreed payment", color: "var(--chart-1)", dashed: true, rows: plan.rows },
  ];
  if (whatIf && whatIf.kind !== "same") {
    series.push({
      name: `${money(whatIf.payment)} a month`,
      color: "var(--chart-2)",
      rows: whatIf.rows,
    });
  }

  return (
    <section aria-labelledby="payment-heading">
      <SectionHeading id="payment-heading" title="What if you paid more, or less?">
        Your agreed payment is {money(plan.payment)}. Try something else and see what changes.
      </SectionHeading>

      <div className="flex flex-wrap items-start gap-x-4 gap-y-3">
        <div className="w-44">
          <MoneyField
            id="payment"
            label="Monthly payment"
            prefix="$"
            value={shownPayment}
            onChange={onPaymentChange}
            error={paymentError}
          />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-[1.65rem]">
          {STEPS.map((step) => {
            const next = (paymentCents ?? 0) + step * 100;
            return (
              <Button
                key={step}
                type="button"
                variant="outline"
                disabled={paymentCents === null || next <= 0}
                onClick={() => onPaymentChange(moneyInput(next))}
                className="figure h-11 border-input px-3"
              >
                {step > 0 ? `+$${step}` : `-$${-step}`}
              </Button>
            );
          })}
          <Button
            type="button"
            variant="ghost"
            onClick={() => onPaymentChange(null)}
            disabled={shownPayment === moneyInput(plan.payment)}
            className="h-11 px-3 underline underline-offset-4"
          >
            Back to the agreed payment
          </Button>
        </div>
      </div>

      {whatIf && <WhatIfOutcome plan={plan} whatIf={whatIf} />}

      <div className="mt-6 bg-card p-3 sm:p-4">
        <p className="mb-2 font-semibold">What you still owe, over time</p>
        <BalanceChart
          principal={plan.principal}
          series={series}
          caption={`Line chart of the balance still owed over time for ${series
            .map((s) => s.name)
            .join(" and ")}. The same figures are in the year-by-year table below.`}
        />
      </div>
    </section>
  );
}

function SectionHeading({
  id,
  title,
  children,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <header className="mb-4 max-w-prose">
      <h2 id={id} className="text-2xl font-bold tracking-tight">
        {title}
      </h2>
      <p className="mt-1 text-muted-foreground">{children}</p>
    </header>
  );
}

const LENDER_NOTE =
  "Paying less than agreed normally needs your lender's approval. This doesn't count any late fees or the effect on your credit.";

function Warning({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 border-l-4 border-destructive bg-card p-4">
      <p className="font-semibold text-destructive">{title}</p>
      <p className="mt-1 max-w-prose">{children}</p>
      <p className="mt-2 max-w-prose text-sm text-muted-foreground">{LENDER_NOTE}</p>
    </div>
  );
}

function WhatIfOutcome({ plan, whatIf }: { plan: Plan; whatIf: WhatIf }) {
  if (whatIf.kind === "same") {
    return (
      <p className="mt-5">
        That&apos;s your agreed payment: paid off in {duration(plan.months)}, with{" "}
        {money(plan.totalInterest)} in interest.
      </p>
    );
  }

  if (whatIf.kind === "belowInterest") {
    return (
      <Warning title="This loan would never be paid off">
        {money(whatIf.payment)} a month doesn&apos;t cover the {money(whatIf.interest)} of interest
        charged in the first month. The unpaid interest gets added to what you owe, and then earns
        interest itself. After 12 months you&apos;d owe {money(whatIf.balanceAfterYear)}.
      </Warning>
    );
  }

  if (whatIf.kind === "interestOnly") {
    return (
      <Warning title="This only covers the interest">
        At {money(whatIf.payment)} a month you&apos;d never reduce the loan. However long you paid,
        you&apos;d still owe {money(whatIf.balance)}.
      </Warning>
    );
  }

  if (whatIf.kind === "tooLong") {
    return (
      <Warning title="This would take more than 30 years">
        At {money(whatIf.payment)} a month, this loan would take more than 30 years to pay off.
        Almost all of each payment would go on interest at first.
      </Warning>
    );
  }

  const faster = whatIf.monthsSooner > 0;
  const slower = whatIf.monthsSooner < 0;
  const cheaper = whatIf.interestSaved > 0;
  const dearer = whatIf.interestSaved < 0;
  const isLower = whatIf.payment < plan.payment;

  return (
    <div className="mt-5">
      <dl className="grid border border-foreground sm:grid-cols-2">
        <div className="bg-card p-4">
          <dt className="text-sm font-semibold">Paid off in</dt>
          <dd className="figure my-1 text-xl">{duration(whatIf.months)}</dd>
          <dd className="text-sm text-muted-foreground">
            {faster && `${plural(whatIf.monthsSooner, "month")} sooner`}
            {slower && `${plural(-whatIf.monthsSooner, "month")} later`}
            {!faster && !slower && "Same length as agreed"}
          </dd>
        </div>
        <div className="border-t border-foreground bg-card p-4 sm:border-t-0 sm:border-l">
          <dt className="text-sm font-semibold">Total interest</dt>
          <dd className="figure my-1 text-xl">{money(whatIf.totalInterest)}</dd>
          <dd className="text-sm text-muted-foreground">
            {cheaper && `${money(whatIf.interestSaved)} less interest`}
            {dearer && `${money(-whatIf.interestSaved)} more interest`}
            {!cheaper && !dearer && "Same interest as agreed"}
          </dd>
        </div>
      </dl>
      {whatIf.neededToClear !== null && (
        <p className="mt-3">
          That&apos;s more than you&apos;d need. The loan is paid off in the first payment, and only{" "}
          {money(whatIf.neededToClear)} is needed.
        </p>
      )}
      {isLower && <p className="mt-3 text-sm text-muted-foreground">{LENDER_NOTE}</p>}
    </div>
  );
}

function InterestBreakdown({
  loan,
  plan,
  whatIf,
}: {
  loan: ValidLoan;
  plan: Plan;
  whatIf: WhatIf | null;
}) {
  const other: Compounding = loan.compounding === "monthly" ? "daily" : "monthly";
  const alternative = buildPlan(loan.principal, loan.apr, loan.years, other);
  const dailyPlan = loan.compounding === "daily" ? plan : alternative;
  const monthlyPlan = loan.compounding === "monthly" ? plan : alternative;
  const dailyExtra = dailyPlan.totalInterest - monthlyPlan.totalInterest;

  const paidOff = whatIf?.kind === "paid";
  const rows = paidOff ? whatIf.rows : plan.rows;
  const cannotRepay =
    whatIf?.kind === "tooLong" || whatIf?.kind === "interestOnly" || whatIf?.kind === "belowInterest";
  const years = summarizeByYear(rows);
  const totals = paidOff ? whatIf : plan;

  return (
    <section aria-labelledby="interest-heading">
      <SectionHeading id="interest-heading" title="How the interest builds up">
        Each month, interest is charged on whatever you still owe. Early on you owe the most, so
        more of each payment goes on interest.
      </SectionHeading>

      <ul className="mb-6 grid max-w-prose gap-2">
        <li>
          Your first month&apos;s interest is{" "}
          <strong className="figure font-medium">{money(plan.rows[0].interest)}</strong> on{" "}
          {money(plan.principal)}.
        </li>
        <li>
          A {loan.apr}% rate compounding {loan.compounding === "daily" ? "daily" : "monthly"} works
          out to an effective yearly rate of{" "}
          <strong className="figure font-medium">{effectiveYearlyRate(plan.rate).toFixed(2)}%</strong>
          .
        </li>
        {dailyExtra > 0 && (
          <li>
            {loan.compounding === "daily"
              ? `That's ${money(dailyExtra)} more interest than compounding monthly.`
              : `Compounding daily would cost ${money(dailyExtra)} more interest in total.`}
          </li>
        )}
      </ul>

      <p className="mb-2 font-semibold">
        Year by year at {money(paidOff ? whatIf.payment : plan.payment)} a month
      </p>
      {cannotRepay && (
        <p className="mb-2 text-sm text-muted-foreground">
          Your payment above can&apos;t repay this loan in a sensible time, so this table shows the
          agreed payment.
        </p>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Year</TableHead>
            <TableHead className="text-right">Paid</TableHead>
            <TableHead className="text-right">To interest</TableHead>
            <TableHead className="text-right">To the loan</TableHead>
            <TableHead className="text-right">Still owed</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {years.map((year) => (
            <TableRow key={year.year}>
              <TableCell>{year.year}</TableCell>
              <TableCell className="figure text-right">{money(year.paid)}</TableCell>
              <TableCell className="figure text-right">{money(year.interest)}</TableCell>
              <TableCell className="figure text-right">{money(year.principal)}</TableCell>
              <TableCell className="figure text-right">{money(year.balance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell>Total</TableCell>
            <TableCell className="figure text-right">{money(totals.totalPaid)}</TableCell>
            <TableCell className="figure text-right">{money(totals.totalInterest)}</TableCell>
            <TableCell className="figure text-right">{money(plan.principal)}</TableCell>
            <TableCell />
          </TableRow>
        </TableFooter>
      </Table>
    </section>
  );
}
