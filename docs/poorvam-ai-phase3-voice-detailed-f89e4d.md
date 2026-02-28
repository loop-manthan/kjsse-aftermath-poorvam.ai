# Phase 3: Node-Only Voice Interface (Express + LiveKit + Sarvam + Plivo)

This phase integrates real-time voice capability entirely within the Express.js backend. There is no separate Python microservice. Express acts as both the business logic layer and the real-time voice agent.

---

## Architecture Overview

```text
+------------------+    PSTN      +------------------+
|   User (Phone)   | <==========> |      Plivo       |
+------------------+              +--------+---------+
                                           |
                                    SIP Trunk Transfer
                                           |
                                           v
+------------------+   WebRTC      +------------------+
|  LiveKit Cloud   | <============>|   Express.js     |
|  (Audio Room)    |   (SDK Agent) |   (Node Agent)   |
+------------------+               +--------+---------+
                                            |
                                   MongoDB + Sarvam AI
```

**Data Flow Summary:**
1. User calls the Plivo number (PSTN).
2. Plivo receives the call, sends a webhook to Express.
3. Express returns a SIP Transfer instruction to Plivo (pointing at LiveKit SIP endpoint).
4. Plivo transfers the call into a LiveKit room via SIP trunk.
5. Express Node process connects to the same LiveKit room as a programmatic agent using `livekit-server-sdk`.
6. Express agent listens to audio, pipes it through Sarvam STT, processes intent, runs job logic, and responds via Sarvam TTS back into the room.

---

## Deployment Requirement ⚠️

> **A publicly accessible URL is REQUIRED for Plivo webhooks.**

Plivo must reach your Express server on a public HTTP endpoint. Localhost will NOT work for real phone calls.

**Options:**
- `ngrok http 5000` → Use the generated HTTPS URL for Plivo config during development.
- Deploy to Render, Railway, or Fly.io for the hackathon demo.

---

## Technology Stack

| Component          | Tool                     | Responsibility                                        |
|--------------------|--------------------------|-------------------------------------------------------|
| Backend Server     | Express.js (Node 20)     | All logic, webhooks, voice agent, API endpoints       |
| Database           | MongoDB (Atlas)          | Source of truth for users, jobs, categories           |
| Telephony          | Plivo                    | PSTN incoming calls, SIP transfer, SMS notifications  |
| Audio Room         | LiveKit Cloud            | Real-time audio rooms via WebRTC + SIP                |
| STT / TTS / NLP    | Sarvam AI                | Speech transcription, synthesis, intent extraction    |
| Language Support   | Hindi + English          | Code-mixed input supported by Sarvam Saaras v3        |

---

## Timeline Overview (Hours 28-40)

| Phase   | Hours     | Focus                                        | Priority |
|---------|-----------|----------------------------------------------|----------|
| 3.1     | 28 – 30   | Setup: Plivo + LiveKit SIP bridge validated  | P0       |
| 3.2     | 30 – 34   | Node voice agent + Sarvam STT/TTS working    | P0       |
| 3.3     | 34 – 38   | Full Client + Worker voice flows wired       | P0       |
| 3.4     | 38 – 40   | Edge cases, SMS fallback, demo prep          | P1       |

---

## Developer Split

### Developer A — Backend Logic + Plivo (Hours 28-40)

**P0 Tasks:**
- `POST /api/webhooks/plivo/incoming` — Receive incoming call, respond with SIP Transfer XML to LiveKit.
- `POST /api/webhooks/plivo/status` — Handle call status updates.
- `POST /api/voice/sessions/initiate` — Internal: called by voice agent module to hydrate user context from phone number.
- `POST /api/voice/jobs/create` — Internal: called by voice agent module after intent is extracted. Runs `$nearSphere` query to find nearest worker. Returns matched worker.
- `POST /api/voice/jobs/action` — Internal: updates job status when worker accepts/declines.
- MongoDB Geospatial indexes on `User.location` and `Job.location`.
- Seed 5 mock workers with coordinates near the hackathon venue.

**P1 Tasks:**
- Plivo SMS notification when a new job is assigned to a worker.
- `GET /api/voice/worker/:userId/pending-job` — Returns the current assigned pending job for a worker, called by the voice agent during worker call.

### Developer B — LiveKit Agent + Sarvam (Hours 28-40)

**P0 Tasks:**
- `src/services/livekit.service.js` — Generate room tokens, join a LiveKit room programmatically on the Node server.
- `src/services/sarvam.service.js` — STT (audio buffer → transcript), TTS (text → audio buffer), Intent LLM (transcript → JSON intent).
- `src/services/voiceAgent.service.js` — Core voice state machine. Export a `startVoiceSession(roomName, phoneNumber)` function. This function joins the room and processes the conversation.
- Wire the Plivo webhook (built by Dev A) to trigger `startVoiceSession`.
- Implement audio capture from LiveKit track and streaming to Sarvam STT.
- Implement `playAudio(audioBuffer, track)` to publish TTS output to the LiveKit room.

**P1 Tasks:**
- Worker voice state machine (parallel to client flow).
- Hindi fallback if STT returns no transcript.

---

## Node.js Folder Structure

```text
/backend
├── server.js
└── src/
    ├── controllers/
    │   └── webhook.controller.js     # Plivo incoming call → SIP transfer logic
    ├── routes/
    │   ├── webhook.routes.js         # POST /api/webhooks/plivo/*
    │   └── voice.routes.js           # Internal voice API routes
    ├── models/
    │   ├── User.model.js
    │   └── Job.model.js
    ├── services/
    │   ├── livekit.service.js        # Room creation, token gen, programmatic join
    │   ├── sarvam.service.js         # STT, TTS, Intent extraction wrappers
    │   ├── voiceAgent.service.js     # Voice state machine (client + worker flows)
    │   └── plivo.service.js          # Outbound SMS via Plivo REST API
    └── utils/
        ├── distance.js               # Haversine formula
        └── categoryExtractor.js      # Fallback keyword-matching for categories
```

---

## Phase 3.1: Plivo → LiveKit SIP Bridge Setup (Hours 28-30)

### Plivo Incoming Webhook Response (Developer A)

Express responds to Plivo with a SIP Transfer XML, redirecting the caller into a LiveKit room.

```javascript
// src/controllers/webhook.controller.js
import { AccessToken } from 'livekit-server-sdk';
import crypto from 'crypto';
import voiceAgentService from '../services/voiceAgent.service.js';

export const handleIncomingCall = async (req, res) => {
  const { From, CallUUID } = req.body;
  const roomName = `call-${CallUUID}`;
  
  // Generate a LiveKit SIP participant token for the caller
  const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: `caller-${From}`
  });
  at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
  const token = await at.toJwt();

  // Trigger Node agent to join the same room (async — do not await here)
  voiceAgentService.startVoiceSession(roomName, From).catch(console.error);

  // Return Plivo XML to transfer call to LiveKit SIP endpoint
  const xml = `
    <Response>
      <Speak>Connecting you now, please wait.</Speak>
      <Dial>
        <SIP authUser="${process.env.LIVEKIT_SIP_USER}" authPassword="${token}">
          ${process.env.LIVEKIT_SIP_URI}/${roomName}
        </SIP>
      </Dial>
    </Response>
  `;
  res.set('Content-Type', 'application/xml').send(xml);
};
```

---

## Phase 3.2: Sarvam Service Layer (Hours 30-32) — Developer B

```javascript
// src/services/sarvam.service.js
import axios from 'axios';
import FormData from 'form-data';

const SARVAM_KEY = process.env.SARVAM_API_KEY;
const BASE_URL = 'https://api.sarvam.ai';

class SarvamService {

  // Speech-to-Text
  async transcribe(audioBuffer, language = 'hi-IN') {
    const form = new FormData();
    form.append('file', audioBuffer, { filename: 'audio.wav', contentType: 'audio/wav' });
    form.append('language_code', language);
    form.append('model', 'saaras:v1');

    const { data } = await axios.post(`${BASE_URL}/speech-to-text`, form, {
      headers: { ...form.getHeaders(), 'api-subscription-key': SARVAM_KEY }
    });
    return data.transcript; // string
  }

  // Text-to-Speech — returns base64 audio string
  async synthesize(text, language = 'hi-IN', speaker = 'meera') {
    const { data } = await axios.post(`${BASE_URL}/text-to-speech`, {
      inputs: [text],
      target_language_code: language,
      speaker,
      model: 'bulbul:v1',
      speech_sample_rate: 16000
    }, {
      headers: { 'api-subscription-key': SARVAM_KEY }
    });
    return Buffer.from(data.audios[0], 'base64'); // audio buffer
  }

  // Intent Extraction via Sarvam Chat
  async extractIntent(transcript) {
    const SYSTEM_PROMPT = `You are a service dispatcher for India. 
      Extract the service intent from the user's request (may be Hindi, English or code-mixed).
      Return ONLY a JSON object: { "category": string, "description": string, "urgency": "high"|"normal" }
      Categories: plumber, electrician, carpenter, painter, cleaner, mechanic, ac_technician, general`;

    const { data } = await axios.post(`${BASE_URL}/chat/completions`, {
      model: 'sarvam-2b',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: transcript }
      ],
      max_tokens: 150,
      temperature: 0.2
    }, {
      headers: { 'api-subscription-key': SARVAM_KEY }
    });

    try {
      return JSON.parse(data.choices[0].message.content.trim());
    } catch {
      return { category: 'general', description: transcript, urgency: 'normal' };
    }
  }
}

export default new SarvamService();
```

---

## Phase 3.3: Voice State Machine (Hours 32-38) — Developer B

### Client Voice Flow

```text
[Room Joined]
     |
     v
 GREET (TTS)
"Hello, kya problem hai aapki?" (Hello, what is your problem?)
     |
     v
 LISTEN (STT) ← 8 second audio capture window
     |
     v
 PARSE_INTENT (Sarvam LLM)
 { category: "plumbing", description: "tap is leaking" }
     |
     v
 CREATE_JOB (Internal Express call to job.controller)
     |
     +-- No Worker Found? ---> TTS "Koi worker nahi mila, baad mein try karo." --> END
     |
     +-- Worker Found? -------> TTS "Aapka [category] worker [name] raasta pe hai." --> END
```

### Worker Voice Flow

```text
[Room Joined]
     |
     v
 IDENTIFY_WORKER (Lookup by phone)
     |
     v
 CHECK_PENDING_JOB (GET /api/voice/worker/:id/pending-job)
     |
     +-- No Jobs? -----------> TTS "Abhi koi kaam nahi hai." --> END
     |
     +-- Job Found? ----------> TTS "Aapke paas [category] job hai. Accept karo?" --> LISTEN
                                         |
                                         v
                                    PARSE RESPONSE (STT + check for "haan"/"yes")
                                         |
                                   Accept?   Reject?
                                     |           |
                                  POST action   POST action
                                  (accept)     (decline)
                                     |
                                   TTS "Job accepted. Client ne aapko await kar raha hai."
```

### voiceAgent.service.js Core Structure

```javascript
// src/services/voiceAgent.service.js
import { Room, RoomEvent, AudioFrame } from 'livekit-client';
import { AccessToken } from 'livekit-server-sdk';
import sarvamService from './sarvam.service.js';
import User from '../models/User.model.js';
import jobController from '../controllers/job.controller.js';

class VoiceAgentService {
  async startVoiceSession(roomName, phoneNumber) {
    // 1. Generate agent token
    const at = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
      identity: 'node-agent'
    });
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
    const token = await at.toJwt();

    // 2. Connect to room
    const room = new Room();
    await room.connect(process.env.LIVEKIT_URL, token);

    // 3. Identify user from phone number
    const user = await User.findOne({ phone: phoneNumber });

    if (user?.userType === 'client') {
      await this.runClientFlow(room, user);
    } else if (user?.userType === 'worker') {
      await this.runWorkerFlow(room, user);
    } else {
      await this.speak(room, 'Aapka number registered nahi hai.');
    }

    await room.disconnect();
  }

  async speak(room, text, lang = 'hi-IN') {
    const audioBuffer = await sarvamService.synthesize(text, lang);
    // Publish audio buffer to room track
    // (Implementation uses LiveKit's LocalAudioTrack.publish())
  }

  async listen(room, durationMs = 8000) {
    // Subscribe to remote participant audio track
    // Collect audio chunks for durationMs
    // Return accumulated Buffer
  }

  async runClientFlow(room, user) {
    await this.speak(room, 'Hello, aapki kya problem hai? Hindi ya English mein batao.');
    const audio = await this.listen(room, 8000);
    const transcript = await sarvamService.transcribe(audio);
    const intent = await sarvamService.extractIntent(transcript);
    const result = await jobController.createAndMatchJob(user._id, intent);

    if (result.matched) {
      await this.speak(room, `Aapka ${intent.category} worker ${result.workerName} rasta pe hai, ${result.distanceKm} kilometer door.`);
    } else {
      await this.speak(room, 'Maafi, abhi koi worker available nahi hai. Thodi der baad call karo.');
    }
  }

  async runWorkerFlow(room, user) {
    const job = await jobController.getPendingJobForWorker(user._id);
    if (!job) {
      await this.speak(room, 'Abhi aapke liye koi kaam nahi hai.');
      return;
    }
    await this.speak(room, `Aapke paas ek ${job.category} ka kaam hai, ${job.distanceKm} km door, ${job.paymentOffer} rupees ka. Accept karo?`);
    const audio = await this.listen(room, 5000);
    const transcript = await sarvamService.transcribe(audio);
    const accepted = /haan|yes|accept|ha/i.test(transcript);
    await jobController.updateJobAction(user._id, job._id, accepted ? 'accept' : 'decline');
    await this.speak(room, accepted ? `Kaam accept hua. Client ${job.clientName} ka intezaar kar raha hai.` : 'Theek hai, kaam decline kiya.');
  }
}

export default new VoiceAgentService();
```

---

## Internal API Contracts (Service Layer — No HTTP needed)

Since everything runs within Express, voice logic calls controller functions directly (not via HTTP). These are the internal function signatures:

```javascript
// job.controller.js exports for use by voiceAgent.service.js

// Creates job + runs $nearSphere matching. Returns { matched, workerName, distanceKm, jobId }
export const createAndMatchJob = (clientId, intent) => { ... };

// Returns the first "assigned" job for a worker with client details
export const getPendingJobForWorker = (workerId) => { ... };

// Sets job.status = 'accepted' or re-queues it
export const updateJobAction = (workerId, jobId, action) => { ... };
```

---

## Phase 3.4: SMS Fallback via Plivo (Hours 38-40) — Developer A

```javascript
// src/services/plivo.service.js
import plivo from 'plivo';

const client = new plivo.Client(process.env.PLIVO_AUTH_ID, process.env.PLIVO_AUTH_TOKEN);

export const sendSMS = async (to, message) => {
  return client.messages.create({
    src: process.env.PLIVO_PHONE_NUMBER,
    dst: to,
    text: message
  });
};

// Called by job.controller.js after match
export const notifyWorkerSMS = async (worker, job) => {
  const msg = `Naya kaam mila! ${job.category} - ${job.address}. Payment: Rs ${job.paymentOffer}. Call karo accept ke liye.`;
  return sendSMS(worker.phone, msg);
};
```

---

## Environment Variables Required

```env
# MongoDB
MONGO_URI=mongodb+srv://...

# JWT
JWT_SECRET=your_secret
PORT=5000
FRONTEND_URL=http://localhost:5173

# Sarvam AI
SARVAM_API_KEY=sk_...

# LiveKit Cloud
LIVEKIT_API_KEY=APIxxxx
LIVEKIT_API_SECRET=your_secret
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_SIP_URI=sip:your-project.sip.livekit.cloud
LIVEKIT_SIP_USER=livekit

# Plivo
PLIVO_AUTH_ID=MAXXXXXXXXX
PLIVO_AUTH_TOKEN=xxxxxxxx
PLIVO_PHONE_NUMBER=+91xxxxxxxxxx

# Public URL (for Plivo webhooks — use ngrok in dev)
PUBLIC_URL=https://your-ngrok-url.ngrok.io
```

---

## Testing Checklist

### Phase 3.1 — Telephony Bridge
- [ ] Plivo app is configured with webhook URL: `{PUBLIC_URL}/api/webhooks/plivo/incoming`.
- [ ] Dialing the Plivo number triggers `handleIncomingCall` in Express.
- [ ] Express returns valid SIP Transfer XML without errors.
- [ ] LiveKit Cloud dashboard shows a new room created on each call.

### Phase 3.2 — Sarvam Service
- [ ] `sarvamService.transcribe(audioBuffer)` returns correct Hindi text.
- [ ] `sarvamService.synthesize("Namaste")` returns a valid audio buffer.
- [ ] `sarvamService.extractIntent("Mera tap leak kar raha hai")` returns `{ category: "plumbing", ... }`.

### Phase 3.3 — Voice Agent
- [ ] `voiceAgentService.startVoiceSession(roomName, phone)` connects to LiveKit without error.
- [ ] Agent speaks the greeting and audio is heard on the caller's phone.
- [ ] Agent listens for 8 seconds and returns a buffer.
- [ ] Full client flow runs end-to-end: Problem → Job Created → Worker Matched → Confirmation spoken.
- [ ] Full worker flow runs: Job read → Accept spoken → DB updated.

### Phase 3.4 — SMS
- [ ] Worker receives SMS within 5 seconds of job assignment.
- [ ] SMS content is in Hindi and includes job category + payment offer.

---

## Demo Day Checklist (Must be GREEN before demo)

- [ ] Express server is deployed and publicly accessible.
- [ ] MongoDB has 5 mock workers seeded with GPS coordinates within 5km of demo venue.
- [ ] Plivo number is active and webhooks point to deployed URL.
- [ ] LiveKit SIP trunk is connected and functional.
- [ ] One complete call demo tested end-to-end 1 hour before presentation.
- [ ] Client voice scenario works: call in → speak → job assigned → confirmation heard.
- [ ] Show MongoDB `jobs` collection update live on screen after call.
- [ ] Backup: have ngrok URL ready as a fallback if deployment fails.
