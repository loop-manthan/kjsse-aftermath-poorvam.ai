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
let TrackKind = null;
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
  TrackKind = rtc.TrackKind;
  rtcAvailable = true;
  console.log('[VoiceAgent] @livekit/rtc-node loaded successfully');
} catch (err) {
  console.warn('[VoiceAgent] @livekit/rtc-node not available:', err.message);
  console.warn('[VoiceAgent] Running in token-only mode.');
}

const LISTEN_DURATION_MS = 10_000;
const SESSION_TIMEOUT_MS = 120_000;

// ═══════════════════════════════════════════════
//  Multi-language config: Hindi, Gujarati, Marathi
// ═══════════════════════════════════════════════

const LANG_CONFIG = {
  'hi-IN': {
    greeting: 'नमस्ते! आपको किसी की नौकरी चाहिए?',
    fallback: 'माफ़ कीजिए, मैं समझ नहीं पाया। कृपया दोबारा बोलिए।',
    mock: {
      JOB_TYPE:    'मुझे सफाई की नौकरी चाहिए',
      JOB_SUBTYPE: 'घरेलू सफाई',
      AREA:        'अंधेरी',
      INCOME:      'महीने का 10000 रुपये',
      AGE:         '25 साल',
    },
    summaryTemplate: (d) =>
      `आपकी जानकारी — काम: ${d.jobType || 'अज्ञात'}, ` +
      `प्रकार: ${d.jobSubtype || 'अज्ञात'}, ` +
      `इलाका: ${d.area || 'अज्ञात'}, ` +
      `कमाई: ${d.income || 'अज्ञात'}, ` +
      `उम्र: ${d.age || 'अज्ञात'}। ` +
      `हम आपको काम मिलने पर कॉल करेंगे। कृपया किसी को ओटीपी या पैसे की जानकारी मत दीजिए।`,
    promptLang: 'Hindi',
  },
  'gu-IN': {
    greeting: 'નમસ્તે! તમારે કોઈ નોકરી જોઈએ છે?',
    fallback: 'માફ કરજો, હું સમજી શક્યો નહીં. કૃપા કરીને ફરીથી બોલો.',
    mock: {
      JOB_TYPE:    'મને સફાઈનું કામ જોઈએ છે',
      JOB_SUBTYPE: 'ઘરેલું સફાઈ',
      AREA:        'અમદાવાદ',
      INCOME:      'મહિને 10000 રૂપિયા',
      AGE:         '25 વર્ષ',
    },
    summaryTemplate: (d) =>
      `તમારી માહિતી — કામ: ${d.jobType || 'અજ્ઞાત'}, ` +
      `પ્રકાર: ${d.jobSubtype || 'અજ્ઞાત'}, ` +
      `વિસ્તાર: ${d.area || 'અજ્ઞાત'}, ` +
      `આવક: ${d.income || 'અજ્ઞાત'}, ` +
      `ઉંમર: ${d.age || 'અજ્ઞાત'}. ` +
      `અમે તમને કામ મળશે ત્યારે કૉલ કરીશું. કૃપા કરીને કોઈને OTP કે પૈસાની માહિતી ન આપો.`,
    promptLang: 'Gujarati',
  },
  'mr-IN': {
    greeting: 'नमस्कार! तुम्हाला कोणती नोकरी हवी आहे?',
    fallback: 'माफ करा, मला समजले नाही. कृपया पुन्हा सांगा.',
    mock: {
      JOB_TYPE:    'मला सफाईचे काम हवे आहे',
      JOB_SUBTYPE: 'घरगुती सफाई',
      AREA:        'अंधेरी',
      INCOME:      'महिना 10000 रुपये',
      AGE:         '25 वर्षे',
    },
    summaryTemplate: (d) =>
      `तुमची माहिती — काम: ${d.jobType || 'अज्ञात'}, ` +
      `प्रकार: ${d.jobSubtype || 'अज्ञात'}, ` +
      `भाग: ${d.area || 'अज्ञात'}, ` +
      `उत्पन्न: ${d.income || 'अज्ञात'}, ` +
      `वय: ${d.age || 'अज्ञात'}. ` +
      `आम्ही तुम्हाला काम मिळाल्यावर कॉल करू. कृपया कोणालाही OTP किंवा पैशांची माहिती देऊ नका.`,
    promptLang: 'Marathi',
  },
};

/**
 * Build the base system prompt for a given language.
 */
function getSystemPromptBase(lang) {
  const langName = LANG_CONFIG[lang]?.promptLang || 'Hindi';
  return `तुम एक ${langName}-speaking job dispatch assistant हो जिसका नाम "aftermath-hacks" है।

तुम blue-collar workers की मदद करते हो जो नौकरी ढूंढ रहे हैं।

नियम:
- केवल सरल और विनम्र ${langName} में बात करो।
- हर जवाब maximum 2 sentences में दो।
- एक बार में केवल एक ही सवाल पूछो।
- अगर जानकारी नहीं है तो खुद से मत बनाओ।
- कभी OTP, Aadhaar, bank details, या payment माँगो मत।
- हमेशा worker को चेतावनी दो कि OTP या पैसे की जानकारी किसी को मत दो।
- बातचीत पहले से शुरू हो चुकी है — दोबारा greeting मत करो।
- Markdown मत use करो। लंबे paragraphs मत लिखो।
- IMPORTANT: Respond ONLY in ${langName}. Do NOT switch languages.`;
}

/**
 * Map stage name to the conversationData key it collects.
 */
function stageToKey(stage) {
  switch (stage) {
    case 'JOB_TYPE':    return 'jobType';
    case 'JOB_SUBTYPE': return 'jobSubtype';
    case 'AREA':        return 'area';
    case 'INCOME':      return 'income';
    case 'AGE':         return 'age';
    default:            return null;
  }
}

/**
 * Build a stage-aware system prompt injecting real collected data.
 * @param {string} stage
 * @param {object} data - conversationData
 * @param {string} lang - e.g. 'hi-IN'
 */
function buildSystemPrompt(stage, data = {}, lang = 'hi-IN') {
  const { jobType, jobSubtype, area, income, age } = data;
  const langName = LANG_CONFIG[lang]?.promptLang || 'Hindi';

  const knownParts = [
    jobType    && `काम: "${jobType}"`,
    jobSubtype && `प्रकार: "${jobSubtype}"`,
    area       && `इलाका: "${area}"`,
    income     && `कमाई: "${income}"`,
    age        && `उम्र: "${age}"`,
  ].filter(Boolean);
  const knownSummary = knownParts.length > 0
    ? knownParts.join(', ')
    : '(no data yet)';

  const stageInstructions = {
    JOB_TYPE:
      `Stage: JOB_TYPE.\n` +
      `Worker wants a job. Acknowledge and ask in ${langName}: "What type of work are you looking for?"`,

    JOB_SUBTYPE:
      `Stage: JOB_SUBTYPE.\n` +
      `Worker said job type: "${jobType || '?'}".\n` +
      `Ask in ${langName}: "What kind of ${jobType || 'this'} work? (domestic, commercial, industrial etc.)"`,

    AREA:
      `Stage: AREA.\nKnown so far: ${knownSummary}.\n` +
      `Ask in ${langName}: "Which area are you looking for work? Please name a nearby landmark."`,

    INCOME:
      `Stage: INCOME.\nKnown so far: ${knownSummary}.\n` +
      `Ask in ${langName}: "How much income do you expect? (daily or monthly)"`,

    AGE:
      `Stage: AGE.\nKnown so far: ${knownSummary}.\n` +
      `Ask in ${langName}: "What is your age?"`,

    CONFIRM:
      `Stage: CONFIRM.\nAll data: ${knownSummary}.\n` +
      `Repeat ALL collected details clearly in ${langName}, then say the closing safety message.`,

    DONE:
      `Conversation done. Say goodbye politely in ${langName}.`,
  };

  const instruction = stageInstructions[stage] || stageInstructions.DONE;
  return `${getSystemPromptBase(lang)}\n\n${instruction}`;
}

/**
 * Advance conversation stage.
 * JOB_TYPE → JOB_SUBTYPE → AREA → INCOME → AGE → CONFIRM → DONE
 */
function updateStage(stage) {
  switch (stage) {
    case 'JOB_TYPE':    return 'JOB_SUBTYPE';
    case 'JOB_SUBTYPE': return 'AREA';
    case 'AREA':        return 'INCOME';
    case 'INCOME':      return 'AGE';
    case 'AGE':         return 'CONFIRM';
    case 'CONFIRM':     return 'DONE';
    default:            return 'DONE';
  }
}

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
    const lang = options.language || 'hi-IN';
    console.log(`[VoiceAgent] Language: ${lang}`);
    const debugMode = process.env.VOICE_DEBUG_MODE;
    if (debugMode === 'stt-llm') {
      this._runSttGeminiDebug(roomName, room, lang).catch((err) => {
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

  async _runSttGeminiDebug(roomName, room, lang = 'hi-IN') {
    this._sessionResults.set(roomName, { status: 'running', events: [] });

    const cfg = LANG_CONFIG[lang] || LANG_CONFIG['hi-IN'];
    console.log(`[VOICE] Language: ${lang} (${cfg.promptLang})`);
    this._pushResult(roomName, { type: 'status', message: `Language: ${cfg.promptLang}` });

    // ── Conversation state ──
    let stage = 'JOB_TYPE';
    let conversationActive = true;

    const conversationData = {
      jobType: null, jobSubtype: null, area: null, income: null, age: null,
    };

    try {
      console.log(`[VOICE] Waiting for remote audio track (30s)...`);
      this._pushResult(roomName, { type: 'status', message: 'Waiting for browser mic…' });
      const remoteTrack = await this._waitForAudioTrack(room, 30_000);

      if (!remoteTrack) {
        console.log('[VOICE] No audio track received within 30s.');
        this._pushResult(roomName, { type: 'error', message: 'No audio track received within 30s.' });
        this._sessionResults.get(roomName).status = 'done';
        return;
      }

      // ── Speak greeting in selected language ──
      console.log('[VOICE] Got mic — speaking greeting...');
      this._pushResult(roomName, { type: 'status', message: 'Speaking greeting…' });
      await this._speak(room, cfg.greeting, lang);

      // Let room acoustics clear so STT won't echo the greeting.
      await this._delay(1500);

      // ── Multi-turn conversation loop ──
      while (conversationActive) {
        console.log('[VOICE][STAGE]', stage);
        this._pushResult(roomName, { type: 'stage', stage });

        // --- Mock transcript (language-specific) ---
        const transcript = cfg.mock[stage];
        if (!transcript) {
          console.log(`[VOICE][MOCK] No mock for stage=${stage}, skipping`);
          break;
        }

        await this._delay(1000);

        console.log(`[VOICE][MOCK] stage=${stage} → "${transcript}"`);
        this._pushResult(roomName, { type: 'stt', transcript, durationMs: 0, mock: true });

        // --- Store the transcript against the current stage's data key ---
        const dataKey = stageToKey(stage);
        if (dataKey) {
          conversationData[dataKey] = transcript.trim();
          console.log('[VOICE][DATA]', JSON.stringify(conversationData));
          this._pushResult(roomName, { type: 'data', data: { ...conversationData } });
        }

        // --- LLM (stage-aware prompt with collected data + language) ---
        const systemPrompt = buildSystemPrompt(stage, conversationData, lang);
        const llmStart = Date.now();
        console.time('llm');
        const reply = await generateReply({ systemPrompt, userText: transcript });
        console.timeEnd('llm');
        const llmMs = Date.now() - llmStart;

        console.log('[VOICE][LLM]', reply);
        this._pushResult(roomName, { type: 'llm', reply, durationMs: llmMs, stage });

        // --- TTS: speak reply in selected language ---
        if (reply && reply.trim()) {
          this._pushResult(roomName, { type: 'status', message: `[${stage}] Speaking reply…` });
          await this._speak(room, reply, lang);
        }

        // --- Advance stage AFTER speaking ---
        stage = updateStage(stage);
        console.log('[VOICE][STAGE] → advanced to', stage);

        if (stage === 'DONE') {
          conversationActive = false;
        } else {
          // Brief pause between turns so mic doesn't catch TTS echo
          await this._delay(800);
        }
      }

      // ── Final summary via TTS (language-aware) ──
      const summary = cfg.summaryTemplate(conversationData);

      console.log('[VOICE][SUMMARY]', summary);
      this._pushResult(roomName, { type: 'summary', summary, data: { ...conversationData }, language: lang });
      await this._speak(room, summary, lang);

      this._sessionResults.get(roomName).status = 'done';

    } catch (err) {
      console.error(`[VOICE] STT-LLM pipeline failed:`, err.message);
      this._pushResult(roomName, { type: 'error', message: err.message });
      if (this._sessionResults.has(roomName)) this._sessionResults.get(roomName).status = 'error';
    } finally {
      // Disconnect ONLY after loop exits (or on error)
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
      // Step 1: Wait for the browser simulator to join and publish its mic.
      //         Must happen BEFORE speaking — the browser takes a few seconds
      //         to load, connect, and call setMicrophoneEnabled(true).
      //         If we greet first, the track subscription fires during TTS playback
      //         and is missed by _waitForAudioTrack.
      console.log(`[VoiceAgent] Waiting for remote audio track...`);
      const remoteTrack = await this._waitForAudioTrack(room, 30_000);

      if (!remoteTrack) {
        console.warn(`[VoiceAgent] No audio track received within 30s. Ending session.`);
        await this.endSession(roomName);
        return;
      }

      console.log(`[VoiceAgent] Got remote audio — speaking greeting...`);

      // Step 2: Speak greeting (browser is already connected and mic is live)
      await this._speak(room, GREETING_TEXT);

      // Step 3: Listen immediately after greeting (mic was already active in Step 1)
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
    let capturedSampleRate = 48000;
    let capturedChannels = 1;
    let stream;

    // VAD: only keep frames with RMS energy above this threshold.
    // 200 filters out silence/echo; user speech is typically 800–4000.
    const VAD_THRESHOLD = 200;

    // Auto-stop after this many ms of consecutive silence post-speech
    const SILENCE_STOP_MS = 2000;

    const speechFrames = [];   // frames that passed VAD
    let totalFrames = 0;
    let hadSpeech = false;
    let silenceStart = null;

    try {
      stream = new AudioStream(remoteTrack);
      const deadline = Date.now() + durationMs;
      let firstFrame = true;

      for await (const frame of stream) {
        if (Date.now() >= deadline) break;
        totalFrames++;

        if (firstFrame) {
          capturedSampleRate = frame.sampleRate;
          capturedChannels = frame.channels;
          console.log(`[VoiceAgent] Audio: ${capturedSampleRate}Hz, ${capturedChannels}ch`);
          firstFrame = false;
        }

        // Compute RMS energy of this frame
        const raw = new Int16Array(frame.data.buffer, frame.data.byteOffset, frame.data.length);
        let sumSq = 0;
        for (let i = 0; i < raw.length; i++) sumSq += raw[i] * raw[i];
        const rms = Math.sqrt(sumSq / raw.length);

        if (rms >= VAD_THRESHOLD) {
          // Speech frame — collect it
          speechFrames.push(Buffer.from(raw.buffer, raw.byteOffset, raw.byteLength));
          hadSpeech = true;
          silenceStart = null;
        } else if (hadSpeech) {
          // Silent frame AFTER speech — track how long silence has lasted
          if (!silenceStart) silenceStart = Date.now();
          if (Date.now() - silenceStart >= SILENCE_STOP_MS) {
            console.log('[VoiceAgent] 2s silence after speech → stopping capture early');
            break;
          }
        }
      }
    } catch (err) {
      console.error('[VoiceAgent] Audio capture error:', err.message);
    }

    if (stream && typeof stream.close === 'function') {
      try { stream.close(); } catch (_) {}
    }

    console.log(`[VoiceAgent] VAD: ${speechFrames.length}/${totalFrames} frames accepted (RMS≥${VAD_THRESHOLD})`);

    if (speechFrames.length === 0) return null;

    // Concatenate speech-only PCM
    const rawPcm = Buffer.concat(speechFrames);
    let samples = new Int16Array(rawPcm.buffer, rawPcm.byteOffset, rawPcm.length / 2);

    // Downmix to mono if multi-channel
    if (capturedChannels > 1) {
      console.log(`[VoiceAgent] Downmixing ${capturedChannels}ch → mono`);
      samples = sarvamService.downmixToMono(samples, capturedChannels);
    }

    // Resample to 16kHz for Sarvam STT
    if (capturedSampleRate !== 16000) {
      console.log(`[VoiceAgent] Resampling ${capturedSampleRate}Hz → 16000Hz`);
      samples = sarvamService.resample(samples, capturedSampleRate, 16000);
    }

    const pcmBuffer = Buffer.from(samples.buffer, samples.byteOffset, samples.byteLength);
    return sarvamService.createWavBuffer(pcmBuffer, 16000, 1);
  }

  // ─────────────────────────────────────────
  //  PRIVATE: Speak — TTS + publish to room
  // ─────────────────────────────────────────

  async _speak(room, text, languageCode = 'hi-IN') {
    // Declared outside try so finally block can access them
    let source = null;
    let trackSid = null;

    try {
      // 1. TTS call
      console.log(`[VoiceAgent] Requesting TTS (${languageCode})...`);
      const wavBuffer = await sarvamService.textToSpeech(text, {
        languageCode,
        sampleRate: 48000,
      });

      if (!wavBuffer) {
        console.error('[VoiceAgent] TTS returned null. Skipping playback.');
        return;
      }
      console.log(`[VoiceAgent] TTS buffer length: ${wavBuffer.length}`);

      // 2. Parse WAV
      const { pcm, sampleRate: ttsSampleRate, numChannels } = sarvamService.parseWav(wavBuffer);
      console.log(`[VoiceAgent] PCM length: ${pcm.length}, sampleRate: ${ttsSampleRate}, channels: ${numChannels}`);

      const pcmCopy = Buffer.from(pcm);
      let samples = new Int16Array(pcmCopy.buffer, pcmCopy.byteOffset, pcmCopy.length / 2);

      if (numChannels > 1) {
        samples = sarvamService.downmixToMono(samples, numChannels);
      }

      const targetRate = 48000;
      if (ttsSampleRate !== targetRate) {
        console.warn(`[VoiceAgent] TTS ${ttsSampleRate}Hz → resampling to ${targetRate}Hz`);
        samples = sarvamService.resample(samples, ttsSampleRate, targetRate);
      }

      // 3. Create AudioSource + track
      source = new AudioSource(targetRate, 1);
      const track = LocalAudioTrack.createAudioTrack('tts-output', source);

      // 4. Publish
      console.log('[VoiceAgent] Publishing TTS track...');
      const publishOptions = new TrackPublishOptions({ source: TrackSource.SOURCE_MICROPHONE });
      await room.localParticipant.publishTrack(track, publishOptions);

      // Find the real SID string by scanning the Map of published tracks.
      // trackPublications is a Map<string, LocalTrackPublication> keyed by SID.
      // We match by the track object reference to get the guaranteed string key.
      for (const [sid, pub] of room.localParticipant.trackPublications) {
        if (pub.track === track) {
          trackSid = sid; // sid here is always a plain string
          break;
        }
      }
      console.log(`[VoiceAgent] TTS track published (sid: ${trackSid ?? 'unknown'})`);

      // 5. Settle before feeding frames
      await this._delay(150);

      // 6. Feed 50ms frames (2400 samples @ 48kHz)
      const FRAME_SIZE = 2400;
      const frameDurationMs = (FRAME_SIZE / targetRate) * 1000;
      let frameCount = 0;

      for (let offset = 0; offset < samples.length; offset += FRAME_SIZE) {
        const end = Math.min(offset + FRAME_SIZE, samples.length);
        const chunkSamples = samples.slice(offset, end);

        // Each frame must have its own standalone Buffer.
        // Never pass a typed-array view that shares an ArrayBuffer with other frames —
        // the Rust FFI receives "[object Object]" and panics at room.rs:524.
        const frameBuf = Buffer.alloc(chunkSamples.byteLength);
        Buffer.from(
          chunkSamples.buffer,
          chunkSamples.byteOffset,
          chunkSamples.byteLength
        ).copy(frameBuf);

        await source.captureFrame(new AudioFrame(frameBuf, targetRate, 1, chunkSamples.length));
        frameCount++;
        await this._delay(frameDurationMs);
      }

      console.log(`[VoiceAgent] Finished feeding ${frameCount} frames`);

      // 7. Flush — let WebRTC drain all frames before teardown
      await this._delay(600);

    } catch (err) {
      console.error('[VoiceAgent] Speak failed:', err.message);
      // Do NOT rethrow — pipeline must continue
    } finally {
      // 8. Unpublish in finally so it always runs, even on error.
      //    MUST pass the SID string — NEVER the track or publication object.
      //    Passing an object makes Rust receive "[object Object]" → panic at room.rs:524.
      if (trackSid && typeof trackSid === 'string') {
        try {
          await room.localParticipant.unpublishTrack(trackSid);
          console.log('[VoiceAgent] TTS track unpublished');
        } catch (unpubErr) {
          // Non-fatal: room.disconnect() will clean up the track
          console.warn('[VoiceAgent] Unpublish skipped (non-fatal):', unpubErr.message);
        }
      } else {
        console.warn('[VoiceAgent] No trackSid found — skipping unpublish, disconnect will clean up');
      }
    }
  }

  // ─────────────────────────────────────────
  //  PRIVATE: Wait for a remote audio track
  // ─────────────────────────────────────────

  _waitForAudioTrack(room, timeoutMs) {
    return new Promise((resolve) => {
      // TrackKind is a numeric enum: KIND_AUDIO = 1, KIND_VIDEO = 2
      // CRITICAL: comparing track.kind === 'audio' always fails — it's a number
      const AUDIO = TrackKind ? TrackKind.KIND_AUDIO : 1;

      // Check existing subscribed tracks first (browser may have joined earlier)
      for (const participant of room.remoteParticipants.values()) {
        for (const pub of participant.trackPublications.values()) {
          console.log(`[VoiceAgent] Existing pub: kind=${pub.kind} track=${!!pub.track} from=${participant.identity}`);
          if (pub.track && pub.kind === AUDIO) {
            console.log(`[VoiceAgent] Found existing audio track from: ${participant.identity}`);
            resolve(pub.track);
            return;
          }
        }
      }

      // Wait for the TrackSubscribed event
      console.log('[VoiceAgent] No existing audio track — waiting for TrackSubscribed...');
      let timer;
      const handler = (track, publication, participant) => {
        console.log(`[VoiceAgent] TrackSubscribed: kind=${track.kind} (AUDIO=${AUDIO}) from=${participant.identity}`);
        if (track.kind === AUDIO) {
          clearTimeout(timer);
          room.off(RoomEvent.TrackSubscribed, handler);
          console.log(`[VoiceAgent] Got audio track from: ${participant.identity}`);
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
