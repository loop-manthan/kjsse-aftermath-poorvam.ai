You are working on a MERN-based Hackathon Management System.

Currently, login requires manual entry of codes for participant/admin/judge roles, which is inefficient.

I want to implement a QR-Based Auto Authentication System with the following architecture and constraints.

🎯 OBJECTIVE

Implement secure QR-based login for:

Participants

Admins

Judges

No manual ID/code entry required.

Users upload their QR → system verifies → auto login → redirect to role dashboard.

🔥 FEATURE REQUIREMENTS
1️⃣ QR Code Generation (During Hackathon Hosting)

When Admin creates a new Hackathon:

System should:

Generate unique secure token for:

Each Participant

Each Judge

Each Admin (sub-admin optional)

Embed in QR:

{
  "hackathonId": "...",
  "userId": "...",
  "role": "participant/admin/judge",
  "token": "signedJWTorHash"
}
Security Rules:

Use JWT (signed with server secret)

Expiry configurable (e.g., 7 days or event duration)

Token must contain:

userId

role

hackathonId

issuedAt

expiry

2️⃣ Bulk QR Code Download Feature

After hackathon creation:

Admin Dashboard → "Generate QR Access Passes"

Options:

Download all participant QRs (ZIP)

Download judge QRs

Download admin QRs

Download single QR

Download CSV + QR pairing

Implementation Suggestion:

Use qrcode npm package

Generate PNGs

Use archiver to zip

Store temporarily in server

Or generate on-demand without saving

3️⃣ QR Upload Login Flow

New Login Option:

“Login via QR Upload”

Frontend:

Upload QR image

Use html5-qrcode OR zxing-js

Decode QR client-side

Extract payload

Backend:

Verify JWT

Validate:

Token signature

Not expired

User exists

Role matches DB

Hackathon is active

If valid:

Generate session JWT

Set HTTP-only cookie

Redirect based on role:

Role	Redirect
participant	/participant/dashboard
judge	/judge/dashboard
admin	/admin/dashboard
4️⃣ Database Design
User Schema:
{
  _id,
  name,
  email,
  role,
  hackathonId,
  qrTokenHash,
  isActive
}
Hackathon Schema:
{
  _id,
  name,
  startDate,
  endDate,
  isActive
}
5️⃣ Security Enhancements (Important)

Do NOT trust QR payload blindly

Always verify token server-side

Rotate tokens when hackathon ends

Add:

IP logging

Login timestamp

Device fingerprint (optional)

Optional Advanced:

One-time QR usage toggle

Regenerate QR option

Invalidate old QR when regenerated

6️⃣ Frontend UX Flow

Login Page:

[ Manual Login ]
[ Login via QR ]

If QR:

Drag & Drop UI

Auto scanning animation

Loader

Success animation

Auto redirect

Error cases:

Expired QR

Invalid hackathon

Role mismatch

Tampered QR

7️⃣ Folder Structure (MERN)
backend/
  controllers/qrController.js
  services/qrService.js
  utils/tokenUtils.js
  routes/qrRoutes.js

frontend/
  components/QRLogin.jsx
  pages/Login.jsx
8️⃣ APIs Required

POST /api/qr/generate/:hackathonId
POST /api/qr/verify
GET /api/qr/download/:hackathonId?role=participant

9️⃣ MVP Shortcut (If No Backend Available)

If running zero-backend demo:

Encode:

{
  role,
  userId,
  hackathonId
}

Store mock users in localStorage

Validate locally

Simulate authentication

Store session in localStorage

But structure code so it can be backend-swappable later.