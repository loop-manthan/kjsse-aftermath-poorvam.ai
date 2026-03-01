# AfterMath Decryters Humanity (Poorvam.ai / BolKaam)

Production-focused marketplace for local services in India, connecting **clients** and **workers** with:
- AI-assisted job creation and categorization
- Worker self-assignment + proximity discovery
- Job lifecycle tracking
- Payment and earnings tracking
- Reviews and notifications
- Voice/telephony integrations (LiveKit/Sarvam/LLM, Bolna sync)

---

## Monorepo Structure

```text
.
├── backend/                      # Node.js + Express + MongoDB API
│   ├── server.js                # API entrypoint
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── socket/
│   │   └── utils/
│   ├── tests/                   # Voice-focused integration tests (3.1/3.2/3.3)
│   └── scripts/                 # Seed/test scripts incl. test_bolna.js
├── frontend/                     # React + Vite web app
│   └── src/
│       ├── pages/               # Landing/Login/Register + dashboards
│       ├── components/          # Client/Worker/shared UI blocks
│       ├── context/             # Auth + Job state
│       ├── api/                 # Axios client + service wrappers
│       └── types/
└── docs/                         # Detailed implementation docs and phase summaries
```

---

## Core Features

### Client Features
- Register/login with geolocation + address
- Create jobs with description, budget, and location
- AI category detection + enhanced description on job creation
- Live overview of active/completed jobs
- View nearby workers on map
- Mark completed jobs as paid

### Worker Features
- Register/login with category skills
- Toggle availability (`available`/`offline`)
- Browse nearby jobs
- Accept jobs and progress through work states
- Track completed jobs and earnings

### Platform Features
- JWT auth
- Geospatial matching (distance-aware)
- Notifications (DB + socket-ready architecture)
- Reviews + rating aggregation
- Payment transaction tracking (online/offline flows)
- Health/readiness/liveness endpoints

### Voice & AI Features
- Voice sessions via LiveKit room token + node agent startup
- Speech pipeline integrations (Sarvam STT/TTS + LLM service routing)
- Multi-language voice configs (hi-IN / gu-IN / mr-IN)
- Bolna integration:
  - frontend webhook trigger (Make.com)
  - backend prompt sync of all pending jobs to Bolna agent

---

## Tech Stack

### Backend
- Node.js (ESM)
- Express
- MongoDB + Mongoose
- JWT (`jsonwebtoken`)
- Socket.IO
- Voice stack: LiveKit + Sarvam + configurable LLM provider

### Frontend
- React 19 + Vite
- TypeScript (mixed TS/JS React files)
- TailwindCSS + glassmorphism UI
- Axios + React Hot Toast
- Google Maps JS API + Places autocomplete

---

## Quick Start (Local Development)

## 1) Backend

```bash
cd backend
npm install
npm run dev
```

Backend runs on: `http://localhost:5000`

## 2) Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on Vite default port (commonly `http://localhost:5173`).

---

## Environment Variables

Create `backend/.env` with at least:

```env
# Core
MONGO_URI=
JWT_SECRET=
PORT=5000
FRONTEND_URL=http://localhost:5173

# AI categorization/enhancement (used in ai.service.js)
GEMINI_API_KEY=

# Voice stack (required for /api/voice endpoints)
LIVEKIT_URL=
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=
SARVAM_API_KEY=

# LLM routing for voice pipeline
LLM_PROVIDER=sarvam
SARVAM_CHAT_MODEL=sarvam-m
HUGGING_FACE_API=
HF_LLM_MODEL=
GEMINI_MODEL=
LLM_TIMEOUT_MS=15000
VOICE_DEBUG_MODE=

# Bolna sync (optional but used if set)
BOLNA_KEY=
BOLNA_AGENT_ID=
```

Optional frontend env (`frontend/.env`):

```env
VITE_API_URL=http://localhost:5000/api
```

> Note: Google Maps key is currently embedded in `frontend/index.html`. Move it to env-driven config before production hardening.

---

## API Overview

Base URL: `http://localhost:5000/api`

### Auth
- `POST /auth/register`
- `POST /auth/login`
- `GET /auth/me`
- `PATCH /auth/profile`
- `PATCH /auth/availability`

### Jobs
- `POST /jobs/create`
- `GET /jobs/available`
- `GET /jobs/my-jobs`
- `GET /jobs/:jobId`
- `POST /jobs/:jobId/apply`
- `PATCH /jobs/:jobId/accept`
- `PATCH /jobs/:jobId/start`
- `PATCH /jobs/:jobId/complete`
- `PATCH /jobs/:jobId/mark-paid`
- `PATCH /jobs/:jobId/cancel`

### Matching
- `POST /matching/find-worker`
- `GET /matching/nearby-jobs/:workerId`
- `GET /matching/nearby-workers`

### Payments
- `POST /payments/create-order`
- `POST /payments/verify`
- `POST /payments/offline-confirm`
- `GET /payments/history/:userId`

### Reviews
- `POST /reviews/submit`
- `GET /reviews/user/:userId`

### Categories
- `GET /categories`
- `GET /categories/stats`
- `POST /categories/create`

### Notifications
- `GET /notifications`
- `GET /notifications/unread-count`
- `PATCH /notifications/:id/read`
- `DELETE /notifications/:id`

### Voice
- `POST /voice/sessions/initiate`
- `DELETE /voice/sessions/:roomName`
- `GET /voice/sessions/:roomName/results`
- `GET /voice/status`

### Health (non-`/api` prefix)
- `GET /health`
- `GET /health/detailed`
- `GET /health/ready`
- `GET /health/live`

---

## Data Models (High-Level)

- `User`: identity, auth, location, categories, status, ratings, experience, earnings
- `Job`: client/worker refs, category, pricing/payment, status lifecycle, geolocation
- `Category`: service taxonomy and keyword metadata
- `Notification`: user-scoped alert feed
- `Review`: bilateral rating/comment records per job
- `Transaction`: payment records (online/offline)

---

## Scripts

### Backend npm scripts

```bash
npm run dev
npm start
npm test
npm run test:voice
npm run test:speech
npm run seed
npm run seed:categories
```

### Utility scripts

```bash
# API smoke checks
node backend/scripts/quickTest.js
node backend/scripts/testAPI.js

# Bolna diagnostic (safe dry-run)
node backend/scripts/test_bolna.js

# Execute live Bolna sync (writes prompt to Bolna)
node backend/scripts/test_bolna.js --sync
```

---

## Testing

- Backend includes dedicated voice integration test suites:
  - `backend/tests/3.1.test.js` (LiveKit infra layer)
  - `backend/tests/3.2.test.js` (speech pipeline)
  - `backend/tests/3.3.test.js` (STT→LLM debug pipeline)
- Run all backend tests:

```bash
cd backend
npm test
```

---

## Notes for Contributors

- Repository contains historical planning/summaries in root and `docs/`.
- Existing `backend/README.md` and `frontend/README.md` are legacy/generic; this root README is the current source-of-truth for project setup.
- Keep secrets out of commits. Rotate keys if they were ever exposed.

---

## License

No explicit license file is currently present in the repository. Add a `LICENSE` before open distribution if required.
