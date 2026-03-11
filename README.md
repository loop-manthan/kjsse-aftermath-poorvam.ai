<div align="center">

# 🎯 Poorvam.ai

### AI-Powered Hyperlocal Service Marketplace

*Connecting clients with nearby workers through intelligent matching, real-time tracking, and multilingual voice interfaces.*

**Built for the KJSSE AfterMath Hackathon 2026** | Team: Decryters

</div>

---

## What is Poorvam.ai?

**Poorvam.ai** is a full-stack hyperlocal service marketplace designed for India. It lets **clients** post jobs (plumbing, electrical, cleaning, etc.) and instantly get matched with **workers** in their area — powered by AI categorization, geospatial proximity matching, and a multilingual voice interface.

### The Problem

Finding reliable local workers is fragmented — people rely on word-of-mouth, WhatsApp groups, or expensive aggregator apps. Workers, especially in semi-urban and rural India, lack discoverability and a digital presence.

### Our Solution

- **AI-driven job creation**: Describe your problem in plain text; Poorvam.ai auto-categorizes it, enhances the description, and finds the right worker.
- **Proximity-first matching**: Haversine distance calculations ensure the closest available workers are matched first.
- **Voice-first UX**: Clients and workers can interact entirely via voice in Hindi, Gujarati, or Marathi — powered by Sarvam AI (STT/TTS) and LiveKit (WebRTC).
- **Bolna AI agent**: A conversational phone agent that can handle job dispatch via phone calls for users without smartphones.
- **End-to-end lifecycle**: Job creation → worker matching → acceptance → work tracking → payment → review — all in one platform.

---

## Features

### For Clients
- Register/login with geolocation + address autocomplete (Google Maps)
- Create jobs with natural-language description — AI auto-detects category & enhances text
- View nearby available workers on an interactive map
- Track active jobs in real-time (status updates, worker info)
- Mark jobs as paid (online/offline) and leave ratings

### For Workers
- Register with skill categories and location
- Toggle availability (`available` / `offline`)
- Browse and accept nearby jobs
- Progress through work states: accepted → in-progress → completed
- Track earnings and completed job history

### Platform
- JWT authentication with protected routes
- Geospatial matching (distance-aware worker discovery)
- Real-time notifications (DB-backed + Socket.IO-ready)
- Bilateral review & rating system with aggregation
- Payment tracking: online (Razorpay-ready) and offline confirmation flows
- Health/readiness/liveness endpoints for deployment monitoring

### Voice & AI
- Voice sessions via LiveKit room tokens + node agent
- Sarvam AI speech pipeline (STT + TTS) with multi-language support (`hi-IN`, `gu-IN`, `mr-IN`)
- Configurable LLM routing (Sarvam / Gemini / HuggingFace)
- Bolna AI phone agent integration — syncs pending jobs and handles dispatch via call

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js (ESM), Express, MongoDB + Mongoose, JWT, Socket.IO |
| **Frontend** | React 19, Vite, TypeScript, TailwindCSS + DaisyUI, Glassmorphism UI |
| **AI/ML** | Google Gemini (categorization), Sarvam AI (STT/TTS/chat), HuggingFace models |
| **Voice** | LiveKit (WebRTC rooms), Sarvam speech pipeline, Bolna conversational agent |
| **Maps** | Google Maps JS API + Places autocomplete |
| **Payments** | Razorpay (online), offline confirmation flow |
| **Testing** | Jest + Supertest |

---

## Project Structure

```
poorvam-ai/
├── backend/                          # Node.js + Express + MongoDB API server
│   ├── server.js                     # Express app entrypoint
│   ├── package.json
│   ├── jest.config.js
│   ├── public/
│   │   ├── simulator.html            # Voice simulator UI
│   │   └── voice-e2e-test.html       # Voice E2E test page
│   ├── scripts/
│   │   ├── quickTest.js              # Quick API smoke test
│   │   ├── seedCategories.js         # Seed service categories
│   │   ├── test_bolna.js             # Bolna agent diagnostic / sync
│   │   └── testAPI.js                # API endpoint tester
│   ├── src/
│   │   ├── controllers/
│   │   │   ├── auth.controller.js        # Register, login, profile
│   │   │   ├── category.controller.js    # Category CRUD + stats
│   │   │   ├── job.controller.js         # Job lifecycle (create → complete)
│   │   │   ├── matching.controller.js    # Proximity-based worker/job matching
│   │   │   ├── notification.controller.js# User notification feed
│   │   │   ├── payment.controller.js     # Payment order + verification
│   │   │   └── review.controller.js      # Rating & review submission
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js         # JWT verification guard
│   │   │   ├── errorHandler.middleware.js # Global error handler
│   │   │   └── validation.middleware.js   # Request validation
│   │   ├── models/
│   │   │   ├── Category.model.js     # Service categories & keywords
│   │   │   ├── Job.model.js          # Job schema with geolocation
│   │   │   ├── Notification.model.js # User notification records
│   │   │   ├── Review.model.js       # Bilateral reviews per job
│   │   │   ├── Transaction.model.js  # Payment transaction log
│   │   │   └── User.model.js         # User identity, auth, location, ratings
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── category.routes.js
│   │   │   ├── health.routes.js      # Health/ready/live probes
│   │   │   ├── job.routes.js
│   │   │   ├── matching.routes.js
│   │   │   ├── notification.routes.js
│   │   │   ├── payment.routes.js
│   │   │   ├── review.routes.js
│   │   │   ├── twilio.routes.js
│   │   │   └── voice.routes.js
│   │   ├── services/
│   │   │   ├── ai.service.js         # Gemini-based category detection & text enhancement
│   │   │   ├── bolna.service.js      # Bolna phone agent prompt sync
│   │   │   ├── livekit.service.js    # LiveKit room token generation
│   │   │   ├── llm.service.js        # Multi-provider LLM routing
│   │   │   ├── notification.service.js # Notification creation helper
│   │   │   ├── sarvam.service.js     # Sarvam AI STT/TTS integration
│   │   │   └── voiceAgent.service.js # Voice agent orchestration
│   │   ├── socket/
│   │   │   └── socket.js            # Socket.IO setup
│   │   ├── scripts/
│   │   │   └── seedMockData.js       # Database seeding script
│   │   └── utils/
│   │       ├── categoryExtractor.js  # Keyword-based category extraction
│   │       ├── distance.js           # Haversine distance calculator
│   │       └── jwt.js               # JWT sign/verify helpers
│   └── tests/
│       ├── 3.1.test.js               # LiveKit infrastructure tests
│       ├── 3.2.test.js               # Speech pipeline tests
│       └── 3.3.test.js               # STT → LLM integration tests
│
├── frontend/                         # React + Vite web application
│   ├── index.html                    # HTML entry (includes Google Maps script)
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── scripts/                      # Python utility scripts
│   │   ├── add_fixed_scores.py
│   │   ├── add_resume_files.py
│   │   ├── generate_teams.py
│   │   └── update_mockdata.py
│   └── src/
│       ├── main.jsx                  # React app bootstrap
│       ├── App.tsx                   # Root component with routing
│       ├── App.jsx                   # Alternate app entry
│       ├── App.css
│       ├── index.css                 # Tailwind base imports
│       ├── api/
│       │   ├── client.ts            # Axios instance with auth interceptor
│       │   └── services.ts          # API service wrappers (auth, jobs, matching, etc.)
│       ├── components/
│       │   ├── ErrorBoundary.tsx     # React error boundary
│       │   ├── ProtectedRoute.tsx    # Auth-gated route wrapper
│       │   ├── client/
│       │   │   ├── ActiveJobs.tsx    # Client's active job list
│       │   │   ├── CreateJob.tsx     # Job creation form with AI assist
│       │   │   └── WorkerMap.tsx     # Map showing nearby workers
│       │   ├── shared/
│       │   │   ├── AddressAutocomplete.tsx  # Google Places address input
│       │   │   ├── CategorySelector.tsx     # Service category picker
│       │   │   ├── GlassButton.tsx          # Glassmorphism button
│       │   │   ├── GlassCard.tsx            # Glassmorphism card
│       │   │   ├── GlassInput.tsx           # Glassmorphism input field
│       │   │   ├── NotificationBadge.tsx    # Unread notification indicator
│       │   │   ├── PaymentModal.tsx         # Payment flow modal
│       │   │   ├── RatingSystem.tsx         # Star rating component
│       │   │   └── index.ts                # Barrel exports
│       │   ├── ui/
│       │   │   ├── animated-web3-landing-page.tsx  # Animated landing hero
│       │   │   ├── card.tsx
│       │   │   ├── context-menu.tsx
│       │   │   └── sign-in.tsx
│       │   └── worker/
│       │       ├── AvailableJobs.tsx  # Nearby available jobs for workers
│       │       └── MyJobs.tsx         # Worker's accepted/active jobs
│       ├── context/
│       │   ├── AuthContext.tsx       # Authentication state (user, token, login/logout)
│       │   └── JobContext.tsx        # Job state management
│       ├── lib/
│       │   └── utils.ts             # Utility functions (cn helper)
│       ├── pages/
│       │   ├── LandingPage.tsx      # Public landing page
│       │   ├── Login.tsx            # Login form
│       │   ├── Register.tsx         # Registration with role selection
│       │   ├── ClientDashboard.tsx  # Client main dashboard
│       │   └── WorkerDashboard.tsx  # Worker main dashboard
│       ├── styles/
│       │   └── glassmorphism.css    # Custom glassmorphism styles
│       └── types/
│           ├── auth.ts              # Auth-related TypeScript types
│           ├── category.ts          # Category types
│           └── job.ts               # Job types
│
└── docs/                             # Implementation documentation
    ├── poorvam-ai-revised-master-plan-f89e4d.md
    ├── poorvam-ai-phases-summary-f89e4d.md
    ├── poorvam-ai-phase1-backend-f89e4d.md
    ├── poorvam-ai-phase2-frontend-detailed-f89e4d.md
    ├── poorvam-ai-phase3-voice-detailed-f89e4d.md
    ├── poorvam-ai-phase4-final-detailed-f89e4d.md
    ├── phase3_phases.md
    ├── 3.1_summary.md
    ├── 3.2_summary.md
    ├── Building Dual-Sided Voice Matching.md
    ├── frontend_prompts.md
    └── implementation_ngrok.md
```

---

## Getting Started

### Prerequisites

- **Node.js** v20+
- **npm** v9+
- **MongoDB** (Atlas cluster or local instance)
- **Git**

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/AfterMath_Decryters_Humanity.git
cd AfterMath_Decryters_Humanity
```

### 2. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in the `backend/` directory:

```env
# ── Core ──────────────────────────────────────
MONGO_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/poorvam
JWT_SECRET=your_jwt_secret
PORT=5000
FRONTEND_URL=http://localhost:5173

# ── AI Categorization (Gemini) ───────────────
GEMINI_API_KEY=your_gemini_api_key

# ── Voice Stack (LiveKit + Sarvam) ───────────
LIVEKIT_URL=wss://your-livekit-instance.livekit.cloud
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
SARVAM_API_KEY=your_sarvam_api_key

# ── LLM Routing ─────────────────────────────
LLM_PROVIDER=sarvam          # sarvam | gemini | huggingface
SARVAM_CHAT_MODEL=sarvam-m
HUGGING_FACE_API=
HF_LLM_MODEL=
GEMINI_MODEL=
LLM_TIMEOUT_MS=15000
VOICE_DEBUG_MODE=false

# ── Bolna Agent (optional) ───────────────────
BOLNA_KEY=
BOLNA_AGENT_ID=
```

Start the backend:

```bash
npm run dev        # Development (nodemon)
# or
npm start          # Production
```

Backend runs at **http://localhost:5000**

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `.env` file in the `frontend/` directory:

```env
VITE_API_URL=http://localhost:5000/api
```

Start the frontend:

```bash
npm run dev
```

Frontend runs at **http://localhost:5173**

### 4. Seed the Database (Optional)

```bash
cd backend
npm run seed:categories   # Seed service categories
npm run seed              # Seed mock users and jobs
```

---

## API Reference

Base URL: `http://localhost:5000/api`

| Module | Endpoints |
|--------|-----------|
| **Auth** | `POST /auth/register` · `POST /auth/login` · `GET /auth/me` · `PATCH /auth/profile` · `PATCH /auth/availability` |
| **Jobs** | `POST /jobs/create` · `GET /jobs/available` · `GET /jobs/my-jobs` · `GET /jobs/:id` · `POST /jobs/:id/apply` · `PATCH /jobs/:id/accept` · `PATCH /jobs/:id/start` · `PATCH /jobs/:id/complete` · `PATCH /jobs/:id/mark-paid` · `PATCH /jobs/:id/cancel` |
| **Matching** | `POST /matching/find-worker` · `GET /matching/nearby-jobs/:workerId` · `GET /matching/nearby-workers` |
| **Payments** | `POST /payments/create-order` · `POST /payments/verify` · `POST /payments/offline-confirm` · `GET /payments/history/:userId` |
| **Reviews** | `POST /reviews/submit` · `GET /reviews/user/:userId` |
| **Categories** | `GET /categories` · `GET /categories/stats` · `POST /categories/create` |
| **Notifications** | `GET /notifications` · `GET /notifications/unread-count` · `PATCH /notifications/:id/read` · `DELETE /notifications/:id` |
| **Voice** | `POST /voice/sessions/initiate` · `DELETE /voice/sessions/:roomName` · `GET /voice/sessions/:roomName/results` · `GET /voice/status` |
| **Health** | `GET /health` · `GET /health/detailed` · `GET /health/ready` · `GET /health/live` |

---

## Data Models

| Model | Description |
|-------|-------------|
| **User** | Identity, auth credentials, geolocation, skill categories, availability status, ratings, earnings |
| **Job** | Client/worker refs, category, pricing, payment method, status lifecycle, geolocation |
| **Category** | Service taxonomy with keyword metadata for AI matching |
| **Notification** | User-scoped alert feed (job updates, assignments, etc.) |
| **Review** | Bilateral rating & comment records per completed job |
| **Transaction** | Payment records tracking online/offline flows |

---

## Scripts Reference

```bash
# ── Backend ──────────────────────────────────
npm run dev              # Start with nodemon (hot-reload)
npm start                # Start production server
npm test                 # Run all tests
npm run test:voice       # Run LiveKit voice tests (3.1)
npm run test:speech      # Run speech pipeline tests (3.2)
npm run seed             # Seed mock data
npm run seed:categories  # Seed service categories

# ── Frontend ─────────────────────────────────
npm run dev              # Start Vite dev server
npm run build            # Production build
npm run preview          # Preview production build
npm run lint             # ESLint check

# ── Utility Scripts ──────────────────────────
node backend/scripts/quickTest.js       # API smoke test
node backend/scripts/testAPI.js         # endpoint tester
node backend/scripts/test_bolna.js      # Bolna dry-run diagnostic
node backend/scripts/test_bolna.js --sync  # Sync jobs to Bolna agent
```

---

## Testing

```bash
cd backend
npm test                 # Runs all test suites
npm run test:voice       # 3.1 — LiveKit infrastructure layer
npm run test:speech      # 3.2 — Sarvam speech pipeline
```

Test suites use Jest + Supertest and cover voice infrastructure, speech-to-text/text-to-speech pipelines, and STT→LLM integration flows.

---

## Architecture Overview

```
┌─────────────┐       ┌──────────────────────────┐       ┌─────────────┐
│   React UI  │◄─────►│   Express API Server     │◄─────►│  MongoDB    │
│  (Vite/TS)  │  HTTP │                          │       │  (Atlas)    │
│             │       │  ┌────────┐ ┌──────────┐ │       └─────────────┘
│  Tailwind   │       │  │ Gemini │ │ Sarvam   │ │
│  DaisyUI    │       │  │  (AI)  │ │(STT/TTS) │ │
│  Glass UI   │       │  └────────┘ └──────────┘ │
└──────┬──────┘       │  ┌────────┐ ┌──────────┐ │
       │              │  │LiveKit │ │  Bolna   │ │
       │   WebSocket  │  │(Voice) │ │ (Phone)  │ │
       └──────────────│  └────────┘ └──────────┘ │
                      └──────────────────────────┘
```

---

## Team

**Decryters** — KJSSE AfterMath Hackathon 2026

---

## License

This project was built as a hackathon submission. No license file is currently included. Add a `LICENSE` before open distribution.
