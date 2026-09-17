# ⚡ InvoiceApp — MERN SaaS MVP

Invoice generator and tracker for freelancers and small businesses.

---

## 🗂 Project Structure

```
invoiceapp/
├── server/         ← Express + MongoDB API
│   ├── config/     ← Database connection
│   ├── controllers/← Route handlers (added Milestone 2+)
│   ├── middleware/ ← Auth middleware (added Milestone 2)
│   ├── models/     ← Mongoose schemas (added Milestone 2+)
│   ├── routes/     ← API routes (added Milestone 2+)
│   └── server.js   ← Entry point
│
└── client/         ← React + Vite frontend
    └── src/
        ├── context/    ← Auth context
        ├── pages/      ← Page components
        ├── components/ ← Shared UI components
        └── utils/      ← API client (axios)
```

---

## 🚀 Setup

### 1. MongoDB Atlas
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas) and create a free cluster
2. Create a database user and whitelist your IP
3. Copy your connection string

### 2. Server
```bash
cd server
npm install
cp .env.example .env
# Edit .env — paste your MONGO_URI and set a JWT_SECRET
npm run dev
```
Server runs on whatever `PORT` is set to in `.env` (defaults to 5002 if unset — see `server.js`). If you change it, update `client/vite.config.js`'s `/api` proxy `target` to match.

### 3. Client
```bash
cd client
npm install
npm run dev
```
Client runs on `http://localhost:5173`

---

## 🌐 Deployment

| Service  | What it hosts |
|----------|--------------|
| [Netlify](https://netlify.com) | React client + Express API (as a Netlify Function) — one site |
| [MongoDB Atlas](https://mongodb.com/atlas) | Database (free 512MB) |

Client and API are deployed together as a single Netlify site — see
[`netlify.toml`](netlify.toml). The API runs at `server/netlify/functions/api.mjs`
(the same Express app as `server/app.js`, wrapped for a Netlify Function) and
is reachable at `/api/*` on the site's own domain, so the client's default
same-origin `/api` base URL (see `client/src/utils/api.js`) just works — no
separate backend URL to configure.

**Deploy to Netlify:**
- New site from Git → connect your repo (build settings come from `netlify.toml`, no manual configuration needed)
- Add these environment variables in Site configuration → Environment variables:
  - `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (this site's own Netlify URL, e.g. `https://your-site.netlify.app`, or a custom domain once attached)
  - `ADMIN_EMAILS`
  - `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` (optional — leave unset to keep "Send to Client" disabled)
  - `PAYSTACK_SECRET_KEY` (optional — leave unset to keep the Paystack webhook disabled)
- Leave `VITE_API_URL` unset (see `client/.env.production`) unless you ever split the client and API back across two separate origins.

For **local development**, `client/` and `server/` still run as two separate
processes (`npm run dev` in each) exactly as described above — Netlify
Functions only come into play in the deployed build. To test the Netlify
build/function locally before pushing, use the [Netlify CLI](https://docs.netlify.com/cli/get-started/)'s `netlify dev` from the repo root.

---

## 📍 Milestones

- [x] M1 — Project setup, Express server, MongoDB, React shell
- [ ] M2 — Authentication (register, login, JWT)
- [ ] M3 — Client management
- [ ] M4 — Invoice creation with line items
- [ ] M5 — PDF export
- [ ] M6 — Invoice tracking & dashboard stats
- [ ] M7 — Polish & production deploy
