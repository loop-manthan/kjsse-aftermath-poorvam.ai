// backend/src/services/livekit.service.js
// Phase 3.1 — Token generation and room management via livekit-server-sdk
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';

class LiveKitService {
  constructor() {
    this._validateEnv();
    this.roomService = new RoomServiceClient(
      this._httpUrl(),
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET
    );
  }

  _validateEnv() {
    const required = ['LIVEKIT_API_KEY', 'LIVEKIT_API_SECRET', 'LIVEKIT_URL'];
    const missing = required.filter((k) => !process.env[k]);
    if (missing.length > 0) {
      throw new Error(`[LiveKit] Missing environment variables: ${missing.join(', ')}`);
    }
  }

  // Convert wss:// to https:// for REST API calls
  _httpUrl() {
    return process.env.LIVEKIT_URL.replace('wss://', 'https://');
  }

  /**
   * Generate a JWT access token for a participant to join a LiveKit room.
   * @param {string} roomName - Name of the room to join
   * @param {string} identity - Unique identity for the participant
   * @param {object} [options] - Optional overrides
   * @param {boolean} [options.canPublish=true]
   * @param {boolean} [options.canSubscribe=true]
   * @returns {Promise<string>} JWT token string
   */
  async createRoomToken(roomName, identity, options = {}) {
    if (!roomName || !identity) {
      throw new Error('[LiveKit] roomName and identity are required for token generation');
    }

    const at = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity,
        ttl: '1h', // 1-hour token TTL — safe for hackathon demo
      }
    );

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: options.canPublish !== false,
      canSubscribe: options.canSubscribe !== false,
    });

    return await at.toJwt();
  }

  /**
   * List active rooms (for health check / debugging).
   * @returns {Promise<Array>} Array of room objects
   */
  async listRooms() {
    try {
      return await this.roomService.listRooms();
    } catch (err) {
      console.error('[LiveKit] Failed to list rooms:', err.message);
      return [];
    }
  }

  /**
   * Health check — verifies credentials by attempting to list rooms.
   * @returns {Promise<{healthy: boolean, error?: string}>}
   */
  async healthCheck() {
    try {
      await this.roomService.listRooms();
      return { healthy: true };
    } catch (err) {
      return { healthy: false, error: err.message };
    }
  }
}

export default new LiveKitService();
