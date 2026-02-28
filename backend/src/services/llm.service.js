// backend/src/services/llm.service.js
// Phase 3 — LLM integration (HuggingFace + Gemini, expandable)
//
// Usage:
//   import { generateReply } from './llm.service.js';
//   const reply = await generateReply({ systemPrompt, userText });
//
// Never throws. Returns a safe fallback string on any error.
//
// .env:
//   LLM_PROVIDER=huggingface   (or 'gemini')
//   HUGGING_FACE_API=hf_xxx
//   HF_LLM_MODEL=https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.2

const FALLBACK_REPLY = 'Maaf kijiye, abhi response generate nahi ho pa raha. Kripya dobara try karein.';

/**
 * Generate a single-turn LLM reply.
 * @param {object} params
 * @param {string} params.systemPrompt - System-level instruction
 * @param {string} params.userText     - User's message / transcript
 * @returns {Promise<string>} LLM reply text (never throws)
 */
export async function generateReply({ systemPrompt, userText }) {
  const provider = (process.env.LLM_PROVIDER || 'sarvam').toLowerCase();

  if (provider === 'sarvam') {
    return _sarvam(systemPrompt, userText);
  }

  if (provider === 'huggingface' || provider === 'hf') {
    return _huggingface(systemPrompt, userText);
  }

  if (provider === 'gemini') {
    return _gemini(systemPrompt, userText);
  }

  console.error(`[LLM] Unknown provider: "${provider}". Set LLM_PROVIDER=sarvam|gemini|huggingface`);
  return FALLBACK_REPLY;
}

// ───────────────────────────────────────
//  Sarvam Chat API (OpenAI-compatible)
// ───────────────────────────────────────

async function _sarvam(systemPrompt, userText) {
  const apiKey = process.env.SARVAM_API_KEY;
  // Use chat completions endpoint (OpenAI-compatible)
  const url = 'https://api.sarvam.ai/v1/chat/completions';
  const model = process.env.SARVAM_CHAT_MODEL || 'sarvam-m';
  const timeoutMs = parseInt(process.env.LLM_TIMEOUT_MS, 10) || 15_000;

  if (!apiKey) {
    console.error('[LLM] SARVAM_API_KEY is not set.');
    return FALLBACK_REPLY;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userText },
        ],
        max_tokens: 200,
        temperature: 0.7,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`[LLM] Sarvam HTTP ${res.status}: ${errBody.slice(0, 300)}`);
      return FALLBACK_REPLY;
    }

    const data = await res.json();
    const reply = data?.choices?.[0]?.message?.content?.trim();

    if (!reply) {
      console.error('[LLM] Sarvam returned empty reply:', JSON.stringify(data).slice(0, 200));
      return FALLBACK_REPLY;
    }

    console.log(`[LLM] Sarvam reply: "${reply.slice(0, 80)}"`);
    return reply;

  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`[LLM] Sarvam timed out after ${timeoutMs}ms`);
    } else {
      console.error('[LLM] Sarvam request failed:', err.message);
    }
    return FALLBACK_REPLY;
  } finally {
    clearTimeout(timer);
  }
}


// ───────────────────────────────────────
//  HuggingFace Inference API (Mistral/any chat model)
// ───────────────────────────────────────

async function _huggingface(systemPrompt, userText) {
  const apiKey = process.env.HUGGING_FACE_API;
  const modelUrl = process.env.HF_LLM_MODEL ||
    'https://router.huggingface.co/hf-inference/models/mistralai/Mistral-7B-Instruct-v0.2';
  const timeoutMs = parseInt(process.env.LLM_TIMEOUT_MS, 10) || 15_000;

  if (!apiKey) {
    console.error('[LLM] HUGGING_FACE_API is not set in .env');
    return FALLBACK_REPLY;
  }

  // Build the prompt in Mistral instruction format
  // <s>[INST] system\n\nuser [/INST]
  const prompt = `<s>[INST] ${systemPrompt}\n\n${userText} [/INST]`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(modelUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.7,
          top_p: 0.9,
          do_sample: true,
          return_full_text: false,
        },
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => '');
      console.error(`[LLM] HuggingFace HTTP ${res.status}: ${errBody.slice(0, 300)}`);
      return FALLBACK_REPLY;
    }

    const data = await res.json();

    // HF inference returns [{ generated_text: "..." }]
    let reply = '';
    if (Array.isArray(data) && data[0]?.generated_text) {
      reply = data[0].generated_text;
    } else if (typeof data?.generated_text === 'string') {
      reply = data.generated_text;
    } else {
      console.error('[LLM] HuggingFace unexpected response shape:', JSON.stringify(data).slice(0, 200));
      return FALLBACK_REPLY;
    }

    // Strip any leftover [INST] / [/INST] artifacts if return_full_text leaked
    reply = reply.replace(/\[INST\].*?\[\/INST\]/gs, '').trim();

    if (!reply) {
      console.error('[LLM] HuggingFace returned empty reply.');
      return FALLBACK_REPLY;
    }

    console.log(`[LLM] HuggingFace reply (${reply.length} chars): "${reply.slice(0, 80)}..."`);
    return reply;

  } catch (err) {
    if (err.name === 'AbortError') {
      console.error(`[LLM] HuggingFace timed out after ${timeoutMs}ms`);
    } else {
      console.error('[LLM] HuggingFace request failed:', err.message);
    }
    return FALLBACK_REPLY;
  } finally {
    clearTimeout(timer);
  }
}

// ───────────────────────────────────────
//  Gemini REST (generativelanguage.googleapis.com)
// ───────────────────────────────────────

async function _gemini(systemPrompt, userText) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-1.5-flash-latest';
  const timeoutMs = parseInt(process.env.LLM_TIMEOUT_MS, 10) || 10_000;

  if (!apiKey) {
    console.error('[LLM] GEMINI_API_KEY is not set.');
    return FALLBACK_REPLY;
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userText }] }],
    generationConfig: { maxOutputTokens: 256, temperature: 0.7 },
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
    const parts = data?.candidates?.[0]?.content?.parts;
    if (!parts || parts.length === 0) {
      console.error('[LLM] Gemini returned no content parts.');
      return FALLBACK_REPLY;
    }

    const reply = parts.map((p) => p.text || '').join('').trim();
    if (!reply) {
      console.error('[LLM] Gemini returned empty text.');
      return FALLBACK_REPLY;
    }

    return reply;
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
