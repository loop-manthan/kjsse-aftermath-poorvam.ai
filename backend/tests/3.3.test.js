/**
 * 3.3.test.js — Phase 3 STT → Gemini Debug Pipeline Tests
 *
 * Validates:
 *   1. llm.service.js — generateReply() with Gemini provider
 *   2. voiceAgent._runSttGeminiDebug() — full debug pipeline
 *   3. Debug mode wiring in startVoiceSession()
 *   4. Failure handling — LLM errors, timeouts, unknown providers
 *   5. Clean disconnect in finally block
 *
 * Zero real API calls. Everything mocked.
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

// ───────────────────────────────────────
//  ENV
// ───────────────────────────────────────
process.env.SARVAM_API_KEY = 'test-sarvam-key';
process.env.LIVEKIT_URL = 'wss://test.livekit.cloud';
process.env.LIVEKIT_API_KEY = 'test-lk-key';
process.env.LIVEKIT_API_SECRET = 'test-lk-secret';
process.env.MONGO_URI = 'mongodb://localhost:27017/test_noop';
process.env.JWT_SECRET = 'test-secret';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.GEMINI_MODEL = 'gemini-1.5-flash';
process.env.LLM_PROVIDER = 'gemini';
process.env.LLM_TIMEOUT_MS = '5000';

// ───────────────────────────────────────
//  HELPERS
// ───────────────────────────────────────

function buildTestWav(sampleRate = 16000, numChannels = 1, numSamples = 160) {
  const bitsPerSample = 16;
  const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
  const blockAlign = numChannels * (bitsPerSample / 8);
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(dataSize + 36, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  const pcm = Buffer.alloc(dataSize);
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, numSamples * numChannels);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.round(Math.sin(i * 0.1) * 3000);
  return Buffer.concat([header, pcm]);
}

const TEST_WAV = buildTestWav(16000, 1, 160);
const TEST_WAV_B64 = TEST_WAV.toString('base64');

// ───────────────────────────────────────
//  MOCK CALL TRACKERS
// ───────────────────────────────────────
const mockRoomConnect = jest.fn().mockResolvedValue(undefined);
const mockRoomDisconnect = jest.fn().mockResolvedValue(undefined);
const mockRoomOn = jest.fn();
const mockRoomOff = jest.fn();
const mockStreamClose = jest.fn();
const mockPublishTrack = jest.fn().mockResolvedValue(undefined);
const mockUnpublishTrack = jest.fn().mockResolvedValue(undefined);
const mockCaptureFrame = jest.fn().mockResolvedValue(undefined);

// ───────────────────────────────────────
//  GLOBAL FETCH MOCK
// ───────────────────────────────────────
const originalFetch = globalThis.fetch;
const mockFetch = jest.fn();
globalThis.fetch = mockFetch;

// ───────────────────────────────────────
//  MODULE MOCKS
// ───────────────────────────────────────

jest.unstable_mockModule('axios', () => ({
  default: { post: jest.fn() },
}));

jest.unstable_mockModule('form-data', () => ({
  default: jest.fn().mockImplementation(() => ({
    append: jest.fn(),
    getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
  })),
}));

jest.unstable_mockModule('@livekit/rtc-node', () => ({
  Room: jest.fn().mockImplementation(() => ({
    connect: mockRoomConnect,
    disconnect: mockRoomDisconnect,
    on: mockRoomOn,
    off: mockRoomOff,
    remoteParticipants: new Map(),
    localParticipant: {
      publishTrack: mockPublishTrack,
      unpublishTrack: mockUnpublishTrack,
    },
  })),
  RoomEvent: {
    ParticipantConnected: 'participantConnected',
    ParticipantDisconnected: 'participantDisconnected',
    TrackSubscribed: 'trackSubscribed',
    TrackUnsubscribed: 'trackUnsubscribed',
    Reconnecting: 'reconnecting',
    Reconnected: 'reconnected',
    Disconnected: 'disconnected',
  },
  AudioStream: jest.fn().mockImplementation(() => {
    const frames = [
      { sampleRate: 48000, channels: 1, data: new Int16Array(480) },
      { sampleRate: 48000, channels: 1, data: new Int16Array(480) },
      { sampleRate: 48000, channels: 1, data: new Int16Array(480) },
    ];
    let idx = 0;
    return {
      [Symbol.asyncIterator]() {
        return {
          next() {
            if (idx < frames.length) return Promise.resolve({ value: frames[idx++], done: false });
            return Promise.resolve({ value: undefined, done: true });
          },
        };
      },
      close: mockStreamClose,
    };
  }),
  LocalAudioTrack: {
    createAudioTrack: jest.fn().mockReturnValue({ kind: 'audio', sid: 'mock-track' }),
  },
  AudioSource: jest.fn().mockImplementation(() => ({ captureFrame: mockCaptureFrame })),
  AudioFrame: jest.fn().mockImplementation((data, sr, ch, spc) => ({
    data, sampleRate: sr, channels: ch, samplesPerChannel: spc,
  })),
  TrackPublishOptions: jest.fn().mockImplementation((opts) => ({ ...opts })),
  TrackSource: {
    SOURCE_UNKNOWN: 0, SOURCE_CAMERA: 1, SOURCE_MICROPHONE: 2,
    SOURCE_SCREENSHARE: 3, SOURCE_SCREENSHARE_AUDIO: 4,
  },
}));

jest.unstable_mockModule('livekit-server-sdk', () => ({
  AccessToken: jest.fn().mockImplementation(() => ({
    addGrant: jest.fn(),
    toJwt: jest.fn().mockResolvedValue('mock-lk-token'),
  })),
  RoomServiceClient: jest.fn().mockImplementation(() => ({
    listRooms: jest.fn().mockResolvedValue([]),
  })),
}));

jest.unstable_mockModule('mongoose', () => {
  const SchemaClass = function () {
    this.index = jest.fn().mockReturnThis();
    this.pre = jest.fn().mockReturnThis();
    this.methods = {};
  };
  SchemaClass.Types = { ObjectId: 'ObjectId' };
  return {
    default: {
      connect: jest.fn().mockResolvedValue(true),
      connection: { readyState: 1 },
      Schema: SchemaClass,
      model: jest.fn().mockReturnValue(function MockModel() {}),
    },
  };
});

jest.unstable_mockModule('bcryptjs', () => ({
  default: { genSalt: jest.fn(), hash: jest.fn(), compare: jest.fn() },
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: { sign: jest.fn().mockReturnValue('jwt'), verify: jest.fn() },
}));

jest.unstable_mockModule('uuid', () => ({
  v4: jest.fn().mockReturnValue('uuid-1234'),
}));

// ───────────────────────────────────────
//  IMPORTS (after mocks)
// ───────────────────────────────────────
const { default: axios } = await import('axios');
const { generateReply } = await import('../src/services/llm.service.js');
const sarvamService = (await import('../src/services/sarvam.service.js')).default;
const voiceAgentService = (await import('../src/services/voiceAgent.service.js')).default;

// ───────────────────────────────────────
//  Gemini mock response builder
// ───────────────────────────────────────
function geminiOkResponse(text) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{
        content: {
          parts: [{ text }],
          role: 'model',
        },
      }],
    }),
    text: async () => '',
  };
}

function geminiErrorResponse(status, body = 'error') {
  return {
    ok: false,
    status,
    json: async () => ({}),
    text: async () => body,
  };
}

// ───────────────────────────────────────
//  TEST SUITE
// ───────────────────────────────────────
describe('Phase 3 — STT → Gemini Debug Pipeline', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    mockFetch.mockReset();
  });

  afterEach(() => {
    // Restore env defaults between tests
    process.env.LLM_PROVIDER = 'gemini';
    process.env.GEMINI_API_KEY = 'test-gemini-key';
    process.env.GEMINI_MODEL = 'gemini-1.5-flash';
    process.env.LLM_TIMEOUT_MS = '5000';
  });

  // ─────────────────────────────────
  // 1. generateReply — Gemini happy path
  // ─────────────────────────────────
  describe('generateReply() — Gemini provider', () => {
    it('should return Gemini reply text on success', async () => {
      mockFetch.mockResolvedValueOnce(geminiOkResponse('Hello from Gemini!'));

      const reply = await generateReply({
        systemPrompt: 'You are helpful.',
        userText: 'Hi',
      });

      expect(reply).toBe('Hello from Gemini!');
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verify URL contains model and key
      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('gemini-1.5-flash');
      expect(url).toContain('key=test-gemini-key');
    });

    it('should join multiple content parts', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          candidates: [{
            content: {
              parts: [{ text: 'Part 1. ' }, { text: 'Part 2.' }],
              role: 'model',
            },
          }],
        }),
        text: async () => '',
      });

      const reply = await generateReply({ systemPrompt: 'test', userText: 'test' });
      expect(reply).toBe('Part 1. Part 2.');
    });

    it('should send correct request body structure', async () => {
      mockFetch.mockResolvedValueOnce(geminiOkResponse('ok'));

      await generateReply({ systemPrompt: 'Be helpful.', userText: 'Hello world' });

      const reqBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(reqBody.systemInstruction.parts[0].text).toBe('Be helpful.');
      expect(reqBody.contents[0].parts[0].text).toBe('Hello world');
      expect(reqBody.contents[0].role).toBe('user');
      expect(reqBody.generationConfig.maxOutputTokens).toBe(256);
    });

    it('should use custom model from env', async () => {
      process.env.GEMINI_MODEL = 'gemini-2.0-pro';
      mockFetch.mockResolvedValueOnce(geminiOkResponse('ok'));

      await generateReply({ systemPrompt: 'test', userText: 'test' });

      const url = mockFetch.mock.calls[0][0];
      expect(url).toContain('gemini-2.0-pro');
    });
  });

  // ─────────────────────────────────
  // 2. generateReply — error handling
  // ─────────────────────────────────
  describe('generateReply() — error cases', () => {
    const FALLBACK = 'Sorry, I could not generate a response right now.';

    it('should return fallback on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce(geminiErrorResponse(500, 'Internal Server Error'));

      const reply = await generateReply({ systemPrompt: 'test', userText: 'test' });
      expect(reply).toBe(FALLBACK);
    });

    it('should return fallback on 429 rate limit', async () => {
      mockFetch.mockResolvedValueOnce(geminiErrorResponse(429, 'Rate limited'));

      const reply = await generateReply({ systemPrompt: 'test', userText: 'test' });
      expect(reply).toBe(FALLBACK);
    });

    it('should return fallback on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('fetch failed'));

      const reply = await generateReply({ systemPrompt: 'test', userText: 'test' });
      expect(reply).toBe(FALLBACK);
    });

    it('should return fallback on timeout (AbortError)', async () => {
      const abortErr = new Error('The operation was aborted');
      abortErr.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortErr);

      const reply = await generateReply({ systemPrompt: 'test', userText: 'test' });
      expect(reply).toBe(FALLBACK);
    });

    it('should return fallback when candidates array is empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({ candidates: [] }),
        text: async () => '',
      });

      const reply = await generateReply({ systemPrompt: 'test', userText: 'test' });
      expect(reply).toBe(FALLBACK);
    });

    it('should return fallback when parts are empty', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [], role: 'model' } }],
        }),
        text: async () => '',
      });

      const reply = await generateReply({ systemPrompt: 'test', userText: 'test' });
      expect(reply).toBe(FALLBACK);
    });

    it('should return fallback when part text is empty/whitespace', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true, status: 200,
        json: async () => ({
          candidates: [{ content: { parts: [{ text: '   ' }], role: 'model' } }],
        }),
        text: async () => '',
      });

      const reply = await generateReply({ systemPrompt: 'test', userText: 'test' });
      expect(reply).toBe(FALLBACK);
    });

    it('should return fallback when GEMINI_API_KEY is missing', async () => {
      const saved = process.env.GEMINI_API_KEY;
      delete process.env.GEMINI_API_KEY;

      const reply = await generateReply({ systemPrompt: 'test', userText: 'test' });
      expect(reply).toBe(FALLBACK);
      expect(mockFetch).not.toHaveBeenCalled();

      process.env.GEMINI_API_KEY = saved;
    });

    it('should return fallback for unknown provider', async () => {
      process.env.LLM_PROVIDER = 'openai';

      const reply = await generateReply({ systemPrompt: 'test', userText: 'test' });
      expect(reply).toBe(FALLBACK);
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should return fallback when LLM_PROVIDER is empty', async () => {
      process.env.LLM_PROVIDER = '';

      const reply = await generateReply({ systemPrompt: 'test', userText: 'test' });
      expect(reply).toBe(FALLBACK);
    });

    it('should never throw regardless of error type', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('Cannot read properties'));

      await expect(
        generateReply({ systemPrompt: 'test', userText: 'test' })
      ).resolves.not.toThrow();
    });
  });

  // ─────────────────────────────────
  // 3. _runSttGeminiDebug — full pipeline
  // ─────────────────────────────────
  describe('VoiceAgentService._runSttGeminiDebug()', () => {

    it('should run STT then LLM then disconnect on valid audio', async () => {
      // TTS greeting mock (axios.post call #1 — _speak for greeting)
      axios.post.mockResolvedValueOnce({
        data: { audios: [TEST_WAV_B64] },
      });

      // STT mock (axios.post call #2 — speechToText)
      axios.post.mockResolvedValueOnce({
        data: { transcript: 'Mera geyser kharab hai', language_code: 'hi-IN' },
      });

      // LLM mock — Gemini returns reply
      mockFetch.mockResolvedValueOnce(geminiOkResponse('Main aapki madad karta hoon.'));

      // TTS reply mock (axios.post call #3 — _speak for LLM reply)
      axios.post.mockResolvedValueOnce({
        data: { audios: [TEST_WAV_B64] },
      });

      // Stub _waitForAudioTrack to return a mock track immediately
      const origWait = voiceAgentService._waitForAudioTrack.bind(voiceAgentService);
      voiceAgentService._waitForAudioTrack = jest.fn().mockResolvedValue({ kind: 'audio' });

      // Stub _delay to prevent real waits
      voiceAgentService._delay = jest.fn().mockResolvedValue(undefined);

      const mockRoom = {
        disconnect: mockRoomDisconnect,
        localParticipant: { publishTrack: mockPublishTrack, unpublishTrack: mockUnpublishTrack },
        remoteParticipants: new Map(),
        on: mockRoomOn,
        off: mockRoomOff,
      };

      const roomName = 'test-debug-room';
      voiceAgentService._activeSessions.set(roomName, { room: mockRoom, timer: null });

      // Capture console.log calls
      const logs = [];
      const origLog = console.log;
      console.log = (...args) => { logs.push(args.join(' ')); };

      await voiceAgentService._runSttGeminiDebug(roomName, mockRoom);

      console.log = origLog;

      // Verify TTS greeting + STT + TTS reply were called
      expect(axios.post).toHaveBeenCalledTimes(3);
      expect(axios.post.mock.calls[0][0]).toContain('/text-to-speech'); // greeting
      expect(axios.post.mock.calls[1][0]).toContain('/speech-to-text'); // STT
      expect(axios.post.mock.calls[2][0]).toContain('/text-to-speech'); // reply

      // Verify LLM was called
      expect(mockFetch).toHaveBeenCalledTimes(1);

      // Verify logs contain transcript and reply
      const sttLog = logs.find(l => l.includes('[VOICE][STT]') && l.includes('Mera geyser'));
      expect(sttLog).toBeDefined();

      const llmLog = logs.find(l => l.includes('[VOICE][LLM]') && l.includes('madad'));
      expect(llmLog).toBeDefined();

      // Verify clean disconnect
      const disconnectLog = logs.find(l => l.includes('disconnected cleanly'));
      expect(disconnectLog).toBeDefined();

      voiceAgentService._waitForAudioTrack = origWait;
    });

    it('should handle empty transcript gracefully (no LLM call)', async () => {
      // TTS greeting mock
      axios.post.mockResolvedValueOnce({
        data: { audios: [TEST_WAV_B64] },
      });

      // STT returns empty
      axios.post.mockResolvedValueOnce({
        data: { transcript: '', language_code: null },
      });

      voiceAgentService._waitForAudioTrack = jest.fn().mockResolvedValue({ kind: 'audio' });
      voiceAgentService._delay = jest.fn().mockResolvedValue(undefined);

      const mockRoom = {
        disconnect: mockRoomDisconnect,
        localParticipant: { publishTrack: mockPublishTrack, unpublishTrack: mockUnpublishTrack },
        remoteParticipants: new Map(),
        on: mockRoomOn,
        off: mockRoomOff,
      };

      const roomName = 'test-empty-stt-room';
      voiceAgentService._activeSessions.set(roomName, { room: mockRoom, timer: null });

      await voiceAgentService._runSttGeminiDebug(roomName, mockRoom);

      // LLM should NOT have been called
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should handle no audio track (timeout) gracefully', async () => {
      // TTS greeting mock
      axios.post.mockResolvedValueOnce({
        data: { audios: [TEST_WAV_B64] },
      });

      voiceAgentService._waitForAudioTrack = jest.fn().mockResolvedValue(null);
      voiceAgentService._delay = jest.fn().mockResolvedValue(undefined);

      const mockRoom = {
        disconnect: mockRoomDisconnect,
        localParticipant: { publishTrack: mockPublishTrack, unpublishTrack: mockUnpublishTrack },
        on: mockRoomOn,
        off: mockRoomOff,
        remoteParticipants: new Map(),
      };

      const roomName = 'test-no-track-room';
      voiceAgentService._activeSessions.set(roomName, { room: mockRoom, timer: null });

      const logs = [];
      const origLog = console.log;
      console.log = (...args) => { logs.push(args.join(' ')); };

      await voiceAgentService._runSttGeminiDebug(roomName, mockRoom);

      console.log = origLog;

      // Should log about no track
      expect(logs.some(l => l.includes('No audio track'))).toBe(true);
      // Only TTS greeting was called (no STT or LLM)
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post.mock.calls[0][0]).toContain('/text-to-speech');
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it('should always disconnect even if STT throws', async () => {
      // TTS greeting mock
      axios.post.mockResolvedValueOnce({
        data: { audios: [TEST_WAV_B64] },
      });

      voiceAgentService._waitForAudioTrack = jest.fn().mockResolvedValue({ kind: 'audio' });
      voiceAgentService._delay = jest.fn().mockResolvedValue(undefined);

      // Make _listen throw
      const origListen = voiceAgentService._listen.bind(voiceAgentService);
      voiceAgentService._listen = jest.fn().mockRejectedValue(new Error('STT boom'));

      const mockRoom = {
        disconnect: mockRoomDisconnect,
        localParticipant: { publishTrack: mockPublishTrack, unpublishTrack: mockUnpublishTrack },
        on: mockRoomOn,
        off: mockRoomOff,
        remoteParticipants: new Map(),
      };

      const roomName = 'test-stt-crash-room';
      voiceAgentService._activeSessions.set(roomName, { room: mockRoom, timer: null });

      // Should not throw
      await expect(
        voiceAgentService._runSttGeminiDebug(roomName, mockRoom)
      ).resolves.not.toThrow();

      // Disconnect should still have been attempted (from finally block via endSession)
      // endSession calls room.disconnect
      expect(mockRoomDisconnect).toHaveBeenCalled();

      voiceAgentService._listen = origListen;
    });

    it('should survive LLM failure and still disconnect', async () => {
      // TTS greeting mock
      axios.post.mockResolvedValueOnce({
        data: { audios: [TEST_WAV_B64] },
      });

      // STT returns valid transcript
      axios.post.mockResolvedValueOnce({
        data: { transcript: 'Hello', language_code: 'en' },
      });

      // LLM fails — generateReply returns fallback string
      mockFetch.mockRejectedValueOnce(new Error('LLM down'));

      // TTS reply mock (for the fallback reply)
      axios.post.mockResolvedValueOnce({
        data: { audios: [TEST_WAV_B64] },
      });

      voiceAgentService._waitForAudioTrack = jest.fn().mockResolvedValue({ kind: 'audio' });
      voiceAgentService._delay = jest.fn().mockResolvedValue(undefined);

      const mockRoom = {
        disconnect: mockRoomDisconnect,
        localParticipant: { publishTrack: mockPublishTrack, unpublishTrack: mockUnpublishTrack },
        remoteParticipants: new Map(),
        on: mockRoomOn,
        off: mockRoomOff,
      };

      const roomName = 'test-llm-fail-room';
      voiceAgentService._activeSessions.set(roomName, { room: mockRoom, timer: null });

      const logs = [];
      const origLog = console.log;
      console.log = (...args) => { logs.push(args.join(' ')); };

      await voiceAgentService._runSttGeminiDebug(roomName, mockRoom);

      console.log = origLog;

      // STT log should still appear
      expect(logs.some(l => l.includes('[VOICE][STT]') && l.includes('Hello'))).toBe(true);
      // LLM log should have a fallback reply
      expect(logs.some(l => l.includes('[VOICE][LLM]'))).toBe(true);
      // Clean disconnect
      expect(logs.some(l => l.includes('disconnected cleanly'))).toBe(true);
    });
  });

  // ─────────────────────────────────
  // 4. Debug mode wiring
  // ─────────────────────────────────
  describe('startVoiceSession() debug mode wiring', () => {

    it('should call _runSttGeminiDebug when VOICE_DEBUG_MODE=stt-llm', async () => {
      process.env.VOICE_DEBUG_MODE = 'stt-llm';

      const spy = jest.spyOn(voiceAgentService, '_runSttGeminiDebug')
        .mockResolvedValue(undefined);

      const result = await voiceAgentService.startVoiceSession('debug-test-room');

      expect(result.status).toBe('agent_connected');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy.mock.calls[0][0]).toBe('debug-test-room');

      spy.mockRestore();
      delete process.env.VOICE_DEBUG_MODE;

      // Cleanup session
      voiceAgentService._activeSessions.delete('debug-test-room');
    });

    it('should call _runPipeline when VOICE_DEBUG_MODE is not set', async () => {
      delete process.env.VOICE_DEBUG_MODE;

      const debugSpy = jest.spyOn(voiceAgentService, '_runSttGeminiDebug')
        .mockResolvedValue(undefined);
      const pipelineSpy = jest.spyOn(voiceAgentService, '_runPipeline')
        .mockResolvedValue(undefined);

      await voiceAgentService.startVoiceSession('normal-test-room');

      expect(debugSpy).not.toHaveBeenCalled();
      expect(pipelineSpy).toHaveBeenCalledTimes(1);

      debugSpy.mockRestore();
      pipelineSpy.mockRestore();
      voiceAgentService._activeSessions.delete('normal-test-room');
    });

    it('should call _runPipeline for unknown debug mode values', async () => {
      process.env.VOICE_DEBUG_MODE = 'something-else';

      const debugSpy = jest.spyOn(voiceAgentService, '_runSttGeminiDebug')
        .mockResolvedValue(undefined);
      const pipelineSpy = jest.spyOn(voiceAgentService, '_runPipeline')
        .mockResolvedValue(undefined);

      await voiceAgentService.startVoiceSession('other-mode-room');

      expect(debugSpy).not.toHaveBeenCalled();
      expect(pipelineSpy).toHaveBeenCalledTimes(1);

      debugSpy.mockRestore();
      pipelineSpy.mockRestore();
      delete process.env.VOICE_DEBUG_MODE;
      voiceAgentService._activeSessions.delete('other-mode-room');
    });
  });

  // ─────────────────────────────────
  // 5. Security — API key not leaked
  // ─────────────────────────────────
  describe('Security', () => {
    it('should not include API key in request headers (uses query param)', async () => {
      mockFetch.mockResolvedValueOnce(geminiOkResponse('ok'));

      await generateReply({ systemPrompt: 'test', userText: 'test' });

      const reqOpts = mockFetch.mock.calls[0][1];
      const headers = reqOpts.headers;
      // No Authorization or api-key header — key is in the URL query
      expect(headers['Authorization']).toBeUndefined();
      expect(headers['api-key']).toBeUndefined();
      expect(headers['x-api-key']).toBeUndefined();
    });
  });
});
