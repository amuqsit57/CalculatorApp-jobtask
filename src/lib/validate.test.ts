import { describe, expect, it } from "vitest";
import { parseApr, parseDownPayment, parsePayment, parsePrice, parseYears, validateLoan } from "./validate";

const errorOf = (result: { ok: boolean; error?: string }) => result.error;

describe("parsePrice", () => {
  it.each([
    ["", "Enter the car price."],
    ["   ", "Enter the car price."],
    ["abc", "Car price must be a number, like 28,000."],
    ["1e5", "Car price must be a number, like 28,000."],
    ["Infinity", "Car price must be a number, like 28,000."],
    ["1,2,3", "Car price must be a number, like 28,000."],
    ["12.3.4", "Car price must be a number, like 28,000."],
    ["-5", "Car price can't be negative."],
    ["99.99", "Car price must be at least $100."],
    ["2000000.01", "Car price can't be more than $2,000,000."],
    ["99999999999999999999999", "Car price can't be more than $2,000,000."],
    ["1000.555", "Car price can't include fractions of a cent."],
  ])("rejects %j", (text, message) => {
    expect(errorOf(parsePrice(text))).toBe(message);
  });

  it.each([
    ["28000", 2_800_000],
    ["28,000", 2_800_000],
    ["$28,000.50", 2_800_050],
    [" 100 ", 10_000],
    ["2000000", 200_000_000],
  ])("reads %j", (text, cents) => {
    expect(parsePrice(text)).toEqual({ ok: true, value: cents });
  });

  it("keeps cents exact for values that floats handle badly", () => {
    expect(parsePrice("1001.10")).toEqual({ ok: true, value: 100_110 });
    expect(parsePrice("4353.35")).toEqual({ ok: true, value: 435_335 });
  });
});

describe("parseDownPayment", () => {
  it("accepts zero", () => {
    expect(parseDownPayment("0", 2_800_000)).toEqual({ ok: true, value: 0 });
  });

  it.each([
    ["28000", "Down payment must be less than the car price."],
    ["30000", "Down payment must be less than the car price."],
    ["27900.01", "That leaves less than $100 to borrow. Lower the down payment."],
    ["", "Enter the down payment, or 0 if there isn't one."],
  ])("rejects %j", (text, message) => {
    expect(errorOf(parseDownPayment(text, 2_800_000))).toBe(message);
  });

  it("allows exactly $100 to be borrowed", () => {
    expect(parseDownPayment("27900", 2_800_000).ok).toBe(true);
  });
});

describe("parseApr", () => {
  it.each([
    ["", "Enter the interest rate (APR)."],
    ["abc", "APR must be a number, like 7.5."],
    ["-1", "APR can't be negative."],
    ["51", "APR can't be more than 50%."],
    ["50.01", "APR can't be more than 50%."],
  ])("rejects %j", (text, message) => {
    expect(errorOf(parseApr(text))).toBe(message);
  });

  it.each([
    ["0", 0],
    ["7.5", 7.5],
    ["7.5%", 7.5],
    ["50", 50],
  ])("reads %j", (text, value) => {
    expect(parseApr(text)).toEqual({ ok: true, value });
  });
});

describe("parseYears", () => {
  it.each(["2.5", "0", "11", "-1", "abc", "1e1"])("rejects %j", (text) => {
    expect(errorOf(parseYears(text))).toBe(
      "Loan length must be a whole number of years, from 1 to 10.",
    );
  });

  it.each([
    ["1", 1],
    ["10", 10],
  ])("reads %j", (text, value) => {
    expect(parseYears(text)).toEqual({ ok: true, value });
  });
});

describe("parsePayment", () => {
  it.each([
    ["", "Enter a monthly payment."],
    ["0", "Monthly payment must be more than $0."],
    ["0.00", "Monthly payment must be more than $0."],
    ["abc", "Monthly payment must be a number, like 450."],
    ["-50", "Monthly payment can't be negative."],
    ["2000000.01", "Monthly payment can't be more than $2,000,000."],
  ])("rejects %j", (text, message) => {
    expect(errorOf(parsePayment(text))).toBe(message);
  });

  it("accepts a single cent", () => {
    expect(parsePayment("0.01")).toEqual({ ok: true, value: 1 });
  });
});

describe("validateLoan", () => {
  const form = { price: "28000", down: "3000", apr: "7.5", years: "5", compounding: "monthly" as const };

  it("returns the amount borrowed", () => {
    expect(validateLoan(form).loan?.principal).toBe(2_500_000);
  });

  it("reports every bad field at once and returns no loan", () => {
    const { loan, errors } = validateLoan({ ...form, price: "abc", apr: "99" });
    expect(loan).toBeNull();
    expect(Object.keys(errors).sort()).toEqual(["apr", "price"]);
  });
});
