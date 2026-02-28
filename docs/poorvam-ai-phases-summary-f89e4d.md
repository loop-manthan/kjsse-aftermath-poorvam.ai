# Poorvam.ai Phases 2-4 Summary

Quick reference guide for remaining implementation phases.

## Phase 2: Frontend (Hours 14-28)

### Setup
- Configure Axios with base URL and auth interceptor
- Create context for auth state management
- Set up React Router with protected routes

### Key Components

**Auth Pages**
- `/login` - Phone/email login form
- `/register` - User type selection → registration form with location input

**Client Dashboard** (`/client/dashboard`)
- Create Job form (description, location, payment offer)
- Active Jobs list (status, worker details, actions)
- Job History with ratings

**Worker Dashboard** (`/worker/dashboard`)
- Assigned Jobs (auto-assigned from backend)
- Accept/Reject job actions
- Active Jobs with Start/Complete buttons
- Availability toggle (available/busy/offline)

**Shared Components**
- JobCard (displays job details, distance, payment)
- RatingModal (star rating + comment)
- LocationPicker (map or address input)
- PaymentSelector (online/offline toggle)

### API Integration
```javascript
// src/api/client.js
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

### State Management
- AuthContext (user, token, login, logout, register)
- JobContext (jobs, createJob, updateJob, refreshJobs)

---

## Phase 3: Voice Interface (Hours 28-40)

### Sarvam AI Integration

**Speech-to-Text**
```javascript
// src/services/sarvam.js
const transcribeAudio = async (audioBlob) => {
  const formData = new FormData();
  formData.append('audio', audioBlob);
  
  const response = await fetch('https://api.sarvam.ai/v1/speech-to-text', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${SARVAM_API_KEY}` },
    body: formData
  });
  
  return response.json();
};
```

**Text-to-Speech**
```javascript
const generateSpeech = async (text) => {
  const response = await fetch('https://api.sarvam.ai/v1/text-to-speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SARVAM_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text, language: 'hi-IN' })
  });
  
  return response.blob();
};
```

### LiveKit Setup

**Voice Room Component**
```javascript
// src/components/VoiceInterface.jsx
import { Room, useParticipant } from '@livekit/components-react';

const VoiceInterface = ({ userType }) => {
  const [room, setRoom] = useState(null);
  
  useEffect(() => {
    // Connect to LiveKit room
    const connectRoom = async () => {
      const token = await getVoiceToken();
      const room = new Room();
      await room.connect(LIVEKIT_URL, token);
      setRoom(room);
    };
    connectRoom();
  }, []);
  
  return (
    <Room room={room}>
      {userType === 'worker' ? <WorkerVoiceControl /> : <ClientVoiceRequest />}
    </Room>
  );
};
```

### Voice Flows

**Client Voice Flow**
1. Call initiated → authenticate by phone number
2. "Describe your problem" → STT captures description
3. Backend creates job + assigns worker
4. TTS confirms: "Worker assigned, name is X, arriving in Y minutes"

**Worker Voice Flow**
1. Call initiated → authenticate by phone number
2. Fetch nearby jobs from backend
3. TTS reads job: "Plumber needed, 2km away, ₹500"
4. Worker says "Accept" or "Skip" → STT processes
5. Backend updates job status
6. TTS confirms action

### Phone Number Routing
- Map test numbers to user accounts
- Auto-authenticate on incoming call
- Route to appropriate voice flow based on user type

---

## Phase 4: Final Integration (Hours 40-48)

### Razorpay Integration

**Frontend**
```javascript
const handlePayment = async (jobId, amount) => {
  const { data } = await api.post('/payments/create-order', { jobId });
  
  const options = {
    key: RAZORPAY_KEY,
    amount: data.order.amount,
    currency: 'INR',
    order_id: data.order.id,
    handler: async (response) => {
      await api.post('/payments/verify', {
        transactionId: data.transaction.transactionId,
        razorpayPaymentId: response.razorpay_payment_id,
        razorpaySignature: response.razorpay_signature
      });
      toast.success('Payment successful');
    }
  };
  
  const razorpay = new window.Razorpay(options);
  razorpay.open();
};
```

**Backend** (add to payment controller)
```javascript
import Razorpay from 'razorpay';
import crypto from 'crypto';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

export const createPaymentOrder = async (req, res) => {
  const { jobId, tip = 0 } = req.body;
  const job = await Job.findById(jobId);
  const amount = (job.paymentOffer + tip) * 100; // Convert to paise
  
  const order = await razorpay.orders.create({
    amount,
    currency: 'INR',
    receipt: `job_${jobId}`
  });
  
  const transaction = await Transaction.create({
    jobId,
    amount: job.paymentOffer,
    tip,
    mode: 'online',
    razorpayOrderId: order.id
  });
  
  res.json({ order, transaction });
};

export const verifyPayment = async (req, res) => {
  const { transactionId, razorpayPaymentId, razorpaySignature } = req.body;
  const transaction = await Transaction.findOne({ transactionId });
  
  const sign = razorpayOrderId + '|' + razorpayPaymentId;
  const expectedSign = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(sign.toString())
    .digest('hex');
  
  if (razorpaySignature === expectedSign) {
    transaction.status = 'completed';
    transaction.razorpayPaymentId = razorpayPaymentId;
    await transaction.save();
    
    await Job.findByIdAndUpdate(transaction.jobId, {
      paymentStatus: 'completed'
    });
    
    res.json({ success: true });
  } else {
    res.status(400).json({ error: 'Invalid signature' });
  }
};
```

### Enhanced Features

**Real-time Updates** (Optional - if time permits)
```javascript
// Backend: server.js
import { Server } from 'socket.io';

const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL }
});

io.on('connection', (socket) => {
  socket.on('join-job', (jobId) => {
    socket.join(`job-${jobId}`);
  });
});

// Emit job updates
io.to(`job-${jobId}`).emit('job-updated', job);
```

**SMS Notifications** (Twilio)
```javascript
import twilio from 'twilio';

const client = twilio(TWILIO_SID, TWILIO_AUTH_TOKEN);

const sendSMS = async (to, message) => {
  await client.messages.create({
    body: message,
    from: TWILIO_PHONE,
    to
  });
};

// After job assignment
await sendSMS(worker.phone, `New job assigned: ${job.description}`);
```

### Testing Checklist

**End-to-End Flows**
- [ ] Client registers → creates job → worker auto-assigned → job completed → both rate each other → payment processed
- [ ] Worker registers → receives job → accepts → completes → confirms offline payment
- [ ] Client calls voice bot → describes problem → job created → worker assigned
- [ ] Worker calls voice bot → hears nearby jobs → accepts via voice → job updated

**Edge Cases**
- [ ] No workers available for category
- [ ] Worker rejects job (manual cancel)
- [ ] Payment failure handling
- [ ] Invalid location coordinates
- [ ] Duplicate phone number registration

### Deployment Preparation

**Environment Variables**
```
MONGO_URI=<atlas-connection>
JWT_SECRET=<secret>
SARVAM_API_KEY=<key>
RAZORPAY_KEY_ID=<key>
RAZORPAY_KEY_SECRET=<secret>
TWILIO_SID=<sid>
TWILIO_AUTH_TOKEN=<token>
LIVEKIT_API_KEY=<key>
LIVEKIT_API_SECRET=<secret>
```

**Build Commands**
```bash
# Frontend
cd frontend
npm run build

# Backend
cd backend
npm start
```

---

## Complete Feature Matrix

| Feature | Phase 1 | Phase 2 | Phase 3 | Phase 4 |
|---------|---------|---------|---------|---------|
| User Auth | ✅ Backend | ✅ UI | ✅ Voice | ✅ Complete |
| Job Creation | ✅ API | ✅ UI | ✅ Voice | ✅ Complete |
| Matching | ✅ Algorithm | ✅ Display | - | ✅ Optimized |
| Dashboards | - | ✅ Complete | - | ✅ Enhanced |
| Ratings | ✅ API | ✅ UI | - | ✅ Complete |
| Payments | ✅ Structure | ✅ Selection | - | ✅ Razorpay |
| Voice | ✅ Placeholder | - | ✅ Complete | ✅ Integrated |
| SMS | - | - | - | ✅ Twilio |

---

## Success Criteria

✅ Client can create job via web or voice
✅ Auto-matching assigns nearest available worker
✅ Worker can accept/complete jobs via web or voice
✅ Mutual rating system functional
✅ Online payment via Razorpay works
✅ Offline payment confirmation works
✅ Voice interface works for all 4 test numbers
✅ SMS confirmations sent
✅ Categories auto-generated from descriptions

---

## Time Allocation

- **Phase 1 (0-14h)**: Backend foundation
- **Phase 2 (14-28h)**: Frontend with live APIs
- **Phase 3 (28-40h)**: Voice integration
- **Phase 4 (40-48h)**: Payments, SMS, testing

**Total: 48 hours**
