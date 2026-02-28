/**
 * 3.2.test.js — Phase 3.2 Speech Pipeline Tests
 *
 * Validates:
 *   1. Sarvam STT wrapper
 *   2. Sarvam TTS wrapper
 *   3. Resampling (48→16kHz, 16→48kHz)
 *   4. Stereo → mono downmix
 *   5. speak() — publish/unpublish lifecycle
 *   6. listen() — frame accumulation + cleanup
 *   7. Failure handling — STT/TTS errors, timeout
 *
 * Zero real API calls. Everything mocked.
 */

import { jest, describe, it, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';

// ───────────────────────────────────────
//  ENV
// ───────────────────────────────────────
process.env.SARVAM_API_KEY = 'test-sarvam-key';
process.env.LIVEKIT_URL = 'wss://test.livekit.cloud';
process.env.LIVEKIT_API_KEY = 'test-lk-key';
process.env.LIVEKIT_API_SECRET = 'test-lk-secret';
process.env.MONGO_URI = 'mongodb://localhost:27017/test_noop';
process.env.JWT_SECRET = 'test-secret';

// ───────────────────────────────────────
//  MOCK FACTORIES
// ───────────────────────────────────────

// Helper: build a minimal valid WAV buffer (44-byte header + PCM data)
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
  // Fill with a simple tone pattern
  const samples = new Int16Array(pcm.buffer, pcm.byteOffset, numSamples * numChannels);
  for (let i = 0; i < samples.length; i++) {
    samples[i] = Math.round(Math.sin(i * 0.1) * 3000);
  }
  return Buffer.concat([header, pcm]);
}

const TEST_WAV = buildTestWav(16000, 1, 160);
const TEST_WAV_B64 = TEST_WAV.toString('base64');

// ───────────────────────────────────────
//  MOCKS
// ───────────────────────────────────────

// Track mock call state for assertions
const mockPublishTrack = jest.fn().mockResolvedValue(undefined);
const mockUnpublishTrack = jest.fn().mockResolvedValue(undefined);
const mockCaptureFrame = jest.fn().mockResolvedValue(undefined);
const mockRoomConnect = jest.fn().mockResolvedValue(undefined);
const mockRoomDisconnect = jest.fn().mockResolvedValue(undefined);
const mockRoomOn = jest.fn();
const mockRoomOff = jest.fn();
const mockStreamClose = jest.fn();

// Mock axios
jest.unstable_mockModule('axios', () => ({
  default: {
    post: jest.fn(),
  },
}));

// Mock form-data
jest.unstable_mockModule('form-data', () => {
  return {
    default: jest.fn().mockImplementation(() => ({
      append: jest.fn(),
      getHeaders: jest.fn().mockReturnValue({ 'content-type': 'multipart/form-data' }),
    })),
  };
});

// Mock @livekit/rtc-node
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
    // Returns an async iterable that yields 3 frames then stops
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
            if (idx < frames.length) {
              return Promise.resolve({ value: frames[idx++], done: false });
            }
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
  AudioSource: jest.fn().mockImplementation(() => ({
    captureFrame: mockCaptureFrame,
  })),
  AudioFrame: jest.fn().mockImplementation((data, sr, ch, spc) => ({
    data,
    sampleRate: sr,
    channels: ch,
    samplesPerChannel: spc,
  })),
  TrackPublishOptions: jest.fn().mockImplementation((opts) => ({ ...opts })),
  TrackSource: {
    SOURCE_UNKNOWN: 0,
    SOURCE_CAMERA: 1,
    SOURCE_MICROPHONE: 2,
    SOURCE_SCREENSHARE: 3,
    SOURCE_SCREENSHARE_AUDIO: 4,
  },
}));

// Mock livekit-server-sdk
jest.unstable_mockModule('livekit-server-sdk', () => ({
  AccessToken: jest.fn().mockImplementation(() => ({
    addGrant: jest.fn(),
    toJwt: jest.fn().mockResolvedValue('mock-lk-token'),
  })),
  RoomServiceClient: jest.fn().mockImplementation(() => ({
    listRooms: jest.fn().mockResolvedValue([]),
  })),
}));

// Mock mongoose
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
const sarvamService = (await import('../src/services/sarvam.service.js')).default;
const voiceAgentService = (await import('../src/services/voiceAgent.service.js')).default;

// ───────────────────────────────────────
//  TEST SUITE
// ───────────────────────────────────────
describe('Phase 3.2 — Speech Pipeline', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────
  // 1. STT Wrapper
  // ─────────────────────────────────
  describe('SarvamService.speechToText()', () => {
    it('should return transcript from valid WAV buffer', async () => {
      axios.post.mockResolvedValueOnce({
        data: { transcript: 'test transcript', language_code: 'hi-IN' },
      });

      const result = await sarvamService.speechToText(TEST_WAV, { languageCode: 'hi-IN' });

      expect(result.transcript).toBe('test transcript');
      expect(result.languageCode).toBe('hi-IN');
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post.mock.calls[0][0]).toContain('/speech-to-text');
    });

    it('should return empty transcript on API error', async () => {
      axios.post.mockRejectedValueOnce(new Error('Network error'));

      const result = await sarvamService.speechToText(TEST_WAV);

      expect(result.transcript).toBe('');
      expect(result.languageCode).toBeNull();
    });

    it('should return empty transcript on timeout (AbortError)', async () => {
      const abortError = new Error('Aborted');
      abortError.code = 'ECONNABORTED';
      axios.post.mockRejectedValueOnce(abortError);

      const result = await sarvamService.speechToText(TEST_WAV);

      expect(result.transcript).toBe('');
    });
  });

  // ─────────────────────────────────
  // 2. TTS Wrapper
  // ─────────────────────────────────
  describe('SarvamService.textToSpeech()', () => {
    it('should return Buffer from valid text', async () => {
      axios.post.mockResolvedValueOnce({
        data: { audios: [TEST_WAV_B64] },
      });

      const result = await sarvamService.textToSpeech('Hello', { languageCode: 'hi-IN' });

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBe(TEST_WAV.length);
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post.mock.calls[0][0]).toContain('/text-to-speech');
    });

    it('should return null on API error', async () => {
      axios.post.mockRejectedValueOnce(new Error('Server error'));

      const result = await sarvamService.textToSpeech('Hello');

      expect(result).toBeNull();
    });

    it('should return null on timeout', async () => {
      const abortError = new Error('Aborted');
      abortError.code = 'ECONNABORTED';
      axios.post.mockRejectedValueOnce(abortError);

      const result = await sarvamService.textToSpeech('Hello');

      expect(result).toBeNull();
    });

    it('should return null on empty audios array', async () => {
      axios.post.mockResolvedValueOnce({ data: { audios: [] } });

      const result = await sarvamService.textToSpeech('Hello');

      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────
  // 3. Resampling
  // ─────────────────────────────────
  describe('SarvamService.resample()', () => {
    it('should decimate 48kHz → 16kHz (ratio 3)', () => {
      const input = new Int16Array(4800); // 100ms at 48kHz
      for (let i = 0; i < input.length; i++) input[i] = i;

      const output = sarvamService.resample(input, 48000, 16000);

      expect(output.length).toBe(1600); // 4800 / 3
      expect(output[0]).toBe(0);
      expect(output[1]).toBe(3); // every 3rd sample
      expect(output[2]).toBe(6);
    });

    it('should upsample 16kHz → 48kHz (repeat 3x)', () => {
      const input = new Int16Array(1600); // 100ms at 16kHz
      for (let i = 0; i < input.length; i++) input[i] = i * 10;

      const output = sarvamService.resample(input, 16000, 48000);

      expect(output.length).toBe(4800); // 1600 * 3
      // Each sample repeated 3 times
      expect(output[0]).toBe(0);
      expect(output[1]).toBe(0);
      expect(output[2]).toBe(0);
      expect(output[3]).toBe(10);
      expect(output[4]).toBe(10);
      expect(output[5]).toBe(10);
    });

    it('should return same array if rates are equal', () => {
      const input = new Int16Array([100, 200, 300]);
      const output = sarvamService.resample(input, 16000, 16000);

      expect(output).toBe(input); // same reference
    });
  });

  // ─────────────────────────────────
  // 4. Downmix
  // ─────────────────────────────────
  describe('SarvamService.downmixToMono()', () => {
    it('should average stereo channels correctly', () => {
      // Interleaved stereo: [L0, R0, L1, R1, L2, R2]
      const stereo = new Int16Array([1000, 2000, 3000, 4000, 5000, 6000]);

      const mono = sarvamService.downmixToMono(stereo, 2);

      expect(mono.length).toBe(3);
      expect(mono[0]).toBe(1500); // (1000+2000)/2
      expect(mono[1]).toBe(3500); // (3000+4000)/2
      expect(mono[2]).toBe(5500); // (5000+6000)/2
    });

    it('should return same array for mono input', () => {
      const mono = new Int16Array([100, 200, 300]);
      const result = sarvamService.downmixToMono(mono, 1);

      expect(result).toBe(mono); // same reference
    });

    it('should handle 4-channel input', () => {
      // [ch0, ch1, ch2, ch3, ch0, ch1, ch2, ch3]
      const quad = new Int16Array([100, 200, 300, 400, 500, 600, 700, 800]);

      const mono = sarvamService.downmixToMono(quad, 4);

      expect(mono.length).toBe(2);
      expect(mono[0]).toBe(250); // (100+200+300+400)/4
      expect(mono[1]).toBe(650); // (500+600+700+800)/4
    });
  });

  // ─────────────────────────────────
  // 5. WAV Creation + Parsing
  // ─────────────────────────────────
  describe('SarvamService WAV utilities', () => {
    it('createWavBuffer should produce valid 44-byte header', () => {
      const pcm = Buffer.alloc(320); // 160 samples * 2 bytes
      const wav = sarvamService.createWavBuffer(pcm, 16000, 1);

      expect(wav.length).toBe(44 + 320);
      expect(wav.toString('ascii', 0, 4)).toBe('RIFF');
      expect(wav.toString('ascii', 8, 12)).toBe('WAVE');
      expect(wav.readUInt32LE(24)).toBe(16000); // sample rate
      expect(wav.readUInt16LE(22)).toBe(1); // channels
    });

    it('parseWav should extract correct metadata', () => {
      const pcm = Buffer.alloc(320);
      const wav = sarvamService.createWavBuffer(pcm, 22050, 2);
      const parsed = sarvamService.parseWav(wav);

      expect(parsed.sampleRate).toBe(22050);
      expect(parsed.numChannels).toBe(2);
      expect(parsed.bitsPerSample).toBe(16);
      expect(parsed.pcm.length).toBe(320);
    });

    it('roundtrip: create → parse should preserve PCM data', () => {
      const samples = new Int16Array([100, -200, 300, -400]);
      const pcm = Buffer.from(samples.buffer);
      const wav = sarvamService.createWavBuffer(pcm, 16000, 1);
      const parsed = sarvamService.parseWav(wav);

      const recovered = new Int16Array(
        parsed.pcm.buffer, parsed.pcm.byteOffset, parsed.pcm.length / 2
      );
      expect(recovered[0]).toBe(100);
      expect(recovered[1]).toBe(-200);
      expect(recovered[2]).toBe(300);
      expect(recovered[3]).toBe(-400);
    });
  });

  // ─────────────────────────────────
  // 6. speak() lifecycle
  // ─────────────────────────────────
  describe('VoiceAgentService._speak()', () => {
    it('should publish, feed frames, and unpublish track', async () => {
      // Mock TTS to return a small WAV
      axios.post.mockResolvedValueOnce({
        data: { audios: [TEST_WAV_B64] },
      });

      // Shorten delay to speed up test
      const originalDelay = voiceAgentService._delay.bind(voiceAgentService);
      voiceAgentService._delay = jest.fn().mockResolvedValue(undefined);

      const mockRoom = {
        localParticipant: {
          publishTrack: mockPublishTrack,
          unpublishTrack: mockUnpublishTrack,
        },
      };

      await voiceAgentService._speak(mockRoom, 'Test text');

      expect(mockPublishTrack).toHaveBeenCalledTimes(1);
      expect(mockCaptureFrame).toHaveBeenCalled();
      expect(mockUnpublishTrack).toHaveBeenCalledTimes(1);

      // Unpublish called after publish
      const publishOrder = mockPublishTrack.mock.invocationCallOrder[0];
      const unpublishOrder = mockUnpublishTrack.mock.invocationCallOrder[0];
      expect(unpublishOrder).toBeGreaterThan(publishOrder);

      voiceAgentService._delay = originalDelay;
    });

    it('should not crash if TTS returns null', async () => {
      axios.post.mockRejectedValueOnce(new Error('TTS down'));

      const mockRoom = {
        localParticipant: {
          publishTrack: mockPublishTrack,
          unpublishTrack: mockUnpublishTrack,
        },
      };

      // Should not throw
      await expect(
        voiceAgentService._speak(mockRoom, 'Test')
      ).resolves.not.toThrow();

      // No track published since TTS failed
      expect(mockPublishTrack).not.toHaveBeenCalled();
    });

    it('should not stack tracks (only one publish per speak call)', async () => {
      axios.post.mockResolvedValueOnce({
        data: { audios: [TEST_WAV_B64] },
      });

      voiceAgentService._delay = jest.fn().mockResolvedValue(undefined);

      const mockRoom = {
        localParticipant: {
          publishTrack: mockPublishTrack,
          unpublishTrack: mockUnpublishTrack,
        },
      };

      await voiceAgentService._speak(mockRoom, 'One call');

      expect(mockPublishTrack).toHaveBeenCalledTimes(1);
      expect(mockUnpublishTrack).toHaveBeenCalledTimes(1);
    });
  });

  // ─────────────────────────────────
  // 7. listen() — frame capture
  // ─────────────────────────────────
  describe('VoiceAgentService._listen()', () => {
    it('should accumulate frames and return WAV buffer', async () => {
      const mockTrack = { kind: 'audio', sid: 'remote-track-1' };

      const result = await voiceAgentService._listen(mockTrack, 5000);

      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.length).toBeGreaterThan(44); // header + PCM data
      // Verify WAV header
      expect(result.toString('ascii', 0, 4)).toBe('RIFF');
      expect(result.toString('ascii', 8, 12)).toBe('WAVE');
    });

    it('should stop after duration expires', async () => {
      // The mock AudioStream yields only 3 frames, so it finishes quickly.
      // This test verifies it doesn't hang.
      const mockTrack = { kind: 'audio' };
      const startTime = Date.now();

      await voiceAgentService._listen(mockTrack, 100);

      const elapsed = Date.now() - startTime;
      expect(elapsed).toBeLessThan(3000);
    });

    it('should call stream.close() for cleanup', async () => {
      const mockTrack = { kind: 'audio' };

      await voiceAgentService._listen(mockTrack, 5000);

      expect(mockStreamClose).toHaveBeenCalled();
    });

    it('should return null when no frames captured', async () => {
      // Override AudioStream to yield nothing
      const { AudioStream: MockAudioStream } = await import('@livekit/rtc-node');
      MockAudioStream.mockImplementationOnce(() => ({
        [Symbol.asyncIterator]() {
          return {
            next() {
              return Promise.resolve({ value: undefined, done: true });
            },
          };
        },
        close: jest.fn(),
      }));

      const mockTrack = { kind: 'audio' };
      const result = await voiceAgentService._listen(mockTrack, 5000);

      expect(result).toBeNull();
    });
  });

  // ─────────────────────────────────
  // 8. Failure handling
  // ─────────────────────────────────
  describe('Failure handling', () => {
    it('STT failure should not crash server', async () => {
      axios.post.mockRejectedValueOnce(new Error('STT exploded'));

      const result = await sarvamService.speechToText(TEST_WAV);

      expect(result.transcript).toBe('');
      expect(result.languageCode).toBeNull();
    });

    it('TTS failure should not crash server', async () => {
      axios.post.mockRejectedValueOnce(new Error('TTS exploded'));

      const result = await sarvamService.textToSpeech('Hello');

      expect(result).toBeNull();
    });

    it('timeout should trigger abort and return gracefully for STT', async () => {
      const timeoutError = new Error('timeout');
      timeoutError.code = 'ECONNABORTED';
      axios.post.mockRejectedValueOnce(timeoutError);

      const result = await sarvamService.speechToText(TEST_WAV);

      expect(result.transcript).toBe('');
    });

    it('timeout should trigger abort and return null for TTS', async () => {
      const timeoutError = new Error('timeout');
      timeoutError.code = 'ECONNABORTED';
      axios.post.mockRejectedValueOnce(timeoutError);

      const result = await sarvamService.textToSpeech('Hello');

      expect(result).toBeNull();
    });

    it('speak() should survive TTS failure without crashing', async () => {
      axios.post.mockRejectedValueOnce(new Error('TTS down'));

      const mockRoom = {
        localParticipant: {
          publishTrack: jest.fn(),
          unpublishTrack: jest.fn(),
        },
      };

      await expect(
        voiceAgentService._speak(mockRoom, 'Test')
      ).resolves.not.toThrow();
    });

    it('listen() should survive AudioStream error without crashing', async () => {
      const { AudioStream: MockAudioStream } = await import('@livekit/rtc-node');
      MockAudioStream.mockImplementationOnce(() => ({
        [Symbol.asyncIterator]() {
          return {
            next() {
              return Promise.reject(new Error('Stream died'));
            },
          };
        },
        close: jest.fn(),
      }));

      const mockTrack = { kind: 'audio' };

      await expect(
        voiceAgentService._listen(mockTrack, 5000)
      ).resolves.not.toThrow();
    });
  });
});
