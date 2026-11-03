import { describe, expect, it } from "vitest";
import { duration, money } from "./format";
import { buildPlan, comparePayment, effectiveYearlyRate, summarizeByYear } from "./loan";

// Expected figures were calculated by a separate script, not by this code.
const example = () => buildPlan(2_500_000, 7.5, 5, "monthly");

describe("buildPlan", () => {
  it("works out the example loan", () => {
    const plan = example();
    expect(plan.payment).toBe(50_095);
    expect(plan.totalInterest).toBe(505_696);
    expect(plan.totalPaid).toBe(3_005_696);
    expect(plan.rows).toHaveLength(60);
  });

  it.each([
    [3, 77_766, 299_558],
    [4, 60_447, 401_468],
    [6, 43_225, 612_218],
    [7, 38_346, 721_024],
  ])("works out a %i-year loan", (years, payment, interest) => {
    const plan = buildPlan(2_500_000, 7.5, years, "monthly");
    expect(plan.payment).toBe(payment);
    expect(plan.totalInterest).toBe(interest);
  });

  it("handles a 0% rate with no division by zero", () => {
    const plan = buildPlan(2_500_000, 0, 5, "monthly");
    expect(plan.payment).toBe(41_667);
    expect(plan.totalInterest).toBe(0);
    expect(plan.totalPaid).toBe(2_500_000);
  });

  it("handles the smallest and largest loans allowed", () => {
    const smallest = buildPlan(10_000, 7.5, 1, "monthly");
    expect(smallest.payment).toBe(868);
    expect(smallest.totalInterest).toBe(409);

    const largest = buildPlan(200_000_000, 50, 10, "monthly");
    expect(largest.payment).toBe(8_395_940);
    expect(largest.totalInterest).toBe(807_511_378);
    expect(money(largest.totalInterest)).toBe("$8,075,113.78");
  });

  it("charges slightly more when compounding daily", () => {
    const plan = buildPlan(2_500_000, 7.5, 5, "daily");
    expect(plan.payment).toBe(50_122);
    expect(plan.totalInterest).toBe(507_309);
    expect(plan.totalInterest - example().totalInterest).toBe(1_613);
  });

  it("always ends at zero, with repayments equal to loan plus interest", () => {
    for (const [principal, apr, years] of [
      [10_000, 0, 10],
      [10_001, 0.01, 3],
      [3_333_333, 13.37, 7],
      [200_000_000, 50, 1],
    ]) {
      const plan = buildPlan(principal, apr, years, "monthly");
      expect(plan.rows).toHaveLength(years * 12);
      expect(plan.rows.at(-1)?.balance).toBe(0);
      expect(plan.totalPaid).toBe(principal + plan.totalInterest);
    }
  });

  it("reports the effective yearly rate", () => {
    expect(effectiveYearlyRate(example().rate).toFixed(2)).toBe("7.76");
  });
});

describe("comparePayment", () => {
  it("recognises the agreed payment", () => {
    expect(comparePayment(example(), 50_095).kind).toBe("same");
  });

  it("shows the effect of paying more", () => {
    const result = comparePayment(example(), 60_095);
    if (result.kind !== "paid") throw new Error(result.kind);
    expect(result.months).toBe(49);
    expect(duration(result.months)).toBe("4 years 1 month");
    expect(result.monthsSooner).toBe(11);
    expect(result.interestSaved).toBe(101_370);
    expect(result.neededToClear).toBeNull();
  });

  it("shows the effect of paying less", () => {
    const result = comparePayment(example(), 40_095);
    if (result.kind !== "paid") throw new Error(result.kind);
    expect(duration(result.months)).toBe("6 years 8 months");
    expect(result.monthsSooner).toBe(-20);
    expect(result.interestSaved).toBe(-172_068);
  });

  it("caps a payment bigger than the whole loan", () => {
    const result = comparePayment(example(), 3_000_000);
    if (result.kind !== "paid") throw new Error(result.kind);
    expect(result.months).toBe(1);
    expect(result.neededToClear).toBe(2_515_625);
    expect(result.totalPaid).toBe(2_515_625);
  });

  it("treats a payment of exactly the amount needed as not excessive", () => {
    const result = comparePayment(example(), 2_515_625);
    if (result.kind !== "paid") throw new Error(result.kind);
    expect(result.months).toBe(1);
    expect(result.neededToClear).toBeNull();
  });

  it("refuses to give a payoff time past 30 years", () => {
    expect(comparePayment(example(), 15_700).kind).toBe("tooLong");
  });

  it("flags a payment that only covers the interest", () => {
    const result = comparePayment(example(), 15_625);
    if (result.kind !== "interestOnly") throw new Error(result.kind);
    expect(result.balance).toBe(2_500_000);
  });

  it("shows the balance growing when interest is not covered", () => {
    const result = comparePayment(example(), 10_000);
    if (result.kind !== "belowInterest") throw new Error(result.kind);
    expect(result.balanceAfterYear).toBe(2_569_869);
  });

  it("flags a tiny payment on a 0% loan as too long, not as an error", () => {
    const plan = buildPlan(2_500_000, 0, 5, "monthly");
    expect(comparePayment(plan, 1).kind).toBe("tooLong");
  });
});

describe("summarizeByYear", () => {
  it("adds up to the plan totals", () => {
    const plan = example();
    const years = summarizeByYear(plan.rows);
    expect(years).toHaveLength(5);
    expect(years.at(-1)?.balance).toBe(0);
    expect(years.reduce((total, y) => total + y.paid, 0)).toBe(plan.totalPaid);
    expect(years.reduce((total, y) => total + y.interest, 0)).toBe(plan.totalInterest);
  });

  it("includes a part year", () => {
    const result = comparePayment(example(), 60_095);
    if (result.kind !== "paid") throw new Error(result.kind);
    expect(summarizeByYear(result.rows)).toHaveLength(5);
  });
});
