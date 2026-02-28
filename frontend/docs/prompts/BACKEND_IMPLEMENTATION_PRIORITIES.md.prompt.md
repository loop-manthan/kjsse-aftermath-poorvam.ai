# Backend Implementation Priorities - AeroHacks v3.0

**Last Updated**: February 21, 2026  
**Current Status**: 🔴 **5% Complete** (7/80+ endpoints implemented)  
**Frontend Status**: ✅ **100% Complete** (v3.0 with AI Shortlisting UI)

---

## 📊 CURRENT IMPLEMENTATION GAP

### ✅ What's Implemented (5%)

**AI Analysis Microservice** - 7 Endpoints:

```
GET  /api/v1/ai/health                  - Health check
POST /api/v1/ai/analyze/resume          - Resume grading
POST /api/v1/ai/analyze/ppt             - PPT grading
GET  /api/v1/ai/analysis/:id            - Get single analysis
GET  /api/v1/ai/analysis                - Get all analyses
GET  /api/v1/ai/analysis/ids            - Get all IDs
DELETE /api/v1/ai/analysis/:id          - Delete analysis
```

**Supporting Infrastructure**:

- Express server with CORS
- MongoDB connection configured
- Multer file upload middleware
- HuggingFace AI integration (Mistral-7B-Instruct)
- PDF/PPTX parsing utilities
- In-memory analysis storage

### ❌ What's Missing (95%)

**Critical Gaps**:

- ❌ Team Management (0/15 endpoints)
- ❌ Hackathon Management (0/12 endpoints)
- ❌ Authentication System (0/8 endpoints)
- ❌ File Storage (0/4 endpoints)
- ❌ Judge Scoring (0/10 endpoints)
- ❌ Entry Logs (0/8 endpoints)
- ❌ Leaderboard API (0/6 endpoints)
- ❌ Email Notifications (0/5 endpoints)
- ❌ Real-time Updates (0/4 endpoints)

**Total**: 7 implemented / 80+ planned = **8.75% completion**

---

## 🎯 PRIORITY MATRIX

### Priority 1: CRITICAL (Blocking - 6-8 hours)

**Must implement for v3.0 AI Shortlisting to work**

#### 1.1 Team Management with AI Integration (3 hours)

**Why Critical**: Frontend v3.0 requires team persistence and AI grading workflow

**Endpoints to Build**:

```javascript
POST   /api/v1/teams                    // Create team
GET    /api/v1/teams/:id                // Get team by ID
GET    /api/v1/teams                    // Get all teams (with filters)
PATCH  /api/v1/teams/:id                // Update team details
DELETE /api/v1/teams/:id                // Delete team
POST   /api/v1/teams/batch-grade        // AI grade all REGISTERED teams
POST   /api/v1/teams/finalize-shortlist // Admin selects top N teams
PATCH  /api/v1/teams/:id/status         // Update registration status
GET    /api/v1/teams/shortlisted        // Get shortlisted teams only
POST   /api/v1/teams/:id/upload         // Upload team files (PPT/resume)
```

**Database Model Required**:

```javascript
// models/Team.js
const teamSchema = new mongoose.Schema(
  {
    hackathonCode: { type: String, required: true, index: true },
    teamName: { type: String, required: true },
    members: [memberSchema], // 2-4 members with individual QR codes

    // v3.0 AI SHORTLISTING FIELDS (CRITICAL)
    registrationStatus: {
      type: String,
      enum: ["REGISTERED", "UNDER_REVIEW", "SHORTLISTED", "REJECTED"],
      default: "REGISTERED",
      index: true,
    },

    aiScore: { type: Number, min: 0, max: 10 }, // Out of 10
    aiGradedAt: { type: Date },
    aiGradingStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "error"],
      default: "pending",
    },
    aiScoreBreakdown: {
      pptScore: { type: Number },
      resumeScores: [{ type: Number }], // One per member
      combinedScore: { type: Number },
    },

    // Judge evaluation (only for shortlisted)
    scores: {
      innovation: { type: Number, min: 1, max: 10 },
      feasibility: { type: Number, min: 1, max: 10 },
      technical: { type: Number, min: 1, max: 10 },
      presentation: { type: Number, min: 1, max: 10 },
    },
    totalScore: { type: Number, min: 0, max: 40 },

    // Files
    pptUrl: { type: String }, // Cloudinary URL
    resumeUrls: [{ type: String }], // One per member
    collegeIdUrls: [{ type: String }],

    // Event tracking
    foodCoupons: {
      breakfast: { type: Boolean, default: false },
      lunch: { type: Boolean, default: false },
      dinner: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

// Indexes for performance
teamSchema.index({ aiScore: -1 }); // For shortlist sorting
teamSchema.index({ totalScore: -1 }); // For leaderboard
teamSchema.index({ registrationStatus: 1, hackathonCode: 1 }); // For filtering
```

**Key Business Logic**:

```javascript
// controllers/team.controller.js

// Batch AI grading workflow
exports.batchGradeTeams = async (req, res) => {
  const { hackathonCode } = req.body;

  // 1. Find all REGISTERED teams
  const teams = await Team.find({
    hackathonCode,
    registrationStatus: "REGISTERED",
  });

  // 2. Update status to UNDER_REVIEW
  await Team.updateMany(
    { _id: { $in: teams.map((t) => t._id) } },
    { registrationStatus: "UNDER_REVIEW" },
  );

  // 3. Grade each team (call AI service)
  for (const team of teams) {
    try {
      const pptScore = await gradeDocument(team.pptUrl, "ppt");
      const resumeScores = await Promise.all(
        team.resumeUrls.map((url) => gradeDocument(url, "resume")),
      );

      const combinedScore = pptScore * 0.7 + avgScore(resumeScores) * 0.3;

      await Team.findByIdAndUpdate(team._id, {
        aiScore: combinedScore,
        aiGradedAt: new Date(),
        aiGradingStatus: "completed",
        aiScoreBreakdown: { pptScore, resumeScores, combinedScore },
      });
    } catch (error) {
      await Team.findByIdAndUpdate(team._id, {
        aiGradingStatus: "error",
      });
    }
  }

  res.json({ message: `Graded ${teams.length} teams` });
};

// Finalize shortlist workflow
exports.finalizeShortlist = async (req, res) => {
  const { teamIds } = req.body; // Selected team IDs

  // 1. Update selected teams to SHORTLISTED
  await Team.updateMany(
    { _id: { $in: teamIds } },
    { registrationStatus: "SHORTLISTED" },
  );

  // 2. Update remaining UNDER_REVIEW teams to REJECTED
  await Team.updateMany(
    {
      registrationStatus: "UNDER_REVIEW",
      _id: { $nin: teamIds },
    },
    { registrationStatus: "REJECTED" },
  );

  // 3. Generate QR codes for shortlisted teams
  const shortlistedTeams = await Team.find({ _id: { $in: teamIds } });
  for (const team of shortlistedTeams) {
    for (const member of team.members) {
      member.qrCode = await generateQRCode(
        `${team.hackathonCode}-${team.teamName}-${member.name}`,
      );
    }
    await team.save();
  }

  res.json({ message: `Shortlisted ${teamIds.length} teams` });
};
```

**Mock Strategy** (if skipping):

- Frontend keeps using localStorage
- AI grading stays mocked with random 7-10 scores
- **Impact**: No persistence, no multi-user access

---

#### 1.2 Authentication & Code Verification (2 hours)

**Why Critical**: Two-layer auth (hackathon code + role code) is core security

**Endpoints to Build**:

```javascript
POST / api / v1 / auth / verify - hackathon - code; // Layer 1 auth
POST / api / v1 / auth / verify - role - code; // Layer 2 auth
POST / api / v1 / auth / refresh - token; // JWT refresh
POST / api / v1 / auth / logout; // Invalidate tokens
GET / api / v1 / auth / me; // Get current user
```

**Middleware Required**:

```javascript
// middleware/auth.middleware.js
export const verifyHackathonCode = async (req, res, next) => {
  const { hackathonCode } = req.headers;

  const hackathon = await Hackathon.findOne({
    hackathonCode,
    status: "active",
  });

  if (!hackathon) {
    return res.status(403).json({ error: "Invalid hackathon code" });
  }

  req.hackathon = hackathon;
  next();
};

export const verifyRoleCode = (allowedRoles) => async (req, res, next) => {
  const { roleCode } = req.headers;
  const { hackathon } = req;

  let role = null;
  if (hackathon.codes.admin === roleCode) role = "admin";
  else if (hackathon.codes.judge === roleCode) role = "judge";
  else if (hackathon.codes.participants.includes(roleCode))
    role = "participant";

  if (!role || !allowedRoles.includes(role)) {
    return res.status(403).json({ error: "Invalid role code" });
  }

  req.user = { role, code: roleCode };
  next();
};

// Usage
router.post(
  "/teams",
  verifyHackathonCode,
  verifyRoleCode(["participant"]),
  createTeam,
);
```

**Mock Strategy** (if skipping):

- Accept any hackathon/role code (no validation)
- Skip JWT generation
- **Impact**: No security, anyone can access any role

---

#### 1.3 Hackathon CRUD (2 hours)

**Why Critical**: Host must create hackathons and generate codes

**Endpoints to Build**:

```javascript
POST   /api/v1/hackathons                // Create hackathon + generate codes
GET    /api/v1/hackathons/:code          // Get hackathon details
GET    /api/v1/hackathons                // List all hackathons
PATCH  /api/v1/hackathons/:code          // Update hackathon
DELETE /api/v1/hackathons/:code          // Delete hackathon
GET    /api/v1/hackathons/:code/stats    // Get stats (teams, participants)
```

**Database Model Required**:

```javascript
// models/Hackathon.js
const hackathonSchema = new mongoose.Schema(
  {
    hackathonCode: {
      type: String,
      required: true,
      unique: true,
      index: true,
      default: () => generateHackathonCode(), // AERO-2026-HC1234
    },
    eventName: { type: String, required: true },
    date: { type: Date, required: true },
    venue: { type: String, required: true },
    maxTeams: { type: Number, default: 50 },

    // v2.0 Authentication codes
    codes: {
      admin: { type: String, required: true, default: generateAdminCode },
      judge: { type: String, required: true, default: generateJudgeCode },
      participants: [{ type: String }], // 100+ codes
    },

    // v3.0 Shortlisting configuration
    shortlistingConfig: {
      maxShortlistedTeams: { type: Number, default: 30 },
      useAiGrading: { type: Boolean, default: true },
      aiWeightPPT: { type: Number, default: 0.7 },
      aiWeightResume: { type: Number, default: 0.3 },
    },

    currentPhase: {
      type: String,
      enum: [
        "REGISTRATION_OPEN",
        "SHORTLISTING",
        "EVENT_ONGOING",
        "JUDGING",
        "RESULTS_PUBLISHED",
        "COMPLETED",
      ],
      default: "REGISTRATION_OPEN",
    },

    stats: {
      registeredTeams: { type: Number, default: 0 },
      shortlistedTeams: { type: Number, default: 0 },
      rejectedTeams: { type: Number, default: 0 },
    },

    status: {
      type: String,
      enum: ["active", "completed", "cancelled"],
      default: "active",
    },
  },
  { timestamps: true },
);
```

**Mock Strategy** (if skipping):

- Frontend keeps using mockHackathons.js
- Host flow generates codes client-side only
- **Impact**: No persistence, codes lost on refresh

---

#### 1.4 File Upload (Cloudinary) (1 hour)

**Why Critical**: Teams must upload resumes, PPTs, college IDs

**Endpoints to Build**:

```javascript
POST   /api/v1/upload/resume             // Upload resume PDF
POST   /api/v1/upload/ppt                // Upload PPT
POST   /api/v1/upload/college-id         // Upload college ID image
DELETE /api/v1/upload/:fileId            // Delete uploaded file
```

**Implementation**:

```javascript
// services/cloudinary.service.js
import cloudinary from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadFile = async (filePath, folder) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: `aerohacks/${folder}`,
    resource_type: "auto",
  });
  return result.secure_url;
};

// controllers/upload.controller.js
export const uploadResume = async (req, res) => {
  const url = await uploadFile(req.file.path, "resumes");
  fs.unlink(req.file.path, () => {}); // Cleanup
  res.json({ url });
};
```

**Mock Strategy** (if skipping):

- Frontend stores files as base64 in localStorage
- AI grading uses sample files from /backend/test/
- **Impact**: No persistent file storage, AI can't analyze real uploads

---

### Priority 2: HIGH (Important - 4-6 hours)

**Can be mocked initially, but needed for full workflow**

#### 2.1 Judge Scoring System (2 hours)

**Endpoints**:

```javascript
POST   /api/v1/scores                    // Submit scores for a team
GET    /api/v1/scores/:teamId            // Get scores for a team
GET    /api/v1/scores                    // Get all scores (admin only)
PATCH  /api/v1/scores/:id                // Update scores
DELETE /api/v1/scores/:id                // Delete scores
POST   /api/v1/scores/send-to-admin      // Judge marks evaluation complete
POST   /api/v1/scores/publish-results    // Admin publishes results
```

**Mock Strategy**:

- Frontend stores scores in localStorage
- "Send to Admin" just updates local status
- **Impact**: No multi-judge scenarios, no persistence

---

#### 2.2 Entry Log System (2 hours)

**Endpoints**:

```javascript
POST   /api/v1/entry-logs                // Record gate/meal entry
GET    /api/v1/entry-logs                // Get all entries (paginated)
GET    /api/v1/entry-logs/:id            // Get single entry
GET    /api/v1/entry-logs/duplicate-check // Check if QR scanned before
GET    /api/v1/entry-logs/stats          // Entry statistics
```

**Mock Strategy**:

- Frontend scanner updates localStorage only
- Duplicate check happens client-side
- **Impact**: No server-side duplicate prevention, no multi-admin sync

---

#### 2.3 Leaderboard API (1 hour)

**Endpoints**:

```javascript
GET    /api/v1/leaderboard/:hackathonCode // Get sorted leaderboard
GET    /api/v1/leaderboard/:hackathonCode/:teamId // Get team rank
```

**Mock Strategy**:

- Frontend sorts teams client-side
- **Impact**: Works fine in localStorage, no issue

---

### Priority 3: MEDIUM (Nice to Have - 3-4 hours)

**Can be deferred for MVP launch**

#### 3.1 Email Notifications (2 hours)

**Endpoints**:

```javascript
POST / api / v1 / notifications / send - codes; // Email codes to participants
POST / api / v1 / notifications / shortlist - result; // Notify shortlisted teams
POST / api / v1 / notifications / final - result; // Notify final results
```

**Mock Strategy**:

- Host manually shares codes
- Participants check dashboard for status
- **Impact**: Manual work, but functional

---

#### 3.2 QR Code Generation (1 hour)

**Endpoints**:

```javascript
POST   /api/v1/qr/generate                // Server-side QR generation
GET    /api/v1/qr/:teamId                // Get team QR codes
```

**Mock Strategy**:

- Frontend uses external API (qrserver.com)
- **Impact**: Works fine, no issue

---

#### 3.3 Admin Analytics (1 hour)

**Endpoints**:

```javascript
GET    /api/v1/analytics/:hackathonCode  // Dashboard stats
GET    /api/v1/analytics/:hackathonCode/export // Export CSV
```

**Mock Strategy**:

- Admin manually counts from UI
- **Impact**: No automated reports

---

### Priority 4: LOW (Defer - 2-3 hours)

**Not needed for core functionality**

#### 4.1 Real-time Updates (WebSocket) (2 hours)

**Endpoints**:

```javascript
WS / ws / leaderboard; // Live leaderboard updates
WS / ws / entry - logs; // Live entry log updates
```

**Mock Strategy**:

- Manual refresh or polling
- **Impact**: Not real-time, but functional

---

#### 4.2 Advanced Security (1 hour)

**Features**:

- Rate limiting
- Request logging
- CORS whitelist
- Input sanitization

**Mock Strategy**:

- Basic CORS (already implemented)
- **Impact**: Less secure, but functional for demo

---

## 🛠️ IMPLEMENTATION ROADMAP

### Scenario A: 4 Hours Available (Minimum Viable)

**Implement Priority 1 only**

**Timeline**:

- Hour 1: Team model + Create/Read endpoints (2 endpoints)
- Hour 2: AI batch grading + Finalize shortlist (2 endpoints)
- Hour 3: Authentication middleware + Hackathon model (2 endpoints)
- Hour 4: File upload (Cloudinary) + Testing

**What Works**:

- ✅ Team registration persists
- ✅ AI shortlisting workflow functional
- ✅ Files uploaded to cloud
- ✅ Basic auth protection

**What's Mocked**:

- Judge scoring (localStorage)
- Entry logs (localStorage)
- Leaderboard (client-side sorting)
- Email notifications (manual)

---

### Scenario B: 8 Hours Available (Recommended)

**Implement Priority 1 + Priority 2**

**Additional Timeline**:

- Hour 5: Judge scoring endpoints (4 endpoints)
- Hour 6: Entry log endpoints (4 endpoints)
- Hour 7: Leaderboard API + Result publishing (2 endpoints)
- Hour 8: Full integration testing

**What Works**:

- ✅ Everything from Scenario A
- ✅ Judge evaluation persists
- ✅ Entry logs tracked server-side
- ✅ Results workflow complete

**What's Mocked**:

- Email notifications (manual)
- Real-time updates (manual refresh)
- Advanced security (basic only)

---

### Scenario C: 16 Hours Available (Full MVP)

**Implement Priority 1 + Priority 2 + Priority 3**

**Additional Timeline**:

- Hour 9-10: Email notifications (SendGrid)
- Hour 11: Server-side QR generation
- Hour 12: Admin analytics
- Hour 13-14: Refactoring + Error handling
- Hour 15-16: Deployment + Production testing

**What Works**:

- ✅ Everything from Scenario B
- ✅ Automated email notifications
- ✅ Server-generated QR codes
- ✅ Admin analytics dashboard

**What's Mocked**:

- Real-time updates (can add later)
- Advanced security (can add incrementally)

---

## 📋 DECISION FRAMEWORK

### When to Mock (Keep in Frontend)

✅ **Mock if**:

- Low impact on core workflow
- Frontend implementation already works well
- Backend adds complexity without much value
- Time-constrained

**Examples**:

- Leaderboard sorting (client-side is fine)
- QR generation (external API works)
- Result status flags (localStorage is fine)
- Bandwidth toggle (client preference)

---

### When to Build Backend (Required)

❌ **Must Build if**:

- Data must persist across sessions
- Multi-user access required
- Security/authentication needed
- File storage required
- AI integration depends on it

**Examples**:

- Team registration (must persist)
- AI grading workflow (server-side processing)
- File uploads (need cloud storage)
- Authentication (security critical)
- Entry logs (multi-admin sync needed)

---

## 🚀 QUICK START GUIDE

### Priority 1 Implementation (4 hours)

**Step 1: Database Models (30 min)**

```bash
cd backend
mkdir -p models
touch models/Team.js models/Hackathon.js
```

Copy schemas from Priority 1.1 and 1.3 sections above.

**Step 2: Team Endpoints (90 min)**

```bash
mkdir -p src/controllers src/routes
touch src/controllers/team.controller.js
touch src/routes/team.routes.js
```

Implement:

- `POST /api/v1/teams` - Create team
- `POST /api/v1/teams/batch-grade` - AI batch grading
- `POST /api/v1/teams/finalize-shortlist` - Finalize shortlist

**Step 3: Authentication (60 min)**

```bash
touch src/middleware/auth.middleware.js
```

Implement:

- `verifyHackathonCode` middleware
- `verifyRoleCode` middleware

**Step 4: Cloudinary Setup (30 min)**

```bash
npm install cloudinary
touch src/services/cloudinary.service.js
touch src/controllers/upload.controller.js
```

Implement:

- `POST /api/v1/upload/resume`
- `POST /api/v1/upload/ppt`

**Step 5: Testing (30 min)**

- Test team creation
- Test AI grading workflow
- Test file upload
- Test authentication

---

## 📊 EFFORT ESTIMATION

| Feature                 | Endpoints | Effort | Impact      | Recommended      |
| ----------------------- | --------- | ------ | ----------- | ---------------- |
| **Team Management**     | 10        | 3h     | 🔴 Critical | ✅ Must Build    |
| **Authentication**      | 5         | 2h     | 🔴 Critical | ✅ Must Build    |
| **Hackathon CRUD**      | 6         | 2h     | 🔴 Critical | ✅ Must Build    |
| **File Upload**         | 4         | 1h     | 🔴 Critical | ✅ Must Build    |
| **Judge Scoring**       | 7         | 2h     | 🟠 High     | ⚠️ Build if time |
| **Entry Logs**          | 5         | 2h     | 🟠 High     | ⚠️ Build if time |
| **Leaderboard API**     | 2         | 1h     | 🟠 High     | ⚠️ Build if time |
| **Email Notifications** | 3         | 2h     | 🟡 Medium   | ❌ Can Mock      |
| **QR Generation**       | 2         | 1h     | 🟡 Medium   | ❌ Can Mock      |
| **Analytics**           | 2         | 1h     | 🟡 Medium   | ❌ Can Mock      |
| **WebSocket**           | 2         | 2h     | 🔵 Low      | ❌ Defer         |
| **Advanced Security**   | -         | 1h     | 🔵 Low      | ❌ Defer         |

**Total Estimated Effort**:

- Priority 1: 8 hours
- Priority 2: 5 hours
- Priority 3: 4 hours
- Priority 4: 3 hours
- **Grand Total**: 20 hours

---

## ✅ COMPLETION CHECKLIST

### Priority 1 (Critical) - Must Complete

- [ ] Team model created with v3.0 AI fields
- [ ] `POST /api/v1/teams` - Create team
- [ ] `POST /api/v1/teams/batch-grade` - AI batch grading
- [ ] `POST /api/v1/teams/finalize-shortlist` - Finalize shortlist
- [ ] `PATCH /api/v1/teams/:id/status` - Update status
- [ ] Hackathon model created with codes
- [ ] `POST /api/v1/hackathons` - Create hackathon + codes
- [ ] `GET /api/v1/hackathons/:code` - Get hackathon
- [ ] Authentication middleware (2-layer)
- [ ] Cloudinary file upload integrated
- [ ] `POST /api/v1/upload/resume` - Upload resume
- [ ] `POST /api/v1/upload/ppt` - Upload PPT

### Priority 2 (High) - Build if time

- [ ] Judge scoring endpoints (7 total)
- [ ] Entry log endpoints (5 total)
- [ ] Leaderboard API (2 total)
- [ ] Result publishing workflow

### Priority 3 (Medium) - Nice to have

- [ ] Email notifications (SendGrid)
- [ ] Server-side QR generation
- [ ] Admin analytics

### Priority 4 (Low) - Defer

- [ ] WebSocket real-time updates
- [ ] Advanced security features

---

## 🔗 RELATED DOCUMENTS

- **BACKEND_IMPLEMENTATION_PLAN.md** - Full backend architecture
- **COMPLETE_PROJECT_SUMMARY.md** - Frontend v3.0 status
- **TESTING_GUIDE_AI_SHORTLISTING.md** - v3.0 feature testing
- **IMPLEMENTATION_PLAN_V2.md** - Frontend v2.0 security plan

---

## 📝 FINAL RECOMMENDATIONS

### For Time-Constrained Development (4 hours)

**Focus on Priority 1 only**:

1. Team Management + AI Integration (3h)
2. Authentication + Hackathon CRUD (1h)

**Result**: Core v3.0 AI shortlisting workflow functional, everything else mocked

---

### For Standard Development (8 hours)

**Implement Priority 1 + Priority 2**:

1. All Priority 1 features (4h)
2. Judge Scoring (2h)
3. Entry Logs + Leaderboard (2h)

**Result**: Full workflow functional, only notifications/analytics mocked

---

### For Complete MVP (16 hours)

**Implement Priority 1 + 2 + 3**:

1. All Critical + High features (9h)
2. Email Notifications (2h)
3. QR Generation + Analytics (2h)
4. Testing + Deployment (3h)

**Result**: Production-ready MVP with all core features

---

**🚀 READY TO IMPLEMENT! Choose your scenario and start building.**
