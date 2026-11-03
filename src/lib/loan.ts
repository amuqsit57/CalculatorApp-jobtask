/**
 * Loan arithmetic. All money is held in whole cents so that a schedule always
 * adds up exactly; rates stay as floats and each month's interest is rounded
 * to the cent, the way a lender's statement would be.
 */

export type Compounding = "monthly" | "daily";

export type ScheduleRow = {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
};

export type Plan = {
  principal: number;
  rate: number;
  months: number;
  payment: number;
  finalPayment: number;
  totalInterest: number;
  totalPaid: number;
  rows: ScheduleRow[];
};

export type WhatIf =
  | { kind: "same" }
  | {
      kind: "paid";
      payment: number;
      months: number;
      monthsSooner: number;
      interestSaved: number;
      totalInterest: number;
      totalPaid: number;
      /** Set when the payment is more than the whole loan plus a month's interest. */
      neededToClear: number | null;
      rows: ScheduleRow[];
    }
  | { kind: "tooLong"; payment: number; rows: ScheduleRow[] }
  | { kind: "interestOnly"; payment: number; balance: number; rows: ScheduleRow[] }
  | {
      kind: "belowInterest";
      payment: number;
      interest: number;
      balanceAfterYear: number;
      rows: ScheduleRow[];
    };

export const MAX_PAYOFF_MONTHS = 360;

/** The rate applied to the balance each month. */
export function monthlyRate(aprPercent: number, compounding: Compounding) {
  const apr = aprPercent / 100;
  return compounding === "daily" ? (1 + apr / 365) ** (365 / 12) - 1 : apr / 12;
}

/** What a year of this rate really adds up to, as a percentage. */
export function effectiveYearlyRate(rate: number) {
  return ((1 + rate) ** 12 - 1) * 100;
}

export function agreedPayment(principal: number, rate: number, months: number) {
  if (rate === 0) return Math.round(principal / months);
  return Math.round((principal * rate) / (1 - (1 + rate) ** -months));
}

/**
 * Pays `payment` each month until the balance is cleared or `maxMonths` is
 * reached. With `settleAtEnd`, the last month pays whatever is left, which
 * absorbs the rounding in the agreed payment. Interest that a payment does not
 * cover is added to the balance, so it earns interest in later months.
 */
function runSchedule(
  principal: number,
  rate: number,
  payment: number,
  maxMonths: number,
  settleAtEnd = false,
) {
  const rows: ScheduleRow[] = [];
  let balance = principal;

  for (let month = 1; month <= maxMonths && balance > 0; month++) {
    const interest = Math.round(balance * rate);
    const owed = balance + interest;
    const paid = owed <= payment || (settleAtEnd && month === maxMonths) ? owed : payment;
    balance = owed - paid;
    rows.push({ month, payment: paid, interest, principal: paid - interest, balance });
  }

  return rows;
}

function sum(rows: ScheduleRow[], key: "payment" | "interest") {
  return rows.reduce((total, row) => total + row[key], 0);
}

export function buildPlan(
  principal: number,
  aprPercent: number,
  years: number,
  compounding: Compounding,
): Plan {
  const rate = monthlyRate(aprPercent, compounding);
  const months = years * 12;
  const payment = agreedPayment(principal, rate, months);
  const rows = runSchedule(principal, rate, payment, months, true);

  return {
    principal,
    rate,
    months,
    payment,
    finalPayment: rows[rows.length - 1].payment,
    totalInterest: sum(rows, "interest"),
    totalPaid: sum(rows, "payment"),
    rows,
  };
}

export function comparePayment(plan: Plan, payment: number): WhatIf {
  if (payment === plan.payment) return { kind: "same" };

  const firstInterest = Math.round(plan.principal * plan.rate);

  if (payment === firstInterest) {
    return {
      kind: "interestOnly",
      payment,
      balance: plan.principal,
      rows: runSchedule(plan.principal, plan.rate, payment, plan.months),
    };
  }

  if (payment < firstInterest) {
    const firstYear = runSchedule(plan.principal, plan.rate, payment, 12);
    return {
      kind: "belowInterest",
      payment,
      interest: firstInterest,
      balanceAfterYear: firstYear[firstYear.length - 1].balance,
      rows: runSchedule(plan.principal, plan.rate, payment, plan.months),
    };
  }

  const rows = runSchedule(plan.principal, plan.rate, payment, MAX_PAYOFF_MONTHS);

  if (rows[rows.length - 1].balance > 0) {
    return { kind: "tooLong", payment, rows };
  }

  const totalInterest = sum(rows, "interest");
  const clearAmount = plan.principal + firstInterest;

  return {
    kind: "paid",
    payment,
    months: rows.length,
    monthsSooner: plan.months - rows.length,
    interestSaved: plan.totalInterest - totalInterest,
    totalInterest,
    totalPaid: sum(rows, "payment"),
    neededToClear: payment > clearAmount ? clearAmount : null,
    rows,
  };
}

export type YearSummary = {
  year: number;
  paid: number;
  interest: number;
  principal: number;
  balance: number;
};

export function summarizeByYear(rows: ScheduleRow[]): YearSummary[] {
  const years: YearSummary[] = [];

  for (const row of rows) {
    const index = Math.ceil(row.month / 12) - 1;
    years[index] ??= { year: index + 1, paid: 0, interest: 0, principal: 0, balance: 0 };
    years[index].paid += row.payment;
    years[index].interest += row.interest;
    years[index].principal += row.principal;
    years[index].balance = row.balance;
  }

  return years;
}
