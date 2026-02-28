// backend/src/services/voiceAgent.service.js
// Phase 3.2 — Voice agent with STT + TTS roundtrip inside LiveKit room
//
// Pipeline:
//   1. Connect to room
//   2. Speak greeting via TTS
//   3. Listen 8 seconds (capture AudioStream frames)
//   4. Downmix to mono, resample 48→16kHz, encode WAV
//   5. Send to Sarvam STT
//   6. Log transcript
//   7. Speak echo response via TTS
//   8. Disconnect cleanly

import livekitService from './livekit.service.js';
import sarvamService from './sarvam.service.js';
import { generateReply } from './llm.service.js';

// --- Dynamic import with graceful fallback ---
let Room = null;
let RoomEvent = null;
let AudioStream = null;
let LocalAudioTrack = null;
let AudioSource = null;
let AudioFrame = null;
let TrackPublishOptions = null;
let TrackSource = null;
let rtcAvailable = false;

try {
  const rtc = await import('@livekit/rtc-node');
  Room = rtc.Room;
  RoomEvent = rtc.RoomEvent;
  AudioStream = rtc.AudioStream;
  LocalAudioTrack = rtc.LocalAudioTrack;
  AudioSource = rtc.AudioSource;
  AudioFrame = rtc.AudioFrame;
  TrackPublishOptions = rtc.TrackPublishOptions;
  TrackSource = rtc.TrackSource;
  rtcAvailable = true;
  console.log('[VoiceAgent] @livekit/rtc-node loaded successfully');
} catch (err) {
  console.warn('[VoiceAgent] @livekit/rtc-node not available:', err.message);
  console.warn('[VoiceAgent] Running in token-only mode.');
}

const LISTEN_DURATION_MS = 8_000;
const SESSION_TIMEOUT_MS = 120_000;
const GREETING_TEXT = 'Namaste! Poorvam AI mein aapka swagat hai. Aapko kya seva chahiye?';
const FALLBACK_TEXT = 'Maaf kijiye, main samajh nahi paaya. Kripya dobara bolein.';
const ECHO_PREFIX = 'Aapne kaha: ';

// ── aftermath-hacks agent system prompt ──
const AGENT_SYSTEM_PROMPT = `You are "aftermath-hacks", a patient, clear, and reassuring Hindi-speaking voice assistant for blue-collar workers.

DEMEANOUR & IDENTITY
- Speak slowly when needed; listen carefully; repeat information to ensure understanding.
- Use simple, colloquial Hindi only (no English except very common job terms the worker uses).
- Never guess missing information — ask calmly for more details.
- Never share or ask for sensitive data (OTP, Aadhaar, bank details, payments). Warn the worker if asked.
- Maintain a warm, respectful, encouraging tone.

GOAL
1. Collect complete job details: client name, location, nearest landmark, building name, floor/flat, scheduled time, job type, client phone number.
2. Repeat the full summary for confirmation.
3. Ask worker's current location (nearest landmark) and give 2-4 simple, landmark-based directional steps.
4. Provide a short call script for the worker to confirm attendance or reschedule with the client/coordinator.
5. Warn about never sharing OTP or financial info.
6. Offer to repeat summary or directions before ending.

FLOW
- Greet: "नमस्ते! क्या आप अभी बात कर सकते हैं? आपको किस में मदद चाहिए—अगले काम की डिटेल्स, रास्ता, या क्लाइंट को कॉल करने का तरीका?"
- Collect details one by one if missing: client name, area + landmark, building + floor, job type, time, client phone.
- If answer is incomplete: "कृपया कोई बड़ा लैंडमार्क बताइए जैसे स्टेशन, बस स्टॉप, मंदिर, अस्पताल या सोसाइटी का गेट।"
- Confirm summary: "मैं आपकी जानकारी दोहरा रहा हूँ — …. क्या ये सब सही है?"
- Directions: ask current landmark, then give 2-4 steps. Offer to repeat slowly.
- Call script: "नमस्ते, मैं {काम} के लिए आ रहा हूँ। मैं लगभग {समय} में पहुँच जाऊँगा। क्या आप उपलब्ध हैं?"
- Reschedule script: "नमस्ते, मैं आज {काम} के लिए नहीं आ पाऊँगा। कृपया अपने कॉर्डिनेटर को सूचना दें। धन्यवाद।"
- Warning: "कृपया ध्यान दें, कोई भी ओटीपी, बैंक या पैसे की जानकारी किसी को मत दीजिए।"
- Closing: "धन्यवाद। अगर आपको फिर मदद चाहिए तो कॉल करिए। आपका दिन शुभ हो।"

GUARDRAILS
- Never give map-based or backend-driven directions; rely solely on landmarks reported by the worker.
- Do not call clients yourself; provide the number and script.
- Keep instructions brief but thorough.
- Always confirm summary and directions before ending.
- Reply in 1-3 short sentences per turn. Do not produce long monologues.`;

class VoiceAgentService {
  constructor() {
    this._activeSessions = new Map();
    this._sessionResults = new Map(); // roomName -> { status, events[] }
  }

  // ─────────────────────────────────────────
  //  PUBLIC: Start voice session
  // ─────────────────────────────────────────

  async startVoiceSession(roomName, options = {}) {
    if (!rtcAvailable) {
      console.warn(`[VoiceAgent] Skipping room join for ${roomName} — native module not loaded.`);
      return { roomName, status: 'token_only' };
    }

    console.log(`[VoiceAgent] Starting session for room: ${roomName}`);

    // 1. Generate token
    let token;
    try {
      token = await livekitService.createRoomToken(roomName, `node-agent-${Date.now()}`, {
        canPublish: true,
        canSubscribe: true,
      });
    } catch (err) {
      console.error('[VoiceAgent] Token generation failed:', err.message);
      throw err;
    }

    // 2. Create room and connect
    const room = new Room();
    try {
      await room.connect(process.env.LIVEKIT_URL, token, { autoSubscribe: true });
      console.log(`[VoiceAgent] Connected to room: ${roomName}`);
    } catch (err) {
      console.error(`[VoiceAgent] Failed to connect to ${roomName}:`, err.message);
      throw err;
    }

    // 3. Store session
    const sessionTimer = setTimeout(() => {
      this.endSession(roomName).catch((e) =>
        console.error(`[VoiceAgent] Timeout disconnect failed:`, e.message)
      );
    }, options.timeoutMs || SESSION_TIMEOUT_MS);

    this._activeSessions.set(roomName, { room, timer: sessionTimer });

    // 4. Choose pipeline based on debug mode
    const debugMode = process.env.VOICE_DEBUG_MODE;
    if (debugMode === 'stt-llm') {
      this._runSttGeminiDebug(roomName, room).catch((err) => {
        console.error(`[VoiceAgent] STT-LLM debug error in ${roomName}:`, err.message);
      });
    } else {
      this._runPipeline(roomName, room).catch((err) => {
        console.error(`[VoiceAgent] Pipeline error in ${roomName}:`, err.message);
      });
    }

    return { roomName, status: 'agent_connected' };
  }

  // ─────────────────────────────────────────
  //  PRIVATE: STT → Gemini debug pipeline (no TTS)
  // ─────────────────────────────────────────

  _pushResult(roomName, event) {
    if (!this._sessionResults.has(roomName)) {
      this._sessionResults.set(roomName, { status: 'running', events: [] });
    }
    const entry = this._sessionResults.get(roomName);
    entry.events.push({ ...event, ts: Date.now() });
  }

  getSessionResults(roomName) {
    return this._sessionResults.get(roomName) || null;
  }

  async _runSttGeminiDebug(roomName, room) {
    this._sessionResults.set(roomName, { status: 'running', events: [] });

    try {
      // Speak greeting so the user knows the agent is alive
      console.log(`[VOICE] STT-LLM debug mode — speaking greeting...`);
      this._pushResult(roomName, { type: 'status', message: 'Speaking greeting…' });
      await this._speak(room, GREETING_TEXT);

      console.log(`[VOICE] STT-LLM debug mode — waiting for audio track...`);
      this._pushResult(roomName, { type: 'status', message: 'Waiting for audio track…' });
      const remoteTrack = await this._waitForAudioTrack(room, 15_000);

      if (!remoteTrack) {
        console.log('[VOICE][STT] No audio track received within timeout.');
        this._pushResult(roomName, { type: 'error', message: 'No audio track received within timeout.' });
        this._sessionResults.get(roomName).status = 'done';
        return;
      }

      this._pushResult(roomName, { type: 'status', message: `Listening for ${LISTEN_DURATION_MS / 1000}s…` });
      console.log(`[VOICE] Listening for ${LISTEN_DURATION_MS}ms...`);
      const wav = await this._listen(remoteTrack, LISTEN_DURATION_MS);

      if (!wav || wav.length <= 44) {
        console.log('[VOICE][STT] empty — no audio captured');
        this._pushResult(roomName, { type: 'error', message: 'No audio captured.' });
        this._sessionResults.get(roomName).status = 'done';
        return;
      }

      const audioBytes = wav.length;
      console.log(`[VOICE] Captured ${audioBytes} bytes. Running STT...`);
      this._pushResult(roomName, { type: 'status', message: `Captured ${audioBytes} bytes. Running STT…` });

      // STT
      const sttStart = Date.now();
      console.time('stt');
      const { transcript } = await sarvamService.speechToText(wav, { languageCode: 'hi-IN' });
      console.timeEnd('stt');
      const sttMs = Date.now() - sttStart;

      if (!transcript || transcript.trim() === '') {
        console.log('[VOICE][STT] empty');
        this._pushResult(roomName, { type: 'stt', transcript: '', durationMs: sttMs });
        this._sessionResults.get(roomName).status = 'done';
        return;
      }

      console.log('[VOICE][STT]', transcript);
      this._pushResult(roomName, { type: 'stt', transcript, durationMs: sttMs });

      // LLM
      const llmStart = Date.now();
      console.time('llm');
      const reply = await generateReply({ systemPrompt: AGENT_SYSTEM_PROMPT, userText: transcript });
      console.timeEnd('llm');
      const llmMs = Date.now() - llmStart;

      console.log('[VOICE][LLM]', reply);
      this._pushResult(roomName, { type: 'llm', reply, durationMs: llmMs });

      // Speak the LLM reply back to the user via TTS
      if (reply && reply.trim()) {
        console.log(`[VOICE] Speaking LLM reply via TTS...`);
        this._pushResult(roomName, { type: 'status', message: 'Speaking reply…' });
        await this._speak(room, reply);
      }

      this._sessionResults.get(roomName).status = 'done';

    } catch (err) {
      console.error(`[VOICE] STT-LLM debug pipeline failed:`, err.message);
      this._pushResult(roomName, { type: 'error', message: err.message });
      if (this._sessionResults.has(roomName)) this._sessionResults.get(roomName).status = 'error';
    } finally {
      // Always disconnect cleanly
      try {
        await this.endSession(roomName);
        this._pushResult(roomName, { type: 'status', message: 'Disconnected cleanly.' });
        console.log(`[VOICE] Session ${roomName} disconnected cleanly.`);
      } catch (_) {}
    }
  }

  // ─────────────────────────────────────────
  //  PRIVATE: Speech pipeline
  // ─────────────────────────────────────────

  async _runPipeline(roomName, room) {
    try {
      // Step 1: Speak greeting
      console.log(`[VoiceAgent] Speaking greeting...`);
      await this._speak(room, GREETING_TEXT);

      // Step 2: Wait for remote participant's audio track
      console.log(`[VoiceAgent] Waiting for remote audio...`);
      const remoteTrack = await this._waitForAudioTrack(room, 15_000);

      if (!remoteTrack) {
        console.warn(`[VoiceAgent] No audio track received. Prompting retry.`);
        await this._speak(room, FALLBACK_TEXT);
        await this._delay(2000);
        await this.endSession(roomName);
        return;
      }

      // Step 3: Listen for 8 seconds
      console.log(`[VoiceAgent] Listening for ${LISTEN_DURATION_MS}ms...`);
      const wavBuffer = await this._listen(remoteTrack, LISTEN_DURATION_MS);

      if (!wavBuffer || wavBuffer.length <= 44) {
        console.warn(`[VoiceAgent] No audio captured. Speaking fallback.`);
        await this._speak(room, FALLBACK_TEXT);
        await this._delay(2000);
        await this.endSession(roomName);
        return;
      }

      console.log(`[VoiceAgent] Captured ${wavBuffer.length} bytes of WAV audio`);

      // Step 4: STT
      console.log(`[VoiceAgent] Sending to Sarvam STT...`);
      const sttResult = await sarvamService.speechToText(wavBuffer, { languageCode: 'hi-IN' });

      if (!sttResult.transcript || sttResult.transcript.trim() === '') {
        console.warn(`[VoiceAgent] Empty transcript. Speaking fallback.`);
        await this._speak(room, FALLBACK_TEXT);
      } else {
        console.log(`[VoiceAgent] Transcript: "${sttResult.transcript}"`);
        console.log(`[VoiceAgent] Language: ${sttResult.languageCode}`);

        // Step 5: Echo response
        const echoText = ECHO_PREFIX + sttResult.transcript;
        console.log(`[VoiceAgent] Speaking echo: "${echoText}"`);
        await this._speak(room, echoText);
      }

      // Step 6: Clean disconnect
      await this._delay(1000);
      await this.endSession(roomName);
      console.log(`[VoiceAgent] Pipeline complete for ${roomName}`);

    } catch (err) {
      console.error(`[VoiceAgent] Pipeline failed:`, err.message);
      try { await this.endSession(roomName); } catch (_) {}
    }
  }

  // ─────────────────────────────────────────
  //  PRIVATE: Listen — capture audio frames
  // ─────────────────────────────────────────

  async _listen(remoteTrack, durationMs) {
    const frameBuffers = [];
    let capturedSampleRate = 48000;
    let capturedChannels = 1;
    let stream;

    try {
      stream = new AudioStream(remoteTrack);

      const deadline = Date.now() + durationMs;
      let firstFrame = true;

      for await (const frame of stream) {
        if (Date.now() >= deadline) break;

        if (firstFrame) {
          capturedSampleRate = frame.sampleRate;
          capturedChannels = frame.channels;
          console.log(`[VoiceAgent] Audio: ${capturedSampleRate}Hz, ${capturedChannels}ch`);
          firstFrame = false;
        }

        // frame.data is Int16Array (interleaved if multi-channel)
        const raw = new Int16Array(frame.data.buffer, frame.data.byteOffset, frame.data.length);
        frameBuffers.push(Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength));
      }
    } catch (err) {
      console.error('[VoiceAgent] Audio capture error:', err.message);
    }

    // Stream cleanup happens when the for-await exits
    if (stream && typeof stream.close === 'function') {
      try { stream.close(); } catch (_) {}
    }

    if (frameBuffers.length === 0) return null;

    // Concatenate all captured PCM
    const rawPcm = Buffer.concat(frameBuffers);
    let samples = new Int16Array(rawPcm.buffer, rawPcm.byteOffset, rawPcm.length / 2);

    // Downmix to mono if multi-channel
    if (capturedChannels > 1) {
      console.log(`[VoiceAgent] Downmixing ${capturedChannels}ch → mono`);
      samples = sarvamService.downmixToMono(samples, capturedChannels);
    }

    // Resample to 16kHz
    if (capturedSampleRate !== 16000) {
      console.log(`[VoiceAgent] Resampling ${capturedSampleRate}Hz → 16000Hz`);
      samples = sarvamService.resample(samples, capturedSampleRate, 16000);
    }

    // Build WAV
    const pcmBuffer = Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength);
    return sarvamService.createWavBuffer(pcmBuffer, 16000, 1);
  }

  // ─────────────────────────────────────────
  //  PRIVATE: Speak — TTS + publish to room
  // ─────────────────────────────────────────

  async _speak(room, text) {
    try {
      // 1. Get TTS audio at native 48000Hz — matches LiveKit exactly, no resampling needed
      const wavBuffer = await sarvamService.textToSpeech(text, {
        languageCode: 'hi-IN',
        sampleRate: 48000,
      });

      if (!wavBuffer) {
        console.error('[VoiceAgent] TTS returned null. Skipping playback.');
        return;
      }

      // 2. Parse WAV and extract PCM
      const { pcm, sampleRate: ttsSampleRate, numChannels } = sarvamService.parseWav(wavBuffer);
      let samples = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length / 2);

      // 3. Downmix if needed (rare — Sarvam typically returns mono)
      if (numChannels > 1) {
        samples = sarvamService.downmixToMono(samples, numChannels);
      }

      // 4. Validate sample rate — should be 48000 from Sarvam, no resampling needed
      const targetRate = 48000;
      if (ttsSampleRate !== targetRate) {
        console.warn(`[VoiceAgent] TTS returned ${ttsSampleRate}Hz, expected ${targetRate}Hz. Resampling.`);
        samples = sarvamService.resample(samples, ttsSampleRate, targetRate);
      }

      // 5. Create AudioSource and LocalAudioTrack at native 48kHz
      const source = new AudioSource(targetRate, 1);
      const track = LocalAudioTrack.createAudioTrack('tts-output', source);

      // 6. Publish track
      const publishOptions = new TrackPublishOptions({
        source: TrackSource.SOURCE_MICROPHONE,
      });
      await room.localParticipant.publishTrack(track, publishOptions);
      console.log('[VoiceAgent] TTS track published');

      // 7. Feed frames with 50ms chunks (2400 samples at 48kHz)
      //    Larger frames = fewer scheduling calls = dramatically less jitter
      const FRAME_SIZE = 2400; // 50ms at 48kHz
      const frameDurationMs = (FRAME_SIZE / targetRate) * 1000; // 50ms

      for (let offset = 0; offset < samples.length; offset += FRAME_SIZE) {
        const end = Math.min(offset + FRAME_SIZE, samples.length);
        const chunk = samples.slice(offset, end);

        const frame = new AudioFrame(
          Buffer.from(chunk.buffer, chunk.byteOffset, chunk.byteLength),
          targetRate,
          1,
          chunk.length
        );

        await source.captureFrame(frame);

        // Real-time pacing with larger intervals — stable playback
        await this._delay(frameDurationMs);
      }

      // 8. Brief pause after last frame, then unpublish
      await this._delay(200);
      await room.localParticipant.unpublishTrack(track);
      console.log('[VoiceAgent] TTS track unpublished');

    } catch (err) {
      console.error('[VoiceAgent] Speak failed:', err.message);
    }
  }

  // ─────────────────────────────────────────
  //  PRIVATE: Wait for a remote audio track
  // ─────────────────────────────────────────

  _waitForAudioTrack(room, timeoutMs) {
    return new Promise((resolve) => {
      // Check existing participants first
      for (const participant of room.remoteParticipants.values()) {
        for (const pub of participant.trackPublications.values()) {
          if (pub.track && pub.kind === 'audio') {
            resolve(pub.track);
            return;
          }
        }
      }

      // Otherwise wait for subscription
      let timer;
      const handler = (track, publication, participant) => {
        if (track.kind === 'audio') {
          clearTimeout(timer);
          room.off(RoomEvent.TrackSubscribed, handler);
          console.log(`[VoiceAgent] Got audio from: ${participant.identity}`);
          resolve(track);
        }
      };

      room.on(RoomEvent.TrackSubscribed, handler);

      timer = setTimeout(() => {
        room.off(RoomEvent.TrackSubscribed, handler);
        resolve(null);
      }, timeoutMs);
    });
  }

  // ─────────────────────────────────────────
  //  PUBLIC: End session
  // ─────────────────────────────────────────

  async endSession(roomName) {
    const session = this._activeSessions.get(roomName);
    if (!session) {
      console.log(`[VoiceAgent] No active session for: ${roomName}`);
      return;
    }

    try {
      await session.room.disconnect();
    } catch (err) {
      console.error(`[VoiceAgent] Disconnect error:`, err.message);
    }

    this._cleanup(roomName);
  }

  _cleanup(roomName) {
    const session = this._activeSessions.get(roomName);
    if (session) {
      clearTimeout(session.timer);
      this._activeSessions.delete(roomName);
    }
  }

  getActiveSessionCount() {
    return this._activeSessions.size;
  }

  isRtcAvailable() {
    return rtcAvailable;
  }

  _delay(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }
}

export default new VoiceAgentService();
