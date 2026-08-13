# Straw Hut Media — Invoice Admin

A private, single-page admin tool for turning contractor hours into saved invoices,
then paying those contractors by credit card through **Melio** (for the points + float).

Open `index.html` in a browser, or use the hosted private version.

## What it does

1. **Save contractors** once — name, email, hourly rate, how they get paid (ACH or check).
2. **Create an invoice** — pick a contractor, then either **paste/upload their monthly hours**
   from a spreadsheet or type them in. The total calculates automatically.
3. **Generate a clean, branded invoice** you can print, save as PDF, or email to the contractor.
4. **Save every invoice** with a **Paid / Unpaid** toggle you flip once you've paid in Melio.
5. Read the **big total** off the invoice and pay the contractor by credit card in Melio.

## How payment works (Melio)

You pay Melio with your **credit card** (2.9% fee); Melio pays your contractor by **ACH
deposit or mailed check** from Melio's account. The contractor never needs to accept cards.
This tool produces the invoice + the number you enter in Melio — it does not move money itself.

## Notes

- Data is stored **in your browser** (localStorage). Use **Settings → Back up all data**
  regularly, and **Restore** on another device to move your data.
- The passcode is a light convenience lock stored in this browser, not bank-grade security.
- No accounts, no server, no external services — everything runs locally in the page.
