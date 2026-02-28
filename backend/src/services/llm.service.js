// backend/src/services/llm.service.js
// Phase 3 — LLM integration (Gemini REST, expandable to other providers)
//
// Usage:
//   import { generateReply } from './llm.service.js';
//   const reply = await generateReply({ systemPrompt, userText });
//
// Never throws. Returns a safe fallback string on any error.

const FALLBACK_REPLY = 'Sorry, I could not generate a response right now.';

/**
 * Generate a single-turn LLM reply.
 * @param {object} params
 * @param {string} params.systemPrompt - System-level instruction
 * @param {string} params.userText     - User's message / transcript
 * @returns {Promise<string>} LLM reply text (never throws)
 */
export async function generateReply({ systemPrompt, userText }) {
  const provider = (process.env.LLM_PROVIDER || '').toLowerCase();

  if (provider === 'gemini') {
    return _gemini(systemPrompt, userText);
  }

  console.error(`[LLM] Unknown provider: "${provider}". Set LLM_PROVIDER=gemini in .env`);
  return FALLBACK_REPLY;
}

// ───────────────────────────────────────
//  Gemini REST (generativelanguage.googleapis.com)
// ───────────────────────────────────────

async function _gemini(systemPrompt, userText) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash';
  const timeoutMs = parseInt(process.env.LLM_TIMEOUT_MS, 10) || 10_000;

  if (!apiKey) {
    console.error('[LLM] GEMINI_API_KEY is not set.');
    return FALLBACK_REPLY;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userText }],
      },
    ],
    generationConfig: {
      maxOutputTokens: 256,
      temperature: 0.7,
    },
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`[LLM] Gemini HTTP ${res.status}: ${errBody.slice(0, 200)}`);
      return FALLBACK_REPLY;
    }

    const data = await res.json();

    // Extract text from candidates[0].content.parts[].text
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) {
      console.error('[LLM] Gemini returned no content parts.');
      return FALLBACK_REPLY;
    }

    const reply = parts.map((p) => p.text || '').join('');
    if (!reply.trim()) {
      console.error('[LLM] Gemini returned empty text.');
      return FALLBACK_REPLY;
    }

    return reply.trim();
  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`[LLM] Gemini timed out after ${timeoutMs}ms`);
    } else {
      console.error('[LLM] Gemini request failed:', err.message);
    }
    return FALLBACK_REPLY;
  } finally {
    clearTimeout(timer);
  }
}
