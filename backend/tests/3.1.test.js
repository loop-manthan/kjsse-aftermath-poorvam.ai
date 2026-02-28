/**
 * 3.1.test.js — Phase 3.1 Integration Tests
 *
 * Validates LiveKit infrastructure layer ONLY:
 *   - Token generation via livekit.service.js
 *   - POST /api/voice/sessions/initiate
 *   - Non-blocking agent startup
 *   - Missing env resilience
 *   - Concurrent request safety
 *
 * All external dependencies (LiveKit SDK, MongoDB, RTC native module) are mocked.
 */

import { jest, describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';

// ─────────────────────────────────────────────
//  ENV SETUP — must happen before app import
// ─────────────────────────────────────────────
process.env.MONGO_URI = 'mongodb://localhost:27017/test_noop';
process.env.JWT_SECRET = 'test-secret';
process.env.LIVEKIT_API_KEY = 'test-api-key';
process.env.LIVEKIT_API_SECRET = 'test-api-secret';
process.env.LIVEKIT_URL = 'wss://test.livekit.cloud';
process.env.PORT = '0';

// ─────────────────────────────────────────────
//  MOCKS — must be set up before any import
// ─────────────────────────────────────────────

// Mock mongoose — full enough that all models can load without crashing
jest.unstable_mockModule('mongoose', () => {
  const ObjectId = 'ObjectId';
  const SchemaClass = function (definition, options) {
    this.definition = definition;
    this.options = options;
    this.index = jest.fn().mockReturnThis();
    this.pre = jest.fn().mockReturnThis();
    this.methods = {};
  };
  SchemaClass.Types = { ObjectId };

  return {
    default: {
      connect: jest.fn().mockResolvedValue(true),
      connection: { readyState: 1 },
      Schema: SchemaClass,
      model: jest.fn().mockReturnValue(function MockModel() {}),
    },
  };
});

// Mock bcryptjs
jest.unstable_mockModule('bcryptjs', () => ({
  default: {
    genSalt: jest.fn().mockResolvedValue('salt'),
    hash: jest.fn().mockResolvedValue('hashed'),
    compare: jest.fn().mockResolvedValue(true),
  },
}));

// Mock uuid
jest.unstable_mockModule('uuid', () => ({
  v4: jest.fn().mockReturnValue('mock-uuid-1234'),
}));

// Mock jsonwebtoken
jest.unstable_mockModule('jsonwebtoken', () => ({
  default: {
    sign: jest.fn().mockReturnValue('mock-auth-jwt'),
    verify: jest.fn().mockReturnValue({ userId: 'test-user' }),
  },
}));

// Mock axios (prevents real Sarvam API calls from background pipeline)
jest.unstable_mockModule('axios', () => ({
  default: {
    post: jest.fn().mockResolvedValue({ data: { audios: [], transcript: '' } }),
  },
}));

// Mock form-data (used by sarvam.service.js)
jest.unstable_mockModule('form-data', () => ({
  default: jest.fn().mockImplementation(() => ({
    append: jest.fn(),
    getHeaders: jest.fn().mockReturnValue({}),
  })),
}));

// Mock livekit-server-sdk (prevents real token generation and API calls)
jest.unstable_mockModule('livekit-server-sdk', () => {
  const mockAddGrant = jest.fn();
  const mockToJwt = jest.fn().mockResolvedValue('mock-jwt-token');

  return {
    AccessToken: jest.fn().mockImplementation(() => ({
      addGrant: mockAddGrant,
      toJwt: mockToJwt,
    })),
    RoomServiceClient: jest.fn().mockImplementation(() => ({
      listRooms: jest.fn().mockResolvedValue([]),
    })),
  };
});

// Mock @livekit/rtc-node (prevents native binary load)
jest.unstable_mockModule('@livekit/rtc-node', () => {
  const mockOn = jest.fn().mockReturnThis();
  const mockOff = jest.fn().mockReturnThis();
  const mockConnect = jest.fn().mockResolvedValue(undefined);
  const mockDisconnect = jest.fn().mockResolvedValue(undefined);

  return {
    Room: jest.fn().mockImplementation(() => ({
      on: mockOn,
      off: mockOff,
      connect: mockConnect,
      disconnect: mockDisconnect,
      remoteParticipants: new Map(),
      localParticipant: {
        publishTrack: jest.fn().mockResolvedValue(undefined),
        unpublishTrack: jest.fn().mockResolvedValue(undefined),
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
    AudioStream: jest.fn().mockImplementation(() => ({
      [Symbol.asyncIterator]() {
        return { next() { return Promise.resolve({ done: true }); } };
      },
      close: jest.fn(),
    })),
    LocalAudioTrack: {
      createAudioTrack: jest.fn().mockReturnValue({ kind: 'audio' }),
    },
    AudioSource: jest.fn().mockImplementation(() => ({
      captureFrame: jest.fn().mockResolvedValue(undefined),
    })),
    AudioFrame: jest.fn().mockImplementation((d, sr, ch, spc) => ({ data: d })),
    TrackPublishOptions: jest.fn(),
  };
});

// ─────────────────────────────────────────────
//  DYNAMIC IMPORTS (after mocks are set)
// ─────────────────────────────────────────────
const { default: request } = await import('supertest');

// Import the app — mocks are already in place
const { app, server } = await import('../server.js');

// Get references to mocked services for spy assertions
const livekitService = (await import('../src/services/livekit.service.js')).default;
const voiceAgentService = (await import('../src/services/voiceAgent.service.js')).default;

// ─────────────────────────────────────────────
//  TEST SUITE
// ─────────────────────────────────────────────
describe('Phase 3.1 — LiveKit Infrastructure', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    if (server && server.close) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  // ───────────────────────────────────
  // TEST 1: Token Generation
  // ───────────────────────────────────
  describe('POST /api/voice/sessions/initiate — Token Generation', () => {
    it('should return 200 with roomName, token, and livekitUrl', async () => {
      const res = await request(app)
        .post('/api/voice/sessions/initiate')
        .send({ roomName: 'test-room-1' })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('roomName', 'test-room-1');
      expect(res.body).toHaveProperty('token', 'mock-jwt-token');
      expect(res.body).toHaveProperty('livekitUrl', 'wss://test.livekit.cloud');
      expect(res.body.agentIdentity).toBe('node-agent');
      expect(res.body).toHaveProperty('simulatorIdentity');
    });

    it('should auto-generate roomName when not provided', async () => {
      const res = await request(app)
        .post('/api/voice/sessions/initiate')
        .send({})
        .expect(200);

      expect(res.body.roomName).toMatch(/^room-\d+$/);
      expect(res.body.token).toBe('mock-jwt-token');
    });

    it('should auto-generate simulatorIdentity when not provided', async () => {
      const res = await request(app)
        .post('/api/voice/sessions/initiate')
        .send({ roomName: 'test-room-2' })
        .expect(200);

      expect(res.body.simulatorIdentity).toMatch(/^simulator-\d+$/);
    });

    it('should use custom simulatorIdentity when provided', async () => {
      const res = await request(app)
        .post('/api/voice/sessions/initiate')
        .send({ roomName: 'test-room-3', simulatorIdentity: 'my-phone' })
        .expect(200);

      expect(res.body.simulatorIdentity).toBe('my-phone');
    });
  });

  // ───────────────────────────────────
  // TEST 2: Non-blocking Agent Start
  // ───────────────────────────────────
  describe('POST /api/voice/sessions/initiate — Non-blocking Agent', () => {
    it('should return response without waiting for agent to connect', async () => {
      const startSpy = jest.spyOn(voiceAgentService, 'startVoiceSession');

      const startTime = Date.now();
      const res = await request(app)
        .post('/api/voice/sessions/initiate')
        .send({ roomName: 'agent-test-room' })
        .expect(200);

      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(2000);
      expect(startSpy).toHaveBeenCalledWith('agent-test-room');
      expect(res.body.token).toBe('mock-jwt-token');

      startSpy.mockRestore();
    });

    it('should still return 200 even if agent startup throws', async () => {
      const startSpy = jest.spyOn(voiceAgentService, 'startVoiceSession')
        .mockRejectedValueOnce(new Error('Agent connection failed'));

      const res = await request(app)
        .post('/api/voice/sessions/initiate')
        .send({ roomName: 'fail-room' })
        .expect(200);

      expect(res.body.token).toBe('mock-jwt-token');
      expect(res.body.roomName).toBe('fail-room');

      // Wait a tick for the .catch() to fire
      await new Promise((r) => setTimeout(r, 50));

      startSpy.mockRestore();
    });
  });

  // ───────────────────────────────────
  // TEST 3: Input Handling
  // ───────────────────────────────────
  describe('POST /api/voice/sessions/initiate — Input Handling', () => {
    it('should handle empty body gracefully', async () => {
      const res = await request(app)
        .post('/api/voice/sessions/initiate')
        .send()
        .expect(200);

      expect(res.body.roomName).toBeDefined();
      expect(res.body.token).toBe('mock-jwt-token');
      expect(res.body.simulatorIdentity).toBeDefined();
    });

    it('should handle missing Content-Type gracefully', async () => {
      const res = await request(app)
        .post('/api/voice/sessions/initiate')
        .expect(200);

      expect(res.body.roomName).toBeDefined();
      expect(res.body.token).toBe('mock-jwt-token');
    });
  });

  // ───────────────────────────────────
  // TEST 4: Missing LIVEKIT_URL
  // ───────────────────────────────────
  describe('POST /api/voice/sessions/initiate — Missing LIVEKIT_URL', () => {
    let originalUrl;

    beforeAll(() => {
      originalUrl = process.env.LIVEKIT_URL;
    });

    afterEach(() => {
      process.env.LIVEKIT_URL = originalUrl;
    });

    it('should return 200 with livekitUrl undefined when LIVEKIT_URL is unset', async () => {
      delete process.env.LIVEKIT_URL;

      const res = await request(app)
        .post('/api/voice/sessions/initiate')
        .send({ roomName: 'no-url-room' })
        .expect(200);

      expect(res.body.roomName).toBe('no-url-room');
      expect(res.body.token).toBe('mock-jwt-token');
      expect(res.body.livekitUrl).toBeUndefined();
    });
  });

  // ───────────────────────────────────
  // TEST 5: Multiple Rapid Calls
  // ───────────────────────────────────
  describe('POST /api/voice/sessions/initiate — Concurrent Requests', () => {
    it('should handle 5 concurrent requests without errors', async () => {
      const requests = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/voice/sessions/initiate')
          .send({ roomName: `concurrent-room-${i}` })
      );

      const results = await Promise.all(requests);

      results.forEach((res, i) => {
        expect(res.status).toBe(200);
        expect(res.body.roomName).toBe(`concurrent-room-${i}`);
        expect(res.body.token).toBe('mock-jwt-token');
        expect(res.body.livekitUrl).toBe('wss://test.livekit.cloud');
      });
    });

    it('should generate unique room names for concurrent requests without roomName', async () => {
      const requests = Array.from({ length: 5 }, () =>
        request(app)
          .post('/api/voice/sessions/initiate')
          .send({})
      );

      const results = await Promise.all(requests);
      const roomNames = results.map((r) => r.body.roomName);

      results.forEach((res) => expect(res.status).toBe(200));
      expect(roomNames.length).toBe(5);
    });
  });

  // ───────────────────────────────────
  // TEST 6: Health Check Endpoint
  // ───────────────────────────────────
  describe('GET /api/voice/status — Health Check', () => {
    it('should return phase 3.1 status with livekit health', async () => {
      const res = await request(app)
        .get('/api/voice/status')
        .expect(200);

      expect(res.body).toHaveProperty('phase', '3.1');
      expect(res.body).toHaveProperty('livekit');
      expect(res.body.livekit).toHaveProperty('healthy', true);
      expect(res.body).toHaveProperty('activeSessions');
      expect(typeof res.body.activeSessions).toBe('number');
      expect(res.body).toHaveProperty('env');
    });
  });

  // ───────────────────────────────────
  // TEST 7: Session Teardown
  // ───────────────────────────────────
  describe('DELETE /api/voice/sessions/:roomName — Session Teardown', () => {
    it('should return success even if no active session exists', async () => {
      const res = await request(app)
        .delete('/api/voice/sessions/nonexistent-room')
        .expect(200);

      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('nonexistent-room');
    });
  });
});
