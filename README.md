# PLMun Business Center

A browser-based ordering and point-of-sale system for the PLMun Business Center, built for HCI Group 7.

The system is **three websites that share one database**:

| Site | File | Who uses it |
| --- | --- | --- |
| **Shop** | `index.html` | Students: browse, order, pay, track pickups |
| **Cashier / POS** | `cashier.html` | Staff: verify payments, hand out orders, walk-in sales |
| **Inventory / Reports** | `admin.html` | Managers: stock, prices, sales reports, audit log |

## Live site

Once GitHub Pages is enabled on this repository:

- Shop — https://rakka-m.github.io/HCI-SYSTEM/
- Cashier — https://rakka-m.github.io/HCI-SYSTEM/cashier.html
- Admin — https://rakka-m.github.io/HCI-SYSTEM/admin.html

Open all three in separate browser tabs to see the live sync in action.

## Run locally

Double-click `START.bat`. It starts a small local server and opens all three pages:

- http://localhost:8000/index.html
- http://localhost:8000/cashier.html
- http://localhost:8000/admin.html

**Why a server?** The three sites only share data when they come from the same
address. Opening the HTML files directly can make some browsers keep each file's
data separate, so the live sync will not work. `START.bat` removes that risk.

If Python is missing, install it from [python.org](https://www.python.org/downloads/).

## Demo accounts

| Username | Password | Role |
| --- | --- | --- |
| `staff1` | `1234` | Staff |
| `staff2` | `1234` | Staff |
| `admin` | `admin123` | Manager (also sees the Activity tab) |

Students create their own account on the Shop site with any student ID and a
4-digit PIN.

## What each site does

### Shop (`index.html`)
- Browse products and bundles, search, choose sizes
- Add to cart; pay with GCash/Maya (reference number + receipt screenshot) or
  choose "Pay at counter (cash)"
- Choose a pickup time slot, sign in with student ID + 4-digit PIN
- Track orders, see the pickup code + QR, print a receipt slip
- Take the SUS usability survey

### Cashier + POS (`cashier.html`)
- Staff login
- **POS**: tap products, enter cash received, the change is computed, complete
  the sale, print a walk-in receipt. GCash/Maya sales ask for the reference
  number instead of cash.
- **Orders**: verify GCash payments, confirm cash received, mark orders ready,
  type the pickup code to mark an order claimed

### Inventory + Reports (`admin.html`)
- Staff/manager login
- **Inventory**: stock per size, prices, alert levels, +10 restock, add/remove
  products, shop announcement
- **Report**: total sales, paid orders, POS counter sales, SUS score, average
  transaction times, top items, low stock, counter-time baseline, CSV export of
  every order (includes a Channel column)
- **Activity**: manager only — audit log and staff accounts

## How the three sites talk to each other

All data lives in the browser's `localStorage` under the key `plmun_bc_v2`. Each
site keeps a copy in memory, and every `save()` writes to `localStorage`. The
browser then fires a `storage` event in the other open tabs, which reload the
data and redraw. That is the whole interaction — no server code needed.

Try this:

1. Place an order on the Shop site.
2. The Cashier site's Orders tab shows it within a second (Pending).
3. Verify it and mark it ready on the Cashier site.
4. The student's My Orders tab now shows the pickup code.
5. Make a POS sale on the Cashier site.
6. The Admin site's stock and Report numbers change immediately.

## Files

| File | Purpose |
| --- | --- |
| `index.html` | Site 1 — Shop |
| `cashier.html` | Site 2 — Cashier + POS |
| `admin.html` | Site 3 — Inventory + Reports |
| `data.js` | Seed products, accounts, survey text, shared state |
| `store.js` | All rules and data changes (the "brain") |
| `views.js` | All screens (HTML builders) |
| `app.js` | Boots the page |
| `styles.css` | The look, including POS styles |
| `theme.js` | Dark/light mode |
| `START.bat` | One-click local launcher |
| `PLMUN_LOGO.png`, `images/` | Artwork |

## Notes

- **GCash/Maya is not an automatic payment gateway.** The buyer pays in their own
  app, then the reference number and a receipt screenshot are recorded and a
  staff member verifies them. Say that plainly if asked.
- The POS handles walk-in sales with cash and change, or an e-wallet reference.
  Those sales are saved with channel `POS` and status `Claimed`, so they count in
  the sales report automatically.
- Stock is deducted the moment a sale or order is made, and returned if an online
  order is rejected or cancelled.
- Data is stored per browser/origin. Clearing site data resets the demo.
