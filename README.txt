PLMun Business Center — Enhanced version (3 sites + POS)
========================================================

This folder is the enhanced copy. The original folder on your Desktop is
untouched, so you always have something to fall back on.

The system is now THREE websites that share one database:

  index.html      SITE 1 — SHOP (students)
  cashier.html    SITE 2 — CASHIER + POS (staff)
  admin.html      SITE 3 — INVENTORY + REPORTS (manager)

Open them in three browser tabs and they react to each other live.


HOW TO RUN IT (important)
-------------------------
Double-click START.bat.

It starts a small local server and opens all three sites at:

  http://localhost:8000/index.html
  http://localhost:8000/cashier.html
  http://localhost:8000/admin.html

Why a server? The three sites only share data when they come from the same
address. If you just double-click the .html files, some browsers keep each
file's data separate and the live sync will not work. START.bat removes that
risk during your demo.

If Python is missing, install it from python.org, or open the files directly
and accept that the auto-refresh between tabs may not work.


WHAT EACH SITE DOES
-------------------
SITE 1 — SHOP (index.html)
  - Browse products and bundles, search, choose sizes
  - Add to cart, pay with GCash/Maya (reference number + receipt screenshot)
    or choose "Pay at counter (cash)"
  - Choose a pickup time slot, sign in with student ID + 4-digit PIN
  - Track orders, see the pickup code + QR, print a receipt slip
  - Take the SUS usability survey

SITE 2 — CASHIER + POS (cashier.html)
  - Staff login (see accounts below)
  - POS tab (new): tap products, enter cash received, the change is computed,
    complete the sale, print a walk-in receipt. GCash/Maya sales ask for the
    reference number instead of cash.
  - Orders tab: verify GCash payments, confirm cash received, mark orders
    ready, type the pickup code to mark an order claimed.

SITE 3 — INVENTORY + REPORTS (admin.html)
  - Staff/manager login
  - Inventory: stock per size, prices, alert levels, +10 restock, add/remove
    products, shop announcement
  - Report: total sales, paid orders, POS counter sales, SUS score, average
    transaction times, top items, low stock, counter-time baseline,
    CSV export of every order (now includes a Channel column)
  - Activity: manager only — audit log and staff accounts


DEMO ACCOUNTS
-------------
  staff1 / 1234      staff
  staff2 / 1234      staff
  admin  / admin123  manager (also sees the Activity tab)

Students create their own account on the Shop site with any student ID and a
4-digit PIN.


HOW THE THREE SITES TALK TO EACH OTHER
--------------------------------------
All data lives in the browser's localStorage under the key "plmun_bc_v2".
Each site keeps a copy in memory, and every save() writes to localStorage.
The browser then fires a "storage" event in the other open tabs, which reload
the data and redraw. That is the whole "interaction" — no server code needed.

Try this in the demo:
  1. Place an order on the Shop site.
  2. The Cashier site's Orders tab shows it within a second (Pending).
  3. Verify it, mark it ready on the Cashier site.
  4. The student's My Orders tab now shows the pickup code.
  5. Make a POS sale on the Cashier site.
  6. The Admin site's stock and Report numbers change immediately.


WHAT IS NEW COMPARED TO THE ORIGINAL
------------------------------------
  - data.js     PAGE constant (which site is open) + POS state
  - store.js    POS actions (posAdd, posChg, posComplete, ...), reloadDb(),
                pruneCart() and the cross-tab storage listener; doLogout()
  - views.js    vPos() POS terminal, vPosRcp() walk-in receipt, per-site nav,
                POS tag and POS sales card in reports, Channel column in CSV
  - styles.css  site switcher + POS grid and cart styles
  - index.html  rebuilt with the site switcher; cashier.html and admin.html
                are new; START.bat is new


FILES
-----
  index.html    Site 1 — shop
  cashier.html  Site 2 — cashier + POS
  admin.html    Site 3 — inventory + reports
  START.bat     one-click launcher (local server + three tabs)
  data.js       seed products, accounts, survey text, shared state
  store.js      all rules and data changes (the "brain")
  views.js      all screens (HTML builders)
  app.js        boots the page
  styles.css    the look, including POS styles
  theme.js      dark/light mode
  PLMUN_LOGO.png, images/   artwork

Not copied from the original folder on purpose:
  - main.html   the old single-file version, one version behind (would confuse
                a demo)
  - MYAPI.txt   it contains real API keys and nothing in the app reads it.
                Keep it out of any submission and consider revoking the keys.


NOTES FOR YOUR DEFENSE
----------------------
  - GCash/Maya here is NOT an automatic payment gateway. The buyer pays in
    their own app, then the reference number and a receipt screenshot are
    recorded and a staff member verifies them. Say that plainly if asked.
  - The POS handles walk-in sales with cash and change, or an e-wallet
    reference. Those sales are saved with channel "POS" and status "Claimed",
    so they count in the sales report automatically.
  - Stock is deducted the moment a sale or order is made, and returned if an
    online order is rejected or cancelled.
