# Phase 3: Voice Interface with Sarvam AI and LiveKit

This phase integrates voice capabilities using Sarvam AI for speech-to-text and text-to-speech, and LiveKit for real-time voice communication with the 4 test phone numbers.

## Timeline: Hours 28-40

## Objectives

- Integrate Sarvam AI for STT and TTS
- Set up LiveKit for voice rooms
- Build worker voice control interface
- Build client voice request interface
- Implement phone number routing
- Connect voice flows to backend APIs
- Add SMS notifications via Twilio

---

## Step 1: Sarvam AI Integration (Hours 28-30)

### 1.1 Install Dependencies

```bash
# Backend
cd backend
npm install @sarvam/sdk twilio

# Frontend (if needed for web-based voice)
cd frontend
npm install @livekit/components-react livekit-client
```

### 1.2 Sarvam Service Setup (`src/services/sarvam.service.js`)

```javascript
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

const SARVAM_API_KEY = process.env.SARVAM_API_KEY;
const SARVAM_BASE_URL = 'https://api.sarvam.ai';

class SarvamService {
  constructor() {
    this.client = axios.create({
      baseURL: SARVAM_BASE_URL,
      headers: {
        'Authorization': `Bearer ${SARVAM_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  }

  // Speech-to-Text
  async transcribeAudio(audioBuffer, language = 'hi-IN') {
    try {
      const formData = new FormData();
      formData.append('file', audioBuffer, {
        filename: 'audio.wav',
        contentType: 'audio/wav'
      });
      formData.append('language', language);
      formData.append('model', 'saaras:v1');

      const response = await axios.post(
        `${SARVAM_BASE_URL}/speech-to-text`,
        formData,
        {
          headers: {
            ...formData.getHeaders(),
            'Authorization': `Bearer ${SARVAM_API_KEY}`
          }
        }
      );

      return response.data.transcript;
    } catch (error) {
      console.error('Sarvam STT Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Text-to-Speech
  async generateSpeech(text, language = 'hi-IN', speaker = 'meera') {
    try {
      const response = await this.client.post('/text-to-speech', {
        inputs: [text],
        target_language_code: language,
        speaker: speaker,
        pitch: 0,
        pace: 1.0,
        loudness: 1.5,
        speech_sample_rate: 8000,
        enable_preprocessing: true,
        model: 'bulbul:v1'
      });

      // Response contains base64 audio
      return response.data.audios[0];
    } catch (error) {
      console.error('Sarvam TTS Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // Text translation (if needed)
  async translateText(text, sourceLang = 'hi-IN', targetLang = 'en-IN') {
    try {
      const response = await this.client.post('/translate', {
        input: text,
        source_language_code: sourceLang,
        target_language_code: targetLang,
        speaker_gender: 'Male',
        mode: 'formal',
        model: 'mayura:v1',
        enable_preprocessing: false
      });

      return response.data.translated_text;
    } catch (error) {
      console.error('Sarvam Translation Error:', error.response?.data || error.message);
      throw error;
    }
  }

  // NLP for intent extraction
  async extractIntent(text) {
    try {
      // Use Sarvam's chat completion for intent detection
      const response = await axios.post(
        process.env.SARVAM_API_URL,
        {
          model: 'sarvam-2b',
          messages: [
            {
              role: 'system',
              content: 'You are a service categorization assistant. Extract the service type from user requests. Respond with only the category name: plumber, electrician, carpenter, painter, cleaner, mechanic, ac_technician, pest_control, or general.'
            },
            {
              role: 'user',
              content: text
            }
          ],
          max_tokens: 50,
          temperature: 0.3
        },
        {
          headers: {
            'Authorization': `Bearer ${SARVAM_API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content.trim().toLowerCase();
    } catch (error) {
      console.error('Sarvam Intent Error:', error.response?.data || error.message);
      return 'general';
    }
  }
}

export default new SarvamService();
```

### 1.3 Twilio SMS Service (`src/services/twilio.service.js`)

```javascript
import twilio from 'twilio';

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhone = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

class TwilioService {
  async sendSMS(to, message) {
    try {
      const result = await client.messages.create({
        body: message,
        from: twilioPhone,
        to: to
      });
      
      console.log('SMS sent:', result.sid);
      return result;
    } catch (error) {
      console.error('Twilio SMS Error:', error);
      throw error;
    }
  }

  async sendJobAssignmentSMS(worker, job) {
    const message = `New job assigned! ${job.category} - ${job.description.substring(0, 50)}... Payment: ₹${job.paymentOffer}. Location: ${job.address}. Call to accept.`;
    return this.sendSMS(worker.phone, message);
  }

  async sendJobAcceptedSMS(client, worker, job) {
    const message = `Your job has been accepted by ${worker.name}. Contact: ${worker.phone}. They will arrive soon.`;
    return this.sendSMS(client.phone, message);
  }

  async sendJobCompletedSMS(client, job) {
    const message = `Job completed! Please rate your experience and process payment of ₹${job.paymentOffer}.`;
    return this.sendSMS(client.phone, message);
  }
}

export default new TwilioService();
```

---

## Step 2: LiveKit Setup (Hours 30-32)

### 2.1 LiveKit Server Configuration

```bash
# Install LiveKit server (local development)
# Download from https://livekit.io/
# Or use LiveKit Cloud

# Environment variables
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_URL=ws://localhost:7880
```

### 2.2 LiveKit Service (`src/services/livekit.service.js`)

```javascript
import { AccessToken } from 'livekit-server-sdk';

const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY;
const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET;

class LiveKitService {
  generateToken(roomName, participantName, metadata = {}) {
    const at = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
      identity: participantName,
      metadata: JSON.stringify(metadata)
    });

    at.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true
    });

    return at.toJwt();
  }

  createVoiceRoom(userId, userType) {
    const roomName = `voice-${userId}-${Date.now()}`;
    const token = this.generateToken(roomName, userId, { userType });
    
    return {
      roomName,
      token,
      url: process.env.LIVEKIT_URL
    };
  }
}

export default new LiveKitService();
```

---

## Step 3: Voice Controller & Routes (Hours 32-34)

### 3.1 Voice Controller (`src/controllers/voice.controller.js`)

```javascript
import User from '../models/User.model.js';
import Job from '../models/Job.model.js';
import sarvamService from '../services/sarvam.service.js';
import liveKitService from '../services/livekit.service.js';
import twilioService from '../services/twilio.service.js';
import { generateToken } from '../utils/jwt.js';
import { extractCategory } from '../utils/categoryExtractor.js';
import { calculateDistance } from '../utils/distance.js';

// Phone number to user mapping
const TEST_PHONE_NUMBERS = {
  '+919326418140': null,
  '+919987300208': null,
  '+919892884320': null,
  '+919324769110': null
};

export const authenticateByPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    // Check if it's a test number
    const formattedPhone = phone.startsWith('+91') ? phone : `+91${phone}`;
    
    let user = await User.findOne({ phone: formattedPhone });
    
    if (!user) {
      return res.json({ 
        isNewUser: true,
        phone: formattedPhone,
        message: 'New user detected. Please provide registration details.'
      });
    }

    const token = generateToken(user._id);
    const voiceRoom = liveKitService.createVoiceRoom(user._id.toString(), user.userType);

    res.json({
      isNewUser: false,
      token,
      voiceRoom,
      user: {
        id: user._id,
        name: user.name,
        userType: user.userType,
        location: user.location,
        categories: user.categories,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const registerViaVoice = async (req, res) => {
  try {
    const { phone, name, userType, location, address, categories } = req.body;

    const user = await User.create({
      phone,
      name,
      userType,
      location,
      address,
      categories: userType === 'worker' ? categories : [],
      authMethod: 'voice',
      password: Math.random().toString(36).slice(-8) // Random password for voice users
    });

    const token = generateToken(user._id);
    const voiceRoom = liveKitService.createVoiceRoom(user._id.toString(), user.userType);

    res.json({
      message: 'Registration successful',
      token,
      voiceRoom,
      user: {
        id: user._id,
        name: user.name,
        userType: user.userType
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const processClientVoiceRequest = async (req, res) => {
  try {
    const { audioBuffer, userId } = req.body;

    // Transcribe audio
    const transcript = await sarvamService.transcribeAudio(audioBuffer);
    
    // Extract category from transcript
    const category = await extractCategory(transcript);
    
    // Get user
    const user = await User.findById(userId);
    if (!user || user.userType !== 'client') {
      return res.status(403).json({ error: 'Invalid user' });
    }

    // Create job
    const job = await Job.create({
      clientId: user._id,
      description: transcript,
      paymentOffer: 500, // Default or extract from speech
      location: user.location,
      address: user.address,
      category
    });

    // Find and assign worker
    const workers = await User.find({
      userType: 'worker',
      status: 'available',
      categories: category
    });

    if (workers.length === 0) {
      const responseText = 'क्षमा करें, इस समय कोई कार्यकर्ता उपलब्ध नहीं है। कृपया बाद में प्रयास करें।';
      const audioResponse = await sarvamService.generateSpeech(responseText, 'hi-IN');
      
      return res.json({
        success: false,
        message: 'No workers available',
        audioResponse,
        transcript
      });
    }

    // Score and assign best worker
    const scoredWorkers = workers.map(worker => {
      const distance = calculateDistance(
        job.location.coordinates,
        worker.location.coordinates
      );
      const score = (100 - distance * 10) * 0.5 + (worker.rating / 5 * 100) * 0.5;
      return { worker, distance, score };
    });

    scoredWorkers.sort((a, b) => b.score - a.score);
    const bestWorker = scoredWorkers[0].worker;

    job.workerId = bestWorker._id;
    job.status = 'assigned';
    job.distance = scoredWorkers[0].distance;
    await job.save();

    // Send SMS to worker
    await twilioService.sendJobAssignmentSMS(bestWorker, job);

    // Generate voice response
    const responseText = `आपका अनुरोध प्राप्त हुआ। ${bestWorker.name} को आपका काम सौंपा गया है। वे ${scoredWorkers[0].distance.toFixed(1)} किलोमीटर दूर हैं। उनका संपर्क नंबर ${bestWorker.phone} है।`;
    const audioResponse = await sarvamService.generateSpeech(responseText, 'hi-IN');

    res.json({
      success: true,
      job,
      worker: {
        name: bestWorker.name,
        phone: bestWorker.phone,
        rating: bestWorker.rating,
        distance: scoredWorkers[0].distance
      },
      transcript,
      audioResponse
    });
  } catch (error) {
    console.error('Voice request error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const processWorkerVoiceCommand = async (req, res) => {
  try {
    const { audioBuffer, userId } = req.body;

    // Transcribe audio
    const transcript = await sarvamService.transcribeAudio(audioBuffer);
    const command = transcript.toLowerCase();

    const user = await User.findById(userId);
    if (!user || user.userType !== 'worker') {
      return res.status(403).json({ error: 'Invalid user' });
    }

    // Get assigned jobs
    const assignedJobs = await Job.find({
      workerId: user._id,
      status: 'assigned'
    }).populate('clientId', 'name phone address');

    if (assignedJobs.length === 0) {
      const responseText = 'आपके पास कोई नया काम नहीं है।';
      const audioResponse = await sarvamService.generateSpeech(responseText, 'hi-IN');
      
      return res.json({
        success: true,
        hasJobs: false,
        audioResponse,
        transcript
      });
    }

    // Read first job
    const job = assignedJobs[0];
    
    // Check if command is accept/reject
    if (command.includes('accept') || command.includes('स्वीकार') || command.includes('हां')) {
      job.status = 'accepted';
      job.acceptedAt = new Date();
      await job.save();

      await User.findByIdAndUpdate(user._id, { status: 'busy' });
      await twilioService.sendJobAcceptedSMS(job.clientId, user, job);

      const responseText = `काम स्वीकार किया गया। ग्राहक का नाम ${job.clientId.name} है। पता: ${job.clientId.address}। संपर्क: ${job.clientId.phone}।`;
      const audioResponse = await sarvamService.generateSpeech(responseText, 'hi-IN');

      return res.json({
        success: true,
        action: 'accepted',
        job,
        audioResponse,
        transcript
      });
    } else if (command.includes('skip') || command.includes('अस्वीकार') || command.includes('नहीं')) {
      job.status = 'pending';
      job.workerId = null;
      await job.save();

      const responseText = 'काम अस्वीकार किया गया। अगला काम खोज रहे हैं।';
      const audioResponse = await sarvamService.generateSpeech(responseText, 'hi-IN');

      return res.json({
        success: true,
        action: 'rejected',
        audioResponse,
        transcript
      });
    } else {
      // Read job details
      const responseText = `आपके पास ${job.category} का काम है। विवरण: ${job.description}। भुगतान: ${job.paymentOffer} रुपये। दूरी: ${job.distance} किलोमीटर। स्वीकार करने के लिए "हां" कहें या अस्वीकार करने के लिए "नहीं" कहें।`;
      const audioResponse = await sarvamService.generateSpeech(responseText, 'hi-IN');

      return res.json({
        success: true,
        action: 'read_job',
        job,
        audioResponse,
        transcript
      });
    }
  } catch (error) {
    console.error('Worker voice command error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getVoiceToken = async (req, res) => {
  try {
    const { userId } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const voiceRoom = liveKitService.createVoiceRoom(userId, user.userType);
    
    res.json(voiceRoom);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const completeJobViaVoice = async (req, res) => {
  try {
    const { jobId, userId } = req.body;

    const job = await Job.findById(jobId).populate('clientId');
    if (!job || job.workerId.toString() !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    job.status = 'completed';
    job.completedAt = new Date();
    await job.save();

    await User.findByIdAndUpdate(userId, { status: 'available' });
    await twilioService.sendJobCompletedSMS(job.clientId, job);

    const responseText = 'काम पूरा हो गया है। धन्यवाद।';
    const audioResponse = await sarvamService.generateSpeech(responseText, 'hi-IN');

    res.json({
      success: true,
      job,
      audioResponse
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 3.2 Voice Routes (`src/routes/voice.routes.js`)

```javascript
import express from 'express';
import multer from 'multer';
import {
  authenticateByPhone,
  registerViaVoice,
  processClientVoiceRequest,
  processWorkerVoiceCommand,
  getVoiceToken,
  completeJobViaVoice
} from '../controllers/voice.controller.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post('/authenticate', authenticateByPhone);
router.post('/register', registerViaVoice);
router.post('/client-request', upload.single('audio'), processClientVoiceRequest);
router.post('/worker-command', upload.single('audio'), processWorkerVoiceCommand);
router.post('/get-token', getVoiceToken);
router.post('/complete-job', completeJobViaVoice);

export default router;
```

---

## Step 4: Frontend Voice Components (Hours 34-37)

### 4.1 Voice Interface Component (`src/components/voice/VoiceInterface.jsx`)

```javascript
import { useState, useEffect, useRef } from 'react';
import { Room, RoomEvent } from 'livekit-client';
import { Mic, MicOff, Phone, PhoneOff } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import toast from 'react-hot-toast';

const VoiceInterface = ({ onClose }) => {
  const { user } = useAuth();
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    connectToRoom();
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, []);

  const connectToRoom = async () => {
    try {
      const { data } = await api.post('/voice/get-token', {
        userId: user.id
      });

      const newRoom = new Room();
      
      newRoom.on(RoomEvent.Connected, () => {
        setIsConnected(true);
        toast.success('Voice connected');
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        toast.info('Voice disconnected');
      });

      await newRoom.connect(data.url, data.token);
      setRoom(newRoom);
    } catch (error) {
      console.error('Error connecting to voice room:', error);
      toast.error('Failed to connect voice');
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        audioChunksRef.current = [];
        await processVoiceCommand(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Microphone access denied');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processVoiceCommand = async (audioBlob) => {
    try {
      const formData = new FormData();
      formData.append('audio', audioBlob);
      formData.append('userId', user.id);

      const endpoint = user.userType === 'client' 
        ? '/voice/client-request' 
        : '/voice/worker-command';

      const { data } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Play audio response
      if (data.audioResponse) {
        playAudioResponse(data.audioResponse);
      }

      toast.success(data.message || 'Command processed');
    } catch (error) {
      console.error('Error processing voice:', error);
      toast.error('Failed to process voice command');
    }
  };

  const playAudioResponse = (base64Audio) => {
    const audio = new Audio(`data:audio/wav;base64,${base64Audio}`);
    audio.play();
  };

  const toggleMute = () => {
    if (room) {
      room.localParticipant.setMicrophoneEnabled(isMuted);
      setIsMuted(!isMuted);
    }
  };

  const disconnect = () => {
    if (room) {
      room.disconnect();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="card w-96 bg-base-100 shadow-xl">
        <div className="card-body items-center text-center">
          <h2 className="card-title mb-4">Voice Interface</h2>
          
          <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 ${
            isConnected ? 'bg-success' : 'bg-error'
          } ${isRecording ? 'animate-pulse' : ''}`}>
            {isRecording ? (
              <Mic size={64} className="text-white" />
            ) : (
              <MicOff size={64} className="text-white" />
            )}
          </div>

          <p className="mb-4">
            {isConnected ? 'Connected' : 'Connecting...'}
          </p>

          <div className="flex gap-4">
            <button
              className={`btn btn-circle btn-lg ${isRecording ? 'btn-error' : 'btn-primary'}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={!isConnected}
            >
              {isRecording ? <MicOff size={32} /> : <Mic size={32} />}
            </button>

            <button
              className="btn btn-circle btn-lg btn-outline"
              onClick={toggleMute}
              disabled={!isConnected}
            >
              {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
            </button>

            <button
              className="btn btn-circle btn-lg btn-error"
              onClick={disconnect}
            >
              <PhoneOff size={32} />
            </button>
          </div>

          <p className="text-sm text-gray-500 mt-4">
            {user.userType === 'client' 
              ? 'Press mic to describe your problem'
              : 'Press mic to accept or reject jobs'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default VoiceInterface;
```

### 4.2 Add Voice Button to Dashboards

**Client Dashboard** - Add to navbar:
```javascript
import { Phone } from 'lucide-react';
import VoiceInterface from '../components/voice/VoiceInterface';

const [showVoice, setShowVoice] = useState(false);

// In navbar
<button 
  className="btn btn-primary btn-circle"
  onClick={() => setShowVoice(true)}
>
  <Phone size={24} />
</button>

{showVoice && <VoiceInterface onClose={() => setShowVoice(false)} />}
```

**Worker Dashboard** - Same addition

---

## Step 5: Phone Call Integration (Hours 37-39)

### 5.1 Twilio Voice Webhook Handler (`src/controllers/twilio.controller.js`)

```javascript
import twilio from 'twilio';
import User from '../models/User.model.js';
import sarvamService from '../services/sarvam.service.js';

const VoiceResponse = twilio.twiml.VoiceResponse;

export const handleIncomingCall = async (req, res) => {
  const twiml = new VoiceResponse();
  const from = req.body.From;

  try {
    // Check if user exists
    const user = await User.findOne({ phone: from });

    if (!user) {
      // New user registration flow
      twiml.say({ language: 'hi-IN' }, 'नमस्ते। आप पूर्वम डॉट ए आई में नए हैं।');
      twiml.gather({
        input: 'speech',
        language: 'hi-IN',
        action: '/api/twilio/register-response',
        method: 'POST'
      }).say('क्या आप ग्राहक हैं या कार्यकर्ता? कृपया बोलें।');
    } else {
      // Existing user
      if (user.userType === 'client') {
        twiml.say({ language: 'hi-IN' }, `नमस्ते ${user.name}। अपनी समस्या बताएं।`);
        twiml.gather({
          input: 'speech',
          language: 'hi-IN',
          action: '/api/twilio/client-request',
          method: 'POST'
        });
      } else {
        twiml.say({ language: 'hi-IN' }, `नमस्ते ${user.name}। आपके काम सुन रहे हैं।`);
        twiml.redirect('/api/twilio/worker-jobs');
      }
    }

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Twilio webhook error:', error);
    twiml.say('क्षमा करें, कुछ गलत हो गया। कृपया बाद में प्रयास करें।');
    res.type('text/xml');
    res.send(twiml.toString());
  }
};

export const handleClientRequest = async (req, res) => {
  const twiml = new VoiceResponse();
  const speechResult = req.body.SpeechResult;
  const from = req.body.From;

  try {
    const user = await User.findOne({ phone: from });
    
    // Process the request (similar to voice controller logic)
    const category = await extractCategory(speechResult);
    // ... create job and assign worker ...

    twiml.say({ language: 'hi-IN' }, 'आपका अनुरोध प्राप्त हुआ। कार्यकर्ता जल्द ही संपर्क करेंगे।');
    twiml.hangup();

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Client request error:', error);
    twiml.say('क्षमा करें, अनुरोध प्रोसेस नहीं हो सका।');
    res.type('text/xml');
    res.send(twiml.toString());
  }
};

export const handleWorkerJobs = async (req, res) => {
  const twiml = new VoiceResponse();
  const from = req.body.From;

  try {
    const user = await User.findOne({ phone: from });
    const jobs = await Job.find({ workerId: user._id, status: 'assigned' })
      .populate('clientId');

    if (jobs.length === 0) {
      twiml.say({ language: 'hi-IN' }, 'आपके पास कोई नया काम नहीं है।');
      twiml.hangup();
    } else {
      const job = jobs[0];
      twiml.say({ language: 'hi-IN' }, 
        `${job.category} का काम। ${job.description}। भुगतान ${job.paymentOffer} रुपये।`
      );
      twiml.gather({
        input: 'speech',
        language: 'hi-IN',
        action: '/api/twilio/worker-response',
        method: 'POST'
      }).say('स्वीकार करने के लिए हां कहें या अस्वीकार करने के लिए नहीं।');
    }

    res.type('text/xml');
    res.send(twiml.toString());
  } catch (error) {
    console.error('Worker jobs error:', error);
    twiml.say('क्षमा करें, काम नहीं मिल सके।');
    res.type('text/xml');
    res.send(twiml.toString());
  }
};
```

### 5.2 Twilio Routes (`src/routes/twilio.routes.js`)

```javascript
import express from 'express';
import {
  handleIncomingCall,
  handleClientRequest,
  handleWorkerJobs
} from '../controllers/twilio.controller.js';

const router = express.Router();

router.post('/incoming-call', handleIncomingCall);
router.post('/client-request', handleClientRequest);
router.post('/worker-jobs', handleWorkerJobs);
router.post('/register-response', handleRegisterResponse);
router.post('/worker-response', handleWorkerResponse);

export default router;
```

### 5.3 Add to server.js

```javascript
import twilioRoutes from './src/routes/twilio.routes.js';

app.use('/api/twilio', twilioRoutes);
```

---

## Step 6: Testing & Environment Setup (Hours 39-40)

### 6.1 Environment Variables

Add to `.env`:
```
# Sarvam AI
SARVAM_API_KEY=sk_n4sm3lup_H5D5ELgmNy3sZPnQF4bcmGsT
SARVAM_API_URL=https://api.sarvam.ai/v1/chat/completions

# LiveKit
LIVEKIT_API_KEY=your_livekit_key
LIVEKIT_API_SECRET=your_livekit_secret
LIVEKIT_URL=wss://your-livekit-server.com

# Twilio
TWILIO_ACCOUNT_SID=your_account_sid
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

### 6.2 Test Phone Numbers Configuration

Create test user accounts for the 4 numbers:
```javascript
// Script: scripts/setup-test-users.js
import mongoose from 'mongoose';
import User from '../src/models/User.model.js';
import dotenv from 'dotenv';

dotenv.config();

const testUsers = [
  {
    phone: '+919326418140',
    name: 'Test Client 1',
    userType: 'client',
    location: { type: 'Point', coordinates: [72.8777, 19.0760] },
    address: 'Mumbai, Maharashtra',
    authMethod: 'voice'
  },
  {
    phone: '+919987300208',
    name: 'Test Worker 1',
    userType: 'worker',
    categories: ['plumber', 'electrician'],
    location: { type: 'Point', coordinates: [72.8800, 19.0800] },
    address: 'Mumbai, Maharashtra',
    authMethod: 'voice'
  },
  {
    phone: '+919892884320',
    name: 'Test Client 2',
    userType: 'client',
    location: { type: 'Point', coordinates: [72.8850, 19.0850] },
    address: 'Mumbai, Maharashtra',
    authMethod: 'voice'
  },
  {
    phone: '+919324769110',
    name: 'Test Worker 2',
    userType: 'worker',
    categories: ['carpenter', 'painter'],
    location: { type: 'Point', coordinates: [72.8900, 19.0900] },
    address: 'Mumbai, Maharashtra',
    authMethod: 'voice'
  }
];

async function setupTestUsers() {
  await mongoose.connect(process.env.MONGO_URI);
  
  for (const userData of testUsers) {
    const existing = await User.findOne({ phone: userData.phone });
    if (!existing) {
      await User.create({ ...userData, password: 'test123' });
      console.log(`Created user: ${userData.name}`);
    }
  }
  
  console.log('Test users setup complete');
  process.exit(0);
}

setupTestUsers();
```

Run: `node scripts/setup-test-users.js`

---

## Testing Checklist

### Voice Interface Testing

1. **Sarvam AI**
   - [ ] STT converts Hindi/English speech correctly
   - [ ] TTS generates clear audio responses
   - [ ] Intent extraction works for job categories

2. **LiveKit**
   - [ ] Voice rooms connect successfully
   - [ ] Audio quality is acceptable
   - [ ] Multiple participants can join

3. **Client Voice Flow**
   - [ ] Call test number 1 or 3
   - [ ] Describe problem in Hindi/English
   - [ ] Receive worker assignment confirmation
   - [ ] Get SMS with worker details

4. **Worker Voice Flow**
   - [ ] Call test number 2 or 4
   - [ ] Hear assigned job details
   - [ ] Accept job via voice command
   - [ ] Receive SMS confirmation

5. **Twilio Integration**
   - [ ] Incoming calls route correctly
   - [ ] SMS notifications sent
   - [ ] Voice responses play clearly

---

## Deliverables

✅ Sarvam AI integration (STT, TTS, NLP)
✅ LiveKit voice rooms setup
✅ Client voice request flow
✅ Worker voice control flow
✅ Phone number routing for test numbers
✅ Twilio SMS notifications
✅ Voice interface UI components
✅ Complete voice-to-backend integration

---

## Next Phase

Proceed to **Phase 4: Payment Integration, Ratings, and Final Integration**
