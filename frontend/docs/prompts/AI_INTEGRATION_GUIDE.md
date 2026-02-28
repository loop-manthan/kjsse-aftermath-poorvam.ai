# AI Integration & QR Generation - Complete Guide

## Overview
This document explains how the AI shortlisting and QR generation workflow is now properly integrated.

## AI Backend Routes (Working ✅)

Based on your test output in `@airoutemsg.md`, the backend AI routes are **fully functional**:

### 1. Resume Analysis
**Endpoint:** `POST /api/v1/ai/analyze/resume`
- **Input:** PDF file (team leader's resume)
- **Output:** 
  ```json
  {
    "success": true,
    "data": {
      "analysis": {
        "parsedInfo": { name, email, phone, skills, experience, education },
        "scores": {
          "overall": 85,
          "skillsRelevance": 95,
          "experienceDepth": 75,
          "educationQuality": 80,
          "formatting": 60
        },
        "recommendations": [...]
      }
    }
  }
  ```

### 2. PPT Analysis
**Endpoint:** `POST /api/v1/ai/analyze/ppt`
- **Input:** PPTX file (team presentation)
- **Output:**
  ```json
  {
    "success": true,
    "data": {
      "analysis": {
        "projectInfo": { title, description, technologies },
        "scores": {
          "overall": 92,
          "clarity": 95,
          "innovation": 90,
          "technicalDepth": 98,
          "designQuality": 85,
          "feasibility": 95
        },
        "feedback": [...],
        "strengths": [...],
        "improvements": [...]
      }
    }
  }
  ```

## Frontend AI Integration (Now Active ✅)

### Configuration Changes Made

**File:** `frontend/.env`
```env
VITE_AI_BACKEND_URL=http://localhost:5000/api/v1/ai
VITE_USE_REAL_AI=true  # ✅ Changed from false to true
```

### How AI Grading Works

**File:** `frontend/src/utils/aiGrading.js`

The `realAiGrade()` function:
1. Uploads team's **PPT file** to `/api/v1/ai/analyze/ppt`
2. Uploads **team leader's resume** to `/api/v1/ai/analyze/resume`
3. Extracts all scores from both analyses:
   - **PPT scores (6):** overall, clarity, innovation, technicalDepth, designQuality, feasibility
   - **Resume scores (5):** overall, skillsRelevance, experienceDepth, educationQuality, formatting
4. Calculates **average of all 11 scores** (0-100 scale)
5. Converts to **0-10 scale** and returns final AI score

### Admin Shortlisting Workflow

**File:** `frontend/src/pages/AdminShortlisting.jsx`

1. **Click "Grade All Teams"** button
   - Calls `gradeTeams()` from TeamContext
   - For each REGISTERED team:
     - Changes status to `UNDER_REVIEW`
     - Calls `realAiGrade(pptFile, leaderResumeFile)`
     - Stores AI score (0-10) in team data
     - Updates status with AI score

2. **Select Top N Teams**
   - Filters teams with `UNDER_REVIEW` status and AI scores
   - Sorts by AI score (descending)
   - Selects top N teams

3. **Click "Finalize Shortlist"**
   - Changes selected teams to `SHORTLISTED` status
   - Changes remaining teams to `REJECTED` status
   - **Calls backend to generate QR codes** ✅ (NEW)

## QR Code Generation (Now Integrated ✅)

### Backend QR Routes

**File:** `backend/src/routes/participant.routes.js`

- `GET /api/v1/participant/qr?teamId=123` - Generate QR for shortlisted team
- `POST /api/v1/participant/qr/regenerate` - Regenerate expired QR

**File:** `backend/src/controllers/participant.controller.js`

QR generation logic:
```javascript
// Only generates QR if team.registrationStatus === 'SHORTLISTED'
const qrPayload = {
  teamId: team.id,
  teamName: team.teamName,
  timestamp: now.toISOString(),
  expiresAt: new Date(now + 5 minutes).toISOString()
};
```

### Frontend QR Integration

**File:** `frontend/src/context/TeamContext.jsx` (Line 149-192)

When `shortlistTopN()` is called:
```javascript
// 1. Update team statuses
const updated = teams.map(t => 
  selectedTeamIds.includes(t.id) 
    ? { ...t, registrationStatus: 'SHORTLISTED' }
    : { ...t, registrationStatus: 'REJECTED' }
);

// 2. Call backend to generate QR codes
for (const team of shortlistedTeams) {
  const response = await fetch(
    `${BACKEND_URL}/api/v1/participant/qr?teamId=${team.id}`
  );
  // QR code generated with 5-minute expiry
}
```

**File:** `frontend/src/components/participant/QRPassesTab.jsx`

- Shows "Waiting for shortlisting" if not shortlisted
- Fetches QR from backend when shortlisted
- Displays **5-minute countdown timer**
- Shows **"Regenerate" button** when expired

## Complete Workflow

### 1. Team Registration
- Team fills form with PPT, GitHub, team leader resume
- Status: `REGISTERED`
- **No QR code yet** ✅

### 2. Admin AI Grading
- Admin clicks "Grade All Teams"
- Backend analyzes PPT + resume
- Returns AI scores (0-10)
- Status: `UNDER_REVIEW`
- **Still no QR code** ✅

### 3. Admin Shortlisting
- Admin selects top N teams
- Clicks "Finalize Shortlist"
- Selected teams → `SHORTLISTED`
- **Backend generates QR codes** ✅
- Rejected teams → `REJECTED`

### 4. Participant QR Access
- Shortlisted teams see QR in "QR & Passes" tab
- QR has 5-minute expiry with countdown
- Can regenerate when expired
- **QR only visible if shortlisted** ✅

## Testing Checklist

### Backend Tests (Already Passing ✅)
- [x] Health check: `GET /api/v1/ai/health`
- [x] Resume analysis: `POST /api/v1/ai/analyze/resume`
- [x] PPT analysis: `POST /api/v1/ai/analyze/ppt`
- [x] Get all analyses: `GET /api/v1/ai/analysis`

### Frontend Tests (To Verify)
- [ ] Start backend: `cd backend && npm run dev`
- [ ] Start frontend: `cd frontend && npm run dev`
- [ ] Register a team with PPT and resume
- [ ] Go to Admin Shortlisting page
- [ ] Click "Grade All Teams" - should call real AI API
- [ ] Verify AI scores appear (0-10 range)
- [ ] Select teams and click "Finalize Shortlist"
- [ ] Verify QR codes are generated
- [ ] Go to Participant Dashboard → QR & Passes tab
- [ ] Verify QR shows with countdown timer

## Environment Variables

### Frontend `.env`
```env
VITE_AI_BACKEND_URL=http://localhost:5000/api/v1/ai
VITE_USE_REAL_AI=true  # Must be true for real AI
```

### Backend `.env`
```env
PORT=5000
MONGODB_URI=your_mongodb_uri
HUGGINGFACE_API_KEY=your_hf_key  # For AI models
```

## Troubleshooting

### Issue: "AI grading returns 0"
**Cause:** Backend not running or VITE_USE_REAL_AI=false
**Fix:** 
1. Start backend: `cd backend && npm run dev`
2. Check frontend `.env`: `VITE_USE_REAL_AI=true`
3. Restart frontend dev server

### Issue: "QR code not showing"
**Cause:** Team not shortlisted or backend not running
**Fix:**
1. Verify team status is `SHORTLISTED`
2. Check backend is running on port 5000
3. Check browser console for API errors

### Issue: "QR expired immediately"
**Cause:** System time mismatch
**Fix:** QR expires after 5 minutes - this is expected behavior

## Files Modified

### Backend (New)
- `backend/src/routes/participant.routes.js`
- `backend/src/controllers/participant.controller.js`
- `backend/src/data/teamStore.js`
- `backend/server.js` (registered routes)

### Frontend (Modified)
- `frontend/.env` (VITE_USE_REAL_AI=true)
- `frontend/src/context/TeamContext.jsx` (QR generation on shortlist)
- `frontend/src/pages/AdminShortlisting.jsx` (async shortlist handler)

### Frontend (New)
- `frontend/src/components/participant/QRPassesTab.jsx`
- `frontend/src/components/participant/SubmissionsTab.jsx`
- `frontend/src/components/participant/TeamInfoTab.jsx`

## Summary

✅ **AI Backend Routes:** Working (verified by your test)
✅ **Frontend AI Integration:** Now enabled (VITE_USE_REAL_AI=true)
✅ **QR Generation:** Integrated into shortlisting workflow
✅ **QR Expiry:** 5-minute countdown with regenerate
✅ **Status Flow:** REGISTERED → UNDER_REVIEW → SHORTLISTED → QR Generated

The complete AI-powered shortlisting and QR generation workflow is now fully integrated and ready for testing!
