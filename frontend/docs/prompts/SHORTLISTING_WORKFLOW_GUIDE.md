# Admin Shortlisting Workflow - Complete Guide

## Updated Workflow (Fixed)

### Step 1: Start AI Grading
1. Admin clicks **"Start AI Grading (X teams)"** button
2. System prompts: **"How many teams should be shortlisted for the next round?"**
   - Shows total registered teams
   - Default suggestion: min(30, total_teams)
3. Admin enters desired shortlist count (e.g., 30)
4. System starts AI grading:
   - Uploads each team's PPT to `/api/v1/ai/analyze/ppt`
   - Uploads team leader's resume to `/api/v1/ai/analyze/resume`
   - Calculates AI score (0-10 scale)
   - Updates team status to `UNDER_REVIEW`
5. Success message: "Successfully graded X teams!"
6. Info message: "Top N teams will be auto-selected"

### Step 2: Select Teams (Two Options)

#### Option A: Auto-Select (Recommended)
1. Click **"Auto-Select"** button
2. System automatically selects top N teams by AI score
3. Selected teams are highlighted in the table
4. Success message: "Selected top N teams by AI score"

#### Option B: Manual Selection
1. Click checkboxes next to teams in the table
2. Can select any teams regardless of AI score
3. Can use "Select Top" input to change the number
4. Selected count updates in real-time

### Step 3: Finalize Shortlist
1. Click **"Finalize Shortlist"** button
2. Confirmation dialog appears:
   ```
   Shortlist X teams? This will:
   • Generate QR codes for selected teams
   • Mark remaining teams as rejected
   • Send notifications
   
   This action cannot be undone.
   ```
3. Click "OK" to confirm
4. System processes:
   - Changes selected teams to `SHORTLISTED` status
   - Changes remaining `UNDER_REVIEW` teams to `REJECTED`
   - Calls backend to generate QR codes for each shortlisted team
   - QR codes include: teamId, teamName, timestamp, expiresAt (5 min)
5. Success messages:
   - "✅ X teams shortlisted!"
   - "🎫 QR codes generated for gate entry and food coupons"

### Step 4: Participant Access
1. Shortlisted participants log in
2. Navigate to **"QR & Passes"** tab
3. See:
   - QR code with 5-minute countdown timer
   - Food coupons (Breakfast, Lunch, Dinner)
   - Gate entry instructions
4. When QR expires:
   - "QR Expired. Click to regenerate" message
   - Click regenerate button for new QR

## Key Features

### AI Grading
- **Real AI Backend:** Calls actual AI API (not mock)
- **Dual Analysis:** PPT (6 scores) + Resume (5 scores)
- **Smart Scoring:** Averages 11 scores, converts to 0-10 scale
- **Team Leader Focus:** Only team leader's resume analyzed

### Manual Override
- Admin can manually select/deselect teams
- Not forced to use AI recommendations
- Can adjust shortlist count anytime
- Checkbox selection for full control

### QR Generation
- **Automatic:** Generated when shortlist finalized
- **Secure:** 5-minute expiry with regenerate option
- **Status-Gated:** Only `SHORTLISTED` teams get QR codes
- **Multi-Purpose:** Gate entry + food coupons

### Food Coupons
- **Breakfast** - 8:30 AM
- **Lunch** - 1:00 PM
- **Dinner** - 7:00 PM
- Tracked per team (claimed/available)
- Visible in QR & Passes tab

## Status Flow

```
REGISTERED (form submitted)
    ↓
    [Admin clicks "Start AI Grading"]
    ↓
UNDER_REVIEW (AI grading in progress)
    ↓
    [Admin selects teams + clicks "Finalize Shortlist"]
    ↓
SHORTLISTED (selected) ← QR codes generated ✅
    OR
REJECTED (not selected)
```

## UI Improvements Made

1. **Prompt for Shortlist Count:** Admin specifies count before grading starts
2. **Correct Team Count:** Button shows actual registered teams count
3. **Better Feedback:** Sequential toast messages for clarity
4. **Manual Selection:** Full checkbox control for admin
5. **QR Confirmation:** Explicit message about QR generation

## Testing Checklist

- [ ] Click "Start AI Grading" - prompt appears
- [ ] Enter shortlist count (e.g., 30)
- [ ] AI grading completes - teams show scores
- [ ] Click "Auto-Select" - top N teams selected
- [ ] OR manually check/uncheck teams
- [ ] Click "Finalize Shortlist" - confirmation dialog
- [ ] Confirm - QR codes generated
- [ ] Participant sees QR in "QR & Passes" tab
- [ ] QR countdown timer works (5 minutes)
- [ ] Food coupons visible (Breakfast/Lunch/Dinner)

## Files Modified

- `frontend/src/pages/AdminShortlisting.jsx`
  - Added `handleStartGrading()` with prompt
  - Updated `handleGradeAll()` to accept team count
  - Enhanced `handleFinalizeShortlist()` with QR messages
  - Added `shortlistCount` state

## Environment Check

Ensure `.env` has:
```env
VITE_USE_REAL_AI=true
VITE_AI_BACKEND_URL=http://localhost:5000/api/v1/ai
```

Backend must be running on port 5000 for AI grading to work!
