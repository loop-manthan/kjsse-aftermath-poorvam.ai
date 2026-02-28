# Phase 3 – Voice Dispatch System: Execution Breakdown

> **$0 Setup. No Twilio. No Plivo. No ngrok.**
> Uses LiveKit Cloud (free), Sarvam AI (credits), OpenAI/Gemini (free tier), and existing MongoDB backend.

---

## Maturity Progression

| Phase | Name | What it proves |
|-------|------|----------------|
| 3.1 | Infrastructure Layer | LiveKit room + token + Node agent joins |
| 3.2 | Speech Pipeline | STT + TTS loop working end-to-end |
| 3.3 | MongoDB Memory Injection + Worker Flow | Agent reads job context and collects decision |
| 3.4 | Full Client → Worker Automated Dispatch | Full end-to-end automated voice dispatch |

---

## Phase 3.1 – LiveKit Infrastructure: Room, Token, and Agent Connection

### Objective
Establish a working WebRTC voice room where a browser simulator and the Node.js agent can both connect and hear each other. No speech processing yet.

### Scope
- Install LiveKit dependencies.
- Create `livekit.service.js`.
- Add `/api/voice/sessions/initiate` endpoint.
- Build a minimal browser simulator HTML page.
- Confirm two-way audio.

### Technical Components
- `livekit-server-sdk` — server-side token generation.
- `livekit-client` — Node agent connection to the room (or `@livekit/agents` if available).
- Browser Web SDK — `livekit-client` in a script tag for the simulator page.

### Files to Create / Modify

| File | Action |
|------|--------|
| `backend/src/services/livekit.service.js` | CREATE |
| `backend/src/routes/voice.routes.js` | MODIFY — add `/sessions/initiate` |
| `frontend/public/simulator.html` | CREATE — browser "phone" page |

### Implementation Steps

1. **Install dependencies:**
   ```bash
   cd backend && npm install livekit-server-sdk livekit-client
   ```

2. **Create `livekit.service.js`:**
   ```javascript
   import { AccessToken } from 'livekit-server-sdk';

   class LiveKitService {
     createRoomToken(roomName, identity) {
       const at = new AccessToken(
         process.env.LIVEKIT_API_KEY,
         process.env.LIVEKIT_API_SECRET,
         { identity }
       );
       at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
       return at.toJwt();
     }
   }

   export default new LiveKitService();
   ```

3. **Add `/api/voice/sessions/initiate` to `voice.routes.js`:**
   - Accept `{ jobId, targetUserId }` from the request.
   - Generate a room name: `job-${jobId}-user-${targetUserId}`.
   - Generate a `simulator` token for the browser page.
   - Generate an `agent` token — spin off `voiceAgentService.startVoiceSession()` in the background.
   - Return `{ roomName, token, livekitUrl }` to the browser.

4. **Create `simulator.html`:**
   - Load `livekit-client` from CDN.
   - On page load, call `POST /api/voice/sessions/initiate` with hardcoded IDs.
   - Connect to LiveKit with the returned token.
   - Show mic/speaker status on screen.
   - Publish local microphone audio to the room.

5. **Create stub `voiceAgentService.startVoiceSession(roomName, userId, jobId)`:**
   - Generate agent token via `livekit.service.js`.
   - Connect to the room with `livekit-client`.
   - Log a message: `"[Agent] Connected to room: ${roomName}"`.
   - Do nothing else yet. This is just the connection proof.

6. **Add environment variables:**
   ```env
   LIVEKIT_API_KEY=APIxxxx
   LIVEKIT_API_SECRET=your_secret
   LIVEKIT_URL=wss://your-project.livekit.cloud
   ```

### Testing Checklist

- [ ] `livekitService.createRoomToken('test', 'user1')` returns a valid JWT (verify at [https://jwt.io](https://jwt.io)).
- [ ] `POST /api/voice/sessions/initiate` responds with `{ roomName, token, livekitUrl }`.
- [ ] Browser opens `simulator.html`, microphone permission is granted, and mic volume indicator is visible.
- [ ] LiveKit Cloud dashboard shows 2 participants in the room: `simulator-<userId>` and `node-agent`.
- [ ] Console logs `"[Agent] Connected to room:"` without errors.

### Demo Scenario

> Open `simulator.html` in a browser. Show the LiveKit cloud dashboard side by side. Speak into the mic. Both the browser room and the Node agent appear as participants. The room is live — just no speech processing yet.

### Risks & Edge Cases

- **CORS on `/sessions/initiate`:** Ensure `http://localhost:5173` is in the Express CORS whitelist.
- **LiveKit free tier limits:** Max 100 concurrent rooms. Not a risk for hackathon demo.
- **Token expiry:** Default token expiry is 6 hours — sufficient for a demo session.

### Completion Criteria

- Two participants (browser + node-agent) appear in the LiveKit room.
- Microphone audio publishes without errors.
- No speech processing is implemented yet — that is intentional.

---

## Phase 3.2 – Speech Pipeline: STT + TTS Loop

### Objective
The Node agent listens to incoming room audio, pipes it through Sarvam STT to get a transcript, sends the transcript to a minimal LLM, and plays the LLM's reply back via Sarvam TTS — all within the LiveKit room.

### Scope
- Create `sarvam.service.js` (STT + TTS + basic intent extraction).
- Implement `agent.listen()` — capture audio frames from the LiveKit room.
- Implement `agent.speak()` — convert text to audio and publish to the room.
- Wire a basic echo-bot or single-turn LLM response to verify the pipeline.

### Technical Components
- Sarvam STT endpoint: `POST https://api.sarvam.ai/speech-to-text` (model: `saaras:v1`).
- Sarvam TTS endpoint: `POST https://api.sarvam.ai/text-to-speech` (model: `bulbul:v1`).
- Sarvam Chat/OpenAI: single-turn completion to generate a reply.
- LiveKit `RemoteAudioTrack` — subscribing to participant audio.
- LiveKit `LocalAudioTrack` — publishing synthesized audio.

### Files to Create / Modify

| File | Action |
|------|--------|
| `backend/src/services/sarvam.service.js` | CREATE |
| `backend/src/services/voiceAgent.service.js` | MODIFY — add `listen()` and `speak()` |

### Implementation Steps

1. **Install dependencies:**
   ```bash
   cd backend && npm install axios form-data
   ```

2. **Create `sarvam.service.js`** with three methods:
   - `transcribe(audioBuffer, lang = 'hi-IN')` → returns string transcript.
   - `synthesize(text, lang = 'hi-IN', speaker = 'meera')` → returns `Buffer`.
   - `extractIntent(transcript)` → returns `{ category, description, urgency }` JSON.

3. **Implement `listen(room, durationMs)` in `voiceAgent.service.js`:**
   - Subscribe to the `RemoteAudioTrack` of the first non-agent participant.
   - Attach a frame listener via `track.on('audioFrame', ...)`.
   - Accumulate raw PCM chunks for `durationMs` milliseconds.
   - Return the concatenated `Buffer`.

4. **Implement `speak(room, text, lang)` in `voiceAgent.service.js`:**
   - Call `sarvamService.synthesize(text, lang)` to get an audio buffer.
   - Create a `LocalAudioTrack` from the buffer in the LiveKit room.
   - Publish the track; remove it after playback finishes.

5. **Update `startVoiceSession()` with a single-turn echo loop:**
   ```javascript
   await this.speak(room, 'Namaste. Boliye, kya problem hai?');
   const audio = await this.listen(room, 8000);
   const transcript = await sarvamService.transcribe(audio);
   await this.speak(room, `Aapne kaha: ${transcript}`); // Echo for testing
   ```

6. **Test with Hindi and English speech separately.**

### Testing Checklist

- [ ] `sarvamService.transcribe(audioBuffer)` returns a non-empty string for a Hindi utterance.
- [ ] `sarvamService.synthesize('Namaste')` returns a `Buffer` that plays valid audio.
- [ ] `sarvamService.extractIntent('Mera tap leak kar raha hai')` returns `{ category: 'plumber', ... }`.
- [ ] Agent speaks the greeting; it is audible in the browser simulator.
- [ ] Agent listens for 8 seconds and prints the transcript to the console.
- [ ] Echo response is heard back in the browser (proves the full STT → TTS round-trip).

### Demo Scenario

> Open the browser simulator. The agent greets you in Hindi. You say "Mera geyser kharab ho gaya hai" (My geyser broke). The agent echoes back: "Aapne kaha: mera geyser kharab ho gaya hai." Speech pipeline is confirmed working.

### Risks & Edge Cases

- **Audio format mismatch:** Sarvam STT requires 16kHz mono WAV. Ensure LiveKit audio frames are resampled before sending. Use a `pcm-to-wav` utility or the `wav` npm package.
- **TTS buffer as a track:** Publishing raw PCM as a LiveKit track requires creating an `AudioBufferSource`. Test this step in isolation before integrating.
- **No intent parsing yet:** `extractIntent()` is created in this phase but NOT wired to any business logic. That is intentional.

### Completion Criteria

- Agent greets, listens, and echoes back the transcript within the LiveKit room.
- STT and TTS both function with Hindi/English input.
- No MongoDB access occurs in this phase yet — that is intentional.

---

## Phase 3.3 – MongoDB Memory Injection + Worker Decision Flow

### Objective
The agent fetches job and worker context from MongoDB, briefs the worker about the job, and updates the job status based on the spoken decision (Accept/Decline).

### Scope
- Wire `voiceAgent.service.js` to existing `User` and `Job` Mongoose models.
- Inject job details (`category`, `address`, `paymentOffer`) into the agent's speech.
- Parse the worker's spoken response using Sarvam STT.
- Call existing controller logic to update `job.status` and `user.status` in MongoDB.

### Technical Components
- `User` model (existing) — fetch worker by `userId`.
- `Job` model (existing) — fetch job by `jobId`, populate `clientId`.
- `job.controller.js → acceptJob` and `cancelJob` — reused directly (no HTTP call, direct import).
- `sarvamService.transcribe()` — from Phase 3.2.
- Regex intent parser: `/haan|yes|accept|ha|theek|okay/i` for Accept; `/nahi|no|decline|na/i` for Decline.

### Files to Create / Modify

| File | Action |
|------|--------|
| `backend/src/services/voiceAgent.service.js` | MODIFY — add `runWorkerFlow()` |
| `backend/src/routes/voice.routes.js` | MODIFY — pass `jobId` and `userId` to `startVoiceSession` |

### Implementation Steps

1. **Update `startVoiceSession(roomName, userId, jobId)` to branch by user type:**
   ```javascript
   const user = await User.findById(userId);
   if (user.userType === 'worker') {
     await this.runWorkerFlow(room, user, jobId);
   }
   // client flow in Phase 3.4
   ```

2. **Implement `runWorkerFlow(room, user, jobId)`:**
   ```javascript
   async runWorkerFlow(room, user, jobId) {
     const job = await Job.findById(jobId).populate('clientId', 'name address');
     if (!job) {
       await this.speak(room, 'Aapke liye koi kaam nahi mila.');
       return;
     }
     const brief = `Namaste ${user.name}. Ek ${job.category} ka kaam hai. `
       + `Jagah: ${job.address}. Payment: ${job.paymentOffer} rupees. `
       + `Accept karoge?`;
     await this.speak(room, brief);
     const audio = await this.listen(room, 6000);
     const transcript = await sarvamService.transcribe(audio);
     const accepted = /haan|yes|accept|ha|theek|okay/i.test(transcript);
     if (accepted) {
       job.status = 'accepted';
       job.acceptedAt = new Date();
       await job.save();
       user.status = 'busy';
       await user.save();
       await this.speak(room, `Kaam accept hua. Client ${job.clientId.name} ka intezaar kar raha hai.`);
     } else {
       job.status = 'pending';
       job.workerId = undefined;
       await job.save();
       user.status = 'available';
       await user.save();
       await this.speak(room, 'Theek hai, kaam decline kiya. Dhanyavaad.');
     }
   }
   ```

3. **Seed test data in MongoDB:**
   - One worker document with `status: 'available'` and real `categories: ['plumber']`.
   - One job document with `status: 'assigned'`, `workerId` pointing to the above worker, `clientId` populated.

4. **Trigger via Postman:** Call `POST /api/voice/sessions/initiate` with the seeded `jobId` and `userId`. Open `simulator.html`.

5. **Verify in MongoDB Compass:** After saying "haan", check that `job.status === 'accepted'` and `user.status === 'busy'`.

### Testing Checklist

- [ ] Agent briefs the correct `job.category`, `job.address`, `job.paymentOffer` from MongoDB.
- [ ] Saying "haan" / "yes" in the browser → MongoDB `job.status` becomes `'accepted'`.
- [ ] Saying "nahi" / "no" → `job.status` resets to `'pending'`, `job.workerId` cleared.
- [ ] `user.status` correctly flips to `'busy'` on accept, `'available'` on decline.
- [ ] Agent speaks the correct confirmation message in both cases.
- [ ] No crash occurs when `jobId` is `null` (no pending job found).

### Demo Scenario

> Trigger the worker call from Postman. The browser simulator acts as the worker's phone. The agent says: "Namaste Rajesh. Ek plumber ka kaam hai. Jagah: Andheri West. Payment: 500 rupees. Accept karoge?" You say "haan". Refresh MongoDB Compass — the job status has changed to `accepted` in real time.

### Risks & Edge Cases

- **Ambiguous speech:** Words like "theek hai" mean both "okay" and "fine" in Hindi. The regex covers this. If the LLM is used instead, add "theek" as an acceptor.
- **Worker says something unrelated:** If the regex matches neither Accept nor Decline, re-prompt once: "Maafi, kripya 'haan' ya 'nahi' boliye." Add a maximum of 2 retry loops.
- **Database connection timing:** `voiceAgent.service.js` must be imported after Mongoose has connected. Import it lazily inside the route handler.

### Completion Criteria

- Worker voice flow runs completely from brief → decision → MongoDB update.
- Both Accept and Decline paths are verified and logged.
- Client flow is NOT implemented yet — that is intentional.

---

## Phase 3.4 – Full Client → Worker Automated Dispatch

### Objective
A client describes their problem, the agent creates a job and finds the nearest available worker using the existing matching algorithm, then automatically initiates the worker flow — completing the full voice dispatch loop.

### Scope
- Implement `runClientFlow(room, user)` in `voiceAgent.service.js`.
- Integrate `sarvamService.extractIntent()` to extract job category from speech.
- Run `$nearSphere` geospatial query to find nearest available worker (mirror of `matching.controller.js`).
- Create and assign the `Job` document in MongoDB.
- Chain the client session end → trigger the worker session start.

### Technical Components
- `User` model — `$nearSphere` query filtered by `categories`, `status: 'available'`.
- `Job` model — `create()` with extracted intent.
- `sarvamService.extractIntent()` — category + description from Hindi/English.
- `voiceAgentService.startVoiceSession()` — recursive call for the worker after client session ends.
- Existing `utils/categoryExtractor.js` — keyword fallback before calling Sarvam LLM.

### Files to Create / Modify

| File | Action |
|------|--------|
| `backend/src/services/voiceAgent.service.js` | MODIFY — add `runClientFlow()` |
| `backend/src/utils/categoryExtractor.js` | REUSE — no changes |
| `backend/src/routes/voice.routes.js` | MODIFY — branch `userType` at initiation |

### Implementation Steps

1. **Update `voice.routes.js` to support client sessions:**
   - `POST /api/voice/sessions/initiate` now accepts `{ userId }` without a `jobId`.
   - If the user is a `client`, generate a client room (`client-session-${userId}-${Date.now()}`).
   - No `jobId` is passed to `startVoiceSession` for clients.

2. **Implement `runClientFlow(room, user)` in `voiceAgent.service.js`:**
   ```javascript
   async runClientFlow(room, user) {
     await this.speak(room, 'Namaste! Aapki kya problem hai? Hindi ya English mein batao.');
     const audio = await this.listen(room, 10000);
     const transcript = await sarvamService.transcribe(audio);

     // Keyword fallback first, then Sarvam LLM
     let category = await extractCategory(transcript);
     if (!category || category === 'general') {
       const intent = await sarvamService.extractIntent(transcript);
       category = intent.category;
     }

     await this.speak(room, `Samjha, aapko ${category} chahiye. Worker dhundh raha hoon...`);

     // $nearSphere query
     const workers = await User.find({
       userType: 'worker',
       status: 'available',
       categories: category,
       location: {
         $nearSphere: {
           $geometry: user.location,
           $maxDistance: 10000,
         },
       },
     }).limit(1);

     if (workers.length === 0) {
       await this.speak(room, 'Maafi, abhi koi worker available nahi hai. Thodi der baad try karo.');
       return;
     }

     const worker = workers[0];
     const job = await Job.create({
       clientId: user._id,
       workerId: worker._id,
       category,
       description: transcript,
       location: user.location,
       address: user.address,
       paymentOffer: 500, // default; can be extracted from speech
       status: 'assigned',
       assignedAt: new Date(),
     });

     await this.speak(room, `Worker ${worker.name} ko aapka kaam mila. Woh jaldi aayenge.`);
     await room.disconnect(); // End client session

     // Automatically start worker session
     const workerRoomName = `job-${job._id}-worker-${worker._id}`;
     this.startVoiceSession(workerRoomName, worker._id.toString(), job._id.toString())
       .catch(console.error);
   }
   ```

3. **Update `startVoiceSession()` to branch on `jobId`:**
   ```javascript
   if (user.userType === 'client') {
     await this.runClientFlow(room, user);
   } else if (user.userType === 'worker') {
     await this.runWorkerFlow(room, user, jobId);
   }
   ```

4. **Seed MongoDB with:**
   - One client with a valid `location.coordinates`.
   - Three workers, each with `status: 'available'`, `categories: ['plumber']`, and different GPS coordinates.

5. **Full end-to-end test:** Trigger client session → speak problem → job created → worker session starts automatically → worker accepts → MongoDB confirms final state.

### Testing Checklist

- [ ] Client speaks "Mera geyser kharab hai" → `category` resolves to `'ac_technician'` or `'plumber'` correctly.
- [ ] `$nearSphere` query returns the nearest worker within 10km.
- [ ] `Job` document is created with correct `clientId`, `workerId`, `category`, `status: 'assigned'`.
- [ ] Client hears confirmation message with the worker's name.
- [ ] Worker session starts automatically after the client session ends.
- [ ] Worker hears the job brief from Phase 3.3.
- [ ] Worker accepts → `job.status === 'accepted'` in MongoDB.
- [ ] No workers available → client hears a "not available" message gracefully.

### Demo Scenario

> Start a client session from Postman. Open `simulator.html` in the browser as the client. Say: "Mera bathroom ka tap leak ho raha hai." The agent replies: "Samjha, aapko plumber chahiye. Worker dhundh raha hoon..." then: "Worker Rajesh ko aapka kaam mila." Immediately, the worker simulator (another browser tab or a Postman trigger) receives the worker call. Rajesh says "haan". MongoDB Compass refreshes: `job.status = 'accepted'`. Full loop demonstrated live.

### Risks & Edge Cases

- **Two browser tabs for demo:** Open one tab as the client simulator, a second tab as the worker simulator. Both use different tokens from separate `/initiate` calls. Coordinate the demo flow beforehand.
- **Race condition on worker session start:** The worker's `startVoiceSession` is async-fired. Add a 2-second `setTimeout` before starting the worker session to ensure the previous room fully disconnects.
- **`paymentOffer` is hardcoded to 500:** For MVP demo, this is acceptable. A future improvement extracts price from speech.
- **Category mismatch:** If the keyword extractor returns `'general'` and Sarvam returns an unsupported category, default to `'general'` and widen the worker query to include any available worker.

### Completion Criteria

- Full client → job creation → worker assignment → worker decision loop completes without manual intervention.
- All state changes are confirmed in MongoDB.
- Both client and worker audio flows work within their respective browser simulator tabs.
- The demo is repeatable with fresh seeded data.

---

## Summary

| Phase | Key Output | MongoDB Changes | Speech Calls |
|-------|-----------|-----------------|--------------|
| 3.1 | Room + agent connected | None | None |
| 3.2 | STT + TTS echo loop | None | STT + TTS |
| 3.3 | Worker accepts/declines job | `job.status`, `user.status` | STT + TTS |
| 3.4 | Full dispatch loop automated | `job.create()`, both statuses | STT + TTS + Intent |

> **Each phase is independently demoable. Do not skip to 3.4 without verifying 3.1 – 3.3.**
