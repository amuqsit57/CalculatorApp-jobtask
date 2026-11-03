import type { Compounding } from "./loan";

export const MIN_PRICE = 10_000; // $100, in cents
export const MAX_MONEY = 200_000_000; // $2,000,000, in cents
export const MIN_LOAN = 10_000; // $100, in cents
export const MAX_APR = 50;
export const MIN_YEARS = 1;
export const MAX_YEARS = 10;

type Parsed<T> = { ok: true; value: T } | { ok: false; error: string };

const PLAIN_NUMBER = /^(\d+(\.\d*)?|\.\d+)$/;
const GROUPED_NUMBER = /^\d{1,3}(,\d{3})+(\.\d*)?$/;

/** Returns the digits of a typed number, its sign, or null when it isn't one. */
function readNumber(text: string, symbol: "$" | "%") {
  let value = text.trim();
  const negative = value.startsWith("-");
  if (negative) value = value.slice(1).trim();

  if (symbol === "$" && value.startsWith("$")) value = value.slice(1).trim();
  if (symbol === "%" && value.endsWith("%")) value = value.slice(0, -1).trim();

  if (!PLAIN_NUMBER.test(value) && !GROUPED_NUMBER.test(value)) return null;
  return { digits: value.replaceAll(",", ""), negative };
}

type MoneyWording = { label: string; empty: string; example: string };

function parseMoney(text: string, { label, empty, example }: MoneyWording): Parsed<number> {
  if (text.trim() === "") return { ok: false, error: empty };

  const number = readNumber(text, "$");
  if (!number) return { ok: false, error: `${label} must be a number, like ${example}.` };
  if (number.negative) return { ok: false, error: `${label} can't be negative.` };

  if ((number.digits.split(".")[1] ?? "").length > 2) {
    return { ok: false, error: `${label} can't include fractions of a cent.` };
  }

  return { ok: true, value: Math.round(Number(number.digits) * 100) };
}

export function parsePrice(text: string): Parsed<number> {
  const money = parseMoney(text, {
    label: "Car price",
    empty: "Enter the car price.",
    example: "28,000",
  });
  if (!money.ok) return money;
  if (money.value < MIN_PRICE) return { ok: false, error: "Car price must be at least $100." };
  if (money.value > MAX_MONEY) {
    return { ok: false, error: "Car price can't be more than $2,000,000." };
  }
  return money;
}

export function parseDownPayment(text: string, priceCents: number | null): Parsed<number> {
  const money = parseMoney(text, {
    label: "Down payment",
    empty: "Enter the down payment, or 0 if there isn't one.",
    example: "3,000",
  });
  if (!money.ok || priceCents === null) return money;
  if (money.value >= priceCents) {
    return { ok: false, error: "Down payment must be less than the car price." };
  }
  if (priceCents - money.value < MIN_LOAN) {
    return { ok: false, error: "That leaves less than $100 to borrow. Lower the down payment." };
  }
  return money;
}

export function parseApr(text: string): Parsed<number> {
  if (text.trim() === "") return { ok: false, error: "Enter the interest rate (APR)." };

  const number = readNumber(text, "%");
  if (!number) return { ok: false, error: "APR must be a number, like 7.5." };
  if (number.negative) return { ok: false, error: "APR can't be negative." };

  const value = Number(number.digits);
  if (value > MAX_APR) return { ok: false, error: "APR can't be more than 50%." };
  return { ok: true, value };
}

export function parseYears(text: string): Parsed<number> {
  if (text.trim() === "") return { ok: false, error: "Enter the loan length in years." };

  const value = /^\d+$/.test(text.trim()) ? Number(text.trim()) : NaN;
  if (!Number.isInteger(value) || value < MIN_YEARS || value > MAX_YEARS) {
    return { ok: false, error: "Loan length must be a whole number of years, from 1 to 10." };
  }
  return { ok: true, value };
}

export function parsePayment(text: string): Parsed<number> {
  const money = parseMoney(text, {
    label: "Monthly payment",
    empty: "Enter a monthly payment.",
    example: "450",
  });
  if (!money.ok) return money;
  if (money.value === 0) return { ok: false, error: "Monthly payment must be more than $0." };
  if (money.value > MAX_MONEY) {
    return { ok: false, error: "Monthly payment can't be more than $2,000,000." };
  }
  return money;
}

export type LoanForm = {
  price: string;
  down: string;
  apr: string;
  years: string;
  compounding: Compounding;
};

export type LoanFormErrors = Partial<Record<"price" | "down" | "apr" | "years", string>>;

export type ValidLoan = {
  priceCents: number;
  downCents: number;
  principal: number;
  apr: number;
  years: number;
  compounding: Compounding;
};

export function validateLoan(form: LoanForm): { loan: ValidLoan | null; errors: LoanFormErrors } {
  const price = parsePrice(form.price);
  const down = parseDownPayment(form.down, price.ok ? price.value : null);
  const apr = parseApr(form.apr);
  const years = parseYears(form.years);

  const errors: LoanFormErrors = {};
  if (!price.ok) errors.price = price.error;
  if (!down.ok) errors.down = down.error;
  if (!apr.ok) errors.apr = apr.error;
  if (!years.ok) errors.years = years.error;

  if (!price.ok || !down.ok || !apr.ok || !years.ok) return { loan: null, errors };

  return {
    errors,
    loan: {
      priceCents: price.value,
      downCents: down.value,
      principal: price.value - down.value,
      apr: apr.value,
      years: years.value,
      compounding: form.compounding,
    },
  };
}
