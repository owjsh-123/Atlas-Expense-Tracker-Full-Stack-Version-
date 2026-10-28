# Atlas — Full-Stack Personal Expense Tracker

Original application developed for Omar Eshatti. © 2026 Omar Eshatti. All rights reserved.

## Features
- Sign up / sign in and isolated user accounts
- Server-side persistent SQLite storage
- Passwords protected with salted scrypt hashes; session cookies are HttpOnly and SameSite=Lax
- Dashboard, charts, income and expense entries, monthly budgets
- Search, CSV import/export, delete, and migration of browser-only Atlas v1 data
- Responsive frontend with no third-party runtime dependencies

## Run
Install Node.js **22.13+**, then:

```bash
npm start
```

Open http://localhost:5173. Register an account. Local SQLite database is created in `data/atlas.sqlite`. The `data/` folder is gitignored. Run `npm test` for tests. No npm install needed.

## Deployment notes
This is a working local full-stack application, **not yet production hardened**. For public internet deployment add HTTPS, rate limiting for authentication, CSRF protections, secure hosting/backups and production monitoring. A static GitHub Pages site **cannot** run this Node.js API or persist its SQLite database. Use GitHub for source hosting, and a Node-capable host for running the backend. Do not upload the `data/` folder or financial records.

## Ownership
All code in this repository belongs to this independently developed Atlas implementation. No source code from the referenced TrackMyExpenses repository was incorporated. All rights reserved; no open-source license is granted.
