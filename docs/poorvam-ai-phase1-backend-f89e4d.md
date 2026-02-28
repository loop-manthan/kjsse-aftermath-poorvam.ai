# Phase 1: Backend Foundation & Core APIs

This phase builds the complete backend infrastructure with MongoDB, authentication, job matching algorithm, and all core API endpoints.

## Timeline: Hours 0-14

## Objectives

- Set up Express server with proper middleware
- Create MongoDB models and schemas
- Implement JWT authentication
- Build job matching algorithm with distance calculation
- Create all REST API endpoints
- Test APIs with Postman/Thunder Client

---

## Step 1: Server Setup & Configuration (Hour 0-1)

### 1.1 Server Entry Point (`server.js`)

```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import authRoutes from './src/routes/auth.routes.js';
import jobRoutes from './src/routes/job.routes.js';
import matchingRoutes from './src/routes/matching.routes.js';
import reviewRoutes from './src/routes/review.routes.js';
import paymentRoutes from './src/routes/payment.routes.js';
import categoryRoutes from './src/routes/category.routes.js';
import voiceRoutes from './src/routes/voice.routes.js';
import { errorHandler } from './src/middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/matching', matchingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/voice', voiceRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// Error handler
app.use(errorHandler);

// Database connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });
```

### 1.2 Environment Variables (`.env`)

Already configured:
- `MONGO_URI` - MongoDB Atlas connection
- `JWT_SECRET` - JWT signing key
- `PORT` - Server port (5000)
- `FRONTEND_URL` - CORS origin
- `SARVAM_API_KEY` - Sarvam AI key
- `SARVAM_API_URL` - Sarvam API endpoint

---

## Step 2: Database Models (Hours 1-3)

### 2.1 User Model (`src/models/User.model.js`)

```javascript
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
    default: () => require('uuid').v4()
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    sparse: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: function() {
      return this.authMethod !== 'voice';
    }
  },
  userType: {
    type: String,
    enum: ['client', 'worker'],
    required: true
  },
  authMethod: {
    type: String,
    enum: ['email', 'phone', 'google', 'voice'],
    default: 'phone'
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: {
    type: String,
    required: true
  },
  categories: [{
    type: String,
    trim: true
  }],
  rating: {
    type: Number,
    default: 5.0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  visibilityWeight: {
    type: Number,
    default: 1.0
  },
  status: {
    type: String,
    enum: ['available', 'busy', 'offline'],
    default: 'available'
  },
  profilePicture: String,
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Geospatial index for location-based queries
userSchema.index({ location: '2dsphere' });
userSchema.index({ phone: 1 });
userSchema.index({ userType: 1, status: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Update visibility weight based on rating
userSchema.methods.updateVisibilityWeight = function() {
  if (this.totalRatings > 0) {
    this.visibilityWeight = this.rating / 5.0;
  }
};

export default mongoose.model('User', userSchema);
```

### 2.2 Job Model (`src/models/Job.model.js`)

```javascript
import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true,
    default: () => require('uuid').v4()
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  paymentOffer: {
    type: Number,
    required: true,
    min: 0
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  address: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'assigned', 'accepted', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  clientRating: {
    type: Number,
    min: 0,
    max: 5
  },
  workerRating: {
    type: Number,
    min: 0,
    max: 5
  },
  clientReview: String,
  workerReview: String,
  paymentMode: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed'],
    default: 'pending'
  },
  tip: {
    type: Number,
    default: 0,
    min: 0
  },
  distance: Number, // Distance from worker to job (in km)
  completedAt: Date,
  acceptedAt: Date,
  cancelledAt: Date,
  cancellationReason: String
}, {
  timestamps: true
});

// Indexes
jobSchema.index({ location: '2dsphere' });
jobSchema.index({ clientId: 1, status: 1 });
jobSchema.index({ workerId: 1, status: 1 });
jobSchema.index({ category: 1, status: 1 });
jobSchema.index({ createdAt: -1 });

export default mongoose.model('Job', jobSchema);
```

### 2.3 Category Model (`src/models/Category.model.js`)

```javascript
import mongoose from 'mongoose';

const categorySchema = new mongoose.Schema({
  categoryId: {
    type: String,
    required: true,
    unique: true,
    default: () => require('uuid').v4()
  },
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  displayName: {
    type: String,
    required: true
  },
  keywords: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  occurrenceCount: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

categorySchema.index({ name: 1 });
categorySchema.index({ keywords: 1 });

export default mongoose.model('Category', categorySchema);
```

### 2.4 Review Model (`src/models/Review.model.js`)

```javascript
import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  reviewId: {
    type: String,
    required: true,
    unique: true,
    default: () => require('uuid').v4()
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  byUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  forUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true
  },
  reviewType: {
    type: String,
    enum: ['client_to_worker', 'worker_to_client'],
    required: true
  }
}, {
  timestamps: true
});

reviewSchema.index({ forUser: 1 });
reviewSchema.index({ jobId: 1 });

export default mongoose.model('Review', reviewSchema);
```

### 2.5 Transaction Model (`src/models/Transaction.model.js`)

```javascript
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true,
    default: () => require('uuid').v4()
  },
  jobId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Job',
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  tip: {
    type: Number,
    default: 0,
    min: 0
  },
  mode: {
    type: String,
    enum: ['online', 'offline'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String
}, {
  timestamps: true
});

transactionSchema.index({ jobId: 1 });
transactionSchema.index({ status: 1 });

export default mongoose.model('Transaction', transactionSchema);
```

---

## Step 3: Middleware (Hour 3-4)

### 3.1 Auth Middleware (`src/middleware/auth.middleware.js`)

```javascript
import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

export const authorizeUserType = (...allowedTypes) => {
  return (req, res, next) => {
    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({ 
        error: `Access denied. Required user type: ${allowedTypes.join(' or ')}` 
      });
    }
    next();
  };
};
```

### 3.2 Error Handler (`src/middleware/errorHandler.js`)

```javascript
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

### 3.3 Validation Middleware (`src/middleware/validation.middleware.js`)

```javascript
export const validateRegistration = (req, res, next) => {
  const { name, phone, userType, location, address } = req.body;

  if (!name || !phone || !userType) {
    return res.status(400).json({ error: 'Name, phone, and userType are required' });
  }

  if (!['client', 'worker'].includes(userType)) {
    return res.status(400).json({ error: 'Invalid userType' });
  }

  if (!location || !location.coordinates || location.coordinates.length !== 2) {
    return res.status(400).json({ error: 'Valid location coordinates required' });
  }

  if (!address) {
    return res.status(400).json({ error: 'Address is required' });
  }

  next();
};

export const validateJobCreation = (req, res, next) => {
  const { description, paymentOffer, location, address } = req.body;

  if (!description || !paymentOffer || !location || !address) {
    return res.status(400).json({ 
      error: 'Description, paymentOffer, location, and address are required' 
    });
  }

  if (paymentOffer < 0) {
    return res.status(400).json({ error: 'Payment offer must be positive' });
  }

  next();
};
```

---

## Step 4: Utility Functions (Hour 4-5)

### 4.1 Distance Calculator (`src/utils/distance.js`)

```javascript
// Haversine formula for calculating distance between two coordinates
export const calculateDistance = (coord1, coord2) => {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;

  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 100) / 100; // Round to 2 decimal places
};

const toRad = (degrees) => {
  return degrees * (Math.PI / 180);
};
```

### 4.2 Category Extractor (`src/utils/categoryExtractor.js`)

```javascript
import Category from '../models/Category.model.js';

// Common service keywords mapping
const SERVICE_KEYWORDS = {
  'plumber': ['plumber', 'pipe', 'leak', 'tap', 'water', 'drainage', 'toilet', 'sink'],
  'electrician': ['electrician', 'electric', 'wiring', 'light', 'switch', 'fan', 'power', 'socket'],
  'carpenter': ['carpenter', 'wood', 'furniture', 'door', 'window', 'cabinet', 'repair'],
  'painter': ['painter', 'paint', 'wall', 'color', 'painting'],
  'cleaner': ['clean', 'cleaning', 'maid', 'sweep', 'dust', 'wash'],
  'mechanic': ['mechanic', 'car', 'bike', 'vehicle', 'engine', 'repair'],
  'ac_technician': ['ac', 'air conditioner', 'cooling', 'hvac', 'refrigerator'],
  'pest_control': ['pest', 'insects', 'cockroach', 'rat', 'termite', 'mosquito']
};

export const extractCategory = async (description) => {
  const lowerDesc = description.toLowerCase();
  
  // Check against existing categories
  for (const [categoryName, keywords] of Object.entries(SERVICE_KEYWORDS)) {
    if (keywords.some(keyword => lowerDesc.includes(keyword))) {
      // Update or create category
      let category = await Category.findOne({ name: categoryName });
      
      if (category) {
        category.occurrenceCount += 1;
        await category.save();
      } else {
        category = await Category.create({
          name: categoryName,
          displayName: categoryName.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
          keywords: keywords,
          occurrenceCount: 1
        });
      }
      
      return category.name;
    }
  }
  
  // Default to 'general' if no match
  let generalCategory = await Category.findOne({ name: 'general' });
  if (!generalCategory) {
    generalCategory = await Category.create({
      name: 'general',
      displayName: 'General Service',
      keywords: ['help', 'service', 'work'],
      occurrenceCount: 1
    });
  } else {
    generalCategory.occurrenceCount += 1;
    await generalCategory.save();
  }
  
  return 'general';
};
```

### 4.3 JWT Helper (`src/utils/jwt.js`)

```javascript
import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
};

export const verifyToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET);
};
```

---

## Step 5: Authentication Routes (Hours 5-7)

### 5.1 Auth Controller (`src/controllers/auth.controller.js`)

```javascript
import User from '../models/User.model.js';
import { generateToken } from '../utils/jwt.js';

export const register = async (req, res) => {
  try {
    const { name, email, phone, password, userType, location, address, categories } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({ error: 'Phone number already registered' });
    }

    // Create user
    const user = await User.create({
      name,
      email,
      phone,
      password,
      userType,
      location,
      address,
      categories: userType === 'worker' ? categories : [],
      authMethod: email ? 'email' : 'phone'
    });

    const token = generateToken(user._id);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        phone: user.phone,
        email: user.email,
        userType: user.userType,
        location: user.location,
        address: user.address,
        categories: user.categories,
        rating: user.rating,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { phone, password } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        userId: user.userId,
        name: user.name,
        phone: user.phone,
        email: user.email,
        userType: user.userType,
        location: user.location,
        address: user.address,
        categories: user.categories,
        rating: user.rating,
        status: user.status
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { name, location, address, categories, status } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name) user.name = name;
    if (location) user.location = location;
    if (address) user.address = address;
    if (categories && user.userType === 'worker') user.categories = categories;
    if (status) user.status = status;
    
    await user.save();
    
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 5.2 Auth Routes (`src/routes/auth.routes.js`)

```javascript
import express from 'express';
import { register, login, getMe, updateProfile } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validateRegistration } from '../middleware/validation.middleware.js';

const router = express.Router();

router.post('/register', validateRegistration, register);
router.post('/login', login);
router.get('/me', authenticate, getMe);
router.patch('/profile', authenticate, updateProfile);

export default router;
```

---

## Step 6: Job & Matching Routes (Hours 7-10)

### 6.1 Job Controller (`src/controllers/job.controller.js`)

```javascript
import Job from '../models/Job.model.js';
import User from '../models/User.model.js';
import { extractCategory } from '../utils/categoryExtractor.js';
import { calculateDistance } from '../utils/distance.js';

export const createJob = async (req, res) => {
  try {
    const { description, paymentOffer, location, address } = req.body;
    
    if (req.user.userType !== 'client') {
      return res.status(403).json({ error: 'Only clients can create jobs' });
    }

    // Extract category from description
    const category = await extractCategory(description);

    const job = await Job.create({
      clientId: req.user._id,
      description,
      paymentOffer,
      location,
      address,
      category
    });

    await job.populate('clientId', 'name phone location');

    res.status(201).json({
      message: 'Job created successfully',
      job
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyJobs = async (req, res) => {
  try {
    const query = req.user.userType === 'client' 
      ? { clientId: req.user._id }
      : { workerId: req.user._id };

    const jobs = await Job.find(query)
      .populate('clientId', 'name phone location address')
      .populate('workerId', 'name phone location address rating')
      .sort({ createdAt: -1 });

    res.json({ jobs });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId)
      .populate('clientId', 'name phone location address')
      .populate('workerId', 'name phone location address rating');

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    res.json({ job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const acceptJob = async (req, res) => {
  try {
    if (req.user.userType !== 'worker') {
      return res.status(403).json({ error: 'Only workers can accept jobs' });
    }

    const job = await Job.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'assigned' || job.workerId.toString() !== req.user._id.toString()) {
      return res.status(400).json({ error: 'Cannot accept this job' });
    }

    job.status = 'accepted';
    job.acceptedAt = new Date();
    await job.save();

    // Update worker status
    await User.findByIdAndUpdate(req.user._id, { status: 'busy' });

    await job.populate('clientId workerId');

    res.json({ message: 'Job accepted', job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const startJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    
    if (!job || job.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    job.status = 'in_progress';
    await job.save();

    res.json({ message: 'Job started', job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const completeJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    
    if (!job || job.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    job.status = 'completed';
    job.completedAt = new Date();
    await job.save();

    // Update worker status back to available
    await User.findByIdAndUpdate(req.user._id, { status: 'available' });

    res.json({ message: 'Job completed', job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const cancelJob = async (req, res) => {
  try {
    const { reason } = req.body;
    const job = await Job.findById(req.params.jobId);
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Only client or assigned worker can cancel
    const canCancel = job.clientId.toString() === req.user._id.toString() ||
                      (job.workerId && job.workerId.toString() === req.user._id.toString());

    if (!canCancel) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    job.status = 'cancelled';
    job.cancelledAt = new Date();
    job.cancellationReason = reason;
    await job.save();

    // If worker cancels, make them available again
    if (job.workerId && job.workerId.toString() === req.user._id.toString()) {
      await User.findByIdAndUpdate(req.user._id, { status: 'available' });
    }

    res.json({ message: 'Job cancelled', job });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 6.2 Matching Controller (`src/controllers/matching.controller.js`)

```javascript
import Job from '../models/Job.model.js';
import User from '../models/User.model.js';
import { calculateDistance } from '../utils/distance.js';

export const findWorker = async (req, res) => {
  try {
    const { jobId } = req.body;
    
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'pending') {
      return res.status(400).json({ error: 'Job already assigned' });
    }

    // Find available workers in the same category
    const workers = await User.find({
      userType: 'worker',
      status: 'available',
      categories: job.category
    });

    if (workers.length === 0) {
      return res.status(404).json({ error: 'No available workers found' });
    }

    // Calculate distances and score workers
    const scoredWorkers = workers.map(worker => {
      const distance = calculateDistance(
        job.location.coordinates,
        worker.location.coordinates
      );

      // Scoring: distance (50%), rating (30%), visibility weight (20%)
      const distanceScore = Math.max(0, 100 - distance * 10);
      const ratingScore = (worker.rating / 5) * 100;
      const visibilityScore = worker.visibilityWeight * 100;

      const totalScore = (distanceScore * 0.5) + (ratingScore * 0.3) + (visibilityScore * 0.2);

      return {
        worker,
        distance,
        score: totalScore
      };
    });

    // Sort by score (highest first)
    scoredWorkers.sort((a, b) => b.score - a.score);

    // Assign to best worker
    const bestMatch = scoredWorkers[0];
    
    job.workerId = bestMatch.worker._id;
    job.status = 'assigned';
    job.distance = bestMatch.distance;
    await job.save();

    await job.populate('clientId workerId');

    res.json({
      message: 'Worker assigned successfully',
      job,
      matchDetails: {
        distance: bestMatch.distance,
        workerRating: bestMatch.worker.rating,
        score: bestMatch.score
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNearbyJobs = async (req, res) => {
  try {
    const { workerId } = req.params;
    const { maxDistance = 10 } = req.query; // Default 10km radius

    const worker = await User.findById(workerId);
    if (!worker || worker.userType !== 'worker') {
      return res.status(404).json({ error: 'Worker not found' });
    }

    // Find pending jobs in worker's categories within radius
    const jobs = await Job.find({
      status: 'pending',
      category: { $in: worker.categories },
      location: {
        $near: {
          $geometry: worker.location,
          $maxDistance: maxDistance * 1000 // Convert km to meters
        }
      }
    })
    .populate('clientId', 'name phone address rating')
    .limit(20);

    // Add distance to each job
    const jobsWithDistance = jobs.map(job => {
      const distance = calculateDistance(
        worker.location.coordinates,
        job.location.coordinates
      );
      return {
        ...job.toObject(),
        distance
      };
    });

    res.json({ jobs: jobsWithDistance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 6.3 Job Routes (`src/routes/job.routes.js`)

```javascript
import express from 'express';
import {
  createJob,
  getMyJobs,
  getJobById,
  acceptJob,
  startJob,
  completeJob,
  cancelJob
} from '../controllers/job.controller.js';
import { authenticate, authorizeUserType } from '../middleware/auth.middleware.js';
import { validateJobCreation } from '../middleware/validation.middleware.js';

const router = express.Router();

router.post('/create', authenticate, authorizeUserType('client'), validateJobCreation, createJob);
router.get('/my-jobs', authenticate, getMyJobs);
router.get('/:jobId', authenticate, getJobById);
router.patch('/:jobId/accept', authenticate, authorizeUserType('worker'), acceptJob);
router.patch('/:jobId/start', authenticate, authorizeUserType('worker'), startJob);
router.patch('/:jobId/complete', authenticate, authorizeUserType('worker'), completeJob);
router.patch('/:jobId/cancel', authenticate, cancelJob);

export default router;
```

### 6.4 Matching Routes (`src/routes/matching.routes.js`)

```javascript
import express from 'express';
import { findWorker, getNearbyJobs } from '../controllers/matching.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/find-worker', authenticate, findWorker);
router.get('/nearby-jobs/:workerId', authenticate, getNearbyJobs);

export default router;
```

---

## Step 7: Review & Payment Routes (Hours 10-12)

### 7.1 Review Controller (`src/controllers/review.controller.js`)

```javascript
import Review from '../models/Review.model.js';
import Job from '../models/Job.model.js';
import User from '../models/User.model.js';

export const submitReview = async (req, res) => {
  try {
    const { jobId, rating, comment } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed jobs' });
    }

    // Determine review type and target user
    let reviewType, forUser;
    
    if (req.user._id.toString() === job.clientId.toString()) {
      reviewType = 'client_to_worker';
      forUser = job.workerId;
      job.workerRating = rating;
      job.workerReview = comment;
    } else if (req.user._id.toString() === job.workerId.toString()) {
      reviewType = 'worker_to_client';
      forUser = job.clientId;
      job.clientRating = rating;
      job.clientReview = comment;
    } else {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Create review
    const review = await Review.create({
      jobId,
      byUser: req.user._id,
      forUser,
      rating,
      comment,
      reviewType
    });

    await job.save();

    // Update user's overall rating
    const targetUser = await User.findById(forUser);
    const allReviews = await Review.find({ forUser });
    
    const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
    targetUser.rating = totalRating / allReviews.length;
    targetUser.totalRatings = allReviews.length;
    targetUser.updateVisibilityWeight();
    
    await targetUser.save();

    res.json({ message: 'Review submitted', review });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getUserReviews = async (req, res) => {
  try {
    const { userId } = req.params;

    const reviews = await Review.find({ forUser: userId })
      .populate('byUser', 'name userType')
      .populate('jobId', 'category description')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 7.2 Payment Controller (`src/controllers/payment.controller.js`)

```javascript
import Transaction from '../models/Transaction.model.js';
import Job from '../models/Job.model.js';

export const createPaymentOrder = async (req, res) => {
  try {
    const { jobId, tip = 0 } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.clientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const amount = job.paymentOffer + tip;

    // Create transaction record
    const transaction = await Transaction.create({
      jobId,
      amount: job.paymentOffer,
      tip,
      mode: 'online',
      status: 'pending'
    });

    // TODO: Integrate Razorpay order creation here
    // For now, return mock order
    res.json({
      message: 'Payment order created',
      transaction,
      order: {
        id: `order_${transaction.transactionId}`,
        amount: amount * 100, // Razorpay expects paise
        currency: 'INR'
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { transactionId, razorpayPaymentId, razorpaySignature } = req.body;

    const transaction = await Transaction.findOne({ transactionId });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // TODO: Verify Razorpay signature
    // For now, mark as completed
    transaction.status = 'completed';
    transaction.razorpayPaymentId = razorpayPaymentId;
    transaction.razorpaySignature = razorpaySignature;
    await transaction.save();

    // Update job payment status
    await Job.findByIdAndUpdate(transaction.jobId, {
      paymentStatus: 'completed',
      paymentMode: 'online',
      tip: transaction.tip
    });

    res.json({ message: 'Payment verified', transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const confirmOfflinePayment = async (req, res) => {
  try {
    const { jobId, tip = 0 } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Only worker can confirm offline payment
    if (job.workerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const transaction = await Transaction.create({
      jobId,
      amount: job.paymentOffer,
      tip,
      mode: 'offline',
      status: 'completed'
    });

    job.paymentStatus = 'completed';
    job.paymentMode = 'offline';
    job.tip = tip;
    await job.save();

    res.json({ message: 'Offline payment confirmed', transaction });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 7.3 Review Routes (`src/routes/review.routes.js`)

```javascript
import express from 'express';
import { submitReview, getUserReviews } from '../controllers/review.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/submit', authenticate, submitReview);
router.get('/user/:userId', getUserReviews);

export default router;
```

### 7.4 Payment Routes (`src/routes/payment.routes.js`)

```javascript
import express from 'express';
import { createPaymentOrder, verifyPayment, confirmOfflinePayment } from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPayment);
router.post('/offline-confirm', authenticate, confirmOfflinePayment);

export default router;
```

---

## Step 8: Category & Voice Routes (Hours 12-14)

### 8.1 Category Controller (`src/controllers/category.controller.js`)

```javascript
import Category from '../models/Category.model.js';

export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true })
      .sort({ occurrenceCount: -1 });

    res.json({ categories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getCategoryStats = async (req, res) => {
  try {
    const stats = await Category.aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: null,
          totalCategories: { $sum: 1 },
          totalOccurrences: { $sum: '$occurrenceCount' }
        }
      }
    ]);

    res.json({ stats: stats[0] || { totalCategories: 0, totalOccurrences: 0 } });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 8.2 Voice Controller (Placeholder) (`src/controllers/voice.controller.js`)

```javascript
import User from '../models/User.model.js';
import { generateToken } from '../utils/jwt.js';

export const authenticateByPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    let user = await User.findOne({ phone });
    
    if (!user) {
      return res.json({ 
        isNewUser: true,
        phone,
        message: 'New user, registration required'
      });
    }

    const token = generateToken(user._id);

    res.json({
      isNewUser: false,
      token,
      user: {
        id: user._id,
        name: user.name,
        userType: user.userType,
        location: user.location,
        categories: user.categories
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const processSpeech = async (req, res) => {
  try {
    const { text, userId } = req.body;

    // TODO: Integrate Sarvam AI for NLP processing
    // For now, return echo
    res.json({
      processedText: text,
      intent: 'unknown',
      entities: []
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const generateSpeech = async (req, res) => {
  try {
    const { text } = req.body;

    // TODO: Integrate Sarvam AI TTS
    // For now, return mock
    res.json({
      audioUrl: 'mock-audio-url',
      text
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### 8.3 Category Routes (`src/routes/category.routes.js`)

```javascript
import express from 'express';
import { getAllCategories, getCategoryStats } from '../controllers/category.controller.js';

const router = express.Router();

router.get('/', getAllCategories);
router.get('/stats', getCategoryStats);

export default router;
```

### 8.4 Voice Routes (`src/routes/voice.routes.js`)

```javascript
import express from 'express';
import { authenticateByPhone, processSpeech, generateSpeech } from '../controllers/voice.controller.js';

const router = express.Router();

router.post('/authenticate', authenticateByPhone);
router.post('/process-speech', processSpeech);
router.post('/generate-speech', generateSpeech);

export default router;
```

---

## Testing Checklist (Hour 14)

### API Testing with Postman/Thunder Client

1. **Authentication**
   - [ ] POST `/api/auth/register` - Register client
   - [ ] POST `/api/auth/register` - Register worker
   - [ ] POST `/api/auth/login` - Login
   - [ ] GET `/api/auth/me` - Get current user

2. **Jobs**
   - [ ] POST `/api/jobs/create` - Create job
   - [ ] GET `/api/jobs/my-jobs` - Get user's jobs
   - [ ] GET `/api/jobs/:jobId` - Get job details

3. **Matching**
   - [ ] POST `/api/matching/find-worker` - Auto-assign worker
   - [ ] GET `/api/matching/nearby-jobs/:workerId` - Get nearby jobs

4. **Job Actions**
   - [ ] PATCH `/api/jobs/:jobId/accept` - Worker accepts job
   - [ ] PATCH `/api/jobs/:jobId/start` - Start job
   - [ ] PATCH `/api/jobs/:jobId/complete` - Complete job

5. **Reviews**
   - [ ] POST `/api/reviews/submit` - Submit rating
   - [ ] GET `/api/reviews/user/:userId` - Get user reviews

6. **Payments**
   - [ ] POST `/api/payments/create-order` - Create payment order
   - [ ] POST `/api/payments/offline-confirm` - Confirm offline payment

7. **Categories**
   - [ ] GET `/api/categories` - List categories
   - [ ] GET `/api/categories/stats` - Category stats

---

## Deliverables

✅ Complete backend infrastructure
✅ MongoDB models with proper indexes
✅ JWT authentication system
✅ Job matching algorithm (distance-based)
✅ All core API endpoints
✅ Category auto-generation
✅ Rating system with visibility weights
✅ Payment flow (online/offline)
✅ Tested and ready for frontend integration

---

## Next Phase

Proceed to **Phase 2: Frontend with Live Backend Integration**
