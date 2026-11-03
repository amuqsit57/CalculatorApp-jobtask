const dollars = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function money(cents: number) {
  return dollars.format(cents / 100);
}

/** A cents value as an editable field value, such as 500.95. */
export function moneyInput(cents: number) {
  return (cents / 100).toFixed(2);
}

export function plural(count: number, word: string) {
  return `${count} ${word}${count === 1 ? "" : "s"}`;
}

export function duration(totalMonths: number) {
  const years = Math.floor(totalMonths / 12);
  const months = totalMonths % 12;
  const parts: string[] = [];
  if (years > 0) parts.push(plural(years, "year"));
  if (months > 0) parts.push(plural(months, "month"));
  return parts.join(" ");
}
