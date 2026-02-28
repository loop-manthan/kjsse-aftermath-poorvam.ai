// backend/src/services/sarvam.service.js
// Phase 3.2 — Sarvam AI integration: STT + TTS + audio encoding utilities
//
// STT: POST https://api.sarvam.ai/speech-to-text (multipart/form-data)
// TTS: POST https://api.sarvam.ai/text-to-speech (application/json)
// Auth: api-subscription-key header

import axios from 'axios';
import FormData from 'form-data';

const SARVAM_BASE = 'https://api.sarvam.ai';
const API_TIMEOUT_MS = 10_000;

class SarvamService {
  constructor() {
    this._apiKey = process.env.SARVAM_API_KEY;
    if (!this._apiKey) {
      console.warn('[Sarvam] SARVAM_API_KEY not set. STT/TTS calls will fail.');
    }
  }

  // ─────────────────────────────────────
  //  STT — Speech to Text
  // ─────────────────────────────────────

  /**
   * Send a WAV buffer to Sarvam STT and return the transcript.
   * @param {Buffer} wavBuffer - Complete WAV file (44-byte header + PCM data)
   * @param {object} [options]
   * @param {string} [options.languageCode='hi-IN']
   * @param {string} [options.model='saaras:v3']
   * @returns {Promise<{transcript: string, languageCode: string|null}>}
   */
  async speechToText(wavBuffer, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const form = new FormData();
      form.append('file', wavBuffer, {
        filename: 'audio.wav',
        contentType: 'audio/wav',
      });
      if (options.model || 'saaras:v3') {
        form.append('model', options.model || 'saaras:v3');
      }
      if (options.languageCode) {
        form.append('language_code', options.languageCode);
      }

      const res = await axios.post(`${SARVAM_BASE}/speech-to-text`, form, {
        headers: {
          ...form.getHeaders(),
          'api-subscription-key': this._apiKey,
        },
        signal: controller.signal,
        timeout: API_TIMEOUT_MS,
      });

      return {
        transcript: res.data.transcript || '',
        languageCode: res.data.language_code || null,
      };
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ECONNABORTED') {
        console.error('[Sarvam] STT timed out after', API_TIMEOUT_MS, 'ms');
      } else {
        console.error('[Sarvam] STT failed:', err.response?.data || err.message);
      }
      return { transcript: '', languageCode: null };
    } finally {
      clearTimeout(timeout);
    }
  }

  // ─────────────────────────────────────
  //  TTS — Text to Speech
  // ─────────────────────────────────────

  /**
   * Convert text to speech via Sarvam TTS. Returns raw WAV buffer.
   * @param {string} text - Text to speak (max 2500 chars for v3)
   * @param {object} [options]
   * @param {string} [options.languageCode='hi-IN']
   * @param {string} [options.speaker='Shubh']
   * @param {number} [options.sampleRate=16000]
   * @returns {Promise<Buffer|null>} WAV buffer or null on failure
   */
  async textToSpeech(text, options = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

    try {
      const res = await axios.post(
        `${SARVAM_BASE}/text-to-speech`,
        {
          text,
          target_language_code: options.languageCode || 'hi-IN',
          model: 'bulbul:v3',
          speaker: options.speaker || 'shubh',
          speech_sample_rate: options.sampleRate || 16000,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'api-subscription-key': this._apiKey,
          },
          signal: controller.signal,
          timeout: API_TIMEOUT_MS,
        }
      );

      if (!res.data.audios || !res.data.audios[0]) {
        console.error('[Sarvam] TTS returned empty audios array');
        return null;
      }

      // Decode base64 WAV
      return Buffer.from(res.data.audios[0], 'base64');
    } catch (err) {
      if (err.name === 'AbortError' || err.code === 'ECONNABORTED') {
        console.error('[Sarvam] TTS timed out after', API_TIMEOUT_MS, 'ms');
      } else {
        console.error('[Sarvam] TTS failed:', err.response?.data || err.message);
      }
      return null;
    } finally {
      clearTimeout(timeout);
    }
  }

  // ─────────────────────────────────────
  //  Audio Utilities
  // ─────────────────────────────────────

  /**
   * Build a WAV file buffer from raw PCM Int16 samples.
   * @param {Buffer} pcmBuffer - Raw PCM data (16-bit signed, little-endian)
   * @param {number} sampleRate - e.g. 16000
   * @param {number} numChannels - e.g. 1
   * @returns {Buffer} Complete WAV file
   */
  createWavBuffer(pcmBuffer, sampleRate = 16000, numChannels = 1) {
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * (bitsPerSample / 8);
    const blockAlign = numChannels * (bitsPerSample / 8);
    const dataSize = pcmBuffer.length;
    const headerSize = 44;

    const header = Buffer.alloc(headerSize);
    header.write('RIFF', 0);
    header.writeUInt32LE(dataSize + headerSize - 8, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);             // PCM format chunk size
    header.writeUInt16LE(1, 20);              // PCM format
    header.writeUInt16LE(numChannels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(dataSize, 40);

    return Buffer.concat([header, pcmBuffer]);
  }

  /**
   * Downmix multi-channel PCM to mono.
   * Input: Int16Array with interleaved channels.
   * @param {Int16Array} samples - Interleaved PCM samples
   * @param {number} numChannels
   * @returns {Int16Array} Mono samples
   */
  downmixToMono(samples, numChannels) {
    if (numChannels === 1) return samples;

    const monoLength = Math.floor(samples.length / numChannels);
    const mono = new Int16Array(monoLength);

    for (let i = 0; i < monoLength; i++) {
      let sum = 0;
      for (let ch = 0; ch < numChannels; ch++) {
        sum += samples[i * numChannels + ch];
      }
      mono[i] = Math.round(sum / numChannels);
    }

    return mono;
  }

  /**
   * Resample by integer ratio (decimation for downsampling, repetition for upsampling).
   * @param {Int16Array} samples - Input samples
   * @param {number} fromRate - e.g. 48000
   * @param {number} toRate - e.g. 16000
   * @returns {Int16Array} Resampled output
   */
  resample(samples, fromRate, toRate) {
    if (fromRate === toRate) return samples;

    const ratio = fromRate / toRate;

    if (ratio > 1 && Number.isInteger(ratio)) {
      // Decimation (e.g. 48000 → 16000, ratio = 3)
      const outLength = Math.floor(samples.length / ratio);
      const out = new Int16Array(outLength);
      for (let i = 0; i < outLength; i++) {
        out[i] = samples[i * ratio];
      }
      return out;
    }

    if (ratio < 1) {
      // Upsampling (e.g. 16000 → 48000, repeat each sample)
      const repeatFactor = Math.round(toRate / fromRate);
      const out = new Int16Array(samples.length * repeatFactor);
      for (let i = 0; i < samples.length; i++) {
        for (let j = 0; j < repeatFactor; j++) {
          out[i * repeatFactor + j] = samples[i];
        }
      }
      return out;
    }

    // Non-integer ratio — linear interpolation fallback
    const outLength = Math.round(samples.length / ratio);
    const out = new Int16Array(outLength);
    for (let i = 0; i < outLength; i++) {
      const srcIdx = i * ratio;
      const lo = Math.floor(srcIdx);
      const hi = Math.min(lo + 1, samples.length - 1);
      const frac = srcIdx - lo;
      out[i] = Math.round(samples[lo] * (1 - frac) + samples[hi] * frac);
    }
    return out;
  }

  /**
   * Extract PCM data and metadata from a WAV buffer.
   * @param {Buffer} wavBuffer
   * @returns {{pcm: Buffer, sampleRate: number, numChannels: number, bitsPerSample: number}}
   */
  parseWav(wavBuffer) {
    const sampleRate = wavBuffer.readUInt32LE(24);
    const numChannels = wavBuffer.readUInt16LE(22);
    const bitsPerSample = wavBuffer.readUInt16LE(34);

    // Find 'data' chunk (usually at byte 36, but be safe)
    let dataOffset = 44;
    for (let i = 36; i < Math.min(wavBuffer.length - 4, 100); i++) {
      if (wavBuffer.toString('ascii', i, i + 4) === 'data') {
        dataOffset = i + 8; // skip 'data' + 4-byte size
        break;
      }
    }

    return {
      pcm: wavBuffer.subarray(dataOffset),
      sampleRate,
      numChannels,
      bitsPerSample,
    };
  }
}

export default new SarvamService();
