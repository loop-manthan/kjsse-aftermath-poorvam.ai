// backend/src/routes/twilio.routes.js
// Twilio Voice IVR Bridge — connects inbound phone calls to the AI core engine.
//
// Routes:
//   POST /twilio/voice          — IVR entry: language selection menu via <Gather>
//   POST /twilio/set-language   — Processes DTMF digit, calls LLM, returns <Say>
//   GET  /twilio/health         — Health check

import express from 'express';
import twilio from 'twilio';
import { generateReply } from '../services/llm.service.js';

const router = express.Router();
const VoiceResponse = twilio.twiml.VoiceResponse;

// ---------------------------------------------------------------------------
// Language mapping: DTMF digit -> internal language code + display name
// Matches LANG_CONFIG keys in voiceAgent.service.js
// ---------------------------------------------------------------------------

const LANGUAGE_MAP = {
  '1': { code: 'hi-IN', name: 'hindi',    label: 'Hindi' },
  '2': { code: 'gu-IN', name: 'gujarati', label: 'Gujarati' },
  '3': { code: 'mr-IN', name: 'marathi',  label: 'Marathi' },
};

// System prompt used for the Twilio demo flow (single-turn greeting)
const TWILIO_SYSTEM_PROMPT = (lang) => `
You are Poorvam, an AI assistant for blue-collar workers in India.
The user just called on a phone. Greet them warmly in ${lang}.
Ask them what kind of job they are looking for.
Keep the response under 3 sentences, spoken naturally.
Respond ONLY in ${lang}. Do not use English.
`.trim();

// ---------------------------------------------------------------------------
// POST /twilio/voice
// Entry point — Twilio calls this when a user dials the number.
// Presents a language selection IVR menu using <Gather>.
// ---------------------------------------------------------------------------

router.post('/voice', (req, res) => {
  const twiml = new VoiceResponse();

  // <Gather> collects a single DTMF digit and forwards to /twilio/set-language
  const gather = twiml.gather({
    numDigits: 1,
    action: '/twilio/set-language',
    method: 'POST',
    timeout: 10,
  });

  gather.say(
    { voice: 'Polly.Aditi', language: 'hi-IN' },
    'Namaste. Poorvam mein aapka swaagat hai. ' +
    'Hindi ke liye 1 dabaiye. ' +
    'Gujarati ke liye 2 dabaiye. ' +
    'Marathi ke liye 3 dabaiye.'
  );

  // If the caller does not press anything within timeout, repeat the menu
  twiml.redirect('/twilio/voice');

  res.set('Content-Type', 'text/xml');
  res.send(twiml.toString());
});

// ---------------------------------------------------------------------------
// POST /twilio/set-language
// Called by <Gather> after the caller presses a digit.
// Maps the digit to a language, calls the LLM directly, and reads the
// AI-generated response back to the caller via <Say>.
// ---------------------------------------------------------------------------

router.post('/set-language', async (req, res) => {
  const twiml = new VoiceResponse();
  const digit = req.body.Digits;

  console.log(`[Twilio IVR] Received digit: ${digit}`);

  // Validate the digit
  const langEntry = LANGUAGE_MAP[digit];

  if (!langEntry) {
    console.log(`[Twilio IVR] Invalid digit: ${digit}`);
    twiml.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      'Galat chunav. Kripya dobara prayaas karein.'
    );
    twiml.redirect('/twilio/voice');
    res.set('Content-Type', 'text/xml');
    return res.send(twiml.toString());
  }

  console.log(`[Twilio IVR] Language selected: ${langEntry.label} (${langEntry.code})`);

  try {
    // Call the LLM directly — no HTTP self-call needed
    const systemPrompt = TWILIO_SYSTEM_PROMPT(langEntry.label);
    const userText = `User selected ${langEntry.label} language on the phone.`;

    console.log('[Twilio IVR] Calling LLM...');
    const aiReply = await generateReply({ systemPrompt, userText });
    console.log(`[Twilio IVR] LLM reply: ${aiReply}`);

    const message = aiReply || 'AI response not available at this time.';

    // Read the AI response back to the caller
    twiml.say(
      { voice: 'Polly.Aditi', language: langEntry.code },
      message
    );

    // Closing message
    twiml.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      'Dhanyavaad. Poorvam ka upyog karne ke liye shukriya. Call samaapt ho rahi hai.'
    );
  } catch (error) {
    console.error('[Twilio IVR] LLM error:', error.message);
    twiml.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      'Maaf kijiye, AI seva uplabdh nahi hai. Kripya baad mein prayaas karein.'
    );
  }

  res.set('Content-Type', 'text/xml');
  res.send(twiml.toString());
});

// ---------------------------------------------------------------------------
// GET /twilio/health
// Quick health check to verify the Twilio bridge is mounted.
// ---------------------------------------------------------------------------

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'twilio-ivr-bridge',
    routes: ['/twilio/voice', '/twilio/set-language'],
    languages: Object.entries(LANGUAGE_MAP).map(
      ([digit, lang]) => `${digit} → ${lang.label}`
    ),
  });
});

export default router;
