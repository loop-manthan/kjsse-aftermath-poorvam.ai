# Database Setup Guide - AeroHacks QR Authentication

## 🚀 Quick Setup for New Database

### **Step 1: Update .env with New Database**

Edit `backend/.env`:

```env
MONGO_URI=your-new-mongodb-connection-string
JWT_SECRET=aerohacks-2026-super-secret-jwt-key-for-qr-authentication-system
QR_TOKEN_EXPIRY=7d
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### **Step 2: Run Setup Script**

```bash
cd backend
node scripts/setupTestDatabase.js
```

This will:
- ✅ Create test hackathon (AERO-2026-HC1234)
- ✅ Create 3 test users (Admin, Judge, Participant)
- ✅ Generate QR codes for all users
- ✅ Set up proper token hashes
- ✅ Create README with all credentials

### **Step 3: Start Servers**

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### **Step 4: Test the System**

Go to `http://localhost:5173` and test both login methods.

---

## 📊 Test Data Created

### **Hackathon**
- **Code:** AERO-2026-HC1234
- **Name:** AeroHacks 2026 - Innovation Challenge
- **Date:** March 15, 2026
- **Venue:** Tech Innovation Hub, Bangalore
- **Max Teams:** 50
- **Status:** Active

### **Users Created**

| Role | Name | Email | Role Code |
|------|------|-------|-----------|
| Admin | Admin User | admin@aerohacks.com | A-12345678 |
| Judge | Judge User | judge@aerohacks.com | J-87654321 |
| Participant | Participant User | participant@aerohacks.com | P-A3F9K2H8 |

### **Participant Codes Available**
```
P-A3F9K2H8, P-B7K4M9N2, P-C2X8Y5Z1, P-D9W3V6T4, P-E1Q7R8S5
P-F4P2L6M3, P-G8N5K9J7, P-H3M1X4Y6, P-I7Z2W8V5, P-J9T4Q3R1
```

---

## 🧪 Testing Scenarios

### **Test 1: Manual Code Login**
1. Go to `http://localhost:5173`
2. Enter: `AERO-2026-HC1234`
3. Select **Admin**
4. Enter: `A-12345678`
5. ✅ Should login to Admin Dashboard

### **Test 2: QR Code Login**
1. Go to `http://localhost:5173`
2. Click **"Upload QR"** tab
3. Upload: `backend/test-qr-codes/admin_A-12345678.png`
4. ✅ Should auto-login to Admin Dashboard

### **Test 3: Download QR Codes**
1. Go to `http://localhost:5173/host`
2. Create new hackathon
3. Click **"Download All QR Codes (ZIP)"**
4. ✅ ZIP file downloads with all QR codes

### **Test 4: Admin QR Management**
1. Login as admin
2. Go to `/admin/qr-codes`
3. Select role and generate tokens
4. Download QR codes
5. ✅ QR codes work for login

---

## 🔧 Troubleshooting

### **Issue: Token verification failed**

**Check:**
1. JWT_SECRET is set in `.env` (min 32 characters)
2. Backend server restarted after adding JWT_SECRET
3. QR codes regenerated after JWT_SECRET change

**Fix:**
```bash
cd backend
node scripts/setupTestDatabase.js
```

### **Issue: QR codes have quotes**

**Fixed in:** `frontend/src/components/features/QRLogin.jsx`
- Automatically strips quotes from decoded tokens

### **Issue: Database connection failed**

**Check:**
1. MONGO_URI is correct in `.env`
2. MongoDB Atlas allows connections from your IP
3. Database user has read/write permissions

---

## 📁 Generated Files

After running setup script:

```
backend/test-qr-codes/
├── README.md                    (Setup summary)
├── admin_A-12345678.png        (Admin QR code)
├── judge_J-87654321.png        (Judge QR code)
└── participant_P-A3F9K2H8.png  (Participant QR code)
```

---

## 🔐 Security Notes

- JWT tokens valid for 7 days
- Token hashes stored in database (SHA-256)
- QR codes contain JWT tokens
- Server verifies both JWT signature and token hash
- All users marked as active by default

---

## 🗄️ Database Collections

### **Hackathons Collection**
```javascript
{
  hackathonCode: "AERO-2026-HC1234",
  name: "AeroHacks 2026",
  isActive: true,
  codes: {
    admin: "A-12345678",
    judge: "J-87654321",
    participants: ["P-A3F9K2H8", ...]
  }
}
```

### **Users Collection**
```javascript
{
  name: "Admin User",
  email: "admin@aerohacks.com",
  role: "admin",
  roleCode: "A-12345678",
  hackathonId: "AERO-2026-HC1234",
  qrTokenHash: "...",
  qrGeneratedAt: Date,
  qrExpiresAt: Date,
  isActive: true
}
```

---

## 🎯 Quick Commands

```bash
# Setup new database
node scripts/setupTestDatabase.js

# Regenerate QR codes only
node scripts/generateTestQRs.js

# Check database status
node check-hackathon.js

# Test QR verification
node test-qr-token.js

# Start backend
npm run dev

# Start frontend (in frontend folder)
npm run dev
```

---

## ✅ Verification Checklist

Before testing, ensure:

- [ ] MongoDB connection working
- [ ] JWT_SECRET set in .env (64 characters)
- [ ] Setup script completed successfully
- [ ] Backend server running on port 5000
- [ ] Frontend server running on port 5173
- [ ] QR codes generated in test-qr-codes folder
- [ ] README.md created with credentials

---

**Your database is ready! 🎉**

Run the setup script and start testing the QR authentication system.
