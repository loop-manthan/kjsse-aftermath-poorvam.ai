// backend/src/routes/voice.routes.js
// Phase 3.1 — Voice session endpoints (LiveKit infrastructure only)
import express from 'express';
import livekitService from '../services/livekit.service.js';
import voiceAgentService from '../services/voiceAgent.service.js';

const router = express.Router();

/**
 * POST /api/voice/sessions/initiate
 *
 * Creates a LiveKit room, generates a browser simulator token,
 * and starts the Node agent in the background.
 *
 * Body: { roomName?: string, simulatorIdentity?: string }
 * Returns: { roomName, token, livekitUrl, agentIdentity, simulatorIdentity }
 */
router.post('/sessions/initiate', async (req, res) => {
  try {
    const roomName = req.body.roomName || `room-${Date.now()}`;
    const simulatorIdentity = req.body.simulatorIdentity || `simulator-${Date.now()}`;

    // Generate token for the browser simulator
    const simulatorToken = await livekitService.createRoomToken(roomName, simulatorIdentity);

    // Start the Node agent in the background (fire-and-forget)
    voiceAgentService.startVoiceSession(roomName).catch((err) => {
      console.error('[VoiceRoute] Agent failed to start:', err.message);
    });

    res.json({
      roomName,
      token: simulatorToken,
      livekitUrl: process.env.LIVEKIT_URL,
      agentIdentity: 'node-agent',
      simulatorIdentity,
    });
  } catch (error) {
    console.error('[VoiceRoute] Session initiation error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/voice/sessions/:roomName
 *
 * Manually end an agent session (for testing / cleanup).
 */
router.delete('/sessions/:roomName', async (req, res) => {
  try {
    await voiceAgentService.endSession(req.params.roomName);
    res.json({ message: `Session ${req.params.roomName} ended` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/voice/sessions/:roomName/results
 *
 * Poll STT/LLM results for a debug session.
 * Returns: { status: 'running'|'done'|'error', events: [...] }
 */
router.get('/sessions/:roomName/results', (req, res) => {
  const results = voiceAgentService.getSessionResults(req.params.roomName);
  if (!results) {
    return res.json({ status: 'pending', events: [] });
  }
  res.json(results);
});

/**
 * GET /api/voice/status
 *
 * Health check — verifies LiveKit credentials and returns agent session count.
 */
router.get('/status', async (req, res) => {
  try {
    const livekitHealth = await livekitService.healthCheck();
    const activeSessions = voiceAgentService.getActiveSessionCount();

    res.json({
      phase: '3.1',
      livekit: livekitHealth,
      activeSessions,
      env: {
        LIVEKIT_URL: process.env.LIVEKIT_URL ? '✅ set' : '❌ missing',
        LIVEKIT_API_KEY: process.env.LIVEKIT_API_KEY ? '✅ set' : '❌ missing',
        LIVEKIT_API_SECRET: process.env.LIVEKIT_API_SECRET ? '✅ set' : '❌ missing',
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
