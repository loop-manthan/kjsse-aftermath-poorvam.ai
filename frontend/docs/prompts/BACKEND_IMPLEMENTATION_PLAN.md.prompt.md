# AeroHacks Backend Implementation Plan (v3.0 - Complete Guide)

**Last Updated**: February 21, 2026  
**Version**: v3.0 (AI Shortlisting Included)  
**Status**: 🔴 Not Started  
**Estimated Time**: 15-20 hours  
**Priority**: P0 (Critical for Production)

---

## 📋 TABLE OF CONTENTS

1. [Executive Summary](#executive-summary)
2. [Tech Stack](#tech-stack)
3. [Project Structure](#project-structure)
4. [Database Design](#database-design)
5. [API Endpoints](#api-endpoints)
6. [AI Integration (v3.0)](#ai-integration-v30)
7. [Authentication & Security](#authentication--security)
8. [File Upload System](#file-upload-system)
9. [Real-time Features](#real-time-features)
10. [Email Service](#email-service)
11. [Implementation Steps](#implementation-steps)
12. [Testing Strategy](#testing-strategy)
13. [Deployment Guide](#deployment-guide)

---

## 1. EXECUTIVE SUMMARY

### Current State

- ✅ **Frontend Complete**: v3.0 with AI shortlisting UI
- ✅ **Mock Data**: All features work with localStorage
- 🔴 **Backend**: Not implemented (100% frontend-only)
- 🔴 **Database**: No persistence
- 🔴 **Authentication**: Mock codes only

### Objective

Build production-ready MERN backend with:

- Real MongoDB database
- REST API (80+ endpoints)
- JWT authentication
- AI grading integration (v3.0)
- File uploads (Cloudinary)
- Email notifications (SendGrid)
- WebSocket real-time updates

### Major v3.0 Features (Backend Focus)

1. **AI Grading Service**:
   - POST `/api/v1/ai/analyze/ppt` - Friend's AI API for PPT grading
   - POST `/api/v1/ai/analyze/resume` - Resume grading
   - Combined scoring algorithm
2. **Shortlisting Workflow**:
   - Batch AI grading for all teams
   - Admin selection of top N teams
   - Automatic QR code generation
   - Status transitions (REGISTERED → UNDER_REVIEW → SHORTLISTED/REJECTED)
3. **Enhanced Team Model**:
   - AI scores storage
   - Registration status tracking
   - Food coupon management
   - Individual member QR codes

---

## 2. TECH STACK

### Backend Dependencies

```json
{
  "name": "aerohacks-backend",
  "version": "3.0.0",
  "dependencies": {
    "express": "^4.21.0",
    "mongoose": "^8.4.0",
    "jsonwebtoken": "^9.0.2",
    "bcryptjs": "^2.4.3",
    "joi": "^17.13.0",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.2.0",
    "cloudinary": "^2.2.0",
    "multer": "^1.4.5-lts.1",
    "socket.io": "^4.7.0",
    "nodemailer": "^6.9.13",
    "@sendgrid/mail": "^8.1.3",
    "axios": "^1.7.9",
    "qrcode": "^1.5.3",
    "winston": "^3.13.0",
    "compression": "^1.7.4"
  },
  "devDependencies": {
    "nodemon": "^3.1.0",
    "jest": "^29.7.0",
    "supertest": "^7.0.0",
    "eslint": "^9.0.0"
  }
}
```

### External Services

| Service         | Purpose             | v3.0 Importance     |
| --------------- | ------------------- | ------------------- |
| MongoDB Atlas   | Database            | Critical            |
| Cloudinary      | File storage        | High                |
| Friend's AI API | PPT/Resume grading  | **Critical (v3.0)** |
| SendGrid        | Email notifications | High                |
| QR Code API     | QR generation       | High                |

---

## 3. PROJECT STRUCTURE

```
backend/
├── src/
│   ├── models/
│   │   ├── User.js                    # Admin, judge, host users
│   │   ├── Hackathon.js               # Event instances
│   │   ├── Team.js                    # v3.0 - Extended with AI fields
│   │   ├── Participant.js             # Individual members
│   │   ├── EntryLog.js                # QR scan logs
│   │   ├── Score.js                   # Judge evaluations
│   │   └── AIGrade.js                 # v3.0 - AI grading results
│   ├── routes/
│   │   ├── auth.routes.js             # Authentication
│   │   ├── hackathon.routes.js        # Hackathon CRUD
│   │   ├── team.routes.js             # v3.0 - Team + AI grading
│   │   ├── score.routes.js            # Judge scoring
│   │   ├── entryLog.routes.js         # QR scanning
│   │   ├── upload.routes.js           # File uploads
│   │   └── ai.routes.js               # v3.0 - AI integration
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── hackathon.controller.js
│   │   ├── team.controller.js         # v3.0 - Extended
│   │   ├── score.controller.js
│   │   ├── entryLog.controller.js
│   │   ├── upload.controller.js
│   │   └── ai.controller.js           # v3.0 - AI logic
│   ├── middleware/
│   │   ├── auth.middleware.js         # JWT validation
│   │   ├── validation.middleware.js   # Joi schemas
│   │   ├── upload.middleware.js       # Multer config
│   │   ├── error.middleware.js        # Error handling
│   │   └── rateLimiter.middleware.js  # Rate limiting
│   ├── services/
│   │   ├── ai.service.js              # v3.0 - Friend's AI API
│   │   ├── email.service.js           # SendGrid
│   │   ├── qr.service.js              # QR generation
│   │   ├── cloudinary.service.js      # File uploads
│   │   └── socket.service.js          # WebSocket
│   ├── config/
│   │   ├── database.js                # MongoDB connection
│   │   ├── cloudinary.js              # Cloudinary config
│   │   └── constants.js               # Enums, constants
│   ├── utils/
│   │   ├── logger.js                  # Winston logger
│   │   ├── codeGenerator.js           # Unique codes
│   │   └── validators.js              # Custom validators
│   ├── sockets/
│   │   ├── leaderboard.socket.js      # Real-time leaderboard
│   │   └── entryLog.socket.js         # Live entry logs
│   └── server.js                      # Express app entry
├── tests/
│   ├── unit/                          # Unit tests
│   ├── integration/                   # Integration tests
│   └── e2e/                           # End-to-end tests
├── .env.example                       # Environment template
├── .gitignore
├── package.json
└── README.md
```

---

## 4. DATABASE DESIGN

### 4.1 User Model

```javascript
// src/models/User.js
import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // Hashed with bcrypt
  role: {
    type: String,
    enum: ["host", "admin", "judge"],
    required: true,
  },
  hackathonCode: { type: String, ref: "Hackathon" },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("User", userSchema);
```

### 4.2 Hackathon Model (v2.0 + v3.0)

```javascript
// src/models/Hackathon.js
import mongoose from "mongoose";

const hackathonSchema = new mongoose.Schema({
  hackathonCode: {
    type: String,
    required: true,
    unique: true,
    index: true, // For fast lookups
  },
  eventName: { type: String, required: true },
  date: { type: Date, required: true },
  venue: { type: String, required: true },
  maxTeams: { type: Number, required: true },

  problemStatements: [{ type: String }],

  // v2.0 Authentication Codes
  codes: {
    admin: { type: String, required: true },
    judge: { type: String, required: true },
    participants: [{ type: String }], // 100+ codes
  },

  // v3.0 Shortlisting Configuration
  shortlistingConfig: {
    maxShortlistedTeams: { type: Number, default: 30 },
    useAiGrading: { type: Boolean, default: true },
    aiWeightPPT: { type: Number, default: 0.7 }, // 70%
    aiWeightResume: { type: Number, default: 0.3 }, // 30%
  },

  // v3.0 Registration Window
  registrationOpenDate: { type: Date },
  registrationCloseDate: { type: Date },

  // v3.0 Current Phase
  currentPhase: {
    type: String,
    enum: [
      "REGISTRATION_OPEN",
      "REGISTRATION_CLOSED",
      "SHORTLISTING",
      "SHORTLIST_ANNOUNCED",
      "EVENT_ONGOING",
      "JUDGING",
      "COMPLETED",
    ],
    default: "REGISTRATION_OPEN",
  },

  status: {
    type: String,
    enum: ["active", "completed", "cancelled"],
    default: "active",
  },

  hostId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  hostEmail: { type: String },

  qrCodeUrl: { type: String },
  shareLink: { type: String },

  // v3.0 Enhanced Stats
  stats: {
    registeredTeams: { type: Number, default: 0 },
    shortlistedTeams: { type: Number, default: 0 },
    rejectedTeams: { type: Number, default: 0 },
    checkedInParticipants: { type: Number, default: 0 },
    totalParticipants: { type: Number, default: 0 },
    entryLogs: { type: Number, default: 0 },
    mealsServed: { type: Number, default: 0 },
  },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Hackathon", hackathonSchema);
```

### 4.3 Team Model (v3.0 Extended - CRITICAL)

```javascript
// src/models/Team.js
import mongoose from "mongoose";

const memberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  mobile: { type: String, required: true },
  college: { type: String, required: true },

  // v3.0 Enhanced Fields
  aadhaar: { type: String }, // Masked
  isLeader: { type: Boolean, default: false },
  mobileVerified: { type: Boolean, default: false },
  aadhaarVerified: { type: Boolean, default: false },

  // v3.0 File URLs
  resumeUrl: { type: String }, // Cloudinary URL
  collegeIdUrl: { type: String },
  qrCode: { type: String }, // Individual QR per member
  idCardUrl: { type: String }, // Generated ID card
});

const teamSchema = new mongoose.Schema({
  hackathonCode: {
    type: String,
    ref: "Hackathon",
    required: true,
    index: true,
  },

  teamName: { type: String, required: true },
  members: [memberSchema], // 2-4 members

  problemStatement: { type: String, required: true },
  github: { type: String },
  pptUrl: { type: String }, // Cloudinary URL

  // v3.0 REGISTRATION STATUS (CRITICAL)
  registrationStatus: {
    type: String,
    enum: ["REGISTERED", "UNDER_REVIEW", "SHORTLISTED", "REJECTED"],
    default: "REGISTERED",
    index: true, // For fast filtering
  },

  registeredAt: { type: Date, default: Date.now },
  reviewedAt: { type: Date },
  shortlistedAt: { type: Date },

  // v3.0 AI GRADING (CRITICAL)
  aiScore: { type: Number, min: 0, max: 10 }, // Out of 10
  aiGradedAt: { type: Date },
  aiGradingStatus: {
    type: String,
    enum: ["pending", "processing", "completed", "error"],
    default: "pending",
  },
  aiGradingError: { type: String }, // Error message if failed

  // v3.0 AI Score Breakdown
  aiScoreBreakdown: {
    pptScore: { type: Number }, // Individual PPT score
    resumeScores: [{ type: Number }], // Array of resume scores
    combinedScore: { type: Number }, // Final weighted score
  },

  // Admin Management
  adminNotes: { type: String },

  // Judge Evaluation (only for shortlisted teams)
  scores: {
    innovation: { type: Number, min: 1, max: 10 },
    feasibility: { type: Number, min: 1, max: 10 },
    technical: { type: Number, min: 1, max: 10 },
    presentation: { type: Number, min: 1, max: 10 },
  },
  totalScore: { type: Number, min: 0, max: 40 },
  evaluatedAt: { type: Date },
  evaluatedBy: { type: String },

  // v3.0 Event Tracking
  isCheckedIn: { type: Boolean, default: false },
  checkedInAt: { type: Date },

  foodCoupons: {
    breakfast: { type: Boolean, default: false },
    lunch: { type: Boolean, default: false },
    dinner: { type: Boolean, default: false },
  },

  // Legacy
  isShortlisted: { type: Boolean, default: false }, // For compatibility
  submittedAt: { type: Date, default: Date.now },

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Index for AI score sorting (v3.0)
teamSchema.index({ aiScore: -1 });

// Index for leaderboard sorting
teamSchema.index({ totalScore: -1 });

export default mongoose.model("Team", teamSchema);
```

### 4.4 AIGrade Model (v3.0 NEW - For Detailed Tracking)

```javascript
// src/models/AIGrade.js
import mongoose from "mongoose";

const aiGradeSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
  },

  hackathonCode: { type: String, required: true },

  // PPT Grading
  ppt: {
    url: { type: String },
    score: { type: Number },
    breakdown: {
      content: { type: Number },
      design: { type: Number },
      clarity: { type: Number },
    },
    feedback: { type: String },
  },

  // Resume Grading (multiple resumes)
  resumes: [
    {
      memberName: { type: String },
      url: { type: String },
      score: { type: Number },
      breakdown: {
        experience: { type: Number },
        skills: { type: Number },
        education: { type: Number },
      },
      feedback: { type: String },
    },
  ],

  // Combined Score
  finalScore: { type: Number }, // Weighted average
  weights: {
    ppt: { type: Number, default: 0.7 },
    resume: { type: Number, default: 0.3 },
  },

  // Status
  status: {
    type: String,
    enum: ["pending", "processing", "completed", "error"],
    default: "pending",
  },

  error: { type: String },

  // API Call Info
  apiCallDuration: { type: Number }, // milliseconds
  apiVersion: { type: String },

  gradedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("AIGrade", aiGradeSchema);
```

### 4.5 EntryLog Model

```javascript
// src/models/EntryLog.js
import mongoose from "mongoose";

const entryLogSchema = new mongoose.Schema({
  hackathonCode: { type: String, required: true, index: true },

  participantId: { type: mongoose.Schema.Types.ObjectId, ref: "Participant" },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },

  studentName: { type: String, required: true },
  teamName: { type: String },
  email: { type: String },

  entryType: {
    type: String,
    enum: ["gate", "breakfast", "lunch", "dinner"],
    required: true,
  },

  qrData: { type: String },

  status: {
    type: String,
    enum: ["success", "duplicate", "invalid"],
    default: "success",
  },

  scannedBy: { type: String }, // Admin ID or name

  timestamp: { type: Date, default: Date.now },
});

// Index for real-time queries
entryLogSchema.index({ timestamp: -1 });

export default mongoose.model("EntryLog", entryLogSchema);
```

### 4.6 Score Model

```javascript
// src/models/Score.js
import mongoose from "mongoose";

const scoreSchema = new mongoose.Schema({
  teamId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Team",
    required: true,
  },

  judgeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  judgeName: { type: String },

  rubrics: {
    innovation: { type: Number, min: 1, max: 10, required: true },
    feasibility: { type: Number, min: 1, max: 10, required: true },
    technical: { type: Number, min: 1, max: 10, required: true },
    presentation: { type: Number, min: 1, max: 10, required: true },
  },

  totalScore: { type: Number, required: true },

  comments: { type: String },

  evaluatedAt: { type: Date, default: Date.now },
});

export default mongoose.model("Score", scoreSchema);
```

---

## 5. API ENDPOINTS

### 5.1 Authentication Endpoints

```javascript
// POST /api/auth/register
// Create new user (admin, judge, host)
Request:
{
  "name": "Admin User",
  "email": "admin@aerohacks.com",
  "password": "SecurePass123",
  "role": "admin",
  "hackathonCode": "AERO-2026-HC1234"
}

Response:
{
  "success": true,
  "user": {
    "_id": "...",
    "name": "Admin User",
    "email": "admin@aerohacks.com",
    "role": "admin"
  },
  "tokens": {
    "accessToken": "...",
    "refreshToken": "..."
  }
}

// POST /api/auth/login
Request:
{
  "email": "admin@aerohacks.com",
  "password": "SecurePass123"
}

Response: Same as register

// POST /api/auth/verify-hackathon-code
Request:
{
  "hackathonCode": "AERO-2026-HC1234"
}

Response:
{
  "success": true,
  "hackathon": {
    "hackathonCode": "AERO-2026-HC1234",
    "eventName": "AeroHacks 2026",
    "date": "2026-02-20",
    "currentPhase": "SHORTLISTING"
  }
}

// POST /api/auth/verify-role-code
Request:
{
  "hackathonCode": "AERO-2026-HC1234",
  "role": "admin",
  "code": "A-12345678"
}

Response:
{
  "success": true,
  "role": "admin",
  "verified": true
}

// POST /api/auth/refresh
Request:
{
  "refreshToken": "..."
}

Response:
{
  "accessToken": "..."
}
```

### 5.2 Hackathon Endpoints (v2.0)

```javascript
// POST /api/hackathons
// Create new hackathon instance
Request:
{
  "eventName": "AeroHacks 2026",
  "date": "2026-02-20",
  "venue": "DJ Sanghvi College",
  "maxTeams": 50,
  "problemStatements": ["Problem 1", "Problem 2"],
  "shortlistingConfig": {
    "maxShortlistedTeams": 30,
    "useAiGrading": true,
    "aiWeightPPT": 0.7,
    "aiWeightResume": 0.3
  }
}

Response:
{
  "success": true,
  "hackathon": {
    "hackathonCode": "AERO-2026-HC1234",
    "eventName": "AeroHacks 2026",
    "codes": {
      "admin": "A-12345678",
      "judge": "J-87654321",
      "participants": ["P-A3F9K2H8", ...]
    },
    "qrCodeUrl": "...",
    "shareLink": "..."
  }
}

// GET /api/hackathons/:code
Response:
{
  "success": true,
  "hackathon": { /* Full hackathon object */ },
  "stats": {
    "registeredTeams": 65,
    "shortlistedTeams": 30,
    "rejectedTeams": 35,
    /* ... */
  }
}

// PATCH /api/hackathons/:code
// Update hackathon details or phase
Request:
{
  "currentPhase": "SHORTLIST_ANNOUNCED"
}

Response:
{
  "success": true,
  "hackathon": { /* Updated hackathon */ }
}

// GET /api/hackathons/:code/stats
// Get real-time stats
Response:
{
  "success": true,
  "stats": {
    "registeredTeams": 65,
    "shortlistedTeams": 30,
    "rejectedTeams": 35,
    "checkedInParticipants": 28,
    "totalParticipants": 260,
    "entryLogs": 145,
    "mealsServed": 280
  }
}
```

### 5.3 Team Endpoints (v3.0 EXTENDED - CRITICAL)

```javascript
// POST /api/teams
// Register new team
Request:
{
  "hackathonCode": "AERO-2026-HC1234",
  "teamName": "Decrypters",
  "members": [
    {
      "name": "Pratham Kataria",
      "email": "pratham@djsce.edu",
      "mobile": "9326418140",
      "college": "DJ Sanghvi",
      "aadhaar": "XXXX XXXX 1140",
      "isLeader": true
    }
  ],
  "problemStatement": "Smart Hackathon System",
  "github": "https://github.com/decrypters/aerohacks"
}

Response:
{
  "success": true,
  "team": {
    "_id": "...",
    "teamName": "Decrypters",
    "registrationStatus": "REGISTERED",
    "registeredAt": "2026-02-20T10:00:00Z"
  }
}

// [v3.0 NEW] POST /api/teams/grade-all
// Trigger AI grading for all registered teams
Request:
{
  "hackathonCode": "AERO-2026-HC1234"
}

Response:
{
  "success": true,
  "message": "AI grading started for 65 teams",
  "totalTeams": 65,
  "estimatedTime": "10-15 minutes"
}
// Note: This is async, updates team status to UNDER_REVIEW

// [v3.0 NEW] POST /api/teams/:id/grade
// Trigger AI grading for single team
Request:
{
  "pptUrl": "https://cloudinary.com/ppt.pdf",
  "resumeUrls": ["https://cloudinary.com/resume1.pdf", ...]
}

Response:
{
  "success": true,
  "aiScore": 8.5,
  "breakdown": {
    "pptScore": 9.0,
    "resumeScores": [8.5, 8.0, 8.3],
    "combinedScore": 8.5
  },
  "team": {
    "_id": "...",
    "registrationStatus": "UNDER_REVIEW",
    "aiScore": 8.5,
    "aiGradedAt": "2026-02-20T10:30:00Z"
  }
}

// [v3.0 NEW] GET /api/hackathons/:code/teams/graded
// Get all teams with AI scores (for admin shortlisting page)
Query Params: ?sortBy=aiScore&order=desc

Response:
{
  "success": true,
  "teams": [
    {
      "_id": "...",
      "teamName": "Team Alpha",
      "aiScore": 9.2,
      "registrationStatus": "UNDER_REVIEW",
      "members": 4,
      "problemStatement": "..."
    },
    {
      "_id": "...",
      "teamName": "Team Beta",
      "aiScore": 8.7,
      /* ... */
    }
  ],
  "total": 65,
  "graded": 65,
  "pending": 0
}

// [v3.0 NEW] POST /api/hackathons/:code/teams/shortlist
// Finalize shortlist (select top N teams)
Request:
{
  "teamIds": ["team_id_1", "team_id_2", ...], // Array of team IDs
  "topN": 30 // Optional: auto-select top 30 by AI score
}

Response:
{
  "success": true,
  "shortlistedCount": 30,
  "rejectedCount": 35,
  "shortlistedTeams": [
    {
      "_id": "...",
      "teamName": "Team Alpha",
      "registrationStatus": "SHORTLISTED",
      "shortlistedAt": "2026-02-20T11:00:00Z",
      "members": [
        {
          "qrCode": "...", // Individual QR generated
          "idCardUrl": "..." // ID card generated
        }
      ]
    }
  ]
}

// GET /api/teams/:id
Response:
{
  "success": true,
  "team": { /* Full team object with members */ }
}

// PATCH /api/teams/:id
// Update team details (only before shortlisting)
Request:
{
  "github": "https://github.com/new-repo",
  "adminNotes": "Strong team, good communication"
}

Response:
{
  "success": true,
  "team": { /* Updated team */ }
}

// GET /api/hackathons/:code/teams
// Get all teams for hackathon
Query Params:
  ?status=SHORTLISTED
  &sortBy=totalScore
  &order=desc

Response:
{
  "success": true,
  "teams": [ /* Array of teams */ ],
  "total": 30
}
```

### 5.4 AI Grading Endpoints (v3.0 NEW - CRITICAL)

```javascript
// POST /api/v1/ai/analyze/ppt
// Grade PPT using friend's AI API
Request:
{
  "pptUrl": "https://cloudinary.com/uploads/ppt.pdf"
}

Response (from friend's API):
{
  "score": 9.0,
  "breakdown": {
    "content": 9.5,
    "design": 8.5,
    "clarity": 9.0
  },
  "feedback": "Strong presentation with clear objectives and good visual design"
}

// POST /api/v1/ai/analyze/resume
// Grade resume using friend's AI API
Request:
{
  "resumeUrl": "https://cloudinary.com/uploads/resume1.pdf"
}

Response (from friend's API):
{
  "score": 8.5,
  "breakdown": {
    "experience": 8.0,
    "skills": 9.0,
    "education": 8.5
  },
  "feedback": "Diverse skill set with relevant project experience"
}

// POST /api/v1/ai/grade-team
// Internal endpoint: Combines PPT + Resume scores
Request:
{
  "teamId": "...",
  "pptUrl": "...",
  "resumeUrls": ["...", "...", "..."]
}

Response:
{
  "success": true,
  "aiScore": 8.5,
  "breakdown": {
    "pptScore": 9.0,
    "resumeScores": [8.5, 8.0, 8.3],
    "averageResumeScore": 8.27,
    "combinedScore": 8.5 // (9.0 * 0.7) + (8.27 * 0.3)
  },
  "weights": {
    "ppt": 0.7,
    "resume": 0.3
  }
}
```

### 5.5 Score Endpoints (Judge Evaluation)

```javascript
// POST /api/scores
// Submit judge evaluation
Request:
{
  "teamId": "...",
  "rubrics": {
    "innovation": 10,
    "feasibility": 9,
    "technical": 10,
    "presentation": 10
  },
  "comments": "Excellent execution and presentation"
}

Response:
{
  "success": true,
  "score": {
    "_id": "...",
    "totalScore": 39,
    "evaluatedAt": "2026-02-20T15:00:00Z"
  }
}

// GET /api/hackathons/:code/scores
// Get all scores (for leaderboard)
Query Params: ?sortBy=totalScore&order=desc

Response:
{
  "success": true,
  "scores": [
    {
      "teamId": "...",
      "teamName": "Decrypters",
      "totalScore": 39,
      "rubrics": { /* ... */ }
    }
  ]
}

// POST /api/scores/send-to-admin
// Change result status to SENT_TO_ADMIN
Request:
{
  "hackathonCode": "AERO-2026-HC1234"
}

Response:
{
  "success": true,
  "status": "SENT_TO_ADMIN"
}

// POST /api/scores/publish-results
// Change result status to RESULTS_PUBLISHED
Request:
{
  "hackathonCode": "AERO-2026-HC1234"
}

Response:
{
  "success": true,
  "status": "RESULTS_PUBLISHED"
}
```

### 5.6 Entry Log Endpoints (QR Scanning)

```javascript
// POST /api/entry-logs
// Log QR scan
Request:
{
  "hackathonCode": "AERO-2026-HC1234",
  "qrData": "AERO-2026-HC1234-Decrypters-Pratham",
  "entryType": "gate", // gate | breakfast | lunch | dinner
  "scannedBy": "Admin-001"
}

Response:
{
  "success": true,
  "log": {
    "_id": "...",
    "studentName": "Pratham Kataria",
    "teamName": "Decrypters",
    "entryType": "gate",
    "status": "success", // success | duplicate | invalid
    "timestamp": "2026-02-20T08:15:00Z"
  }
}

// GET /api/entry-logs/:hackathonCode
// Get all entry logs
Query Params:
  ?type=gate
  &limit=50
  &skip=0

Response:
{
  "success": true,
  "logs": [ /* Array of entry logs */ ],
  "total": 145,
  "stats": {
    "gateEntries": 95,
    "breakfastClaims": 90,
    "lunchClaims": 85,
    "dinnerClaims": 75
  }
}

// GET /api/entry-logs/participant/:id
// Get logs for specific participant
Response:
{
  "success": true,
  "logs": [
    {
      "entryType": "gate",
      "timestamp": "2026-02-20T08:15:00Z",
      "status": "success"
    },
    {
      "entryType": "breakfast",
      "timestamp": "2026-02-20T08:30:00Z",
      "status": "success"
    }
  ]
}
```

### 5.7 File Upload Endpoints

```javascript
// POST /api/upload/resume
// Upload resume to Cloudinary
Request: multipart/form-data
{
  file: <PDF file>,
  teamId: "...",
  memberId: "..."
}

Response:
{
  "success": true,
  "url": "https://res.cloudinary.com/.../resume.pdf",
  "publicId": "resumes/team123_member456"
}

// POST /api/upload/ppt
Request: multipart/form-data
{
  file: <PPT file>,
  teamId: "..."
}

Response:
{
  "success": true,
  "url": "https://res.cloudinary.com/.../presentation.pptx",
  "publicId": "ppts/team123"
}

// POST /api/upload/college-id
Request: multipart/form-data
{
  file: <Image file>,
  teamId: "...",
  memberId: "..."
}

Response:
{
  "success": true,
  "url": "https://res.cloudinary.com/.../college_id.jpg",
  "publicId": "ids/team123_member456"
}

// POST /api/upload/profile-image
Request: multipart/form-data
{
  file: <Image file>,
  teamId: "...",
  memberId: "..."
}

Response:
{
  "success": true,
  "url": "https://res.cloudinary.com/.../profile.jpg",
  "publicId": "profiles/team123_member456"
}
```

---

## 6. AI INTEGRATION (v3.0) - CRITICAL SECTION

### 6.1 Friend's AI API Integration

```javascript
// src/services/ai.service.js
import axios from "axios";

const AI_API_BASE = process.env.AI_API_BASE_URL || "http://localhost:5000";
const AI_API_KEY = process.env.AI_API_KEY;

/**
 * Grade PPT using friend's AI API
 * @param {string} pptUrl - Cloudinary URL
 * @returns {Promise<Object>} - { score, breakdown, feedback }
 */
export const gradePPT = async (pptUrl) => {
  try {
    const response = await axios.post(
      `${AI_API_BASE}/api/v1/ai/analyze/ppt`,
      { pptUrl },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AI_API_KEY}`,
        },
        timeout: 60000, // 60 seconds
      },
    );

    return {
      score: response.data.score,
      breakdown: response.data.breakdown,
      feedback: response.data.feedback,
    };
  } catch (error) {
    console.error("PPT Grading Error:", error);
    throw new Error("AI PPT grading failed");
  }
};

/**
 * Grade Resume using friend's AI API
 * @param {string} resumeUrl - Cloudinary URL
 * @returns {Promise<Object>} - { score, breakdown, feedback }
 */
export const gradeResume = async (resumeUrl) => {
  try {
    const response = await axios.post(
      `${AI_API_BASE}/api/v1/ai/analyze/resume`,
      { resumeUrl },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${AI_API_KEY}`,
        },
        timeout: 60000,
      },
    );

    return {
      score: response.data.score,
      breakdown: response.data.breakdown,
      feedback: response.data.feedback,
    };
  } catch (error) {
    console.error("Resume Grading Error:", error);
    throw new Error("AI resume grading failed");
  }
};

/**
 * Grade entire team (PPT + all resumes)
 * @param {Object} team - Team object with URLs
 * @param {Object} weights - { ppt: 0.7, resume: 0.3 }
 * @returns {Promise<Object>} - Combined score
 */
export const gradeTeam = async (team, weights = { ppt: 0.7, resume: 0.3 }) => {
  try {
    // Grade PPT
    const pptResult = await gradePPT(team.pptUrl);

    // Grade all resumes
    const resumeResults = await Promise.all(
      team.members.map((member) => gradeResume(member.resumeUrl)),
    );

    // Calculate average resume score
    const averageResumeScore =
      resumeResults.reduce((sum, r) => sum + r.score, 0) / resumeResults.length;

    // Calculate combined score
    const combinedScore =
      pptResult.score * weights.ppt + averageResumeScore * weights.resume;

    return {
      aiScore: Math.round(combinedScore * 100) / 100, // Round to 2 decimals
      breakdown: {
        pptScore: pptResult.score,
        resumeScores: resumeResults.map((r) => r.score),
        averageResumeScore,
        combinedScore,
      },
      feedback: {
        ppt: pptResult.feedback,
        resumes: resumeResults.map((r, i) => ({
          member: team.members[i].name,
          feedback: r.feedback,
        })),
      },
    };
  } catch (error) {
    console.error("Team Grading Error:", error);
    throw error;
  }
};
```

### 6.2 Batch AI Grading Controller

```javascript
// src/controllers/ai.controller.js
import Team from "../models/Team.js";
import AIGrade from "../models/AIGrade.js";
import { gradeTeam } from "../services/ai.service.js";

/**
 * Trigger AI grading for all registered teams
 * POST /api/teams/grade-all
 */
export const gradeAllTeams = async (req, res) => {
  try {
    const { hackathonCode } = req.body;

    // Get all registered teams
    const teams = await Team.find({
      hackathonCode,
      registrationStatus: "REGISTERED",
    });

    if (teams.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No teams to grade",
      });
    }

    // Update all teams to UNDER_REVIEW
    await Team.updateMany(
      { hackathonCode, registrationStatus: "REGISTERED" },
      {
        registrationStatus: "UNDER_REVIEW",
        aiGradingStatus: "processing",
      },
    );

    // Start async grading process (don't await)
    processTeamGrading(teams, hackathonCode);

    return res.json({
      success: true,
      message: `AI grading started for ${teams.length} teams`,
      totalTeams: teams.length,
      estimatedTime: `${teams.length * 2}-${teams.length * 5} minutes`,
    });
  } catch (error) {
    console.error("Grade All Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

/**
 * Process team grading asynchronously
 */
const processTeamGrading = async (teams, hackathonCode) => {
  for (const team of teams) {
    try {
      // Grade team
      const result = await gradeTeam(team);

      // Update team with AI score
      await Team.findByIdAndUpdate(team._id, {
        aiScore: result.aiScore,
        aiGradedAt: new Date(),
        aiGradingStatus: "completed",
        aiScoreBreakdown: result.breakdown,
      });

      // Save detailed AI grade
      await AIGrade.create({
        teamId: team._id,
        hackathonCode,
        ppt: {
          url: team.pptUrl,
          score: result.breakdown.pptScore,
          feedback: result.feedback.ppt,
        },
        resumes: result.feedback.resumes.map((r, i) => ({
          memberName: r.member,
          url: team.members[i].resumeUrl,
          score: result.breakdown.resumeScores[i],
          feedback: r.feedback,
        })),
        finalScore: result.aiScore,
        status: "completed",
        gradedAt: new Date(),
      });

      console.log(`✅ Team ${team.teamName} graded: ${result.aiScore}/10`);
    } catch (error) {
      console.error(`❌ Error grading team ${team.teamName}:`, error);

      // Update team with error status
      await Team.findByIdAndUpdate(team._id, {
        aiGradingStatus: "error",
        aiGradingError: error.message,
      });
    }
  }

  console.log(`🎉 AI grading complete for hackathon ${hackathonCode}`);
};

/**
 * Finalize shortlist (select top N teams)
 * POST /api/hackathons/:code/teams/shortlist
 */
export const finalizeShortlist = async (req, res) => {
  try {
    const { code } = req.params;
    const { teamIds, topN } = req.body;

    let selectedTeamIds = teamIds;

    // If topN provided, auto-select top N by AI score
    if (topN) {
      const topTeams = await Team.find({
        hackathonCode: code,
        registrationStatus: "UNDER_REVIEW",
        aiGradingStatus: "completed",
      })
        .sort({ aiScore: -1 })
        .limit(topN)
        .select("_id");

      selectedTeamIds = topTeams.map((t) => t._id.toString());
    }

    // Update shortlisted teams
    const shortlistedResult = await Team.updateMany(
      { _id: { $in: selectedTeamIds } },
      {
        registrationStatus: "SHORTLISTED",
        shortlistedAt: new Date(),
        isShortlisted: true,
      },
    );

    // Generate QR codes for shortlisted teams
    for (const teamId of selectedTeamIds) {
      await generateTeamQRCodes(teamId);
    }

    // Update rejected teams
    const rejectedResult = await Team.updateMany(
      {
        hackathonCode: code,
        registrationStatus: "UNDER_REVIEW",
        _id: { $nin: selectedTeamIds },
      },
      {
        registrationStatus: "REJECTED",
      },
    );

    // Update hackathon stats
    await Hackathon.findOneAndUpdate(
      { hackathonCode: code },
      {
        "stats.shortlistedTeams": shortlistedResult.modifiedCount,
        "stats.rejectedTeams": rejectedResult.modifiedCount,
        currentPhase: "SHORTLIST_ANNOUNCED",
      },
    );

    return res.json({
      success: true,
      shortlistedCount: shortlistedResult.modifiedCount,
      rejectedCount: rejectedResult.modifiedCount,
    });
  } catch (error) {
    console.error("Shortlist Finalize Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
```

### 6.3 QR Code Generation for Shortlisted Teams

```javascript
// src/services/qr.service.js
import QRCode from "qrcode";
import Team from "../models/Team.js";

/**
 * Generate individual QR codes for all team members
 * @param {string} teamId - Team MongoDB ID
 */
export const generateTeamQRCodes = async (teamId) => {
  try {
    const team = await Team.findById(teamId);
    if (!team) throw new Error("Team not found");

    const updatedMembers = [];

    for (const member of team.members) {
      // QR data format: hackathonCode-teamName-memberName
      const qrData = `${team.hackathonCode}-${team.teamName}-${member.name}`;

      // Generate QR code as base64 data URL
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 512,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // Update member with QR code
      member.qrCode = qrCodeDataUrl;

      updatedMembers.push(member);
    }

    // Save updated team with QR codes
    team.members = updatedMembers;
    await team.save();

    console.log(`✅ QR codes generated for team ${team.teamName}`);

    return team;
  } catch (error) {
    console.error("QR Generation Error:", error);
    throw error;
  }
};
```

---

## 7. AUTHENTICATION & SECURITY

### 7.1 JWT Middleware

```javascript
// src/middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import User from "../models/User.js";

export const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Not authorized, no token",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: "Not authorized, token failed",
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Role ${req.user.role} not authorized`,
      });
    }
    next();
  };
};
```

### 7.2 Rate Limiting

```javascript
// src/middleware/rateLimiter.middleware.js
import rateLimit from "express-rate-limit";

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: "Too many requests, please try again later",
});

// AI grading rate limiter (expensive operation)
export const aiGradingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 grading requests per hour per IP
  message: "AI grading rate limit exceeded",
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 uploads per 15 minutes
  message: "Upload rate limit exceeded",
});
```

---

## 8. FILE UPLOAD SYSTEM

### 8.1 Cloudinary Configuration

```javascript
// src/config/cloudinary.js
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import multer from "multer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Resume storage
export const resumeStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "aerohacks/resumes",
    allowed_formats: ["pdf", "doc", "docx"],
    resource_type: "raw",
  },
});

// PPT storage
export const pptStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "aerohacks/presentations",
    allowed_formats: ["ppt", "pptx", "pdf"],
    resource_type: "raw",
  },
});

// Image storage (college ID, profile)
export const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "aerohacks/images",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 1024, height: 1024, crop: "limit" }],
  },
});

export const resumeUpload = multer({ storage: resumeStorage });
export const pptUpload = multer({ storage: pptStorage });
export const imageUpload = multer({ storage: imageStorage });
```

### 8.2 Upload Routes

```javascript
// src/routes/upload.routes.js
import express from "express";
import { resumeUpload, pptUpload, imageUpload } from "../config/cloudinary.js";
import { uploadLimiter } from "../middleware/rateLimiter.middleware.js";

const router = express.Router();

router.post(
  "/resume",
  uploadLimiter,
  resumeUpload.single("file"),
  (req, res) => {
    res.json({
      success: true,
      url: req.file.path,
      publicId: req.file.filename,
    });
  },
);

router.post("/ppt", uploadLimiter, pptUpload.single("file"), (req, res) => {
  res.json({
    success: true,
    url: req.file.path,
    publicId: req.file.filename,
  });
});

router.post(
  "/college-id",
  uploadLimiter,
  imageUpload.single("file"),
  (req, res) => {
    res.json({
      success: true,
      url: req.file.path,
      publicId: req.file.filename,
    });
  },
);

export default router;
```

---

## 9. REAL-TIME FEATURES

### 9.1 Socket.io Setup

```javascript
// src/sockets/index.js
import { Server } from "socket.io";

export const setupSockets = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join hackathon-specific room
    socket.on("join-hackathon", (hackathonCode) => {
      socket.join(hackathonCode);
      console.log(`Socket ${socket.id} joined room: ${hackathonCode}`);
    });

    // Disconnect
    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Emit events (called from controllers)
export const emitLeaderboardUpdate = (io, hackathonCode, teams) => {
  io.to(hackathonCode).emit("leaderboard-update", teams);
};

export const emitEntryLog = (io, hackathonCode, log) => {
  io.to(hackathonCode).emit("entry-log", log);
};

export const emitAIGradingProgress = (io, hackathonCode, progress) => {
  io.to(hackathonCode).emit("ai-grading-progress", progress);
};
```

### 9.2 Integration in Server

```javascript
// src/server.js
import express from "express";
import { createServer } from "http";
import { setupSockets } from "./sockets/index.js";

const app = express();
const httpServer = createServer(app);
const io = setupSockets(httpServer);

// Make io accessible in controllers
app.set("io", io);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 10. EMAIL SERVICE

### 10.1 SendGrid Configuration

```javascript
// src/services/email.service.js
import sgMail from "@sendgrid/mail";

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

/**
 * Send participant code email
 */
export const sendParticipantCode = async (
  email,
  name,
  code,
  hackathonDetails,
) => {
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: `Your ${hackathonDetails.eventName} Participant Code`,
    html: `
      <h2>Welcome to ${hackathonDetails.eventName}!</h2>
      <p>Hi ${name},</p>
      <p>Your participant code is: <strong>${code}</strong></p>
      <p>Date: ${hackathonDetails.date}</p>
      <p>Venue: ${hackathonDetails.venue}</p>
      <p>Use this code to register your team.</p>
      <br>
      <p>Good luck!</p>
    `,
  };

  return await sgMail.send(msg);
};

/**
 * Send shortlist announcement email
 */
export const sendShortlistResult = async (
  email,
  name,
  isShortlisted,
  hackathonDetails,
) => {
  const subject = isShortlisted
    ? `Congratulations! You're Shortlisted for ${hackathonDetails.eventName}`
    : `${hackathonDetails.eventName} Application Update`;

  const html = isShortlisted
    ? `
      <h2>Congratulations! 🎉</h2>
      <p>Hi ${name},</p>
      <p>Your team has been shortlisted for ${hackathonDetails.eventName}!</p>
      <p>Check your dashboard for your QR code and ID card.</p>
      <p>See you at the event!</p>
    `
    : `
      <h2>Thank You for Applying</h2>
      <p>Hi ${name},</p>
      <p>Thank you for your interest in ${hackathonDetails.eventName}.</p>
      <p>Unfortunately, we could only select a limited number of teams this time.</p>
      <p>We encourage you to apply for future hackathons!</p>
    `;

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject,
    html,
  };

  return await sgMail.send(msg);
};
```

---

## 11. IMPLEMENTATION STEPS

### Phase 1: Backend Setup ( hours)

**Step 1: Initialize Project** (15 min)

```bash
mkdir backend
cd backend
npm init -y
npm install express mongoose jsonwebtoken bcryptjs joi cors dotenv helmet
npm install --save-dev nodemon eslint
```

**Step 2: Project Structure** (15 min)

- Create folders: models, routes, controllers, middleware, services, config, utils
- Setup index files

**Step 3: MongoDB Atlas** (20 min)

- Create MongoDB Atlas account
- Create cluster
- Get connection string
- Setup .env file

**Step 4: Database Connection** (10 min)

```javascript
// src/config/database.js
import mongoose from "mongoose";

export const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    process.exit(1);
  }
};
```

### Phase 2: Models & Schemas (2 hours)

**Step 1: User Model** (20 min)

- See section 4.1

**Step 2: Hackathon Model** (30 min)

- See section 4.2

**Step 3: Team Model (v3.0 Extended)** (40 min)

- See section 4.3 (CRITICAL)
- Include all AI fields

**Step 4: AIGrade Model** (15 min)

- See section 4.4

**Step 5: EntryLog & Score Models** (15 min)

- See sections 4.5 & 4.6

### Phase 3: Authentication (2 hours)

**Step 1: JWT Utils** (20 min)

```javascript
// src/utils/jwt.js
import jwt from "jsonwebtoken";

export const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

export const generateRefreshToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: "7d",
  });
};
```

**Step 2: Auth Controller** (40 min)

- register, login, verifyCode functions

**Step 3: Auth Middleware** (30 min)

- See section 7.1

**Step 4: Auth Routes** (30 min)

```javascript
// src/routes/auth.routes.js
import express from "express";
import {
  register,
  login,
  verifyHackathonCode,
  verifyRoleCode,
} from "../controllers/auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/verify-hackathon-code", verifyHackathonCode);
router.post("/verify-role-code", verifyRoleCode);

export default router;
```

### Phase 4: Core CRUD Operations (3 hours)

**Step 1: Hackathon Routes** (1 hour)

- POST /hackathons (create)
- GET /hackathons/:code (read)
- PATCH /hackathons/:code (update)

**Step 2: Team Routes (Basic)** (1 hour)

- POST /teams (register)
- GET /teams/:id
- GET /hackathons/:code/teams

**Step 3: Score Routes** ( hour)

- POST /scores
- GET /hackathons/:code/scores

### Phase 5: AI Integration (v3.0 - CRITICAL) (3 hours)

**Step 1: AI Service Setup** (30 min)

- See section 6.1
- Test friend's API endpoints

**Step 2: AI Controller** (1 hour)

- gradeAllTeams function
- gradeSingleTeam function
- finalizeShortlist function (See section 6.2)

**Step 3: QR Generation Service** (45 min)

- generateTeamQRCodes function (See section 6.3)

**Step 4: AI Routes** (30 min)

```javascript
// src/routes/ai.routes.js
router.post("/teams/grade-all", aiGradingLimiter, gradeAllTeams);
router.post("/teams/:id/grade", aiGradingLimiter, gradeSingleTeam);
router.post("/hackathons/:code/teams/shortlist", finalizeShortlist);
```

**Step 5: Testing AI Flow** (15 min)

- Test with mock teams
- Verify status transitions
- Check QR generation

### Phase 6: File Upload (2 hours)

**Step 1: Cloudinary Setup** (30 min)

- Create account
- Get API keys
- See section 8.1

**Step 2: Upload Middleware** (30 min)

- Configure multer + cloudinary-storage

**Step 3: Upload Routes** (30 min)

- See section 8.2

**Step 4: Integration with Team Registration** (30 min)

- Update team model with URLs
- Test file uploads

### Phase 7: Real-time Features (2 hours)

**Step 1: Socket.io Setup** (30 min)

- See section 9.1

**Step 2: Leaderboard Socket** (30 min)

- Emit on score update

**Step 3: Entry Log Socket** (30 min)

- Emit on QR scan

**Step 4: AI Grading Progress Socket** (30 min)

- Emit grading progress (team X of Y complete)

### Phase 8: Email Notifications (1.5 hours)

**Step 1: SendGrid Setup** (20 min)

- Create account
- Verify sender domain

**Step 2: Email Service** (40 min)

- See section 10.1

**Step 3: Integration** (30 min)

- Send on shortlist finalize
- Send on result publish

### Phase 9: Error Handling & Validation (1.5 hours)

**Step 1: Joi Validation** (45 min)

```javascript
// src/middleware/validation.middleware.js
import Joi from "joi";

export const validateTeamRegistration = (req, res, next) => {
  const schema = Joi.object({
    teamName: Joi.string().required().min(3).max(50),
    members: Joi.array()
      .min(2)
      .max(4)
      .items(
        Joi.object({
          name: Joi.string().required(),
          email: Joi.string().email().required(),
          mobile: Joi.string()
            .pattern(/^[0-9]{10}$/)
            .required(),
          college: Joi.string().required(),
        }),
      ),
    problemStatement: Joi.string().required(),
    github: Joi.string().uri().optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({
      success: false,
      error: error.details[0].message,
    });
  }
  next();
};
```

**Step 2: Error Middleware** (30 min)

```javascript
// src/middleware/error.middleware.js
export const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  res.status(err.statusCode || 500).json({
    success: false,
    error: err.message || "Server Error",
  });
};
```

**Step 3: Apply to All Routes** (15 min)

### Phase 10: Testing & Debugging (2 hours)

**Step 1: Manual API Testing** (1 hour)

- Test all endpoints with Postman
- Verify data persistence
- Check error handling

**Step 2: AI Grading Flow Testing** (30 min)

- Register 5 teams
- Trigger AI grading
- Verify scores
- Finalize shortlist (top 3)
- Check QR generation

**Step 3: Frontend Integration Testing** (30 min)

- Connect frontend to backend
- Test authentication
- Test team registration
- Test AI grading UI

---

## 12. TESTING STRATEGY

### 12.1 Unit Tests (Jest)

```javascript
// tests/unit/ai.service.test.js
import { gradeTeam } from "../../src/services/ai.service.js";

describe("AI Grading Service", () => {
  test("should calculate combined score correctly", async () => {
    const mockTeam = {
      pptUrl: "https://cloudinary.com/ppt.pdf",
      members: [
        { resumeUrl: "https://cloudinary.com/resume1.pdf" },
        { resumeUrl: "https://cloudinary.com/resume2.pdf" },
      ],
    };

    const result = await gradeTeam(mockTeam);

    expect(result.aiScore).toBeGreaterThanOrEqual(0);
    expect(result.aiScore).toBeLessThanOrEqual(10);
    expect(result.breakdown).toHaveProperty("pptScore");
    expect(result.breakdown).toHaveProperty("resumeScores");
  });
});
```

### 12.2 Integration Tests (Supertest)

```javascript
// tests/integration/team.routes.test.js
import request from "supertest";
import app from "../../src/server.js";

describe("Team Routes", () => {
  test("POST /api/teams should register team", async () => {
    const res = await request(app)
      .post("/api/teams")
      .send({
        hackathonCode: "AERO-2026-HC1234",
        teamName: "Test Team",
        members: [
          {
            name: "John Doe",
            email: "john@test.com",
            mobile: "1234567890",
            college: "Test College",
            isLeader: true,
          },
          {
            name: "Jane Smith",
            email: "jane@test.com",
            mobile: "0987654321",
            college: "Test College",
            isLeader: false,
          },
        ],
        problemStatement: "Test Problem",
        github: "https://github.com/test/repo",
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.team).toHaveProperty("_id");
    expect(res.body.team.registrationStatus).toBe("REGISTERED");
  });
});
```

---

## 13. DEPLOYMENT GUIDE

### 13.1 Environment Variables (.env)

```env
# Server
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aerohacks?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz

# SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=noreply@aerohacks.com

# AI Service (Friend's API)
AI_API_BASE_URL=https://ai-api.friend.com
AI_API_KEY=your-ai-api-key

# Frontend (CORS)
FRONTEND_URL=https://aerohacks.vercel.app

# QR Code
QR_API_BASE=https://api.qrserver.com/v1/create-qr-code/
```

### 13.2 Deployment Steps

#### Frontend (Vercel)

```bash
cd frontend
vercel --prod
# Set environment variables in Vercel dashboard:
# VITE_API_BASE_URL=https://api.aerohacks.com
```

#### Backend (Railway/Render)

```bash
cd backend
# Push to Git
git init
git add .
git commit -m "Initial backend"
git push origin main

# On Railway/Render:
# 1. Connect GitHub repo
# 2. Set environment variables (.env)
# 3. Set build command: npm install
# 4. Set start command: npm start
# 5. Deploy
```

#### MongoDB Atlas

- Whitelist deployment IP (or 0.0.0.0/0 for Railway)
- Create database user
- Get connection string

---

## 14. FINAL CHECKLIST

### Before Production Launch

- [ ] All models created (User, Hackathon, Team, AIGrade, EntryLog, Score)
- [ ] All 80+ API endpoints implemented
- [ ] JWT authentication working
- [ ] Rate limiting configured
- [ ] AI grading integrated (friend's API working)
- [ ] File uploads to Cloudinary working
- [ ] QR code generation working
- [ ] Real-time sockets functional
- [ ] Email notifications sending
- [ ] Error handling comprehensive
- [ ] Validation on all inputs
- [ ] CORS configured
- [ ] Environment variables set
- [ ] Database indexed properly
- [ ] API tested with Postman
- [ ] Frontend connected to backend
- [ ] Full AI shortlisting workflow tested
- [ ] Deployed to production
- [ ] SSL certificates configured
- [ ] Monitoring setup (logs)

### v3.0 Specific Checks

- [ ] AI grading API credentials obtained
- [ ] Batch grading tested (65+ teams)
- [ ] Status transitions working (REGISTERED → UNDER_REVIEW → SHORTLISTED/REJECTED)
- [ ] Top N selection algorithm working
- [ ] Individual QR generation for members
- [ ] Food coupon tracking functional
- [ ] Phase indicator updates correctly
- [ ] Null score handling (from recent bugfix)

---

## 15. SUPPORT & RESOURCES

### Documentation Links

- **MongoDB**: https://www.mongodb.com/docs/
- **Express**: https://expressjs.com/
- **JWT**: https://jwt.io/
- **Cloudinary**: https://cloudinary.com/documentation
- **SendGrid**: https://docs.sendgrid.com/
- **Socket.io**: https://socket.io/docs/

### Troubleshooting

**Problem**: MongoDB connection fails  
**Solution**: Check connection string, whitelist IP in Atlas

**Problem**: AI API timeout  
**Solution**: Increase timeout to 120s, check friend's API status

**Problem**: File upload fails  
**Solution**: Check Cloudinary credentials, file size limits

**Problem**: QR code not generating  
**Solution**: Check if team is shortlisted, verify qrcode package installed

---

**🚀 Backend Implementation Complete!**

**Estimated Total Time**: 15-20 hours  
**Priority**: P0 (Critical)  
**Status**: Ready to implement

**Next Action**: Start with Phase 1 (Backend Setup)

---

**Last Updated**: February 21, 2026  
**Document Version**: 3.0.1  
**Maintained By**: AeroHacks Backend Team
