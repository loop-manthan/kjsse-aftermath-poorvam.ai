# PROJECT_DOCS.md — AeroHacks

> Auto-generated comprehensive project documentation  
> Last Updated: February 21, 2026

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure](#3-folder-structure)
4. [Completed Features](#4-completed-features)
5. [Missing Features](#5-missing-features)
6. [Risks / Issues](#6-risks--issues)
7. [Completion Status](#7-completion-status)
8. [API Documentation](#8-api-documentation)
9. [Setup Instructions](#9-setup-instructions)
10. [TODO Roadmap](#10-todo-roadmap)

---

## 1. Project Overview

| Field | Detail |
|---|---|
| **Project Name** | AeroHacks |
| **Version** | v2.0 (Frontend Complete, Backend Planned) |
| **Type** | Web Application — Hackathon Management SaaS / MVP |
| **Purpose** | Digitize the end-to-end lifecycle of college hackathon events including registration, verification, QR-based entry/meal tracking, evaluation, and results publication |

### Problem It Solves

Traditional college hackathons suffer from:

- Manual, error-prone registration and verification processes
- QR code / food coupon fraud and duplicate scanning
- Inconsistent evaluation criteria across judges
- Delayed result publication with no transparency
- No centralized dashboard for hosts/organizers
- Poor mobile experience for on-ground operations
- Data loss and lack of tracking for entries and meals

### Core Value Proposition

- **Two-Layer Authentication**: Hackathon-specific access codes (Layer 1) + Role-based entry codes (Layer 2)
- **Self-Service Hosting**: Organizers create hackathons and instantly generate distributable codes
- **QR-Based Operations**: Automated gate entry and meal tracking with fraud prevention
- **Standardized Evaluation**: Rubric-based judging with 4-criteria scoring (Innovation, Feasibility, Technical, Presentation)
- **Result Workflow**: Three-state pipeline — `EVALUATION_PENDING` → `SENT_TO_ADMIN` → `RESULTS_PUBLISHED`
- **Live Leaderboard**: Real-time ranked teams with role-based visibility controls
- **Multi-Hackathon Support**: Isolated data per event instance
- **Fully Responsive**: Mobile-first design (320px to 4K displays)

---

## 2. Tech Stack

### Frontend

| Category | Technology | Version |
|---|---|---|
| **Framework** | React | 19.2.0 |
| **Build Tool** | Vite | 7.3.1 |
| **Routing** | React Router DOM | 7.13.0 |
| **Styling** | Tailwind CSS | 4.2.0 |
| **Component Library** | DaisyUI | 5.5.18 |
| **Animations** | Framer Motion | 12.34.2 |
| **Icons** | Lucide React | 0.574.0 |
| **Notifications** | React Hot Toast | 2.6.0 |
| **State Management** | React Context API (4 providers) | Built-in |
| **Persistence** | localStorage | Built-in |
| **Linting** | ESLint (flat config) | 9.39.1 |

### Backend (Planned — Documentation Complete, Code NOT Implemented)

| Category | Technology | Notes |
|---|---|---|
| **Runtime** | Node.js 20+ | Planned |
| **Framework** | Express 4.21+ | Planned |
| **Database** | MongoDB Atlas (Mongoose 8.0+) | Planned |
| **Authentication** | JWT (Access + Refresh tokens), bcryptjs | Planned |
| **File Storage** | Cloudinary + Multer | Planned |
| **Real-time** | Socket.io | Planned |
| **Email** | SendGrid | Planned |
| **Validation** | Joi | Planned |
| **Security** | Helmet, CORS, express-rate-limit | Planned |
| **Logging** | Morgan, Winston | Planned |

### Database

| Field | Detail |
|---|---|
| **Type** | NoSQL (MongoDB) — Planned |
| **ORM** | Mongoose 8.0+ — Planned |
| **Current State** | Mock data in `localStorage`; no real database |
| **Schema Docs** | Fully documented in `docs_of_loc/database-schemas.md` (Hackathons, Users, Teams, EntryLogs, Scores, RefreshTokens) |

### AI Integrations

| Integration | Status |
|---|---|
| OpenAI | ❌ Not implemented (mentioned in docs as P2 for AI PPT evaluation) |
| Face Matching (face-api.js) | ❌ Not implemented (documented as P1 feature) |
| HuggingFace | ❌ Not used |
| Replicate | ❌ Not used |

### Deployment Readiness

| Platform | Status |
|---|---|
| **Vercel** | ⚠️ Partially ready — Vite config present, no `vercel.json` |
| **Docker** | ❌ No Dockerfile |
| **Render / Railway** | ❌ No backend to deploy |
| **GitHub Actions / CI/CD** | ❌ Not configured |
| **Environment Files** | ❌ No `.env` or `.env.example` present in root; backend `.env.example` referenced in docs but backend folder only contains `README.md` |

---

## 3. Folder Structure

```
aerohacks-private/
├── index.html                          # Vite entry HTML
├── package.json                        # Frontend dependencies & scripts
├── vite.config.js                      # Vite + React + Tailwind plugin config
├── tailwind.config.js                  # Tailwind CSS + DaisyUI themes
├── eslint.config.js                    # ESLint flat config (React Hooks, Refresh)
├── README.md                           # Default Vite template readme
├── summary.md                          # Comprehensive project master summary
├── plan-hackathonMvpWireframe.prompt.md # Original MVP planning prompt
│
├── src/                                # ── FRONTEND SOURCE ──
│   ├── main.jsx                        # React root with 4 Context Providers
│   ├── App.jsx                         # BrowserRouter + all routes
│   ├── App.css                         # Tailwind import
│   ├── index.css                       # Global styles, bandwidth-light mode, scrollbar, range slider
│   │
│   ├── components/
│   │   ├── features/                   # Domain-specific components
│   │   │   ├── CodeGenerator.jsx       # Displays generated codes after hackathon creation
│   │   │   ├── EntryLogTable.jsx       # Gate/meal entry log table
│   │   │   ├── HackathonSetupForm.jsx  # Form to create new hackathon (event name, date, venue, etc.)
│   │   │   ├── QRScanner.jsx           # Simulated QR scanner with mock camera UI
│   │   │   └── TeamRegistrationForm.jsx # Full registration with member details, Unstop import, verifications
│   │   ├── layout/                     # Structural components
│   │   │   ├── Layout.jsx              # App shell with Sidebar + Navbar + toast config
│   │   │   ├── Navbar.jsx              # Top nav with role-aware links + bandwidth toggle
│   │   │   ├── ProtectedRoute.jsx      # Two-layer auth guard (Layer 1: hackathon, Layer 2: role)
│   │   │   └── Sidebar.jsx             # Left sidebar with role-specific nav links
│   │   └── ui/                         # Reusable UI primitives
│   │       ├── BandwidthToggle.jsx     # Normal / Light mode toggle
│   │       ├── Button.jsx              # Variant + size button component
│   │       ├── CodeInput.jsx           # Styled code input with prefix
│   │       ├── DemoCodesHelper.jsx     # Expandable demo code display for testing
│   │       ├── QRDisplay.jsx           # QR code display + download after registration
│   │       ├── ShareLink.jsx           # QR code image + shareable link + copy/download
│   │       └── StatsCard.jsx           # Dashboard stat card with trend indicator
│   │
│   ├── context/                        # React Context state providers
│   │   ├── AuthContext.jsx             # Role + user state (guest/participant/admin/judge)
│   │   ├── HackathonContext.jsx        # Hackathon CRUD, code verification, localStorage persistence
│   │   ├── TeamContext.jsx             # Teams, scoring, result workflow states
│   │   └── ThemeContext.jsx            # Bandwidth-light mode toggle
│   │
│   ├── data/                           # Mock / seed data
│   │   ├── mockData.js                 # 25 mock teams + 50+ mock entry logs (861 lines)
│   │   └── mockHackathons.js           # 2 pre-seeded hackathon objects with full codes
│   │
│   ├── pages/                          # Route-level page components (11 pages)
│   │   ├── Landing.jsx                 # Hackathon code entry + host button (animated with Framer Motion)
│   │   ├── HostHackathon.jsx           # Create hackathon → generate codes flow
│   │   ├── RoleSelection.jsx           # Choose Participant/Admin/Judge after hackathon verification
│   │   ├── RoleAuth.jsx                # Enter role-specific code (Layer 2 auth)
│   │   ├── ParticipantDashboard.jsx    # Team registration form + QR code + results display
│   │   ├── ParticipantProfile.jsx      # Read-only profile view of team details
│   │   ├── AdminDashboard.jsx          # Stats cards, QR scanner, entry logs, result publishing
│   │   ├── AdminEntries.jsx            # Full entry log table with search, filter, pagination, CSV export
│   │   ├── AdminSubmissions.jsx        # Team submissions grid with GitHub/PPT links, search, filter, CSV export
│   │   ├── JudgeDashboard.jsx          # Team selector, rubric sliders, score submission, send-to-admin
│   │   └── Leaderboard.jsx            # Ranked teams with role-based access control, expandable scores
│   │
│   └── utils/                          # Utility functions
│       ├── codeGenerator.js            # Generate hackathon codes, admin/judge/participant codes, QR URLs, share links
│       ├── helpers.js                  # QR URL generator, score calculator, timestamp formatter
│       └── validators.js              # Regex validators for all code formats + role identification
│
├── backend/                            # ── BACKEND (Stub Only) ──
│   └── README.md                       # Backend tech stack, setup instructions, planned directory structure
│
├── docs/                               # ── PROJECT DOCUMENTATION ──
│   ├── finalday.md                     # Technical blueprint — MVP matrix, npm packages, MERN architecture
│   ├── landing.md                      # Landing page implementation docs
│   ├── navbar.md                       # Navbar implementation docs
│   └── sidebar.md                      # Sidebar implementation docs
│
└── docs_of_loc/                        # ── DETAILED BACKEND SPECS ──
    ├── backend-implementation-guide.md # 3,347 lines — Full backend architecture, API specs, deployment plan
    ├── database-schemas.md             # 1,373 lines — Complete MongoDB schemas with indexes, sample docs
    └── plan-hackathonMvpWireframe.prompt.md # Original wireframe planning document
```

### Folder Responsibilities

| Folder | Purpose |
|---|---|
| `src/components/features/` | Complex domain-specific components (forms, scanners, tables, code generators) |
| `src/components/layout/` | Structural shell — layout, navbar, sidebar, route guards |
| `src/components/ui/` | Small, reusable UI primitives (buttons, input fields, stat cards, toggles) |
| `src/context/` | Global state management via React Context API (Auth, Hackathon, Team, Theme) |
| `src/data/` | Mock data for demo/testing — realistic hackathon data with 25 teams and 50+ entry logs |
| `src/pages/` | Route-level page components — one file per route/view |
| `src/utils/` | Pure utility functions — code generation, validation, formatting |
| `backend/` | Reserved directory for backend code; currently only contains README with planned structure |
| `docs/` | Project-specific planning and implementation documentation |
| `docs_of_loc/` | Comprehensive backend implementation guide and database schemas (4,700+ lines of specs) |

---

## 4. Completed Features

### Core Infrastructure
- ✅ React 19.2.0 + Vite 7.3.1 project setup
- ✅ Tailwind CSS 4.2.0 + DaisyUI glassmorphism design system
- ✅ React Router DOM 7.13.0 with nested route structure
- ✅ Context API state management (4 context providers: Auth, Hackathon, Team, Theme)
- ✅ localStorage persistence for hackathons, teams, users, and result status
- ✅ ESLint flat config with React Hooks and React Refresh rules

### Two-Layer Authentication System
- ✅ **Layer 1** — Hackathon code verification (format: `AERO-2026-HCXXXXXX`)
- ✅ **Layer 2** — Role-specific code verification (`P-XXXXXXXX`, `A-XXXXXXXX`, `J-XXXXXXXX`)
- ✅ Protected route component enforcing both layers with role checks
- ✅ Code format validation with regex (validators.js)
- ✅ Persistent auth state across page refreshes via localStorage

### Host Hackathon Flow
- ✅ Hackathon creation form (event name, date, venue, max teams, problem statements, host email)
- ✅ Auto-generation of hackathon code, admin code, judge code, and N participant codes
- ✅ QR code generation via external API (`api.qrserver.com`)
- ✅ Shareable link generation
- ✅ Download all codes as a formatted text file
- ✅ Copy-to-clipboard for individual codes
- ✅ Multiple hackathon support (independent instances)

### Participant Features
- ✅ Team registration form with 2-4 members
- ✅ Per-member fields: name, email, mobile, college, Aadhaar, resume
- ✅ Simulated mobile OTP verification per member
- ✅ Simulated Aadhaar verification per member (mandatory)
- ✅ Simulated resume upload per member
- ✅ Simulated PPT upload for the team
- ✅ GitHub repository URL input (required)
- ✅ Import from Unstop integration (simulated with pre-filled data)
- ✅ Form validation with comprehensive error messages
- ✅ QR code generation and display after successful registration
- ✅ QR code download and data copy functionality
- ✅ Participant profile page with all team details and verification status
- ✅ Results display with score breakdown (visible after publication)
- ✅ Rank badge display (1st, 2nd, 3rd place with icons)

### Admin Features
- ✅ Admin dashboard with 4 stats cards (participants, teams, meals, gate entries)
- ✅ Simulated QR scanner with mock camera UI, success/failure states
- ✅ Entry log recording from QR scans (gate, breakfast, lunch, dinner)
- ✅ Activity summary with check-in rate and meal participation stats
- ✅ Latest activity feed with entry type and timestamps
- ✅ Full entry log table with columns: student, email, type, time, status
- ✅ Entry logs page with search, filter (by type), pagination (15 per page)
- ✅ CSV export for entry logs
- ✅ Team submissions page with search, filter (all/submitted/shortlisted/pending)
- ✅ Submission cards showing team members, scores, GitHub/PPT links
- ✅ CSV export for submissions
- ✅ Publish results button (enabled when judge sends results)

### Judge Features
- ✅ Judge dashboard with evaluation progress stats (total/evaluated/pending)
- ✅ Team selection dropdown with all teams, showing score or "Pending" status
- ✅ Team details panel (name, problem statement, members, GitHub, PPT links)
- ✅ 4-criteria rubric sliders: Innovation, Feasibility, Technical, Presentation (0-10 each)
- ✅ Real-time total score display with progress bar (out of 40)
- ✅ Score submission per team
- ✅ Reset scores to default
- ✅ "Send to Admin" action (enabled when all teams evaluated)

### Result Workflow
- ✅ Three-state result pipeline: `EVALUATION_PENDING` → `SENT_TO_ADMIN` → `RESULTS_PUBLISHED`
- ✅ Judge sends evaluation results to admin
- ✅ Admin publishes results to all participants
- ✅ Status indicators on dashboards for each state

### Leaderboard
- ✅ Live ranked list sorted by total score (descending)
- ✅ Top 3 teams with differentiated gold/silver/bronze styling
- ✅ Expandable score breakdown per team (4 criteria)
- ✅ Stats cards: top score, total teams, average score
- ✅ Role-based access control:
  - Judges: always see leaderboard
  - Admins: see after evaluation sent
  - Participants: see only after results published
  - Guests: restricted with lock message

### UI / UX
- ✅ Dark glassmorphism design theme (backdrop-blur, subtle borders)
- ✅ Bandwidth-Light Mode (CSS variable toggle, hides images/video, terminal aesthetic)
- ✅ Animated landing page with floating geometric shapes (Framer Motion)
- ✅ Responsive design: mobile-first (320px to desktop)
- ✅ Toast notifications for all user actions
- ✅ Loading states and spinners for async operations
- ✅ Collapsible sidebar with mobile overlay
- ✅ Custom scrollbar styling
- ✅ Custom range slider styling
- ✅ Demo codes helper component for quick testing

---

## 5. Missing Features

### Critical (Backend Not Implemented)
- ❌ **No backend server** — The `backend/` directory only contains a README; no server code, routes, controllers, or models exist
- ❌ **No real database** — All data uses localStorage and in-memory mock data; no MongoDB connection
- ❌ **No real authentication** — JWT, bcrypt, and server-side auth are not implemented; auth is client-side only via Context
- ❌ **No REST API** — No Express routes, controllers, or middleware exist
- ❌ **No real file upload** — Resume, PPT, and ID uploads are simulated with `setTimeout`; no Cloudinary integration
- ❌ **No real QR scanning** — QR scanner is fully mocked; uses `Math.random()` for scan results
- ❌ **No real-time communication** — No Socket.io; leaderboard updates require page refresh
- ❌ **No email service** — No SendGrid or Nodemailer; code distribution is manual
- ❌ **No server-side validation** — All validation happens client-side only

### High Priority
- ❌ **Frontend not connected to any backend API** — All data flows are local
- ❌ **No user registration / login** — Only code-based access; no accounts
- ❌ **No persistent multi-device sync** — Data is device-local (localStorage)
- ❌ **No `.env` or `.env.example` file** — No environment variable management
- ❌ **No error boundary** — React app has no error boundary component for crash recovery

### Medium Priority
- ❌ **No face matching / ID verification** — Documented as P1 but not implemented
- ❌ **No real OTP verification** — Mobile and Aadhaar verifications are simulated
- ❌ **No Unstop API integration** — Import is simulated with hardcoded data
- ❌ **No AI-powered PPT evaluation** — Documented as P2 but not implemented
- ❌ **No GitHub plagiarism checking** — Documented as P2 but not implemented
- ❌ **No data export from backend** — CSV exports are client-side from mock data

### Low Priority
- ❌ **No unit or integration tests** — No test files, no test framework configured
- ❌ **No CI/CD pipeline** — No GitHub Actions or deployment automation
- ❌ **No Dockerfile** — No container configuration
- ❌ **No `vercel.json`** — No deployment configuration for Vercel
- ❌ **No accessibility (a11y) audit** — Forms lack `aria` attributes; no keyboard navigation testing
- ❌ **No i18n / localization** — English only
- ❌ **No PWA support** — No service worker, no manifest

---

## 6. Risks / Issues

### Security Issues
- ⚠️ **Client-side only authentication** — Any user can access any dashboard by manually navigating to routes or editing localStorage
- ⚠️ **Sensitive codes stored in localStorage** — Admin, judge, and participant codes are stored in plaintext in the browser
- ⚠️ **No CSRF / XSS protection** — No server-side security headers (Helmet), no token rotation
- ⚠️ **Demo codes hardcoded in components** — `DemoCodesHelper.jsx` and `RoleAuth.jsx` display admin/judge codes directly in the UI
- ⚠️ **No rate limiting** — Code verification can be brute-forced client-side

### Architectural Risks
- ⚠️ **No backend means no production viability** — The app is a frontend-only prototype; it cannot be deployed for real events
- ⚠️ **localStorage data limit** — Browsers cap localStorage at ~5-10MB; large hackathons with many teams/logs may hit limits
- ⚠️ **No data backup or recovery** — Clearing browser storage or switching devices loses all data
- ⚠️ **Mock data entangled with production code** — `mockData.js` (861 lines) and `mockHackathons.js` are imported directly into contexts

### Incomplete / Placeholder Code
- ⚠️ **QRScanner is entirely simulated** — Uses `Math.random()` for success/failure, hardcoded student names, no camera access
- ⚠️ **File uploads are simulated** — PPT, resume, and ID uploads use `setTimeout` delays, no actual file handling
- ⚠️ **Verification flows are mocked** — Mobile OTP and Aadhaar verification are fake `setTimeout` simulations
- ⚠️ **Unstop import uses hardcoded data** — No actual API call to Unstop; data is pre-defined in component

### Unused / Redundant Files
- ⚠️ **`README.md`** in root is the default Vite template; not customized for the project
- ⚠️ **`tailwind.config.js`** uses `require("daisyui")` syntax which may conflict with ESM `"type": "module"` in `package.json`
- ⚠️ **`App.css`** contains only `@import "tailwindcss"` — same as `index.css`; one file is redundant
- ⚠️ **`AuthContext.jsx`** `role` and `user` state are set but the context is not consistently used — `HackathonContext.jsx` manages its own `currentUser`

### Missing Environment Variables
- ⚠️ No `.env` file exists
- ⚠️ Backend docs reference 9+ required environment variables (`MONGODB_URI`, `JWT_SECRET`, `CLOUDINARY_*`, `SENDGRID_API_KEY`, etc.) — none configured

---

## 7. Completion Status

### Overall Project Completion: **45%**

| Area | Completion | Details |
|---|---|---|
| **Frontend UI** | 90% | All 11 pages built, responsive, styled with glassmorphism theme |
| **Frontend Logic** | 80% | Context state management, code verification, result workflow all functional with mock data |
| **Backend Code** | 0% | Only a `README.md` exists in the `backend/` directory |
| **Database** | 0% | No database; all data in localStorage and mock files |
| **API Integration** | 0% | No REST API exists; frontend has no `fetch` or `axios` calls to a backend |
| **Authentication** | 15% | Code-based auth flow exists in UI (client-side), but no real JWT/session auth |
| **File Upload** | 5% | Upload UI exists with simulation; no real file handling |
| **Real-time Features** | 0% | No WebSocket (Socket.io) implementation |
| **Email Service** | 0% | No SendGrid or Nodemailer integration |
| **Testing** | 0% | No test files or framework |
| **Deployment** | 5% | Vite build config exists; no deployment configs or CI/CD |
| **Documentation** | 85% | Extensive docs in `summary.md`, `docs/`, and `docs_of_loc/` (5,000+ lines of specs) |

### Breakdown

```
Frontend UI/UX:       ████████████████████░  90%
Frontend Logic:       ████████████████░░░░░  80%
Backend:              ░░░░░░░░░░░░░░░░░░░░░   0%
Database:             ░░░░░░░░░░░░░░░░░░░░░   0%
API Integration:      ░░░░░░░░░░░░░░░░░░░░░   0%
Authentication:       ███░░░░░░░░░░░░░░░░░░  15%
Real-time:            ░░░░░░░░░░░░░░░░░░░░░   0%
Testing:              ░░░░░░░░░░░░░░░░░░░░░   0%
Deployment:           █░░░░░░░░░░░░░░░░░░░░   5%
Documentation:        █████████████████░░░░  85%
```

---

## 8. API Documentation

### Current State: No Backend API Exists

The frontend currently uses **no HTTP API calls**. All data flows through:
- React Context API (in-memory state)
- localStorage (browser persistence)
- Mock data files (`mockData.js`, `mockHackathons.js`)

### Planned API Endpoints (from `docs_of_loc/backend-implementation-guide.md`)

The following API routes are **fully documented** but have **zero implementation**:

#### Authentication Routes — `/api/v1/auth`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Register new user account |
| POST | `/api/v1/auth/login` | Login with credentials |
| POST | `/api/v1/auth/refresh` | Refresh JWT access token |
| POST | `/api/v1/auth/logout` | Invalidate refresh token |

#### Hackathon Routes — `/api/v1/hackathons`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/hackathons` | Create new hackathon |
| GET | `/api/v1/hackathons/:code` | Get hackathon by code |
| POST | `/api/v1/hackathons/verify` | Verify hackathon code (Layer 1) |
| POST | `/api/v1/hackathons/verify-role` | Verify role code (Layer 2) |
| PUT | `/api/v1/hackathons/:code` | Update hackathon details |
| GET | `/api/v1/hackathons/:code/stats` | Get hackathon statistics |

#### Team Routes — `/api/v1/teams`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/teams` | Register new team |
| GET | `/api/v1/teams/:id` | Get team by ID |
| GET | `/api/v1/teams/hackathon/:code` | Get all teams in hackathon |
| PUT | `/api/v1/teams/:id` | Update team details |
| POST | `/api/v1/teams/:id/submit` | Submit team project |

#### Entry Log Routes — `/api/v1/entry-logs`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/entry-logs/scan` | Record QR scan (gate/meal) |
| GET | `/api/v1/entry-logs/hackathon/:code` | Get all entry logs for hackathon |
| GET | `/api/v1/entry-logs/stats/:code` | Get entry statistics |

#### Judge Routes — `/api/v1/judges`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/judges/evaluate` | Submit team evaluation scores |
| POST | `/api/v1/judges/send-to-admin` | Send all evaluations to admin |
| GET | `/api/v1/judges/evaluations/:code` | Get evaluations for hackathon |

#### Admin Routes — `/api/v1/admin`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/admin/publish-results` | Publish results to participants |
| GET | `/api/v1/admin/dashboard/:code` | Get admin dashboard data |

#### Upload Routes — `/api/v1/uploads`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/uploads/resume` | Upload resume (Cloudinary) |
| POST | `/api/v1/uploads/ppt` | Upload presentation (Cloudinary) |
| POST | `/api/v1/uploads/id-card` | Upload college ID card (Cloudinary) |

### Planned Database Collections (from `docs_of_loc/database-schemas.md`)

| Collection | Purpose | Key Fields |
|---|---|---|
| `hackathons` | Store hackathon events | `hackathonCode`, `eventName`, `codes`, `status`, `stats` |
| `users` | User accounts | `email`, `password`, `role`, `verification` |
| `teams` | Team registrations | `teamName`, `members[]`, `hackathonCode`, `scores` |
| `entryLogs` | QR scan records | `userId`, `hackathonCode`, `entryType`, `timestamp` |
| `scores` | Judge evaluations | `teamId`, `judgeId`, `innovation`, `feasibility`, `technical`, `presentation` |
| `refreshTokens` | JWT refresh tokens | `userId`, `token`, `expiresAt` |

---

## 9. Setup Instructions

### Prerequisites

- Node.js 18+ (recommended: 20+)
- npm 9+
- Git

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd aerohacks-private

# Install frontend dependencies
npm install
```

### Run Frontend (Development)

```bash
npm run dev
```

The app starts at `http://localhost:5173` (Vite default).

### Build for Production

```bash
npm run build
```

Output goes to the `dist/` folder.

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

### Run Backend

> **⚠️ Backend is NOT implemented.** The `backend/` folder only contains documentation.

When the backend is built, setup would be:

```bash
cd backend
npm install
cp .env.example .env
# Fill in environment variables
npm run dev
# Server starts on http://localhost:5000
```

### Required Environment Variables (for future backend)

```env
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster.mongodb.net/aerohacks_production
JWT_SECRET=<random-64-char-string>
JWT_REFRESH_SECRET=<random-64-char-string>
CLOUDINARY_CLOUD_NAME=<cloudinary-cloud-name>
CLOUDINARY_API_KEY=<cloudinary-api-key>
CLOUDINARY_API_SECRET=<cloudinary-api-secret>
SENDGRID_API_KEY=<sendgrid-api-key>
CLIENT_URL=http://localhost:5173
```

### Deploy Frontend

The frontend can be deployed to Vercel:

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Demo Credentials (for current mock app)

| Role | Code |
|---|---|
| **Hackathon Code** | `AERO-2026-HC1234` |
| **Participant Code** | `P-A3F9K2H8` |
| **Admin Code** | `A-12345678` |
| **Judge Code** | `J-87654321` |

---

## 10. TODO Roadmap

### 🔴 HIGH PRIORITY

| # | Task | Effort | Impact |
|---|---|---|---|
| 1 | **Build Express.js backend server** — Create `server.js`, mount middleware (cors, helmet, morgan, rate-limit), connect to MongoDB Atlas | 2-3 hrs | Critical |
| 2 | **Implement MongoDB schemas** — Create Mongoose models for Hackathon, User, Team, EntryLog, Score, RefreshToken based on documented schemas | 2-3 hrs | Critical |
| 3 | **Implement JWT authentication** — Register/login endpoints, access + refresh token flow, bcrypt password hashing | 2-3 hrs | Critical |
| 4 | **Build REST API routes** — Hackathon CRUD, team registration, entry logs, judge evaluation, admin operations | 4-5 hrs | Critical |
| 5 | **Connect frontend to backend API** — Replace all localStorage/mock data calls with Axios HTTP calls to real API endpoints | 3-4 hrs | Critical |
| 6 | **Implement real file uploads** — Integrate Cloudinary + Multer for resume, PPT, and ID card uploads | 2-3 hrs | Critical |
| 7 | **Add `.env.example`** — Document all required environment variables for both frontend and backend | 0.5 hr | Critical |
| 8 | **Add error boundaries** — Wrap React app in ErrorBoundary component to prevent white screens | 1 hr | High |

### 🟡 MEDIUM PRIORITY

| # | Task | Effort | Impact |
|---|---|---|---|
| 9 | **Implement Socket.io** — Real-time leaderboard updates, live entry log feed, notification events | 3-4 hrs | High |
| 10 | **Integrate SendGrid email service** — Send hackathon codes, OTP verification emails, result notifications | 2 hrs | Medium |
| 11 | **Implement real QR scanning** — Use `html5-qrcode` or `qr-scanner` library for actual camera-based QR reading | 2-3 hrs | High |
| 12 | **Add input validation middleware** — Joi schemas for all API endpoints | 2 hrs | Medium |
| 13 | **Remove/separate mock data** — Extract mock data from production code, use only when `NODE_ENV=development` | 1 hr | Medium |
| 14 | **Reconcile AuthContext with HackathonContext** — Currently both manage user state independently; consolidate | 1-2 hrs | Medium |
| 15 | **Add loading and error states** — Show skeleton loaders, retry buttons, and meaningful errors on API failures | 2 hrs | Medium |

### 🟢 LOW PRIORITY

| # | Task | Effort | Impact |
|---|---|---|---|
| 16 | **Add unit tests** — Jest + React Testing Library for components, Vitest for utilities | 4-6 hrs | Medium |
| 17 | **Add Docker support** — Create Dockerfile, docker-compose.yml for backend + MongoDB | 2 hrs | Low |
| 18 | **Set up CI/CD** — GitHub Actions for lint, test, build, and auto-deploy | 2-3 hrs | Low |
| 19 | **Add Vercel config** — Create `vercel.json` with rewrites for SPA routing | 0.5 hr | Low |
| 20 | **Implement face matching** — face-api.js or cloud-based ID-selfie verification | 4-6 hrs | Low |
| 21 | **Implement real Unstop API** — Replace hardcoded import with actual Unstop/external API | 2-3 hrs | Low |
| 22 | **Accessibility audit** — Add ARIA attributes, keyboard navigation, screen reader support | 3-4 hrs | Low |
| 23 | **Performance optimization** — Code splitting, lazy loading, image optimization | 2-3 hrs | Low |
| 24 | **Remove redundant `App.css`** — Consolidate with `index.css` since both only import Tailwind | 0.1 hr | Low |
| 25 | **Customize root `README.md`** — Replace default Vite readme with project-specific documentation | 0.5 hr | Low |

---

*Generated by analyzing all 40+ source files across the AeroHacks project workspace.*
