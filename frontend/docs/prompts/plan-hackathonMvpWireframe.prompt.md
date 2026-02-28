# Implementation Plan: Enhanced Hackathon Management System MVP

## MISSION

Build a **secure, fully navigable, visually complete** hackathon management system with **two-layer authentication**, **host hackathon functionality**, and **zero backend**. Every feature must be clickable and demonstrate the full user journey instantly with enhanced security.

---

## 🎯 CURRENT IMPLEMENTATION STATUS

### ✅ Completed Features (v1.0)

#### Core Infrastructure

- ✅ React 19 + Vite 7.3.1 setup
- ✅ Tailwind CSS 4.2.0 with glassmorphism design system
- ✅ React Router DOM with nested routes
- ✅ Context API state management (TeamContext, ThemeContext)
- ✅ localStorage persistence for team data

#### Pages Implemented (8)

1. ✅ **Landing Page** - Hero section with role buttons
2. ✅ **Participant Dashboard** - Team registration + QR display
3. ✅ **Participant Profile** - Edit details, upload ID
4. ✅ **Admin Dashboard** - Stats, QR scanner, entry logs
5. ✅ **Admin Entry Logs** - Detailed gate entry table
6. ✅ **Admin Submissions** - Review team PPTs/GitHub
7. ✅ **Judge Dashboard** - Team evaluation interface
8. ✅ **Leaderboard** - Live ranked teams with scores

#### Advanced Features Completed

- ✅ **Result Workflow System** (3-state control)
  - `NOT_EVALUATED` → Judge only access
  - `SENT_TO_ADMIN` → Judge + Admin access
  - `RESULTS_PUBLISHED` → Public access
- ✅ **Role-Based Leaderboard Access** with "Back to Dashboard" navigation
- ✅ **Team Registration Form** with Unstop import simulation
  - Name, Email, Mobile (OTP verification mocked)
  - Aadhaar verification via DigiLocker (mocked)
  - Resume upload (mocked)
  - GitHub repo + PPT upload
- ✅ **QR Code Generation** via external API
- ✅ **Judge Evaluation Form** with 4 rubrics (Innovation, Feasibility, Technical, Presentation)
- ✅ **Responsive Design Overhaul**
  - Mobile-first approach (320px+)
  - Tablet optimizations (640px+)
  - Desktop layouts (1024px+)
  - All text, icons, padding, buttons responsive
  - Flex-wrap for button overflow
  - Break-words for text wrapping

#### Components Built

- ✅ Layout: Navbar, Sidebar, Layout wrapper
- ✅ UI: StatsCard, QRDisplay, BandwidthToggle (all responsive)
- ✅ Features: TeamRegistrationForm, QRScanner, EntryLogTable (all responsive)

---

## 🔐 NEW SECURITY ARCHITECTURE (v2.0)

### Two-Layer Authentication System

#### Layer 1: Hackathon Access Control

**Purpose**: Restrict access to specific hackathon instances

**Flow**:

```
Landing Page → Enter Hackathon Code → Verify → Role Selection Page
```

**Implementation**:

- **Hackathon Code Format**: `AERO-2026-HC1234` (prefix-year-unique)
- **Storage**: localStorage `currentHackathon` object
- **Validation**: Mock verification against `mockHackathons` data

#### Layer 2: Role-Based Entry Codes

**Purpose**: Authenticate individuals for specific roles

**Flow**:

```
Role Selection → Enter Role Code → Verify → Role Dashboard
```

**Implementation**:

- **Participant Code**: 12-digit alphanumeric (e.g., `P-A3F9K2H8`)
- **Admin Code**: 8-digit PIN (e.g., `A-12345678`)
- **Judge Code**: 8-digit PIN (e.g., `J-87654321`)
- **Storage**: localStorage `currentUser` object with role + code

---

## 1. UPDATED MVP PAGES

### Enhanced Page Structure (12 Total)

| Page                      | Route                  | Auth Required | Purpose                                         |
| ------------------------- | ---------------------- | ------------- | ----------------------------------------------- |
| **Landing**               | `/`                    | None          | Hero + Hackathon code entry                     |
| **Host Hackathon**        | `/host`                | None          | Create new hackathon, generate codes/QR         |
| **Role Selection**        | `/hackathon/:code`     | Layer 1       | Choose role after hackathon code verified       |
| **Role Authentication**   | `/:role/auth`          | Layer 1       | Enter individual role code                      |
| **Participant Dashboard** | `/participant`         | Layer 1+2     | Team registration, QR code display, submissions |
| **Participant Profile**   | `/participant/profile` | Layer 1+2     | View/edit registration details, upload ID       |
| **Admin Dashboard**       | `/admin`               | Layer 1+2     | Stats overview, QR scanner, entry logs          |
| **Admin Entry Logs**      | `/admin/entries`       | Layer 1+2     | Detailed table of all gate entries & meals      |
| **Admin Submissions**     | `/admin/submissions`   | Layer 1+2     | View all team PPTs/GitHub links                 |
| **Judge Dashboard**       | `/judge`               | Layer 1+2     | Team evaluation form with rubrics               |
| **Leaderboard**           | `/leaderboard`         | Layer 1       | Live ranked teams with scores (role-dependent)  |
| **Hackathon Management**  | `/host/manage/:code`   | Host Code     | Edit hackathon details, view analytics          |

### Why These Pages?

**Landing**: Establishes the problem space and provides instant role-based navigation without login friction

**Participant Dashboard**: Demonstrates the primary user journey—registration, QR generation, and submission uploads

**Admin Dashboard**: Shows the operational command center with real-time entry monitoring

**Judge Dashboard**: Proves the evaluation workflow with instant score updates

**Leaderboard**: Public-facing feature that showcases transparency and real-time updates

**Admin Entry Logs**: Critical for demonstrating anti-fraud QR scanning logic

**Participant Profile**: Shows identity verification without implementing face-api.js

**Team Submissions**: Organizer productivity tool for batch review

---

## 2. ENHANCED USER FLOWS (With Security Layers)

### NEW Scenario 0: Host Creates Hackathon

```
User lands on Landing Page
  ↓
Clicks "Host a Hackathon" button
  ↓
Fills out hackathon details form: 
  - Event Name (e.g., "AeroHacks 2026")
  - Date & Time
  - Venue
  - Max Teams
  - Problem Statements (multiselect)
  ↓
Clicks "Generate Codes"
  ↓
System generates:
  - Hackathon Code (AERO-2026-HC1234)
  - Admin Code (A-12345678)
  - Judge Code (J-87654321)
  - Participant Code Pool (100 codes generated)
  ↓
Displays QR code + shareable link
  ↓
Host downloads QR code / copies link
  ↓
Success: "Hackathon created! Share code with participants"
```

### UPDATED Scenario 1: Participant Journey (With Auth)

```
User lands on Landing Page
  ↓
Enters Hackathon Code: "AERO-2026-HC1234"
  ↓
Code verified → Redirected to Role Selection Page
  ↓
Clicks "Enter as Participant"
  ↓
Enters Participant Code: "P-A3F9K2H8"
  ↓
Code verified → Lands on Participant Dashboard
  ↓
Fills out team registration form (instant save to localStorage)
  - Team Name, Members (2-4 with full details)
  - Problem Statement, GitHub, PPT upload
  - Aadhaar + Mobile verification (mocked)
  - Import from Unstop option available
  ↓
Sees generated QR code appear instantly
  ↓
Clicks "My Profile" in navbar
  ↓
Uploads college ID image (stored as base64 preview)
  ↓
Status card updates to "Registered"
  ↓
Clicks "View Leaderboard" (visible after RESULTS_PUBLISHED)
  ↓
Sees team ranking and scores
```

### UPDATED Scenario 2: Admin Journey (With Auth)

```
User lands on Landing Page
  ↓
Enters Hackathon Code: "AERO-2026-HC1234"
  ↓
Code verified → Redirected to Role Selection Page
  ↓
Clicks "Admin Panel"
  ↓
Enters Admin Code: "A-12345678"
  ↓
Code verified → Lands on Admin Dashboard with stats cards
  ↓
Clicks "Scan QR Code" button
  ↓
Mock scanner opens (click to simulate scan)
  ↓
Success animation plays, entry log updates instantly
  ↓
Clicks "View All Entries" link
  ↓
Sees paginated table with timestamps
  ↓
Clicks "Team Submissions"
  ↓
Reviews all uploaded PPTs/GitHub links
  ↓
Clicks "Publish Results" (after judge sends to admin)
  ↓
Success: Results now visible to participants
```

### UPDATED Scenario 3: Judge Journey (With Auth)

```
User lands on Landing Page
  ↓
Enters Hackathon Code: "AERO-2026-HC1234"
  ↓
Code verified → Redirected to Role Selection Page
  ↓
Clicks "Judge Panel"
  ↓
Enters Judge Code: "J-87654321"
  ↓
Code verified → Lands on Judge Dashboard with team cards
  ↓
Selects first team from list
  ↓
Adjusts slider inputs for:
  - Innovation (1-10)
  - Feasibility (1-10)
  - Technical Implementation (1-10)
  - Presentation (1-10)
  ↓
Clicks "Submit Scores"
  ↓
Success toast appears
  ↓
Repeats for all teams
  ↓
Clicks "Send to Admin" (changes status to SENT_TO_ADMIN)
  ↓
Clicks "View Leaderboard" in navbar
  ↓
Sees updated rankings instantly (always visible to judge)
```

### Navigation Rules (v2.0)

- ✅ **Two-layer authentication**: Hackathon code → Role code
- ✅ **No validation on codes**: Any format accepted for demo
- ✅ **No loading states**: All transitions are instant
- ✅ **No error handling**: Assume happy path only
- ✅ **Persistent state**: Use Context + localStorage for cross-page data
- ✅ **Protected routes**: Redirect to landing if codes not in localStorage
- ✅ **Role-based access**: Leaderboard visibility based on result status

---

## 3. UPDATED FOLDER STRUCTURE

```
src/
├── components/
│   ├── layout/
│   │   ├── Navbar.jsx              # ✅ Top navigation with role-aware links
│   │   ├── Sidebar.jsx             # ✅ Collapsible side menu
│   │   ├── Layout.jsx              # ✅ Wrapper combining Navbar + Sidebar
│   │   └── ProtectedRoute.jsx      # 🆕 HOC for auth guards
│   ├── ui/
│   │   ├── StatsCard.jsx           # ✅ Reusable metric display (responsive)
│   │   ├── QRDisplay.jsx           # ✅ QR code image component (responsive)
│   │   ├── BandwidthToggle.jsx     # ✅ Light mode switcher
│   │   ├── CodeInput.jsx           # 🆕 Styled input for codes
│   │   └── ShareLink.jsx           # 🆕 Copyable link with QR
│   └── features/
│       ├── QRScanner.jsx           # ✅ Mock scanner with camera UI
│       ├── TeamRegistrationForm.jsx # ✅ Multi-step form (responsive)
│       ├── EntryLogTable.jsx       # ✅ Paginated data table
│       ├── HackathonSetupForm.jsx  # 🆕 Host hackathon creation
│       └── CodeGenerator.jsx       # 🆕 Generate/display codes
├── pages/
│   ├── Landing.jsx                 # ✅ Enhanced with code entry
│   ├── HostHackathon.jsx           # 🆕 Create new hackathon
│   ├── RoleSelection.jsx           # 🆕 Choose role after hackathon code
│   ├── RoleAuth.jsx                # 🆕 Enter individual role code
│   ├── ParticipantDashboard.jsx    # ✅ Responsive, full features
│   ├── ParticipantProfile.jsx      # ✅ Edit details, upload ID
│   ├── AdminDashboard.jsx          # ✅ Responsive, stats, QR scanner
│   ├── AdminEntries.jsx            # ✅ Gate entry logs
│   ├── AdminSubmissions.jsx        # ✅ Review submissions
│   ├── JudgeDashboard.jsx          # ✅ Responsive, evaluation form
│   ├── Leaderboard.jsx             # ✅ Responsive, role-based access
│   └── HackathonManagement.jsx     # 🆕 Edit hackathon, view analytics
├── context/
│   ├── AuthContext.jsx             # ✅ Role state (extended for v2.0)
│   ├── TeamContext.jsx             # ✅ Team registration data with results
│   ├── HackathonContext.jsx        # 🆕 Current hackathon state
│   └── ThemeContext.jsx            # ✅ Bandwidth mode state
├── data/
│   ├── mockData.js                 # ✅ Teams, scores, entry logs
│   └── mockHackathons.js           # 🆕 Hackathon instances with codes
├── utils/
│   ├── helpers.js                  # ✅ QR generation, score calculation
│   ├── codeGenerator.js            # 🆕 Generate unique codes
│   └── validators.js               # 🆕 Mock code validation
├── App.jsx                          # ✅ React Router setup (extended)
├── main.jsx                         # ✅ Context providers
└── index.css                        # ✅ Tailwind + responsive utilities
```

**Legend**:

- ✅ = Already implemented
- 🆕 = New for v2.0

---

## 4. DATA HANDLING APPROACH (Updated for v2.0)

### Strategy: React Context + localStorage + Mock JSON

**New Data Structures**:

```javascript
// src/data/mockHackathons.js
export const mockHackathons = [
  {
    hackathonCode: "AERO-2026-HC1234",
    eventName: "AeroHacks 2026",
    date: "2026-02-20",
    venue: "DJ Sanghvi College of Engineering",
    maxTeams: 50,
    problemStatements: [
      "Smart Campus Navigation",
      "AI Study Planner",
      "Blockchain Voting",
      "Traffic Optimizer",
      "Mental Health Chatbot",
    ],
    codes: {
      admin: "A-12345678",
      judge: "J-87654321",
      participants: [
        "P-A3F9K2H8",
        "P-B7K3M9N2",
        "P-C5H8L4J6",
        // ... 100 codes generated
      ],
    },
    status: "active", // active, completed, cancelled
    createdAt: "2026-02-19T10:00:00Z",
    hostEmail: "host@djsce.edu",
    qrCodeUrl:
      "https://api.qrserver.com/v1/create-qr-code/?data=AERO-2026-HC1234",
    shareLink: "https://aerohacks.com/join/AERO-2026-HC1234",
    stats: {
      registeredTeams: 15,
      totalParticipants: 58,
      entryLogs: 45,
      mealsServed: 120,
    },
  },
  // ... more hackathons
];

// src/data/mockData.js (Enhanced)
export const mockTeams = [
  {
    id: 1,
    hackathonCode: "AERO-2026-HC1234", // 🆕 Link to hackathon
    teamName: "Decrypters",
    members: [
      {
        name: "Pratham Kataria",
        email: "pratham.kataria@djsce.edu",
        mobile: "9326418140",
        college: "Dwarkadas J Sanghvi College of Engineering",
        aadhaar: "XXXX XXXX 1140",
        isLeader: true,
        mobileVerified: true,
        aadhaarVerified: true,
        resumeUploaded: true,
      },
      // ... other members
    ],
    problemStatement: "Smart Hackathon Management System",
    github: "https://github.com/decrypters/aerohacks",
    pptFile: "presentation.pptx",
    scores: { innovation: 10, feasibility: 9, technical: 10, presentation: 10 },
    totalScore: 39,
    isShortlisted: true,
    submittedAt: "2026-02-19T08:00:00Z",
  },
  // ... 15 more teams
];

export const mockEntryLogs = [
  {
    id: 1,
    hackathonCode: "AERO-2026-HC1234", // 🆕 Link to hackathon
    studentName: "Pratham Kataria",
    teamName: "Decrypters",
    email: "pratham.kataria@djsce.edu",
    entryType: "gate", // gate, breakfast, lunch, dinner
    timestamp: "2026-02-19T08:15:23Z",
    status: "success", // success, duplicate, invalid
    scannedBy: "Admin-001",
  },
  // ... meal logs
];

export const RESULT_STATUS = {
  NOT_EVALUATED: "NOT_EVALUATED", // ✅ Initial state
  SENT_TO_ADMIN: "SENT_TO_ADMIN", // ✅ Judge completed
  RESULTS_PUBLISHED: "RESULTS_PUBLISHED", // ✅ Admin published
};
```

### Context Structure (Enhanced):

```javascript
// src/context/HackathonContext.jsx (🆕)
const HackathonContext = createContext();

export const HackathonProvider = ({ children }) => {
  const [currentHackathon, setCurrentHackathon] = useState(() => {
    const saved = localStorage.getItem("currentHackathon");
    return saved ? JSON.parse(saved) : null;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem("currentUser");
    return saved ? JSON.parse(saved) : null;
  });

  const verifyHackathonCode = (code) => {
    const hackathon = mockHackathons.find((h) => h.hackathonCode === code);
    if (hackathon) {
      setCurrentHackathon(hackathon);
      localStorage.setItem("currentHackathon", JSON.stringify(hackathon));
      return true;
    }
    return false;
  };

  const verifyRoleCode = (role, code) => {
    if (!currentHackathon) return false;

    let isValid = false;
    if (role === "admin" && currentHackathon.codes.admin === code) {
      isValid = true;
    } else if (role === "judge" && currentHackathon.codes.judge === code) {
      isValid = true;
    } else if (
      role === "participant" &&
      currentHackathon.codes.participants.includes(code)
    ) {
      isValid = true;
    }

    if (isValid) {
      const user = { role, code, verifiedAt: new Date().toISOString() };
      setCurrentUser(user);
      localStorage.setItem("currentUser", JSON.stringify(user));
    }
    return isValid;
  };

  const createHackathon = (details) => {
    const newHackathon = {
      hackathonCode: generateHackathonCode(),
      ...details,
      codes: {
        admin: generateAdminCode(),
        judge: generateJudgeCode(),
        participants: generateParticipantCodes(details.maxTeams * 4),
      },
      status: "active",
      createdAt: new Date().toISOString(),
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?data=${hackathonCode}`,
      shareLink: `https://aerohacks.com/join/${hackathonCode}`,
    };

    // Save to localStorage (in real app, would POST to backend)
    const hackathons = JSON.parse(localStorage.getItem("hackathons") || "[]");
    hackathons.push(newHackathon);
    localStorage.setItem("hackathons", JSON.stringify(hackathons));

    return newHackathon;
  };

  return (
    <HackathonContext.Provider
      value={{
        currentHackathon,
        currentUser,
        verifyHackathonCode,
        verifyRoleCode,
        createHackathon,
      }}
    >
      {children}
    </HackathonContext.Provider>
  );
};

// src/context/TeamContext.jsx (✅ Enhanced with result status)
const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem("teams");
    return saved ? JSON.parse(saved) : mockTeams;
  });

  const [resultStatus, setResultStatus] = useState(() => {
    return localStorage.getItem("resultStatus") || RESULT_STATUS.NOT_EVALUATED;
  });

  const updateTeamScore = (teamId, scores) => {
    const updated = teams.map((t) =>
      t.id === teamId
        ? {
            ...t,
            scores,
            totalScore: Object.values(scores).reduce((a, b) => a + b, 0),
          }
        : t,
    );
    setTeams(updated);
    localStorage.setItem("teams", JSON.stringify(updated));
  };

  const sendToAdmin = () => {
    setResultStatus(RESULT_STATUS.SENT_TO_ADMIN);
    localStorage.setItem("resultStatus", RESULT_STATUS.SENT_TO_ADMIN);
  };

  const publishResults = () => {
    setResultStatus(RESULT_STATUS.RESULTS_PUBLISHED);
    localStorage.setItem("resultStatus", RESULT_STATUS.RESULTS_PUBLISHED);
  };

  return (
    <TeamContext.Provider
      value={{
        teams,
        updateTeamScore,
        resultStatus,
        sendToAdmin,
        publishResults,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
};
```

---

## 5. ROUTING PLAN (Updated for v2.0)

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useHackathon } from "./context/HackathonContext";
import Layout from "./components/layout/Layout";
import ProtectedRoute from "./components/layout/ProtectedRoute";

// Pages
import Landing from "./pages/Landing";
import HostHackathon from "./pages/HostHackathon";
import RoleSelection from "./pages/RoleSelection";
import RoleAuth from "./pages/RoleAuth";
import ParticipantDashboard from "./pages/ParticipantDashboard";
import ParticipantProfile from "./pages/ParticipantProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEntries from "./pages/AdminEntries";
import AdminSubmissions from "./pages/AdminSubmissions";
import JudgeDashboard from "./pages/JudgeDashboard";
import Leaderboard from "./pages/Leaderboard";
import HackathonManagement from "./pages/HackathonManagement";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/host" element={<HostHackathon />} />

        {/* Layer 1 Auth: Hackathon Code Required */}
        <Route
          path="/hackathon/:code"
          element={
            <ProtectedRoute layer={1}>
              <RoleSelection />
            </ProtectedRoute>
          }
        />

        {/* Layer 2 Auth: Role Code Required */}
        <Route path="/:role/auth" element={<RoleAuth />} />

        {/* Participant Routes (Layer 1 + 2) */}
        <Route
          path="/participant"
          element={
            <ProtectedRoute layer={2} requiredRole="participant">
              <Layout role="participant" />
            </ProtectedRoute>
          }
        >
          <Route index element={<ParticipantDashboard />} />
          <Route path="profile" element={<ParticipantProfile />} />
        </Route>

        {/* Admin Routes (Layer 1 + 2) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute layer={2} requiredRole="admin">
              <Layout role="admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="entries" element={<AdminEntries />} />
          <Route path="submissions" element={<AdminSubmissions />} />
        </Route>

        {/* Judge Routes (Layer 1 + 2) */}
        <Route
          path="/judge"
          element={
            <ProtectedRoute layer={2} requiredRole="judge">
              <Layout role="judge" />
            </ProtectedRoute>
          }
        >
          <Route index element={<JudgeDashboard />} />
        </Route>

        {/* Leaderboard (Layer 1 only, role-based visibility) */}
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute layer={1}>
              <Leaderboard />
            </ProtectedRoute>
          }
        />

        {/* Host Management (Requires host auth) */}
        <Route
          path="/host/manage/:code"
          element={
            <ProtectedRoute layer={1}>
              <HackathonManagement />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

// src/components/layout/ProtectedRoute.jsx (🆕)
const ProtectedRoute = ({ layer, requiredRole, children }) => {
  const { currentHackathon, currentUser } = useHackathon();

  // Layer 1: Only hackathon code required
  if (layer === 1) {
    if (!currentHackathon) {
      return <Navigate to="/" replace />;
    }
    return children;
  }

  // Layer 2: Both hackathon code and role code required
  if (layer === 2) {
    if (!currentHackathon || !currentUser) {
      return <Navigate to="/" replace />;
    }
    if (requiredRole && currentUser.role !== requiredRole) {
      return <Navigate to="/" replace />;
    }
    return children;
  }

  return children;
};
```

---

## 6. COMPONENT BREAKDOWN (Updated for v2.0)

### 🆕 New Components

#### 1. CodeInput.jsx

```jsx
// Styled input with prefix display
<div className="code-input">
  <span className="prefix">{prefix}</span>
  <input
    type="text"
    placeholder="Enter code"
    className="input"
    onChange={(e) => onChange(e.target.value)}
  />
</div>
```

#### 2. ShareLink.jsx

```jsx
// Displays shareable link + QR code
<div className="share-container">
  <img src={qrCodeUrl} alt="QR Code" />
  <div className="link-box">
    <input value={shareLink} readOnly />
    <button onClick={copyToClipboard}>Copy</button>
  </div>
</div>
```

#### 3. HackathonSetupForm.jsx

```jsx
// Multi-step form for creating hackathon
<form onSubmit={handleCreate}>
  <input name="eventName" placeholder="Event Name" />
  <input type="date" name="date" />
  <input name="venue" placeholder="Venue" />
  <input type="number" name="maxTeams" placeholder="Max Teams" />
  <multiselect name="problemStatements" />
  <button type="submit">Generate Codes</button>
</form>
```

#### 4. CodeGenerator.jsx

```jsx
// Displays generated codes after hackathon creation
<div className="codes-display">
  <CodeCard title="Hackathon Code" code={hackathonCode} />
  <CodeCard title="Admin Code" code={adminCode} secret />
  <CodeCard title="Judge Code" code={judgeCode} secret />
  <CodeList title="Participant Codes" codes={participantCodes} downloadable />
</div>
```

#### 5. ProtectedRoute.jsx

```jsx
// HOC for route authentication (see routing plan above)
```

### ✅ Existing Components (Enhanced)

#### Layout Components

- ✅ **Navbar**: Enhanced with code display badge
- ✅ **Sidebar**: Enhanced with hackathon info panel
- ✅ **Layout**: Enhanced with auth checks

#### UI Components

- ✅ **StatsCard**: Responsive, reusable
- ✅ **QRDisplay**: Responsive, download button
- ✅ **BandwidthToggle**: Light/dark mode

#### Feature Components

- ✅ **TeamRegistrationForm**: Responsive, Unstop import, full verification
- ✅ **QRScanner**: Mock scanner simulation
- ✅ **EntryLogTable**: Paginated, sortable

---

User clicks "Admin Panel" on Landing
↓
Lands on Admin Dashboard with stats cards
↓
Clicks "Scan QR Code" button
↓
Mock scanner opens (click to simulate scan)
↓
Success animation plays, entry log updates instantly
↓
Clicks "View All Entries" link
↓
Sees paginated table with timestamps
↓
Clicks "Team Submissions"
↓
Reviews all uploaded PPTs/GitHub links

```

### Scenario 3: Judge Journey

```

User clicks "Judge Panel" on Landing
↓
Lands on Judge Dashboard with team cards
↓
Selects first team from dropdown
↓
Adjusts slider inputs for Innovation, Feasibility, etc.
↓
Clicks "Submit Scores"
↓
Success toast appears
↓
Clicks "View Leaderboard" in navbar
↓
Sees updated rankings instantly

```

### Navigation Rules

- **No authentication barriers**: Any role is accessible from landing
- **No validation**: Forms accept any input instantly
- **No loading states**: All transitions are instant
- **No error handling**: Assume happy path only
- **Persistent state**: Use Context + localStorage for cross-page data

---

## 3. FOLDER STRUCTURE

```

src/
├── components/
│ ├── layout/
│ │ ├── Navbar.jsx # Top navigation with role-aware links
│ │ ├── Sidebar.jsx # Collapsible side menu
│ │ └── Layout.jsx # Wrapper combining Navbar + Sidebar
│ ├── ui/
│ │ ├── StatsCard.jsx # Reusable metric display
│ │ ├── TeamCard.jsx # Team info preview card
│ │ ├── QRDisplay.jsx # QR code image component
│ │ ├── ScoreSlider.jsx # Rubric evaluation slider
│ │ └── BandwidthToggle.jsx # Light mode switcher
│ └── features/
│ ├── QRScanner.jsx # Mock scanner with camera UI
│ ├── TeamRegistrationForm.jsx # Multi-step form
│ ├── EvaluationForm.jsx # Judge scoring interface
│ └── EntryLogTable.jsx # Paginated data table
├── pages/
│ ├── Landing.jsx
│ ├── ParticipantDashboard.jsx
│ ├── ParticipantProfile.jsx
│ ├── AdminDashboard.jsx
│ ├── AdminEntries.jsx
│ ├── AdminSubmissions.jsx
│ ├── JudgeDashboard.jsx
│ └── Leaderboard.jsx
├── context/
│ ├── AuthContext.jsx # Role state (participant/admin/judge)
│ ├── TeamContext.jsx # Team registration data
│ └── ThemeContext.jsx # Bandwidth mode state
├── data/
│ └── mockData.js # All fake data (teams, scores, logs)
├── utils/
│ └── helpers.js # QR generation, score calculation
├── App.jsx # React Router setup
├── main.jsx
└── index.css

````

---

## 4. DATA HANDLING APPROACH

### Strategy: React Context + localStorage + Mock JSON

**Why not json-server?**

- Adds server dependency
- Requires separate terminal process
- Overkill for static wireframe

**Implementation:**

```javascript
// src/data/mockData.js
export const mockTeams = [
  {
    id: 1,
    teamName: "ByteBuilders",
    members: ["Arjun Sharma", "Priya Gupta", "Rohan Mehta"],
    problemStatement: "Smart Campus Navigation",
    github: "https://github.com/bytebuilders/smart-nav",
    pptUrl: "https://drive.google.com/presentation/...",
    scores: { innovation: 8, feasibility: 7, technical: 9, presentation: 8 },
    totalScore: 32,
    isShortlisted: true,
    submittedAt: "2026-02-19T10:30:00Z",
  },
  // ... 15 more teams
];

export const mockEntryLogs = [
  {
    id: 1,
    studentName: "Arjun Sharma",
    email: "arjun@college.edu",
    entryType: "gate",
    timestamp: "2026-02-19T08:15:23Z",
    status: "success",
  },
  // ... meal logs
];

export const mockUser = {
  participant: {
    name: "Demo User",
    email: "demo@hackathon.com",
    team: "ByteBuilders",
    hasEntered: true,
    meals: { breakfast: true, lunch: false, dinner: false },
  },
};
````

### Context Structure:

```javascript
// src/context/TeamContext.jsx
const TeamContext = createContext();

export const TeamProvider = ({ children }) => {
  const [teams, setTeams] = useState(() => {
    const saved = localStorage.getItem("teams");
    return saved ? JSON.parse(saved) : mockTeams;
  });

  const updateTeamScore = (teamId, scores) => {
    const updated = teams.map((t) =>
      t.id === teamId
        ? {
            ...t,
            scores,
            totalScore: Object.values(scores).reduce((a, b) => a + b, 0),
          }
        : t,
    );
    setTeams(updated);
    localStorage.setItem("teams", JSON.stringify(updated));
  };

  return (
    <TeamContext.Provider value={{ teams, updateTeamScore }}>
      {children}
    </TeamContext.Provider>
  );
};
```

---

## 5. ROUTING PLAN

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Landing from "./pages/Landing";
import ParticipantDashboard from "./pages/ParticipantDashboard";
import ParticipantProfile from "./pages/ParticipantProfile";
import AdminDashboard from "./pages/AdminDashboard";
import AdminEntries from "./pages/AdminEntries";
import AdminSubmissions from "./pages/AdminSubmissions";
import JudgeDashboard from "./pages/JudgeDashboard";
import Leaderboard from "./pages/Leaderboard";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />

        <Route path="/participant" element={<Layout role="participant" />}>
          <Route index element={<ParticipantDashboard />} />
          <Route path="profile" element={<ParticipantProfile />} />
        </Route>

        <Route path="/admin" element={<Layout role="admin" />}>
          <Route index element={<AdminDashboard />} />
          <Route path="entries" element={<AdminEntries />} />
          <Route path="submissions" element={<AdminSubmissions />} />
        </Route>

        <Route path="/judge" element={<Layout role="judge" />}>
          <Route index element={<JudgeDashboard />} />
        </Route>

        <Route path="/leaderboard" element={<Leaderboard />} />
      </Routes>
    </BrowserRouter>
  );
}
```

---

## 6. COMPONENT BREAKDOWN

### Layout Components (3)

```jsx
// Navbar.jsx - Top bar with role-aware links
<nav className="navbar bg-base-100">
  <Link to="/">AeroHacks</Link>
  {role === "participant" && <Link to="/participant">Dashboard</Link>}
  {role === "admin" && <Link to="/admin">Admin Panel</Link>}
  <Link to="/leaderboard">Leaderboard</Link>
  <BandwidthToggle />
</nav>
```

### UI Components (5)

- **StatsCard**: `{ title, value, icon, trend }`
- **TeamCard**: Displays team name, members, problem statement
- **QRDisplay**: Shows QR code image with download button
- **ScoreSlider**: Range input with live value display
- **BandwidthToggle**: Switch between normal/minimal CSS

### Feature Components (4)

- **QRScanner**: Mock camera view + scan button simulation
- **TeamRegistrationForm**: Multi-field form with localStorage save
- **EvaluationForm**: Judge scoring with 4 rubric sliders
- **EntryLogTable**: Sortable table with pagination

---

## 7. IMPLEMENTATION TIMELINE FOR v2.0 SECURITY FEATURES

### Phase 1: Security Layer Setup (1.5 hours)

#### Hour 0:00 - 0:20 | HackathonContext Setup

1. **Create mockHackathons.js** (15 min)

```javascript
// src/data/mockHackathons.js
export const mockHackathons = [
  {
    hackathonCode: "AERO-2026-HC1234",
    eventName: "AeroHacks 2026",
    date: "2026-02-20",
    venue: "DJ Sanghvi College of Engineering",
    maxTeams: 50,
    problemStatements: ["Problem 1", "Problem 2", ...],
    codes: {
      admin: "A-12345678",
      judge: "J-87654321",
      participants: ["P-A3F9K2H8", "P-B7K3M9N2", ...],
    },
    status: "active",
    createdAt: "2026-02-19T10:00:00Z",
    qrCodeUrl: "...",
    shareLink: "...",
  },
];
```

2. **Create HackathonContext.jsx** (5 min)

- Copy context structure from plan (see section 4)
- Implement verifyHackathonCode, verifyRoleCode, createHackathon

**Checkpoint**: Context accessible, functions callable

---

#### Hour 0:20 - 0:40 | Code Generator Utilities

1. **Create codeGenerator.js** (15 min)

```javascript
// src/utils/codeGenerator.js
export const generateHackathonCode = () => {
  const prefix = "AERO";
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substr(2, 6).toUpperCase();
  return `${prefix}-${year}-HC${random}`;
};

export const generateAdminCode = () => {
  return `A-${Math.floor(10000000 + Math.random() * 90000000)}`;
};

export const generateJudgeCode = () => {
  return `J-${Math.floor(10000000 + Math.random() * 90000000)}`;
};

export const generateParticipantCodes = (count) => {
  const codes = [];
  for (let i = 0; i < count; i++) {
    const random = Math.random().toString(36).substr(2, 8).toUpperCase();
    codes.push(`P-${random}`);
  }
  return codes;
};
```

2. **Create validators.js** (5 min)

```javascript
// src/utils/validators.js
export const validateHackathonCode = (code) => {
  return /^[A-Z]+-\d{4}-HC[A-Z0-9]{6}$/.test(code);
};

export const validateRoleCode = (role, code) => {
  if (role === "admin") return /^A-\d{8}$/.test(code);
  if (role === "judge") return /^J-\d{8}$/.test(code);
  if (role === "participant" return /^P-[A-Z0-9]{8}$/.test(code);
  return false;
};
```

**Checkpoint**: Utilities return valid codes

---

#### Hour 0:40 - 1:10 | ProtectedRoute Component

1. **Create ProtectedRoute.jsx** (20 min)

```jsx
// src/components/layout/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useHackathon } from "../../context/HackathonContext";

const ProtectedRoute = ({ layer, requiredRole, children }) => {
  const { currentHackathon, currentUser } = useHackathon();

  if (layer === 1 && !currentHackathon) {
    return <Navigate to="/" replace />;
  }

  if (layer === 2) {
    if (!currentHackathon || !currentUser) {
      return <Navigate to="/" replace />;
    }
    if (requiredRole && currentUser.role !== requiredRole) {
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
```

2. **Update App.jsx routing** (10 min)

- Wrap routes with ProtectedRoute (see section 5)
- Test navigation flow

**Checkpoint**: Direct URL access redirects to landing if not authenticated

---

#### Hour 1:10 - 1:30 | UI Components for Codes

1. **Create CodeInput.jsx** (10 min)

```jsx
// src/components/ui/CodeInput.jsx
const CodeInput = ({ prefix, placeholder, onChange, value }) => {
  return (
    <div className="flex items-center gap-2 p-3 sm:p-4 bg-white/5 border border-white/10 rounded-lg">
      <span className="text-gray-400 font-mono text-sm sm:text-base">
        {prefix}
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-white text-sm sm:text-base focus:outline-none font-mono uppercase"
      />
    </div>
  );
};
```

2. **Create ShareLink.jsx** (10 min)

```jsx
// src/components/ui/ShareLink.jsx
import { Copy, Download } from "lucide-react";
import toast from "react-hot-toast";

const ShareLink = ({ qrCodeUrl, shareLink, hackathonCode }) => {
  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast.success("Link copied to clipboard!");
  };

  const downloadQR = () => {
    const link = document.createElement("a");
    link.href = qrCodeUrl;
    link.download = `${hackathonCode}-qr.png`;
    link.click();
    toast.success("QR code downloaded!");
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <img
          src={qrCodeUrl}
          alt="Hackathon QR"
          className="w-48 h-48 rounded-xl"
        />
      </div>
      <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
        <input
          value={shareLink}
          readOnly
          className="flex-1 bg-transparent text-gray-300 text-sm"
        />
        <button onClick={copyLink} className="btn btn-sm btn-ghost">
          <Copy className="w-4 h-4" />
        </button>
      </div>
      <button onClick={downloadQR} className="btn btn-primary w-full">
        <Download className="w-4 h-4" />
        Download QR Code
      </button>
    </div>
  );
};
```

**Checkpoint**: Components render with mock data

---

### Phase 2: Landing Page Enhancement (1 hour)

#### Hour 1:30 - 2:00 | Enhanced Landing Page

1. **Update Landing.jsx** (30 min)

```jsx
// src/pages/Landing.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHackathon } from "../context/HackathonContext";
import CodeInput from "../components/ui/CodeInput";
import toast from "react-hot-toast";

const Landing = () => {
  const [hackathonCode, setHackathonCode] = useState("");
  const { verifyHackathonCode } = useHackathon();
  const navigate = useNavigate();

  const handleEnter = () => {
    if (verifyHackathonCode(hackathonCode)) {
      toast.success("Hackathon code verified!");
      navigate(`/hackathon/${hackathonCode}`);
    } else {
      toast.error("Invalid hackathon code");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <h1 className="text-4xl sm:text-6xl font-bold text-white mb-4 text-center">
          AeroHacks 2026
        </h1>
        <p className="text-lg sm:text-xl text-gray-300 mb-8 text-center">
          Smart College Hackathon Management System
        </p>

        {/* Hackathon Code Entry */}
        <div className="w-full max-w-md space-y-4">
          <CodeInput
            prefix=""
            placeholder="Enter Hackathon Code (e.g., AERO-2026-HC1234)"
            value={hackathonCode}
            onChange={setHackathonCode}
          />
          <button
            onClick={handleEnter}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all"
          >
            Enter Hackathon
          </button>
        </div>

        {/* Host Hackathon Button */}
        <div className="mt-12">
          <button
            onClick={() => navigate("/host")}
            className="px-6 py-3 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-lg font-medium transition-all"
          >
            Host a Hackathon
          </button>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-4xl">
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-2">
              Participants
            </h3>
            <p className="text-sm text-gray-400">
              Register teams, get QR codes, submit projects
            </p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-2">Judges</h3>
            <p className="text-sm text-gray-400">
              Evaluate teams with standardized rubrics
            </p>
          </div>
          <div className="p-6 bg-white/5 border border-white/10 rounded-xl">
            <h3 className="text-lg font-semibold text-white mb-2">Admins</h3>
            <p className="text-sm text-gray-400">
              Scan QR codes, manage entries, publish results
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Checkpoint**: Landing page accepts code, redirects on success

---

#### Hour 2:00 - 2:30 | Role Selection Page

1. **Create RoleSelection.jsx** (30 min)

```jsx
// src/pages/RoleSelection.jsx
import { useNavigate, useParams } from "react-router-dom";
import { useHackathon } from "../context/HackathonContext";
import { Users, Shield, Scale } from "lucide-react";

const RoleSelection = () => {
  const navigate = useNavigate();
  const { code } = useParams();
  const { currentHackathon } = useHackathon();

  const roles = [
    {
      name: "Participant",
      icon: <Users className="w-12 h-12" />,
      description: "Register your team and participate",
      path: "/participant/auth",
      color: "from-blue-500 to-cyan-500",
    },
    {
      name: "Admin",
      icon: <Shield className="w-12 h-12" />,
      description: "Manage entries and operations",
      path: "/admin/auth",
      color: "from-purple-500 to-pink-500",
    },
    {
      name: "Judge",
      icon: <Scale className="w-12 h-12" />,
      description: "Evaluate team submissions",
      path: "/judge/auth",
      color: "from-orange-500 to-red-500",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            {currentHackathon?.eventName}
          </h1>
          <p className="text-gray-400">Select your role to continue</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {roles.map((role) => (
            <button
              key={role.name}
              onClick={() => navigate(role.path)}
              className="p-8 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group"
            >
              <div
                className={`w-20 h-20 rounded-full bg-gradient-to-br ${role.color} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}
              >
                {role.icon}
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                {role.name}
              </h3>
              <p className="text-sm text-gray-400">{role.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
```

**Checkpoint**: Role selection displays, navigates to auth pages

---

### Phase 3: Role Authentication (30 min)

#### Hour 2:30 - 3:00 | Role Auth Page

1. **Create RoleAuth.jsx** (30 min)

```jsx
// src/pages/RoleAuth.jsx
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useHackathon } from "../context/HackathonContext";
import CodeInput from "../components/ui/CodeInput";
import toast from "react-hot-toast";

const RoleAuth = () => {
  const [code, setCode] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyRoleCode } = useHackathon();

  const role = location.pathname.split("/")[1]; // Extract role from path

  const roleDetails = {
    participant: {
      title: "Participant Access",
      prefix: "P-",
      placeholder: "A3F9K2H8",
      redirectTo: "/participant",
    },
    admin: {
      title: "Admin Access",
      prefix: "A-",
      placeholder: "12345678",
      redirectTo: "/admin",
    },
    judge: {
      title: "Judge Access",
      prefix: "J-",
      placeholder: "87654321",
      redirectTo: "/judge",
    },
  };

  const details = roleDetails[role];

  const handleVerify = () => {
    const fullCode = details.prefix + code;
    if (verifyRoleCode(role, fullCode)) {
      toast.success(`${details.title} granted!`);
      navigate(details.redirectTo);
    } else {
      toast.error("Invalid code");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            {details.title}
          </h1>
          <p className="text-gray-400">Enter your {role} code to continue</p>
        </div>

        <div className="space-y-4">
          <CodeInput
            prefix={details.prefix}
            placeholder={details.placeholder}
            value={code}
            onChange={setCode}
          />
          <button
            onClick={handleVerify}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all"
          >
            Verify Code
          </button>
        </div>
      </div>
    </div>
  );
};
```

**Checkpoint**: Code verification works, redirects to dashboards

---

### Phase 4: Host Hackathon Flow (1.5 hours)

#### Hour 3:00 - 3:30 | Hackathon Setup Form

1. **Create HackathonSetupForm.jsx** (30 min)

```jsx
// src/components/features/HackathonSetupForm.jsx
import { useState } from "react";
import { Calendar, MapPin, Users, FileText } from "lucide-react";

const HackathonSetupForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    eventName: "",
    date: "",
    venue: "",
    maxTeams: 50,
    problemStatements: [],
  });

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Event Name <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
          <FileText className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={formData.eventName}
            onChange={(e) => handleChange("eventName", e.target.value)}
            className="flex-1 bg-transparent text-white focus:outline-none"
            placeholder="AeroHacks 2026"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Date <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={formData.date}
              onChange={(e) => handleChange("date", e.target.value)}
              className="flex-1 bg-transparent text-white focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Max Teams <span className="text-red-400">*</span>
          </label>
          <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
            <Users className="w-4 h-4 text-gray-400" />
            <input
              type="number"
              value={formData.maxTeams}
              onChange={(e) => handleChange("maxTeams", +e.target.value)}
              className="flex-1 bg-transparent text-white focus:outline-none"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">
          Venue <span className="text-red-400">*</span>
        </label>
        <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-lg">
          <MapPin className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={formData.venue}
            onChange={(e) => handleChange("venue", e.target.value)}
            className="flex-1 bg-transparent text-white focus:outline-none"
            placeholder="DJ Sanghvi College"
            required
          />
        </div>
      </div>

      <button
        type="submit"
        className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium transition-all"
      >
        Generate Hackathon Codes
      </button>
    </form>
  );
};
```

**Checkpoint**: Form accepts inputs, triggers onSubmit

---

#### Hour 3:30 - 4:00 | Code Generator Component

1. **Create CodeGenerator.jsx** (30 min)

```jsx
// src/components/features/CodeGenerator.jsx
import { Copy, Download } from "lucide-react";
import toast from "react-hot-toast";
import ShareLink from "../ui/ShareLink";

const CodeGenerator = ({ hackathon }) => {
  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copied!");
  };

  const downloadCodes = () => {
    const content = `
Hackathon: ${hackathon.eventName}
Hackathon Code: ${hackathon.hackathonCode}
Admin Code: ${hackathon.codes.admin}
Judge Code: ${hackathon.codes.judge}

Participant Codes:
${hackathon.codes.participants.join("\n")}
    `.trim();

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${hackathon.hackathonCode}-codes.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("Codes downloaded!");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">
          Hackathon Created Successfully!
        </h2>
        <p className="text-gray-400">
          Share these codes with your participants
        </p>
      </div>

      {/* Hackathon Code */}
      <div className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-3">
          Hackathon Code
        </h3>
        <div className="flex items-center justify-between gap-4">
          <code className="text-2xl font-mono text-indigo-400">
            {hackathon.hackathonCode}
          </code>
          <button
            onClick={() => copyCode(hackathon.hackathonCode)}
            className="btn btn-sm btn-ghost"
          >
            <Copy className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* QR Code & Share Link */}
      <div className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-xl">
        <h3 className="text-lg font-semibold text-white mb-3">Share</h3>
        <ShareLink
          qrCodeUrl={hackathon.qrCodeUrl}
          shareLink={hackathon.shareLink}
          hackathonCode={hackathon.hackathonCode}
        />
      </div>

      {/* Admin & Judge Codes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <h4 className="text-sm font-semibold text-red-400 mb-2">
            Admin Code
          </h4>
          <div className="flex items-center justify-between">
            <code className="text-lg font-mono text-white">
              {hackathon.codes.admin}
            </code>
            <button
              onClick={() => copyCode(hackathon.codes.admin)}
              className="btn btn-xs btn-ghost"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl">
          <h4 className="text-sm font-semibold text-orange-400 mb-2">
            Judge Code
          </h4>
          <div className="flex items-center justify-between">
            <code className="text-lg font-mono text-white">
              {hackathon.codes.judge}
            </code>
            <button
              onClick={() => copyCode(hackathon.codes.judge)}
              className="btn btn-xs btn-ghost"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Participant Codes */}
      <div className="p-4 sm:p-6 bg-white/5 border border-white/10 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">
            Participant Codes ({hackathon.codes.participants.length})
          </h3>
          <button onClick={downloadCodes} className="btn btn-sm btn-primary">
            <Download className="w-4 h-4" />
            Download All
          </button>
        </div>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {hackathon.codes.participants.slice(0, 10).map((code, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2 bg-white/5 rounded"
            >
              <code className="text-sm font-mono text-gray-300">{code}</code>
              <button
                onClick={() => copyCode(code)}
                className="btn btn-xs btn-ghost"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
          ))}
          {hackathon.codes.participants.length > 10 && (
            <p className="text-xs text-gray-500 text-center pt-2">
              +{hackathon.codes.participants.length - 10} more codes (download
              to see all)
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
```

**Checkpoint**: Codes display, copy/download works

---

#### Hour 4:00 - 4:30 | Host Hackathon Page

1. **Create HostHackathon.jsx** (30 min)

```jsx
// src/pages/HostHackathon.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHackathon } from "../context/HackathonContext";
import HackathonSetupForm from "../components/features/HackathonSetupForm";
import CodeGenerator from "../components/features/CodeGenerator";
import { ArrowLeft } from "lucide-react";

const HostHackathon = () => {
  const [created, setCreated] = useState(null);
  const { createHackathon } = useHackathon();
  const navigate = useNavigate();

  const handleCreate = (formData) => {
    const newHackathon = createHackathon(formData);
    setCreated(newHackathon);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-4xl mx-auto py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
            Host a Hackathon
          </h1>
          <p className="text-gray-400">
            Create a new hackathon and generate access codes
          </p>
        </div>

        {/* Content */}
        {!created ? (
          <div className="p-6 sm:p-8 bg-white/5 border border-white/10 rounded-2xl">
            <HackathonSetupForm onSubmit={handleCreate} />
          </div>
        ) : (
          <CodeGenerator hackathon={created} />
        )}
      </div>
    </div>
  );
};
```

**Checkpoint**: Full flow works - form submit → codes generated → QR displayed

---

### Phase 5: Integration & Testing (30 min)

#### Hour 4:30 - 5:00 | Final Integration

1. **Update main.jsx to add HackathonProvider** (5 min)

```jsx
//src/main.jsx
<HackathonProvider>
  <TeamProvider>
    <AuthProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </AuthProvider>
  </TeamProvider>
</HackathonProvider>
```

2. **Test Full Authentication Flow** (15 min)

- Landing → Enter hackathon code → Role selection → Enter role code → Dashboard
- Host → Create hackathon → Generate codes → Copy/download
- Try direct URL access (should redirect)

3. **Test Existing Features Still Work** (10 min)

- Team registration with Unstop import
- QR code generation
- Judge evaluation
- Send to Admin → Publish Results
- Leaderboard access control
- Responsive design on mobile

**Checkpoint**: All v1.0 features work + v2.0 security layer active

---

## 8. ORIGINAL 5-HOUR EXECUTION TIMELINE (v1.0 - ✅ COMPLETED)

### Hour 0:00 - 0:20 | Setup & Dependencies

```bash
# Install packages
npm install react-router-dom lucide-react daisyui

# Add to index.css
@import "tailwindcss";
```

Create contexts:

- AuthContext (15 lines)
- TeamContext (40 lines)
- ThemeContext (20 lines)

**Checkpoint**: `npm run dev` works, contexts accessible

---

### Hour 0:20 - 0:40 | Layout System

Build:

- `Navbar.jsx` with DaisyUI navbar component
- `Sidebar.jsx` with collapsible menu
- `Layout.jsx` wrapper with Outlet

**Checkpoint**: Navigate to `/participant`, see layout

---

### Hour 0:40 - 1:10 | Landing Page

```jsx
// src/pages/Landing.jsx
<div className="hero min-h-screen bg-base-200">
  <div className="hero-content text-center">
    <div className="max-w-md">
      <h1 className="text-5xl font-bold">AeroHacks</h1>
      <p className="py-6">Smart College Hackathon Management</p>
      <div className="flex gap-4 justify-center">
        <Link to="/participant" className="btn btn-primary">
          Enter as Participant
        </Link>
        <Link to="/admin" className="btn btn-secondary">
          Admin Panel
        </Link>
        <Link to="/judge" className="btn btn-accent">
          Judge Panel
        </Link>
      </div>
    </div>
  </div>
</div>
```

**Checkpoint**: Click buttons, land on correct pages

---

### Hour 1:10 - 2:10 | Participant Dashboard (60 min)

**1:10 - 1:35**: Team Registration Form

- Input fields: Team Name, Members max(4) min(2) add team member, Problem Statement (id) , GitHub, PPT file upload(mocked)
- Save to TeamContext on blur
- Show success toast
  Team member layout :-
  Name, email, mob no (fake verification), college, resume (fake verification and upload),digi locker based aadhar verification (mocked verfication and data)
- also add import from unstop btn which imports that data of your team
  Team Name - Decrypters,
  Members -
  1. Pratham Kataria (Team Leader), mob no - 9326418140, college - Dwarkadas J Sanghvi College of Engineering.
  2. Mohit Sidhani, mob no - 8923922390, college - Dwarkadas J Sanghvi College of Engineering.
  3. Om Upadhyay, mob no - 9324769110, college - Dwarkadas J Sanghvi College of Engineering.
  4. Bhavya Kuwadia, mob no - 8850161360, college - SPIT, Mumbai

**1:35 - 1:50**: QR Code Display

- Generate QR from team name (use `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${teamName}`)
- Display with copy button

**1:50 - 2:10**: Status Cards

- 4 cards: Registration Status, Entry Status, Meal Status
- Conditionally styled based on mock data

**Checkpoint**: Form saves, QR appears, cards update

---

### Hour 2:10 - 3:00 | Admin Dashboard (50 min)

**2:10 - 2:30**: Stats Cards Row

```jsx
<div className="stats shadow">
  <StatsCard title="Total Participants" value="248" icon={<Users />} />
  <StatsCard title="Teams" value="62" icon={<Users />} />
  <StatsCard title="Meals Served" value="186" icon={<Coffee />} />
</div>
```

**2:30 - 2:50**: QR Scanner Mock UI

```jsx
const [scanning, setScanning] = useState(false);
const simulateScan = () => {
  setScanning(true);
  setTimeout(() => {
    // Update entry log
    setScanning(false);
    toast.success("Entry recorded!");
  }, 1500);
};
```

**2:50 - 3:00**: Recent Entries Table (last 10 logs)

**Checkpoint**: Click "Scan QR", see animation, log updates

---

### Hour 3:00 - 3:45 | Judge Dashboard (45 min)

**3:00 - 3:20**: Team Selection Dropdown

- Populate from TeamContext
- Show selected team details

**3:20 - 3:40**: Evaluation Form

```jsx
<div className="form-control">
  <label>Innovation (1-10)</label>
  <input
    type="range"
    min="1"
    max="10"
    className="range range-primary"
    value={scores.innovation}
    onChange={(e) => setScores({ ...scores, innovation: +e.target.value })}
  />
  <span>{scores.innovation}</span>
</div>
```

**3:40 - 3:45**: Submit Button

- Call `updateTeamScore` from context
- Show success toast

**Checkpoint**: Submit scores, verify localStorage update

---

### Hour 3:45 - 4:15 | Leaderboard (30 min)

**3:45 - 4:00**: Table Header + Sort Logic

```jsx
const sorted = [...teams].sort((a, b) => b.totalScore - a.totalScore);
```

**4:00 - 4:10**: Team Rows with Rank Badges

```jsx
<tr className={rank <= 3 ? "bg-warning" : ""}>
  <td>{rank}</td>
  <td>{team.teamName}</td>
  <td>{team.totalScore}</td>
</tr>
```

**4:10 - 4:15**: Score Breakdown Tooltip

**Checkpoint**: Leaderboard updates after judge submits scores

---

### Hour 4:15 - 4:35 | Mock Data & Polishing (20 min)

**4:15 - 4:25**: Populate `mockData.js` with 15 teams

- Realistic names, problem statements
- Varied scores (20-40 range)
- Mix of submission statuses

**4:25 - 4:35**: Add transitions

```css
.btn {
  @apply transition-all duration-200;
}
.card {
  @apply hover:shadow-xl;
}
```

**Checkpoint**: All pages have realistic data

---

### Hour 4:35 - 5:00 | Bandwidth Mode & Testing (25 min)

**4:35 - 4:50**: Bandwidth Toggle

```jsx
// ThemeContext
const toggleBandwidth = () => {
  const newMode = mode === "normal" ? "light" : "normal";
  setMode(newMode);
  document.documentElement.setAttribute("data-theme", newMode);
};
```

```css
/* index.css */
[data-theme="light"] {
  --color-bg: #000;
  --color-text: #0f0;
}
[data-theme="light"] img {
  display: none;
}
```

**4:50 - 5:00**: Full Demo Walkthrough

- Test all click paths
- Verify mobile responsiveness
- Check for console errors

**Checkpoint**: Complete MVP ready to demo

---

## 9. UPDATED MVP BOUNDARY (v2.0)

### ✅ COMPLETED (v1.0)

- ✅ All 8 original pages with routing
- ✅ Team registration + QR display (with Unstop import)
- ✅ Mock QR scanner with success animation
- ✅ Judge evaluation form with 4 rubrics
- ✅ Sorted leaderboard with role-based access
- ✅ Responsive navbar + sidebar (mobile, tablet, desktop)
- ✅ Bandwidth toggle
- ✅ Result workflow system (3-state control)
- ✅ Team registration with full member details
- ✅ Aadhaar + Mobile verification (mocked)
- ✅ "Send to Admin" + "Publish Results" workflow
- ✅ Back to Dashboard navigation in Leaderboard
- ✅ Complete responsive design overhaul
- ✅ Admin entry logs pagination
- ✅ Team submissions page (view PPTs/GitHub)
- ✅ Participant profile page (ID upload preview)
- ✅ Toast notifications

### 🎯 TO BUILD (v2.0 Security Layer)

- 🆕 Two-layer authentication system
- 🆕 Hackathon code verification on landing
- 🆕 Role selection page
- 🆕 Individual role code verification
- 🆕 Host hackathon page with form
- 🆕 Code generator component
- 🆕 QR code + share link generation
- 🆕 HackathonContext with code validation
- 🆕 ProtectedRoute component
- 🆕 CodeInput + ShareLink UI components
- 🆕 mockHackathons data structure

### ⚠️ BUILD IF TIME (P1)

- Hackathon management dashboard (edit details, analytics)
- Search/filter in leaderboard (already responsive)
- Export participant codes as Excel
- Email notifications simulation
- Multi-judge averaging (currently single judge)
- Team status badges (registered, submitted, evaluated)

### ❌ SKIP ENTIRELY (P2)

- Real face verification
- AI PPT evaluation
- GitHub API integration (live repo analysis)
- Real Aadhaar masking/verification
- Email OTP (already mocked)
- Backend API calls (using Context + localStorage)
- Advanced authentication (JWT, sessions)
- Form validation (accepting all inputs)
- Error boundaries
- Loading skeletons
- Unit tests
- Deployment configuration

---

## 10. FINAL DEMO READINESS CHECKLIST (v2.0)

### Pre-Demo (5 minutes before)

- [ ] `npm run dev` starts without errors
- [ ] Landing page loads in < 1 second with hackathon code input
- [ ] Browser console shows 0 errors
- [ ] Mobile view tested (cmd+shift+M in DevTools)
- [ ] Test hackathon codes ready: `AERO-2026-HC1234`
- [ ] Test role codes ready: `P-A3F9K2H8`, `A-12345678`, `J-87654321`

### 🆕 Host Hackathon Flow (45 seconds)

- [ ] Click "Host a Hackathon" on landing
- [ ] Fill hackathon details form (any data)
- [ ] Click "Generate Codes"
- [ ] Codes display with QR code
- [ ] Copy hackathon code works
- [ ] Download QR code works
- [ ] Download all participant codes works

### 🆕 Participant Flow with Auth (60 seconds)

- [ ] Enter hackathon code on landing: `AERO-2026-HC1234`
- [ ] Code verified → Role selection page appears
- [ ] Click "Enter as Participant"
- [ ] Enter participant code: `P-A3F9K2H8`
- [ ] Code verified → Lands on Participant Dashboard
- [ ] Fill team registration form (any data)
- [ ] Click "Import from Unstop" (data auto-fills)
- [ ] QR code appears instantly
- [ ] Navigate to Profile, fake upload works
- [ ] Leaderboard link appears after RESULTS_PUBLISHED

### 🆕 Admin Flow with Auth (60 seconds)

- [ ] Enter hackathon code on landing: `AERO-2026-HC1234`
- [ ] Click "Admin Panel"
- [ ] Enter admin code: `A-12345678`
- [ ] Code verified → Lands on Admin Dashboard
- [ ] Stats cards show numbers
- [ ] Click "Scan QR Code"
- [ ] Success animation plays
- [ ] Entry log updates with new row
- [ ] "Publish Results" button visible when status is SENT_TO_ADMIN
- [ ] Click "Publish Results" → Status changes to RESULTS_PUBLISHED

### 🆕 Judge Flow with Auth (90 seconds)

- [ ] Enter hackathon code on landing: `AERO-2026-HC1234`
- [ ] Click "Judge Panel"
- [ ] Enter judge code: `J-87654321`
- [ ] Code verified → Lands on Judge Dashboard
- [ ] Select team from list
- [ ] Move all 4 sliders (Innovation, Feasibility, Technical, Presentation)
- [ ] Total score calculates live
- [ ] Click "Submit Scores", toast appears
- [ ] Repeat for multiple teams
- [ ] Click "Send to Admin" → Status changes to SENT_TO_ADMIN
- [ ] Navigate to Leaderboard (always visible to judge)
- [ ] Updated scores reflect in ranking

### 🆕 Security Checks

- [ ] Direct URL access to `/participant` redirects to landing (no hackathon code)
- [ ] Direct URL access to `/admin` redirects to landing (no role code)
- [ ] Changing role in URL (participant → admin) redirects to landing
- [ ] Refresh page preserves authentication (localStorage)
- [ ] Hackathon code persists across role switches

### Bonus Features (if time allows)

- [ ] Toggle bandwidth mode (colors invert)
- [ ] Sidebar collapses on mobile
- [ ] View team submissions page
- [ ] Responsive design works on 320px mobile
- [ ] All buttons have touch-friendly sizes (min 44px)

### Judge Flow (45 seconds)

- [ ] Click "Judge Panel"
- [ ] Select team from dropdown
- [ ] Move all 4 sliders
- [ ] Total score calculates live
- [ ] Click Submit, toast appears
- [ ] Navigate to Leaderboard
- [ ] Updated score reflects in ranking

### Bonus Features (if time allows)

- [ ] Toggle bandwidth mode (colors invert)
- [ ] Sidebar collapses on mobile
- [ ] View team submissions page

### Showstopper Checks

- [ ] No "404 Not Found" errors
- [ ] No blank white screens
- [ ] Images load (use placeholders if needed)
- [ ] Clicking "Back" button works
- [ ] Page refreshes don't break state

---

## COPY-PASTE STARTER CODE

### Install Command

```bash
npm install react-router-dom lucide-react daisyui
```

### Tailwind Config (tailwind.config.js)

```js
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  plugins: [require("daisyui")],
  daisyui: {
    themes: ["light", "dark"],
  },
};
```

### Context Provider Wrapper (main.jsx)

```jsx
import { AuthProvider } from "./context/AuthContext";
import { TeamProvider } from "./context/TeamContext";
import { ThemeProvider } from "./context/ThemeContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <AuthProvider>
      <TeamProvider>
        <ThemeProvider>
          <App />
        </ThemeProvider>
      </TeamProvider>
    </AuthProvider>
  </StrictMode>,
);
```

### Mock QR Generator Utility (utils/helpers.js)

```javascript
export const generateQR = (data) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;

export const calculateTotal = (scores) =>
  Object.values(scores).reduce((sum, val) => sum + val, 0);

export const formatTimestamp = (iso) =>
  new Date(iso).toLocaleString("en-IN", {
    dateStyle: "short",
    timeStyle: "short",
  });
```

---

## 11. CRITICAL SUCCESS FACTORS (v2.0)

### Development Principles

1. **Security First**: Two-layer auth prevents unauthorized access
2. **Speed over Perfection**: Use Context + localStorage, skip backend
3. **Copy-Paste Mock Data**: Use provided code snippets
4. **Skip Real Validation**: Accept any code format for demo
5. **Use External QR API**: `https://api.qrserver.com/v1/create-qr-code/`
6. **Test Every Auth Path**: Broken security flow kills credibility

### Key Differentiators (v2.0)

- ✅ **Hackathon-specific access**: Multi-tenancy simulation
- ✅ **Role separation**: Prevents privilege escalation
- ✅ **Host dashboard**: Self-service hackathon creation
- ✅ **Shareable codes**: QR + link generation
- ✅ **Responsive security UI**: Works on all devices

---

## 12. UPDATED DEMO SCRIPT (4 minutes)

### **[0:00-0:45] Problem Statement + Security**

"Traditional hackathons face chaos in registration, access control, and evaluation. Our system adds enterprise-grade security while digitizing the entire lifecycle."

_Show Landing Page_
"Notice the two-layer authentication: First, organizers create a hackathon and generate codes. Participants use these codes to access specific events."

### **[0:45-1:30] Host Journey (New!)**

_Click "Host a Hackathon"_
"Organizers fill out event details—name, date, venue, max teams. Click Generate Codes—"

_Show generated codes page_
"Instantly get: Hackathon code for participants, separate admin/judge codes, and 100+ participant codes. Download as QR or text file. Share via link."

### **[1:30-2:15] Participant Journey with Auth**

_Go back to landing, enter hackathon code_
"Participants enter the hackathon code—verified. Choose role—"

_Click Participant, enter participant code_
"Enter individual participant code—verified. Now they register teams with Unstop integration—"

_Click Import from Unstop_
"Auto-fills all member details: names, colleges, Aadhaar verification mocked. Instant QR code for entry and meals."

### **[2:15-3:00] Admin Security Operations**

_Enter hackathon code, select Admin, enter admin code_
"Admins have separate access codes. Scan QR codes at gates—"

_Click Scan QR_
"Instant logging with fraud prevention. After judges evaluate, admins publish results to participants."

### **[3:00-3:45] Judge Evaluation Workflow**

_Enter judge code, evaluate team_
"Judges also have unique codes. Evaluate teams with 4 standardized rubrics—Innovation, Feasibility, Technical, Presentation. Total auto-calculates."

_Click "Send to Admin"_
"Once all teams evaluated, send to admin for publishing. Leaderboard visibility is role-based:\n- Judges: Always visible\n- Admins: After sent to admin\n- Participants: After published"

### **[3:45-4:00] Scalability & Mobile**

_Toggle bandwidth mode, resize window_
"Fully responsive—320px to 4K. Bandwidth mode works on 2G. Multi-hackathon support—create unlimited events with isolated data. Built with React 19, ready to scale."

---

## 13. TROUBLESHOOTING GUIDE (v2.0)

| Issue                           | Fix                                                   |
| ------------------------------- | ----------------------------------------------------- |
| Auth redirect loop              | Clear localStorage, restart dev server                |
| Codes not validating            | Check prefix format: `AERO-2026-HC`, `P-`, `A-`, `J-` |
| Protected route not working     | Verify HackathonProvider wraps App in main.jsx        |
| Direct URL access bypasses auth | ProtectedRoute should check localStorage              |
| Hackathon code not persisting   | Check localStorage.setItem in context                 |
| Routing breaks                  | Check `<BrowserRouter>` wraps `<Routes>`              |
| Context undefined               | Verify provider order in main.jsx                     |
| Styles not loading              | Run `npm run dev` again, check Tailwind import        |
| localStorage empty              | Initialize with mockData on first load                |
| Page blank                      | Check console, likely missing import                  |
| Generated codes not displaying  | Check code generator utility return values            |

---

## 14. FINAL OUTPUT (v2.0)

### At Hour 5:00, you should have:

#### ✅ Core Features (v1.0 - Completed)

- ✅ 8 fully navigable pages
- ✅ 3 distinct role dashboards (responsive)
- ✅ Working QR display + scanner simulation
- ✅ Live leaderboard with real scores
- ✅ Role-based access control (3-state result workflow)
- ✅ Team registration with Unstop import
- ✅ Member verification (Aadhaar + Mobile mocked)
- ✅ Bandwidth-light toggle
- ✅ Mobile responsive layout (320px - 4K)
- ✅ Zero console errors
- ✅ All components production-ready

#### 🆕 Security Features (v2.0 - To Implement)

- 🆕 Landing page with hackathon code entry
- 🆕 Host hackathon creation flow
- 🆕 Code generation system (hackathon, admin, judge, participant)
- 🆕 QR code + shareable link generation
- 🆕 Role selection page (after hackathon code)
- 🆕 Individual role authentication pages
- 🆕 Protected routes with two-layer auth
- 🆕 HackathonContext with validation
- 🆕 Code management (copy, download)
- 🆕 Multi-hackathon data structure
- 🆕 Security UI components (CodeInput, ShareLink)
- 🆕 Access control enforcement

### Demo Capability

- ✅ **v1.0**: Full participant/admin/judge workflows functional
- 🎯 **v2.0**: + Two-layer auth + Host hackathon + Code management

### Production Readiness

- ✅ Fully responsive (mobile, tablet, desktop)
- ✅ Glassmorphism design system implemented
- ✅ Touch-friendly buttons (min 44px targets)
- ✅ localStorage persistence working
- ✅ Context API state management stable
- 🆕 Route protection active
- 🆕 Multi-tenancy simulation ready
- ✅ Zero external dependencies (except QR API)

---

## 15. NEXT STEPS & RECOMMENDATIONS

### Immediate (Post v2.0 Implementation):

1. **Test all auth flows** - Ensure no bypass routes
2. **Verify code generation** - Generate 100+ codes without duplicates
3. **Test multi-hackathon** - Create 2 hackathons, verify data isolation
4. **Mobile testing** - Test on actual devices (not just DevTools)

### Short-term Enhancements:

- Add hackathon management dashboard (edit details, view analytics)
- Implement code expiry logic (time-bound access)
- Add bulk participant code generation (CSV export)
- Email/SMS simulation for code distribution

### Long-term (Backend Integration):

- Replace localStorage with actual database
- Implement JWT authentication
- Add real face verification with face-api.js
- GitHub API integration for repo analysis
- WebSocket for real-time leaderboard updates
- Deploy to cloud (Vercel/Netlify frontend + Node.js backend)

---

## 📝 IMPLEMENTATION SUMMARY

### Current Status:

- **v1.0**: ✅ COMPLETED - All core features working + responsive
- **v2.0**: 🎯 PLANNED - Security architecture documented

### Estimated Time to Complete v2.0:

- **Total**: 5 hours (as detailed in Section 7)
- **Phase 1 (Security Setup)**: 1.5 hours
- **Phase 2 (Landing Enhancement)**: 1 hour
- **Phase 3 (Role Auth)**: 0.5 hours
- **Phase 4 (Host Flow)**: 1.5 hours
- **Phase 5 (Integration & Testing)**: 0.5 hours

### Technical Stack:

- React 19.0.0
- Vite 7.3.1
- Tailwind CSS 4.2.0
- React Router DOM 7.1.1
- Lucide React (icons)
- Context API (state management)
- localStorage (persistence)
- External QR API

---

**🚀 YOU ARE NOW READY TO IMPLEMENT v2.0 SECURITY LAYER!**

**With v1.0 completed and v2.0 planned, you have:**

- ✅ A fully functional hackathon management system
- ✅ Complete responsive design
- 🎯 A clear roadmap for enterprise-grade security
- 🎯 Self-service hackathon hosting capability
- ✅ Production-ready demo for presentations

**SHIP IT!** 🎉
