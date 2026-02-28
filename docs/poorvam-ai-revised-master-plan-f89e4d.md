# Poorvam.ai Direct Implementation Plan (Frontend + Backend)

This is a streamlined 48-hour implementation plan for Poorvam.ai with direct frontend and backend integration, eliminating mock data and local storage phases.

## Overview

**Project**: Poorvam.ai - AI-powered service dispatch platform
**Timeline**: 48 hours
**Approach**: Backend-first → Frontend with live APIs → Voice integration → Complete system
**No Mock Data**: Direct database integration from the start

## Existing Setup Analysis

- **Frontend**: React 19 + Vite, TailwindCSS, DaisyUI, React Router, Lucide icons, Framer Motion
- **Backend**: Node.js + Express (empty shell), MongoDB Atlas configured
- **APIs Configured**: Sarvam AI (sk_n4sm3lup_H5D5ELgmNy3sZPnQF4bcmGsT), HuggingFace models
- **Test Phone Numbers**: +91 9326418140, 9987300208, 9892884320, 9324769110
- **Database**: MongoDB Atlas cluster ready

## Revised Phase Structure

### Phase 1: Backend Foundation & Core APIs (Hours 0-14)
**File**: `poorvam-ai-phase1-backend-f89e4d.md`

**Focus**: Build complete backend infrastructure first
- Database schemas (Users, Jobs, Categories, Reviews, Transactions)
- Authentication system (JWT, phone/email/Google)
- Core API endpoints (auth, jobs, matching, reviews)
- Job matching algorithm (Haversine distance calculation)
- Category auto-generation from keywords
- Middleware (auth, error handling, validation)
- **Deliverable**: Fully functional REST API tested with Postman/Thunder Client

### Phase 2: Frontend with Live Backend (Hours 14-28)
**File**: `poorvam-ai-phase2-frontend-f89e4d.md`

**Focus**: Build UI connected directly to backend APIs
- Authentication flows (login/register for clients & workers)
- Client dashboard (create job, view assigned worker, track status)
- Worker dashboard (view assigned jobs, accept/complete, availability toggle)
- Real-time API integration (no local storage)
- Job creation with location input
- Rating system UI
- Payment selection UI
- **Deliverable**: Complete web app with live backend integration

### Phase 3: Voice Interface Integration (Hours 28-40)
**File**: `poorvam-ai-phase3-voice-f89e4d.md`

**Focus**: Sarvam AI voice + LiveKit implementation
- Sarvam AI text-to-speech and speech-to-text integration
- LiveKit room setup for voice calls
- Worker voice control interface (full control over job acceptance/completion)
- Client voice interface (describe problem, get worker assignment)
- Phone number routing for test numbers
- Voice authentication and user identification
- SMS confirmations via Twilio
- **Deliverable**: Working voice bot for both user types

### Phase 4: Advanced Features & Integration (Hours 40-48)
**File**: `poorvam-ai-phase4-final-f89e4d.md`

**Focus**: Complete system integration and polish
- Razorpay payment integration (online payments)
- Offline payment confirmation flow
- Tip functionality
- Enhanced rating system with visibility weights
- Multi-category worker support
- Real-time job status updates
- End-to-end testing (web + voice flows)
- Bug fixes and optimization
- **Deliverable**: Production-ready MVP

## Technology Stack

### Backend Stack
```
- Node.js + Express 5.2
- MongoDB + Mongoose 9.2
- JWT (jsonwebtoken 9.0)
- Axios 1.13 (external API calls)
- Multer 2.0 (file uploads)
- UUID 13.0 (unique IDs)
```

### Frontend Stack
```
- React 19 + Vite 7
- TailwindCSS 4.2 + DaisyUI 5.5
- React Router DOM 7.13
- Lucide React 0.574 (icons)
- Framer Motion 12.34 (animations)
- React Hot Toast 2.6 (notifications)
- Axios (API calls)
```

### Voice & AI Stack
```
- Sarvam AI API (text & voice models)
- LiveKit (WebRTC voice infrastructure)
- Twilio (SMS notifications)
- HuggingFace (embeddings for NLP)
```

### Payment & Services
```
- Razorpay (online payments)
- Google Maps API (geocoding, distance)
```

## Database Schema Overview

### Users Collection
```javascript
{
  _id: ObjectId,
  userId: String (UUID),
  name: String,
  email: String,
  phone: String,
  userType: String, // 'client' or 'worker'
  password: String (hashed),
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  address: String,
  categories: [String], // for workers
  rating: Number,
  totalRatings: Number,
  visibilityWeight: Number,
  status: String, // 'available', 'busy', 'offline'
  createdAt: Date,
  authMethod: String // 'email', 'phone', 'google', 'voice'
}
```

### Jobs Collection
```javascript
{
  _id: ObjectId,
  jobId: String (UUID),
  clientId: String,
  workerId: String,
  category: String,
  description: String,
  paymentOffer: Number,
  location: {
    type: 'Point',
    coordinates: [longitude, latitude]
  },
  address: String,
  status: String, // 'pending', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled'
  clientRating: Number,
  workerRating: Number,
  paymentMode: String, // 'online', 'offline'
  paymentStatus: String,
  tip: Number,
  createdAt: Date,
  completedAt: Date
}
```

### Categories Collection
```javascript
{
  _id: ObjectId,
  categoryId: String,
  name: String,
  keywords: [String],
  occurrenceCount: Number,
  createdAt: Date
}
```

## API Endpoints Structure

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/google` - Google OAuth
- `POST /api/auth/phone-verify` - Phone OTP verification
- `GET /api/auth/me` - Get current user

### Jobs
- `POST /api/jobs/create` - Create new job (client)
- `GET /api/jobs/my-jobs` - Get user's jobs
- `GET /api/jobs/assigned/:workerId` - Get assigned jobs (worker)
- `PATCH /api/jobs/:jobId/accept` - Accept job (worker)
- `PATCH /api/jobs/:jobId/complete` - Mark complete
- `PATCH /api/jobs/:jobId/cancel` - Cancel job

### Matching
- `POST /api/matching/find-worker` - Auto-assign nearest worker
- `GET /api/matching/nearby-jobs/:workerId` - Get nearby jobs for worker

### Reviews
- `POST /api/reviews/submit` - Submit rating
- `GET /api/reviews/user/:userId` - Get user reviews

### Payments
- `POST /api/payments/create-order` - Create Razorpay order
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/offline-confirm` - Confirm offline payment

### Categories
- `GET /api/categories` - List all categories
- `POST /api/categories/generate` - Auto-generate from keywords

### Voice
- `POST /api/voice/authenticate` - Authenticate via phone number
- `POST /api/voice/process-speech` - Process STT input
- `POST /api/voice/generate-response` - Generate TTS response

## Development Workflow

1. **Phase 1 (Hours 0-14)**: Build and test entire backend
   - Set up MongoDB models
   - Implement all API endpoints
   - Test with Postman/Thunder Client
   - Verify matching algorithm works

2. **Phase 2 (Hours 14-28)**: Build frontend connected to live backend
   - Create authentication pages
   - Build client and worker dashboards
   - Integrate all API calls
   - Test complete web flows

3. **Phase 3 (Hours 28-40)**: Add voice layer
   - Integrate Sarvam AI
   - Set up LiveKit rooms
   - Build voice interfaces
   - Test with phone numbers

4. **Phase 4 (Hours 40-48)**: Final integration
   - Add payment processing
   - Implement rating system
   - End-to-end testing
   - Bug fixes

## Key Features Implementation Priority

### Must-Have (Core MVP)
1. User registration/authentication (web + voice)
2. Job creation by client
3. Auto-matching algorithm
4. Worker job acceptance
5. Basic dashboards
6. Job status tracking
7. Rating system
8. Payment selection (online/offline)

### Important (Enhanced MVP)
1. Voice interface for both users
2. SMS notifications
3. Razorpay integration
4. Dynamic category generation
5. Multi-category worker support
6. Tip functionality

### Nice-to-Have (If Time Permits)
1. Real-time updates (Socket.io)
2. Job history
3. Advanced NLP for categorization
4. Worker availability scheduling

## Success Criteria

- ✅ Client can create job via web or voice
- ✅ System auto-assigns nearest available worker
- ✅ Worker can accept/reject jobs via web or voice
- ✅ Both users can rate each other
- ✅ Payment processing works (online + offline)
- ✅ Voice interface functional for all 4 test numbers
- ✅ Database stores all interactions
- ✅ Categories auto-generate from job descriptions

## Next Steps

1. Review this revised master plan
2. Confirm direct backend+frontend approach
3. Proceed to Phase 1 detailed backend plan
4. Begin implementation after approval

---

**Note**: Each phase has a detailed implementation plan in separate files. This approach eliminates mock data complexity and builds a production-ready system from the start.
