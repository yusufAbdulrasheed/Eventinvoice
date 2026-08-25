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
| [Render](https://render.com) | Express server (free tier) |
| [Vercel](https://vercel.com) | React client (free tier) |
| [MongoDB Atlas](https://mongodb.com/atlas) | Database (free 512MB) |

**Deploy server to Render:**
- New Web Service → connect your repo → Root Dir: `server`
- Build: `npm install` | Start: `npm start`
- Add environment variables from `.env`

**Deploy client to Vercel:**
- Import repo → Root Dir: `client`
- Add env var: `VITE_API_URL=https://your-render-url.onrender.com`

---

## 📍 Milestones

- [x] M1 — Project setup, Express server, MongoDB, React shell
- [ ] M2 — Authentication (register, login, JWT)
- [ ] M3 — Client management
- [ ] M4 — Invoice creation with line items
- [ ] M5 — PDF export
- [ ] M6 — Invoice tracking & dashboard stats
- [ ] M7 — Polish & production deploy
