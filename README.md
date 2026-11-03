# Car Loan Worksheet

## What it is and who it is for

A car loan calculator for **first-time car buyers**. It shows the monthly payment and the full cost of a loan, compares loan lengths, shows what happens if you pay more or less each month, and explains how the interest builds up.

**Why this calculator:** people buying their first car are usually quoted a monthly figure, and that figure hides the real trade-off. A longer loan feels cheaper each month but costs more overall, and paying less than the interest makes the debt grow. This app makes those costs visible before the buyer signs.

**Why this one role:** the need belongs to one kind of person, so the app has one role. See [App Roles](docs/app-roles.md).

## Prerequisites

- Node.js 22 (built and tested with v22.14.0)
- npm (comes with Node.js)

No paid accounts, API keys or cloud services are needed.

## Install and start

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

To run the production build instead:

```bash
npm run build
npm start
```

## Tests

```bash
npm test
```

These are automated tests of the loan calculations and input validation in `src/lib`. Their expected figures came from a separate script, not from the app's own code.

Every acceptance criterion of the stories marked Implemented was also checked in the running production build, with a scripted browser run in Microsoft Edge and Google Chrome on Windows. That script is not part of this repository. Firefox and Safari have not been tested.

## AI tool and model

Claude Code, using Claude Opus 5.5 (`claude-opus-5-5`).

## Code changed by hand

None. All of the code was written by the AI tool.

## Assumptions

- Amounts are in US dollars, and the rate entered is a fixed APR.
- Payments are monthly. Each month's interest is rounded to the cent, and the last agreed payment is adjusted so the total adds up exactly. A lender's figures may differ by a few cents.
- Monthly compounding uses APR / 12 each month. Daily compounding uses (1 + APR / 365) ^ (365 / 12) - 1 each month, which treats every month as the same length. Real daily-interest loans vary slightly with the number of days in each month and the dates payments are made.
- Sales tax, dealer fees, a trade-in, insurance and late fees are left out. See the Not implemented stories.
- Limits: car price $100 to $2,000,000, at least $100 borrowed, APR 0% to 50%, and loan length 1 to 10 whole years. These are product choices to catch typing mistakes, not legal limits.
- A payment that would take more than 30 years is treated as not repaying the loan in a sensible time, so no payoff figures are shown for it.

## Known limitations

- On a narrow phone, the wider tables scroll sideways inside their own area instead of fitting on the screen.
- The balance chart's hover details need a pointer or touch. The same information is in the year-by-year table, which works with a keyboard and screen reader.

## Documents

- [App Roles](docs/app-roles.md)
- [Jobs To Be Done](docs/jobs-to-be-done.md)
- [User Stories with Acceptance Criteria](docs/user-stories.md)
- [Session transcripts](transcripts/)
