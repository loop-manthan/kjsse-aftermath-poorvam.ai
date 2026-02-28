# Phase 2: Frontend with Live Backend Integration

This phase builds the complete React frontend with direct integration to backend APIs, implementing all user interfaces for clients and workers.

## Timeline: Hours 14-28

## Objectives

- Set up React project structure with routing
- Implement authentication flows (login/register)
- Build client dashboard with job creation and tracking
- Build worker dashboard with job acceptance and management
- Integrate all backend APIs
- Implement real-time job status updates
- Create reusable components and context providers

---

## Step 1: Project Setup & Configuration (Hour 14-15)

### 1.1 Install Additional Dependencies

```bash
cd frontend
npm install axios react-hook-form @hookform/resolvers zod
```

### 1.2 API Client Setup (`src/api/client.js`)

```javascript
import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.data?.error) {
      toast.error(error.response.data.error);
    } else {
      toast.error('Something went wrong. Please try again.');
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 1.3 API Service Functions (`src/api/services.js`)

```javascript
import api from './client';

// Auth Services
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  updateProfile: (data) => api.patch('/auth/profile', data)
};

// Job Services
export const jobService = {
  createJob: (data) => api.post('/jobs/create', data),
  getMyJobs: () => api.get('/jobs/my-jobs'),
  getJobById: (jobId) => api.get(`/jobs/${jobId}`),
  acceptJob: (jobId) => api.patch(`/jobs/${jobId}/accept`),
  startJob: (jobId) => api.patch(`/jobs/${jobId}/start`),
  completeJob: (jobId) => api.patch(`/jobs/${jobId}/complete`),
  cancelJob: (jobId, reason) => api.patch(`/jobs/${jobId}/cancel`, { reason })
};

// Matching Services
export const matchingService = {
  findWorker: (jobId) => api.post('/matching/find-worker', { jobId }),
  getNearbyJobs: (workerId, maxDistance) => 
    api.get(`/matching/nearby-jobs/${workerId}?maxDistance=${maxDistance}`)
};

// Review Services
export const reviewService = {
  submitReview: (data) => api.post('/reviews/submit', data),
  getUserReviews: (userId) => api.get(`/reviews/user/${userId}`)
};

// Payment Services
export const paymentService = {
  createOrder: (data) => api.post('/payments/create-order', data),
  verifyPayment: (data) => api.post('/payments/verify', data),
  confirmOffline: (data) => api.post('/payments/offline-confirm', data)
};

// Category Services
export const categoryService = {
  getAll: () => api.get('/categories'),
  getStats: () => api.get('/categories/stats')
};
```

### 1.4 Environment Variables (`.env`)

```
VITE_API_URL=http://localhost:5000/api
VITE_RAZORPAY_KEY=<razorpay-key>
```

---

## Step 2: Context & State Management (Hour 15-16)

### 2.1 Auth Context (`src/context/AuthContext.jsx`)

```javascript
import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../api/services';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const { data } = await authService.getMe();
      setUser(data.user);
    } catch (error) {
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const { data } = await authService.login(credentials);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      toast.success('Login successful!');
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await authService.register(userData);
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      toast.success('Registration successful!');
      return data.user;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateUser = async (updates) => {
    try {
      const { data } = await authService.updateProfile(updates);
      setUser(data.user);
      toast.success('Profile updated');
    } catch (error) {
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      register, 
      logout, 
      updateUser,
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 2.2 Job Context (`src/context/JobContext.jsx`)

```javascript
import { createContext, useContext, useState, useCallback } from 'react';
import { jobService, matchingService } from '../api/services';
import toast from 'react-hot-toast';

const JobContext = createContext();

export const useJobs = () => {
  const context = useContext(JobContext);
  if (!context) throw new Error('useJobs must be used within JobProvider');
  return context;
};

export const JobProvider = ({ children }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await jobService.getMyJobs();
      setJobs(data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const createJob = async (jobData) => {
    try {
      const { data } = await jobService.createJob(jobData);
      
      // Auto-assign worker
      await matchingService.findWorker(data.job._id);
      
      await fetchJobs();
      toast.success('Job created and worker assigned!');
      return data.job;
    } catch (error) {
      throw error;
    }
  };

  const acceptJob = async (jobId) => {
    try {
      await jobService.acceptJob(jobId);
      await fetchJobs();
      toast.success('Job accepted!');
    } catch (error) {
      throw error;
    }
  };

  const startJob = async (jobId) => {
    try {
      await jobService.startJob(jobId);
      await fetchJobs();
      toast.success('Job started!');
    } catch (error) {
      throw error;
    }
  };

  const completeJob = async (jobId) => {
    try {
      await jobService.completeJob(jobId);
      await fetchJobs();
      toast.success('Job completed!');
    } catch (error) {
      throw error;
    }
  };

  const cancelJob = async (jobId, reason) => {
    try {
      await jobService.cancelJob(jobId, reason);
      await fetchJobs();
      toast.success('Job cancelled');
    } catch (error) {
      throw error;
    }
  };

  return (
    <JobContext.Provider value={{
      jobs,
      loading,
      selectedJob,
      setSelectedJob,
      fetchJobs,
      createJob,
      acceptJob,
      startJob,
      completeJob,
      cancelJob
    }}>
      {children}
    </JobContext.Provider>
  );
};
```

---

## Step 3: Routing & Layout (Hour 16-17)

### 3.1 Router Setup (`src/App.jsx`)

```javascript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { JobProvider } from './context/JobContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import ClientDashboard from './pages/ClientDashboard';
import WorkerDashboard from './pages/WorkerDashboard';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <JobProvider>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            <Route path="/client/*" element={
              <ProtectedRoute userType="client">
                <ClientDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/worker/*" element={
              <ProtectedRoute userType="worker">
                <WorkerDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </JobProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
```

### 3.2 Protected Route Component (`src/components/ProtectedRoute.jsx`)

```javascript
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, userType }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (userType && user.userType !== userType) {
    return <Navigate to={`/${user.userType}`} replace />;
  }

  return children;
};

export default ProtectedRoute;
```

---

## Step 4: Authentication Pages (Hour 17-19)

### 4.1 Login Page (`src/pages/Login.jsx`)

```javascript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Phone, Lock } from 'lucide-react';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const user = await login({ phone, password });
      navigate(`/${user.userType}`);
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-3xl font-bold text-center mb-6">
            Welcome to Poorvam.ai
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Phone Number</span>
              </label>
              <div className="input input-bordered flex items-center gap-2">
                <Phone size={20} />
                <input
                  type="tel"
                  placeholder="10-digit phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="grow"
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <div className="input input-bordered flex items-center gap-2">
                <Lock size={20} />
                <input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="grow"
                  required
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner"></span> : 'Login'}
            </button>
          </form>

          <div className="divider">OR</div>

          <p className="text-center">
            Don't have an account?{' '}
            <Link to="/register" className="link link-primary">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
```

### 4.2 Register Page (`src/pages/Register.jsx`)

```javascript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, Lock, MapPin, Briefcase } from 'lucide-react';

const Register = () => {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    location: { coordinates: [0, 0] },
    categories: []
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleUserTypeSelect = (type) => {
    setUserType(type);
    setStep(2);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationCapture = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            location: {
              type: 'Point',
              coordinates: [position.coords.longitude, position.coords.latitude]
            }
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Please enable location access');
        }
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData = { ...formData, userType };
      const user = await register(userData);
      navigate(`/${user.userType}`);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
        <div className="card w-full max-w-2xl bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-3xl font-bold text-center mb-6">
              Join Poorvam.ai
            </h2>
            <p className="text-center mb-8">Select your account type</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div 
                onClick={() => handleUserTypeSelect('client')}
                className="card bg-primary text-primary-content cursor-pointer hover:shadow-2xl transition-all"
              >
                <div className="card-body items-center text-center">
                  <User size={48} />
                  <h3 className="card-title">I need help</h3>
                  <p>Register as a Client to find workers for your tasks</p>
                </div>
              </div>

              <div 
                onClick={() => handleUserTypeSelect('worker')}
                className="card bg-secondary text-secondary-content cursor-pointer hover:shadow-2xl transition-all"
              >
                <div className="card-body items-center text-center">
                  <Briefcase size={48} />
                  <h3 className="card-title">I offer services</h3>
                  <p>Register as a Worker to accept jobs and earn money</p>
                </div>
              </div>
            </div>

            <p className="text-center mt-6">
              Already have an account?{' '}
              <Link to="/login" className="link link-primary">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-200 flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold text-center mb-4">
            Register as {userType === 'client' ? 'Client' : 'Worker'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Full Name</span>
              </label>
              <div className="input input-bordered flex items-center gap-2">
                <User size={20} />
                <input
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className="grow"
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Phone Number</span>
              </label>
              <div className="input input-bordered flex items-center gap-2">
                <Phone size={20} />
                <input
                  type="tel"
                  name="phone"
                  placeholder="10-digit phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="grow"
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Email (Optional)</span>
              </label>
              <div className="input input-bordered flex items-center gap-2">
                <Mail size={20} />
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="grow"
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <div className="input input-bordered flex items-center gap-2">
                <Lock size={20} />
                <input
                  type="password"
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  className="grow"
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Address</span>
              </label>
              <div className="input input-bordered flex items-center gap-2">
                <MapPin size={20} />
                <input
                  type="text"
                  name="address"
                  placeholder="Your address"
                  value={formData.address}
                  onChange={handleChange}
                  className="grow"
                  required
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleLocationCapture}
              className="btn btn-outline btn-sm w-full"
            >
              <MapPin size={16} />
              Capture Current Location
            </button>

            {userType === 'worker' && (
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Skills/Categories</span>
                </label>
                <input
                  type="text"
                  name="categories"
                  placeholder="e.g., plumber, electrician"
                  onChange={(e) => setFormData({
                    ...formData,
                    categories: e.target.value.split(',').map(c => c.trim())
                  })}
                  className="input input-bordered"
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-outline flex-1"
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={loading}
              >
                {loading ? <span className="loading loading-spinner"></span> : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
```

---

## Step 5: Client Dashboard (Hour 19-22)

### 5.1 Client Dashboard Layout (`src/pages/ClientDashboard.jsx`)

```javascript
import { useEffect, useState } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobContext';
import { Plus, List, History, LogOut, User } from 'lucide-react';
import CreateJob from '../components/client/CreateJob';
import ActiveJobs from '../components/client/ActiveJobs';
import JobHistory from '../components/client/JobHistory';

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const { fetchJobs } = useJobs();

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <h1 className="text-xl font-bold ml-4">Poorvam.ai - Client</h1>
        </div>
        <div className="flex-none gap-2">
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full bg-primary text-primary-content flex items-center justify-center">
                <User size={24} />
              </div>
            </label>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li className="menu-title">{user?.name}</li>
              <li><a onClick={logout}><LogOut size={16} />Logout</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="drawer lg:drawer-open">
        <input id="drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content">
          {/* Main content */}
          <div className="p-6">
            <Routes>
              <Route path="/" element={<CreateJob />} />
              <Route path="/active" element={<ActiveJobs />} />
              <Route path="/history" element={<JobHistory />} />
            </Routes>
          </div>
        </div>
        
        <div className="drawer-side">
          <label htmlFor="drawer" className="drawer-overlay"></label>
          <ul className="menu p-4 w-64 min-h-full bg-base-100 text-base-content">
            <li>
              <NavLink to="/client" end className={({ isActive }) => isActive ? 'active' : ''}>
                <Plus size={20} />
                Create Job
              </NavLink>
            </li>
            <li>
              <NavLink to="/client/active" className={({ isActive }) => isActive ? 'active' : ''}>
                <List size={20} />
                Active Jobs
              </NavLink>
            </li>
            <li>
              <NavLink to="/client/history" className={({ isActive }) => isActive ? 'active' : ''}>
                <History size={20} />
                Job History
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
```

### 5.2 Create Job Component (`src/components/client/CreateJob.jsx`)

```javascript
import { useState } from 'react';
import { useJobs } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import { MapPin, DollarSign, FileText } from 'lucide-react';

const CreateJob = () => {
  const { user } = useAuth();
  const { createJob } = useJobs();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    paymentOffer: '',
    address: user?.address || '',
    location: user?.location || { coordinates: [0, 0] }
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await createJob({
        ...formData,
        paymentOffer: parseFloat(formData.paymentOffer),
        location: {
          type: 'Point',
          coordinates: formData.location.coordinates
        }
      });
      
      // Reset form
      setFormData({
        description: '',
        paymentOffer: '',
        address: user?.address || '',
        location: user?.location || { coordinates: [0, 0] }
      });
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setLoading(false);
    }
  };

  const captureLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            location: {
              type: 'Point',
              coordinates: [position.coords.longitude, position.coords.latitude]
            }
          });
        }
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-4">Create New Job</h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Describe your problem</span>
              </label>
              <div className="flex items-start gap-2">
                <FileText size={20} className="mt-3" />
                <textarea
                  className="textarea textarea-bordered w-full"
                  placeholder="e.g., My geyser is not working, need urgent repair"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Payment Offer (₹)</span>
              </label>
              <div className="input input-bordered flex items-center gap-2">
                <DollarSign size={20} />
                <input
                  type="number"
                  placeholder="Amount you're willing to pay"
                  value={formData.paymentOffer}
                  onChange={(e) => setFormData({ ...formData, paymentOffer: e.target.value })}
                  className="grow"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Address</span>
              </label>
              <div className="input input-bordered flex items-center gap-2">
                <MapPin size={20} />
                <input
                  type="text"
                  placeholder="Job location address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="grow"
                  required
                />
              </div>
            </div>

            <button
              type="button"
              onClick={captureLocation}
              className="btn btn-outline btn-sm w-full"
            >
              <MapPin size={16} />
              Use Current Location
            </button>

            <button
              type="submit"
              className="btn btn-primary w-full"
              disabled={loading}
            >
              {loading ? <span className="loading loading-spinner"></span> : 'Create Job & Find Worker'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateJob;
```

### 5.3 Active Jobs Component (`src/components/client/ActiveJobs.jsx`)

```javascript
import { useJobs } from '../../context/JobContext';
import { MapPin, DollarSign, User, Phone, Star } from 'lucide-react';
import { useState } from 'react';
import RatingModal from '../shared/RatingModal';

const ActiveJobs = () => {
  const { jobs, loading, cancelJob } = useJobs();
  const [selectedJob, setSelectedJob] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const activeJobs = jobs.filter(job => 
    ['assigned', 'accepted', 'in_progress'].includes(job.status)
  );

  const handleCancel = async (jobId) => {
    if (confirm('Are you sure you want to cancel this job?')) {
      const reason = prompt('Please provide a reason for cancellation:');
      if (reason) {
        await cancelJob(jobId, reason);
      }
    }
  };

  const handleRate = (job) => {
    setSelectedJob(job);
    setShowRatingModal(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  if (activeJobs.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-lg">No active jobs</p>
        <p className="text-sm text-gray-500">Create a new job to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Active Jobs</h2>
      
      {activeJobs.map(job => (
        <div key={job._id} className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="badge badge-primary mb-2">{job.category}</div>
                <h3 className="font-bold text-lg">{job.description}</h3>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={16} />
                    <span>{job.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign size={16} />
                    <span>₹{job.paymentOffer}</span>
                  </div>
                  {job.distance && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={16} />
                      <span>{job.distance} km away</span>
                    </div>
                  )}
                </div>

                {job.workerId && (
                  <div className="mt-4 p-4 bg-base-200 rounded-lg">
                    <p className="font-semibold mb-2">Assigned Worker:</p>
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>{job.workerId.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={16} />
                      <span>{job.workerId.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Star size={16} className="fill-yellow-400 text-yellow-400" />
                      <span>{job.workerId.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <div className={`badge ${
                  job.status === 'assigned' ? 'badge-warning' :
                  job.status === 'accepted' ? 'badge-info' :
                  'badge-success'
                }`}>
                  {job.status}
                </div>
              </div>
            </div>

            <div className="card-actions justify-end mt-4">
              {job.status === 'completed' && !job.workerRating && (
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => handleRate(job)}
                >
                  Rate Worker
                </button>
              )}
              {job.status !== 'completed' && (
                <button 
                  className="btn btn-error btn-sm"
                  onClick={() => handleCancel(job._id)}
                >
                  Cancel Job
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {showRatingModal && (
        <RatingModal
          job={selectedJob}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
};

export default ActiveJobs;
```

---

## Step 6: Worker Dashboard (Hour 22-25)

### 6.1 Worker Dashboard Layout (`src/pages/WorkerDashboard.jsx`)

```javascript
import { useEffect } from 'react';
import { Routes, Route, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useJobs } from '../context/JobContext';
import { List, CheckCircle, History, LogOut, User, ToggleLeft, ToggleRight } from 'lucide-react';
import AssignedJobs from '../components/worker/AssignedJobs';
import ActiveJobs from '../components/worker/ActiveJobs';
import JobHistory from '../components/worker/JobHistory';

const WorkerDashboard = () => {
  const { user, updateUser } = useAuth();
  const { fetchJobs } = useJobs();

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const toggleAvailability = async () => {
    const newStatus = user.status === 'available' ? 'offline' : 'available';
    await updateUser({ status: newStatus });
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navbar */}
      <div className="navbar bg-base-100 shadow-lg">
        <div className="flex-1">
          <h1 className="text-xl font-bold ml-4">Poorvam.ai - Worker</h1>
        </div>
        <div className="flex-none gap-2">
          <button 
            onClick={toggleAvailability}
            className={`btn btn-sm ${user?.status === 'available' ? 'btn-success' : 'btn-error'}`}
          >
            {user?.status === 'available' ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
            {user?.status === 'available' ? 'Available' : 'Offline'}
          </button>
          
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full bg-secondary text-secondary-content flex items-center justify-center">
                <User size={24} />
              </div>
            </label>
            <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52">
              <li className="menu-title">{user?.name}</li>
              <li><span>Rating: {user?.rating?.toFixed(1)} ⭐</span></li>
              <li><a onClick={() => {}}><LogOut size={16} />Logout</a></li>
            </ul>
          </div>
        </div>
      </div>

      <div className="drawer lg:drawer-open">
        <input id="drawer" type="checkbox" className="drawer-toggle" />
        <div className="drawer-content">
          <div className="p-6">
            <Routes>
              <Route path="/" element={<AssignedJobs />} />
              <Route path="/active" element={<ActiveJobs />} />
              <Route path="/history" element={<JobHistory />} />
            </Routes>
          </div>
        </div>
        
        <div className="drawer-side">
          <label htmlFor="drawer" className="drawer-overlay"></label>
          <ul className="menu p-4 w-64 min-h-full bg-base-100 text-base-content">
            <li>
              <NavLink to="/worker" end className={({ isActive }) => isActive ? 'active' : ''}>
                <List size={20} />
                Assigned Jobs
              </NavLink>
            </li>
            <li>
              <NavLink to="/worker/active" className={({ isActive }) => isActive ? 'active' : ''}>
                <CheckCircle size={20} />
                Active Jobs
              </NavLink>
            </li>
            <li>
              <NavLink to="/worker/history" className={({ isActive }) => isActive ? 'active' : ''}>
                <History size={20} />
                Job History
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
```

### 6.2 Assigned Jobs Component (`src/components/worker/AssignedJobs.jsx`)

```javascript
import { useJobs } from '../../context/JobContext';
import { MapPin, DollarSign, User, Phone } from 'lucide-react';

const AssignedJobs = () => {
  const { jobs, loading, acceptJob } = useJobs();

  const assignedJobs = jobs.filter(job => job.status === 'assigned');

  const handleAccept = async (jobId) => {
    await acceptJob(jobId);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  if (assignedJobs.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-lg">No assigned jobs</p>
        <p className="text-sm text-gray-500">Jobs will appear here when clients need your services</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Assigned Jobs</h2>
      
      {assignedJobs.map(job => (
        <div key={job._id} className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="badge badge-warning mb-2">{job.category}</div>
                <h3 className="font-bold text-lg">{job.description}</h3>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={16} />
                    <span>{job.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign size={16} />
                    <span className="font-semibold text-success">₹{job.paymentOffer}</span>
                  </div>
                  {job.distance && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin size={16} />
                      <span>{job.distance} km away</span>
                    </div>
                  )}
                </div>

                {job.clientId && (
                  <div className="mt-4 p-4 bg-base-200 rounded-lg">
                    <p className="font-semibold mb-2">Client Details:</p>
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>{job.clientId.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={16} />
                      <span>{job.clientId.phone}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="card-actions justify-end mt-4">
              <button 
                className="btn btn-success"
                onClick={() => handleAccept(job._id)}
              >
                Accept Job
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default AssignedJobs;
```

### 6.3 Worker Active Jobs (`src/components/worker/ActiveJobs.jsx`)

```javascript
import { useState } from 'react';
import { useJobs } from '../../context/JobContext';
import { MapPin, DollarSign, User, Phone } from 'lucide-react';
import RatingModal from '../shared/RatingModal';

const ActiveJobs = () => {
  const { jobs, loading, startJob, completeJob } = useJobs();
  const [selectedJob, setSelectedJob] = useState(null);
  const [showRatingModal, setShowRatingModal] = useState(false);

  const activeJobs = jobs.filter(job => 
    ['accepted', 'in_progress'].includes(job.status)
  );

  const handleStart = async (jobId) => {
    await startJob(jobId);
  };

  const handleComplete = async (jobId) => {
    if (confirm('Mark this job as completed?')) {
      await completeJob(jobId);
    }
  };

  const handleRate = (job) => {
    setSelectedJob(job);
    setShowRatingModal(true);
  };

  if (loading) {
    return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  if (activeJobs.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-lg">No active jobs</p>
        <p className="text-sm text-gray-500">Accept assigned jobs to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Active Jobs</h2>
      
      {activeJobs.map(job => (
        <div key={job._id} className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="badge badge-info mb-2">{job.category}</div>
                <h3 className="font-bold text-lg">{job.description}</h3>
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin size={16} />
                    <span>{job.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <DollarSign size={16} />
                    <span className="font-semibold text-success">₹{job.paymentOffer}</span>
                  </div>
                </div>

                {job.clientId && (
                  <div className="mt-4 p-4 bg-base-200 rounded-lg">
                    <p className="font-semibold mb-2">Client:</p>
                    <div className="flex items-center gap-2">
                      <User size={16} />
                      <span>{job.clientId.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone size={16} />
                      <span>{job.clientId.phone}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className={`badge ${
                job.status === 'accepted' ? 'badge-info' : 'badge-success'
              }`}>
                {job.status}
              </div>
            </div>

            <div className="card-actions justify-end mt-4">
              {job.status === 'accepted' && (
                <button 
                  className="btn btn-primary"
                  onClick={() => handleStart(job._id)}
                >
                  Start Job
                </button>
              )}
              {job.status === 'in_progress' && (
                <button 
                  className="btn btn-success"
                  onClick={() => handleComplete(job._id)}
                >
                  Mark Complete
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {showRatingModal && (
        <RatingModal
          job={selectedJob}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedJob(null);
          }}
        />
      )}
    </div>
  );
};

export default ActiveJobs;
```

---

## Step 7: Shared Components (Hour 25-27)

### 7.1 Rating Modal (`src/components/shared/RatingModal.jsx`)

```javascript
import { useState } from 'react';
import { reviewService } from '../../api/services';
import { useJobs } from '../../context/JobContext';
import { Star } from 'lucide-react';
import toast from 'react-hot-toast';

const RatingModal = ({ job, onClose }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const { fetchJobs } = useJobs();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await reviewService.submitReview({
        jobId: job._id,
        rating,
        comment
      });
      
      toast.success('Rating submitted successfully');
      await fetchJobs();
      onClose();
    } catch (error) {
      console.error('Error submitting rating:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">Rate this job</h3>
        
        <form onSubmit={handleSubmit}>
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Rating</span>
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="btn btn-ghost btn-sm"
                >
                  <Star
                    size={32}
                    className={star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text">Comment (Optional)</span>
            </label>
            <textarea
              className="textarea textarea-bordered"
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
            />
          </div>

          <div className="modal-action">
            <button type="button" className="btn" onClick={onClose}>
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={rating === 0 || loading}
            >
              {loading ? <span className="loading loading-spinner"></span> : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RatingModal;
```

### 7.2 Job History Component (Shared) (`src/components/shared/JobHistory.jsx`)

```javascript
import { useJobs } from '../../context/JobContext';
import { MapPin, DollarSign, Calendar, Star } from 'lucide-react';

const JobHistory = () => {
  const { jobs, loading } = useJobs();

  const completedJobs = jobs.filter(job => 
    ['completed', 'cancelled'].includes(job.status)
  );

  if (loading) {
    return <div className="flex justify-center p-8"><span className="loading loading-spinner loading-lg"></span></div>;
  }

  if (completedJobs.length === 0) {
    return (
      <div className="text-center p-8">
        <p className="text-lg">No job history</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Job History</h2>
      
      {completedJobs.map(job => (
        <div key={job._id} className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="badge badge-neutral mb-2">{job.category}</div>
                <h3 className="font-bold text-lg">{job.description}</h3>
                
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>{job.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign size={16} />
                    <span>₹{job.paymentOffer}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>{new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                  {job.workerRating && (
                    <div className="flex items-center gap-2">
                      <Star size={16} className="fill-yellow-400 text-yellow-400" />
                      <span>Rating: {job.workerRating}/5</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={`badge ${
                job.status === 'completed' ? 'badge-success' : 'badge-error'
              }`}>
                {job.status}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default JobHistory;
```

---

## Step 8: Landing Page (Hour 27-28)

### 8.1 Landing Page (`src/pages/LandingPage.jsx`)

```javascript
import { Link } from 'react-router-dom';
import { Zap, Users, MapPin, Star } from 'lucide-react';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary to-secondary">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center text-white mb-16">
          <h1 className="text-6xl font-bold mb-4">Poorvam.ai</h1>
          <p className="text-2xl mb-8">AI-Powered Service Marketplace</p>
          <p className="text-lg mb-8">Connect with skilled workers instantly</p>
          
          <div className="flex gap-4 justify-center">
            <Link to="/register" className="btn btn-lg btn-accent">
              Get Started
            </Link>
            <Link to="/login" className="btn btn-lg btn-outline btn-accent">
              Login
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-8 text-white">
          <div className="text-center">
            <Zap size={48} className="mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Instant Matching</h3>
            <p>AI-powered worker assignment in seconds</p>
          </div>
          <div className="text-center">
            <MapPin size={48} className="mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Location-Based</h3>
            <p>Find workers nearest to you</p>
          </div>
          <div className="text-center">
            <Star size={48} className="mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Rated Workers</h3>
            <p>Quality assured through ratings</p>
          </div>
          <div className="text-center">
            <Users size={48} className="mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Voice Support</h3>
            <p>Call and get help instantly</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
```

---

## Testing Checklist (Hour 28)

### Frontend Testing

1. **Authentication**
   - [ ] Register as client
   - [ ] Register as worker
   - [ ] Login with credentials
   - [ ] Logout functionality
   - [ ] Protected routes redirect

2. **Client Flow**
   - [ ] Create job with description and payment
   - [ ] View assigned worker details
   - [ ] See job status updates
   - [ ] Rate worker after completion
   - [ ] View job history

3. **Worker Flow**
   - [ ] View assigned jobs
   - [ ] Accept job
   - [ ] Start job
   - [ ] Complete job
   - [ ] Toggle availability status
   - [ ] View job history

4. **UI/UX**
   - [ ] Responsive design works
   - [ ] Toast notifications appear
   - [ ] Loading states display
   - [ ] Forms validate properly
   - [ ] Navigation works smoothly

---

## Deliverables

✅ Complete React frontend with routing
✅ Authentication pages (login/register)
✅ Client dashboard with job creation and tracking
✅ Worker dashboard with job management
✅ Real-time API integration
✅ Context-based state management
✅ Responsive UI with DaisyUI
✅ Rating system
✅ Job history views
✅ Location capture functionality

---

## Next Phase

Proceed to **Phase 3: Voice Interface Integration with Sarvam AI and LiveKit**
