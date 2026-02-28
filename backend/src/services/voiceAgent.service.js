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

class VoiceAgentService {
  constructor() {
    this._activeSessions = new Map();
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

    // 4. Run speech pipeline in background (non-blocking)
    this._runPipeline(roomName, room).catch((err) => {
      console.error(`[VoiceAgent] Pipeline error in ${roomName}:`, err.message);
    });

    return { roomName, status: 'agent_connected' };
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
      // 1. Get TTS audio
      const wavBuffer = await sarvamService.textToSpeech(text, {
        languageCode: 'hi-IN',
        sampleRate: 16000,
      });

      if (!wavBuffer) {
        console.error('[VoiceAgent] TTS returned null. Skipping playback.');
        return;
      }

      // 2. Parse WAV and extract PCM
      const { pcm, sampleRate: ttsSampleRate, numChannels } = sarvamService.parseWav(wavBuffer);
      let samples = new Int16Array(pcm.buffer, pcm.byteOffset, pcm.length / 2);

      // 3. Downmix if needed
      if (numChannels > 1) {
        samples = sarvamService.downmixToMono(samples, numChannels);
      }

      // 4. Upsample to 48kHz for LiveKit
      const targetRate = 48000;
      if (ttsSampleRate !== targetRate) {
        samples = sarvamService.resample(samples, ttsSampleRate, targetRate);
      }

      // 5. Create AudioSource and LocalAudioTrack
      const source = new AudioSource(targetRate, 1);
      const track = LocalAudioTrack.createAudioTrack('tts-output', source);

      // 6. Publish track
      const publishOptions = new TrackPublishOptions({
        source: TrackSource.SOURCE_MICROPHONE,
      });
      await room.localParticipant.publishTrack(track, publishOptions);
      console.log('[VoiceAgent] TTS track published');

      // 7. Feed frames with real-time pacing
      const FRAME_SIZE = 480; // 480 samples at 48kHz = 10ms per frame
      const frameDurationMs = (FRAME_SIZE / targetRate) * 1000; // 10ms

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

        // Real-time pacing — prevent audio stacking/distortion
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
