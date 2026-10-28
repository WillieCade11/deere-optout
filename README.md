# Deere Repair Settlement: Opt-Out Information for Farmers

Free handouts for farmers on opting out of the settlement in *In re: Deere & Company Repair Services Antitrust Litigation*, Case No. 3:22-cv-50188 (N.D. Ill.).

**This is not legal advice.** This site is not the official settlement website. Official information: [DeereRepairSettlement.com](https://www.deererepairsettlement.com).

Live site: https://williecade11.github.io/deere-optout/

Questions: Willie Cade, Graceful Solutions LLC, willie@graceful.solutions, 773-562-3377

---

## What is in this repository

| Path | What it is |
|---|---|
| `index.html` | Home page. Lists each organization's page. |
| `style.css` | The look of every page (colors, fonts, buttons). |
| `afr/index.html` | American Farmers and Ranchers landing page. |
| `afr/faq/` `afr/letter/` `afr/invoices/` | QR stop pages. Each printed QR code opens one of these. It counts the scan, then opens the PDF. |
| `afr/*.pdf` | The four handouts. |
| `afr/afr-logo.jpg` | The AFR logo. |

## The one rule: never rename or move a printed address

Printed QR codes point to these addresses forever:

- `https://williecade11.github.io/deere-optout/afr/faq/`
- `https://williecade11.github.io/deere-optout/afr/letter/`
- `https://williecade11.github.io/deere-optout/afr/invoices/`

Do not rename, move, or delete those folders or the PDF file names. If you do, printed codes stop working.

## How to replace a PDF (for example, after a date change)

1. Save the new PDF on your computer with **exactly the same file name** (for example `opt-out-letter.pdf`).
2. On GitHub, open the `afr` folder and click **Add file**, then **Upload files**.
3. Drag the new PDF in. GitHub replaces the old one.
4. Click **Commit changes**. The live site updates in a minute or two.

Printed QR codes keep working because the name did not change.

## How to add another organization (for example, a Farmers Union)

1. Copy the `afr` folder to a new folder with a short name, such as `nfu`.
2. Replace `afr-logo.jpg` with the new logo and update the logo's description in `nfu/index.html`.
3. Replace the four PDFs with versions that carry the new logo and new QR codes. Use the same four file names.
4. Make new QR codes that point to `.../deere-optout/nfu/faq/`, `.../nfu/letter/`, and `.../nfu/invoices/`.
5. In the three stop pages, change `/afr/` to `/nfu/` in the line that starts with `try { window.goatcounter.count`, so scans are counted separately.
6. Add a button for the new organization on the home page (`index.html`).

## How to see visitor numbers

Visits are counted by GoatCounter, which uses no cookies and collects no personal information.

- Dashboard: https://deere-optout.goatcounter.com
- Pages named `/afr/faq/`, `/afr/letter/`, `/afr/invoices/` are **QR scans**.
- Events named `pdf-...` are **download button clicks** on the landing page.
- A weekly summary is emailed every Friday.
