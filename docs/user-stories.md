# User Stories with Acceptance Criteria

How the app helps them get the job done. All amounts are in US dollars.

The starting state called "the example loan" is what the calculator shows when it first appears, after the welcome screen: car price $28,000, down payment $3,000, APR 7.5%, loan length 5 years, compounded monthly. That means $25,000 is borrowed.

The Calculate button on the welcome screen opens the calculator (see S-10). After that, results update as the user types, with no further button to press.

## S-1 (serves J-1, Implemented)

As a First-time Car Buyer, I want to enter a car's price, my down payment, the rate and the loan length, so that I can see what the car will cost me in total.

- Given the calculator has just appeared, when I look at the results, then I see a monthly payment of $500.95, total interest of $5,056.96, total loan repayments of $30,056.96, and a total car cost of $33,056.96 (repayments plus down payment).
- Given the example loan, when I change the APR to 0, then the monthly payment is $416.67, total interest is $0.00, and total repayments are exactly $25,000.00.
- Given the smallest loan allowed (car price $100, down payment 0, APR 7.5%, 1 year), when I look at the results, then the monthly payment is $8.68 and total interest is $4.09.
- Given the largest values allowed (car price $2,000,000, down payment 0, APR 50%, 10 years), when I look at the results, then the monthly payment is $83,959.40, total interest is $8,075,113.78, and no number is shown in scientific notation or cut off.
- Given a monthly payment that does not divide exactly into the loan, when I look at the results, then the last payment is adjusted and shown, so the repayments add up to the loan plus interest to the cent.

## S-2 (serves J-1, Implemented)

As a First-time Car Buyer, I want a clear message when something I typed cannot be used, so that I can fix it and never rely on a wrong figure.

- Given the car price is empty, when I look at the field, then I see "Enter the car price."
- Given I type "abc" as the car price, when I look at the field, then I see "Car price must be a number, like 28,000."
- Given I type "-5" as the car price, when I look at the field, then I see "Car price can't be negative."
- Given I type "99.99" as the car price, when I look at the field, then I see "Car price must be at least $100."
- Given I type "2000000.01" as the car price, when I look at the field, then I see "Car price can't be more than $2,000,000."
- Given I type "1000.555" as the car price, when I look at the field, then I see "Car price can't include fractions of a cent."
- Given I type "1e5" as the car price, when I look at the field, then I see "Car price must be a number, like 28,000."
- Given I type "28,000" or "$28,000.50" as the car price, when I look at the results, then the value is accepted.
- Given the down payment is the same as or more than the car price, when I look at the field, then I see "Down payment must be less than the car price."
- Given the down payment leaves less than $100 to borrow, when I look at the field, then I see "That leaves less than $100 to borrow. Lower the down payment."
- Given I type "51" as the APR, when I look at the field, then I see "APR can't be more than 50%."
- Given I type "2.5", "0" or "11" as the loan length, when I look at the field, then I see "Loan length must be a whole number of years, from 1 to 10."
- Given any field has an error, when I look at the results area, then I see "Fix the marked fields to see your numbers." and no costs are shown.
- Given a field has an error, when I correct it, then the message goes away and the results come back with the right values, without reloading the page.

## S-3 (serves J-2, Implemented)

As a First-time Car Buyer, I want to compare different loan lengths side by side, so that I can see what a lower monthly payment really costs.

- Given the example loan, when I look at the comparison, then I see these rows and the 5-year row is marked as my choice:

| Length | Monthly | Total interest | Total repayments |
|---|---|---|---|
| 3 years | $777.66 | $2,995.58 | $27,995.58 |
| 4 years | $604.47 | $4,014.68 | $29,014.68 |
| 5 years | $500.95 | $5,056.96 | $30,056.96 |
| 6 years | $432.25 | $6,122.18 | $31,122.18 |
| 7 years | $383.46 | $7,210.24 | $32,210.24 |

- Given the comparison is showing, when I choose the 7-year row, then the loan length becomes 7 and all the results update to match it.
- Given I type a loan length of 9, when I look at the comparison, then a 9-year row is added and marked as my choice.
- Given a field has an error, when I look at the results area, then the comparison is not shown.

## S-4 (serves J-3, Implemented)

As a First-time Car Buyer, I want to see what happens if I pay more each month, so that I can decide whether the extra is worth it.

- Given the example loan, when I enter a monthly payment of $600.95, then I see that the loan is paid off in 4 years 1 month, which is 11 months sooner, with $1,013.70 less interest.
- Given the example loan, when I select "+$100", then the monthly payment becomes $600.95 and I see the same result.
- Given the example loan, when I enter a payment of $30,000, which is more than the $25,156.25 needed to clear the loan, then I see that the loan is paid off in the first payment and only $25,156.25 is needed.
- Given I have changed the payment, when I select "Back to the agreed payment", then the payment returns to $500.95.
- Given I have changed the payment, when I change the price, down payment, APR, loan length or compounding, then the payment resets to the new agreed payment.

## S-5 (serves J-3, Implemented)

As a First-time Car Buyer, I want to see what happens if I pay less each month, so that I know the danger before I fall short.

- Given the example loan, when I enter a monthly payment of $400.95, then I see that the loan is paid off in 6 years 8 months, which is 20 months later, with $1,720.68 more interest.
- Given the example loan, when I enter a payment of $157.00, then I see that the loan would take more than 30 years to pay off, and no payoff time or total is shown.
- Given the example loan, when I enter a payment of $156.25, then I see that the payment only covers the interest and I would still owe $25,000.00, and no payoff time or total is shown.
- Given the example loan, when I enter a payment of $100.00, then I see that the loan would never be paid off and that I would owe $25,698.69 after 12 months, and no payoff time or total is shown.
- Given I enter a payment of 0, when I look at the field, then I see "Monthly payment must be more than $0."
- Given I enter "abc" as the payment, when I look at the field, then I see "Monthly payment must be a number, like 450." and the loan results above it stay on screen.
- Given I enter a payment lower than agreed, when I look at the result, then I see a reminder that paying less than agreed normally needs the lender's approval and that late fees are not counted.
- Given the payment has an error, when I correct it, then the message goes away and the result comes back.

## S-6 (serves J-4, Implemented)

As a First-time Car Buyer, I want to see how the interest builds up over the life of the loan, so that I can understand what I am paying for.

- Given the example loan, when I look at the interest section, then I see that the first month's interest is $156.25 on $25,000.00 and that the effective yearly rate is 7.76%.
- Given the example loan, when I choose daily compounding, then the monthly payment becomes $501.22, total interest becomes $5,073.09, and I see that this is $16.13 more interest than compounding monthly.
- Given the example loan, when I look at the year-by-year table, then it has 5 rows, the last row shows $0.00 still owed, and its totals match the total repayments and total interest.
- Given I have entered a different payment that pays off the loan, when I look at the year-by-year table and the balance chart, then they reflect that payment, and the chart also shows the agreed payment for comparison.
- Given the payment never pays off the loan, when I look at the year-by-year table, then it shows the agreed payment and says so.

## S-7 (serves J-1, Not implemented)

As a First-time Car Buyer, I want to include sales tax, dealer fees and a trade-in, so that the amount I borrow matches my real deal.

## S-8 (serves J-3, Not implemented)

As a First-time Car Buyer, I want to see the effect of a one-off lump-sum payment, so that I can decide what to do with a bonus or a tax refund.

## S-9 (serves J-2, Not implemented)

As a First-time Car Buyer, I want to compare offers from two lenders side by side, so that I can pick the better deal.

## S-10 (serves J-1, Implemented)

As a First-time Car Buyer, I want a short welcome that makes clear this is a car loan calculator and lets me start when I am ready, so that I know I am in the right place before I work out what I can afford.

- Given my device allows animation, when I open the app, then a 3D car with rocket flames flies across the screen, the page changes from dark to light as it passes, "Car Loan Calculator" falls from the top, and a Calculate button appears, all within about 5 seconds.
- Given the welcome screen is showing, when I press Calculate, then the calculator appears with the example loan, and I can use every other story in this list as written.
- Given my device allows animation, when I press Calculate, then the car comes in from the bottom left, does a backflip and leaves at the top right, then returns from the right along the line under the header, brakes, its exhaust stops, and it stays parked on that line to the right of the heading as the logo.
- Given the car is still moving after I press Calculate, when I type in a calculator field, then the field accepts my typing and the results update.
- Given the car is parked as the logo, when I scroll the page or resize the window, then it stays in its place on the line under the heading.
- Given the car is still flying on the welcome screen, when I press "Skip intro", then the calculator appears straight away with the car already parked as the logo.
- Given the Calculate button has appeared, when I press Enter without using the mouse, then the calculator appears.
- Given my device is set to reduce motion, when I open the app, then no car flies and the title and Calculate button appear straight away, without animation, and pressing Calculate shows the car already parked as the logo.
- Given my browser cannot display 3D graphics, when I open the app, then the title and Calculate button still appear, with no error shown, and the calculator works with no car.
- Given I reload the page, when it opens, then the welcome plays again and the calculator is back to the example loan.
