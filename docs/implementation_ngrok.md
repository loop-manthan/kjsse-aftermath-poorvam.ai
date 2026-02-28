# Twilio Voice IVR Integration via ngrok

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Dependencies](#2-dependencies)
3. [ngrok Setup](#3-ngrok-setup)
4. [Express Implementation](#4-express-implementation)
5. [Call Flow Explanation](#5-call-flow-explanation)
6. [Demo Safety Checklist](#6-demo-safety-checklist)
7. [Troubleshooting](#7-troubleshooting)
8. [Future Improvements](#8-future-improvements)

---

## 1. Project Overview

### Architecture

This integration adds a Twilio Voice IVR layer on top of the existing Poorvam.ai
voice processing backend. Twilio acts strictly as a **transport layer** -- it
receives phone calls, collects user input via DTMF tones, and reads back
AI-generated responses using text-to-speech. All intelligence remains in the
existing backend.

### Architecture Diagram

```
+------------------+         +------------------+         +--------------------+
|                  |  PSTN   |                  |  HTTPS  |                    |
|   Caller Phone   +-------->+   Twilio Cloud   +-------->+   ngrok Tunnel     |
|                  |         |                  |         |   (public URL)     |
+------------------+         +--------+---------+         +---------+----------+
                                      |                             |
                                      |  TwiML Response             |  HTTP forward
                                      |  (<Say>, <Gather>)          |  to localhost
                                      |                             |
                             +--------+---------+         +---------+----------+
                             |                  |         |                    |
                             |   Twilio Cloud   |<--------+   Express Server   |
                             |   (reads text)   |         |   localhost:5000   |
                             |                  |         |                    |
                             +------------------+         +---------+----------+
                                                                    |
                                                          +---------+----------+
                                                          |                    |
                                                          |   AI Core Engine   |
                                                          |   POST /api/voice/ |
                                                          |   sessions/initiate|
                                                          |                    |
                                                          +--------------------+
```

### Key Design Principle

Twilio does **not** run any AI logic. It is a thin telephony adapter that:

1. Presents a language selection menu via IVR.
2. Forwards the selected language to the existing `POST /api/voice/sessions/initiate` endpoint.
3. Reads the AI-generated response back to the caller using `<Say>`.

The existing backend, including LiveKit, Sarvam STT/TTS, and LLM services,
remains completely unchanged.

---

## 2. Dependencies

### Required npm Packages

| Package      | Purpose                                      |
|--------------|----------------------------------------------|
| `express`    | HTTP server framework (already installed)    |
| `body-parser`| Parse URL-encoded POST bodies from Twilio    |
| `axios`      | HTTP client to call the internal AI endpoint |
| `twilio`     | Twilio Node.js SDK for generating TwiML      |

### Installation

```bash
npm install body-parser axios twilio
```

> **Note:** `express` is already a project dependency and does not need to be
> reinstalled.

### ngrok Installation (Windows)

**Option A -- via Chocolatey:**

```powershell
choco install ngrok
```

**Option B -- manual download:**

1. Visit [https://ngrok.com/download](https://ngrok.com/download).
2. Download the Windows ZIP archive.
3. Extract `ngrok.exe` to a directory in your `PATH` (e.g., `C:\tools\`).
4. Verify installation:

```powershell
ngrok version
```

---

## 3. ngrok Setup

### 3.1 Authenticate ngrok

Create a free account at [https://dashboard.ngrok.com/signup](https://dashboard.ngrok.com/signup),
then copy your auth token from the dashboard.

```powershell
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### 3.2 Start the Tunnel

Ensure the Express server is running on port 5000, then open a **separate**
terminal and run:

```powershell
ngrok http 5000
```

You will see output similar to:

```
Session Status                online
Forwarding                    https://a1b2c3d4e5f6.ngrok-free.app -> http://localhost:5000
```

Copy the **HTTPS** forwarding URL (e.g., `https://a1b2c3d4e5f6.ngrok-free.app`).
This URL changes every time you restart ngrok on the free tier.

### 3.3 Configure Twilio Console

1. Log in to the [Twilio Console](https://console.twilio.com/).
2. Navigate to **Phone Numbers** > **Manage** > **Active Numbers**.
3. Select your Twilio phone number.
4. Under the **Voice Configuration** section:
   - Set **"A call comes in"** to **Webhook**.
   - Set the HTTP method to **POST**.
   - Enter the webhook URL:

```
https://YOUR_NGROK_SUBDOMAIN.ngrok-free.app/twilio/voice
```

5. Click **Save Configuration**.

> **Important:** You must update this URL every time you restart ngrok on the
> free tier, as the subdomain changes.

---

## 4. Express Implementation

The following is a **complete, self-contained** Express server file. Save it as
`twilio-ivr.js` in the project root or the `backend/` directory.

```javascript
// twilio-ivr.js
// Twilio Voice IVR Bridge — connects Twilio phone calls to the AI core engine.

import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';
import twilio from 'twilio';

const app = express();
const PORT = 5000;
const VoiceResponse = twilio.twiml.VoiceResponse;

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

// Twilio sends POST bodies as application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Internal AI endpoint (the existing backend)
const AI_ENDPOINT = 'http://localhost:5000/api/voice/sessions/initiate';

// Language mapping: DTMF digit -> language code
const LANGUAGE_MAP = {
  '1': 'hindi',
  '2': 'gujarati',
  '3': 'marathi',
};

// ---------------------------------------------------------------------------
// POST /twilio/voice
// Entry point — Twilio calls this when a user dials the number.
// Presents a language selection IVR menu using <Gather>.
// ---------------------------------------------------------------------------

app.post('/twilio/voice', (req, res) => {
  const twiml = new VoiceResponse();

  // <Gather> collects a single DTMF digit and forwards it to /twilio/set-language
  const gather = twiml.gather({
    numDigits: 1,
    action: '/twilio/set-language',
    method: 'POST',
    timeout: 10,
  });

  gather.say(
    { voice: 'Polly.Aditi', language: 'hi-IN' },
    'Namaste. Bhasha chunein. Hindi ke liye 1 dabaiye. ' +
    'Gujarati ke liye 2 dabaiye. Marathi ke liye 3 dabaiye.'
  );

  // If the caller does not press anything, repeat the menu
  twiml.redirect('/twilio/voice');

  res.set('Content-Type', 'text/xml');
  res.send(twiml.toString());
});

// ---------------------------------------------------------------------------
// POST /twilio/set-language
// Called by <Gather> after the caller presses a digit.
// Maps the digit to a language code, calls the AI endpoint, and reads the
// response back to the caller.
// ---------------------------------------------------------------------------

app.post('/twilio/set-language', async (req, res) => {
  const twiml = new VoiceResponse();
  const digit = req.body.Digits;

  // Validate the digit
  const language = LANGUAGE_MAP[digit];

  if (!language) {
    twiml.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      'Galat chunav. Kripya dobara prayaas karein.'
    );
    twiml.redirect('/twilio/voice');
    res.set('Content-Type', 'text/xml');
    return res.send(twiml.toString());
  }

  try {
    // Call the existing AI core endpoint
    const aiResponse = await axios.post(AI_ENDPOINT, {
      language: language,
      source: 'twilio_demo',
    });

    const message = aiResponse.data.message || 'AI response not available.';

    // Read the AI response back to the caller
    twiml.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      message
    );

    // After reading, hang up gracefully
    twiml.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      'Dhanyavaad. Call samaapt ho rahi hai.'
    );
  } catch (error) {
    console.error('[Twilio IVR] AI endpoint error:', error.message);
    twiml.say(
      { voice: 'Polly.Aditi', language: 'hi-IN' },
      'Maaf kijiye, AI seva uplabdh nahi hai. Kripya baad mein prayaas karein.'
    );
  }

  res.set('Content-Type', 'text/xml');
  res.send(twiml.toString());
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------

app.get('/twilio/health', (req, res) => {
  res.json({ status: 'ok', service: 'twilio-ivr-bridge' });
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

app.listen(PORT, () => {
  console.log(`[Twilio IVR] Server listening on port ${PORT}`);
  console.log(`[Twilio IVR] Webhook URL: http://localhost:${PORT}/twilio/voice`);
});
```

### Important Notes on the Code

- **`AI_ENDPOINT`**: Points to the existing backend. If the Twilio IVR runs as a
  separate process, change this to the appropriate host and port. If it is
  mounted on the same Express app as the main server, call the handler directly
  or use `localhost`.
- **Content-Type**: Every Twilio response **must** return `text/xml`. Returning
  `application/json` will cause Twilio to reject the response.
- **`bodyParser.urlencoded`**: Required because Twilio sends webhook payloads as
  `application/x-www-form-urlencoded`, not JSON.

---

## 5. Call Flow Explanation

### Step 1 -- Caller Dials the Twilio Number

The caller dials the purchased Twilio phone number from any phone. Twilio
receives the inbound call and sends an HTTP POST to the configured webhook URL:

```
POST https://<ngrok-url>/twilio/voice
```

### Step 2 -- IVR Menu is Presented

The `/twilio/voice` handler returns a TwiML `<Gather>` element that plays an
audio prompt asking the caller to select a language:

- Press **1** for Hindi
- Press **2** for Gujarati
- Press **3** for Marathi

Twilio reads this prompt to the caller using text-to-speech.

### Step 3 -- Caller Presses a Digit

Twilio captures the DTMF tone and sends another POST request to the `action`
URL specified in the `<Gather>` element:

```
POST https://<ngrok-url>/twilio/set-language
Body: Digits=1
```

### Step 4 -- Backend Calls the AI Endpoint

The `/twilio/set-language` handler maps the digit to a language code and calls
the existing AI core endpoint:

```
POST http://localhost:5000/api/voice/sessions/initiate
Body: { "language": "hindi", "source": "twilio_demo" }
```

The AI engine processes the request using the configured LLM and returns a
response.

### Step 5 -- Twilio Reads the AI Response

The handler wraps the AI response in a TwiML `<Say>` element and returns it to
Twilio. Twilio reads the text back to the caller using its built-in TTS engine.

### Step 6 -- Call Ends

After reading the response and a closing message, the call terminates
gracefully. No `<Hangup>` is needed because Twilio automatically ends the call
when there are no more TwiML instructions.

---

## 6. Demo Safety Checklist

Follow this checklist **every time** before presenting the demo.

### Pre-Demo Startup Sequence

| Step | Action                                      | Verify                              |
|------|---------------------------------------------|--------------------------------------|
| 1    | Start the main backend server               | `node server.js` shows port 5000    |
| 2    | Start ngrok tunnel                          | `ngrok http 5000` shows HTTPS URL   |
| 3    | Update Twilio webhook URL                   | Paste new ngrok URL in Twilio Console|
| 4    | Make one test call                          | Confirm IVR plays, digit works      |
| 5    | Keep terminal windows visible               | Monitor for errors in real time     |

### Keep the Server Warm

- Make a test call **5 minutes before** the presentation to ensure the ngrok
  tunnel is active, the backend is responsive, and the AI endpoint returns a
  valid response.
- If using the ngrok free tier, the tunnel expires after **2 hours**. Restart
  it and update Twilio if your demo window exceeds this limit.

### Common Failure Points

| Failure                        | Cause                                      | Fix                                 |
|--------------------------------|--------------------------------------------|--------------------------------------|
| Twilio returns 404             | ngrok URL not updated in Twilio Console    | Paste the new ngrok URL             |
| Twilio returns 502             | Backend server is not running              | Start the backend with `node server.js` |
| No audio after digit press     | AI endpoint threw an error                 | Check backend logs for stack trace  |
| IVR repeats indefinitely       | Caller did not press a digit within timeout| Increase `timeout` in `<Gather>`    |
| Call drops immediately         | TwiML response is malformed                | Validate XML output in logs         |

---

## 7. Troubleshooting

### 404 Errors from Twilio

**Symptom:** Twilio logs show `HTTP 404` for the webhook URL.

**Causes and Fixes:**

1. The ngrok URL in the Twilio Console is outdated. Restart ngrok and paste the
   new URL.
2. The route path is incorrect. Ensure the webhook points to `/twilio/voice`
   (not `/api/twilio/voice` or any other path).
3. The Express server is not running. Start it with `node twilio-ivr.js`.

### ngrok Tunnel Expired

**Symptom:** Calls fail after the tunnel has been running for over 2 hours.

**Fix:** Restart ngrok and update the Twilio Console webhook URL with the new
HTTPS forwarding address. To avoid this during a demo, restart ngrok
immediately before presenting.

### Twilio Not Sending Digits

**Symptom:** The `req.body.Digits` field is `undefined` in the `/twilio/set-language`
handler.

**Causes and Fixes:**

1. **Missing body parser.** Ensure `bodyParser.urlencoded({ extended: false })`
   is registered before the route handlers.
2. **Wrong HTTP method.** The `<Gather>` element must specify `method: 'POST'`,
   not `GET`.
3. **Action URL mismatch.** The `action` in `<Gather>` must match the route
   path exactly: `/twilio/set-language`.

### Body Parser Issues

**Symptom:** `req.body` is an empty object `{}`.

**Causes and Fixes:**

1. Twilio sends `application/x-www-form-urlencoded` payloads, not JSON. You
   must use `bodyParser.urlencoded()`, not just `bodyParser.json()`.
2. Ensure the body parser middleware is registered **before** the route
   definitions.

### TwiML Format Errors

**Symptom:** Twilio logs show "Error: Invalid TwiML" or the caller hears
nothing.

**Causes and Fixes:**

1. The response `Content-Type` header must be `text/xml`. Verify that every
   handler sets `res.set('Content-Type', 'text/xml')` before sending.
2. Do not mix raw string XML with the Twilio SDK. Use `twiml.toString()` to
   generate valid XML.
3. Ensure there are no uncaught exceptions that send an HTML error page to
   Twilio. Wrap all handler logic in `try/catch`.

### Quick Diagnostic Commands

Test the webhook locally using curl before routing through Twilio:

```bash
# Test the IVR entry point
curl -X POST http://localhost:5000/twilio/voice

# Simulate pressing digit 1 (Hindi)
curl -X POST http://localhost:5000/twilio/set-language \
  -d "Digits=1" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

Both commands should return valid XML responses.

---

## 8. Future Improvements

### Production Deployment

Replace ngrok with a production-grade deployment (e.g., AWS EC2, Azure App
Service, or Railway) to eliminate tunnel expiration, provide a stable webhook
URL, and improve reliability. The Twilio Console webhook would point to a
permanent domain such as `https://api.poorvam.ai/twilio/voice`.

### Multilingual TTS with Audio Files

Replace the `<Say>` verb with `<Play>` to use pre-recorded or dynamically
generated audio files for each language. This provides natural-sounding,
native-language responses instead of relying on Twilio's English-optimized TTS:

```xml
<Play>https://api.poorvam.ai/audio/response_hindi.mp3</Play>
```

The existing Sarvam TTS service can generate these audio files on the fly and
serve them via a static URL.

### Real-Time Audio via Media Streams

Twilio Media Streams enable bidirectional real-time audio over WebSocket. This
allows the system to:

- Stream caller audio directly to the Sarvam STT engine.
- Bypass the DTMF-based language selection in favor of voice-based detection.
- Enable true conversational AI over the phone, similar to the existing LiveKit
  implementation but accessible via any telephone.

This would be implemented using the `<Connect><Stream>` TwiML verb and a
WebSocket server integrated with the existing voice agent pipeline.

---

*Document prepared for AfterMath Decrypters -- Hackathon Demo 2026*
