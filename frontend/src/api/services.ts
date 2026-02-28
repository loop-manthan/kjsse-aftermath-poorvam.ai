import api from './client';
import { AuthResponse, LoginCredentials, RegisterData, User } from '../types/auth';
import { Job, CreateJobData } from '../types/job';

// Auth Services
export const authService = {
  register: (data: RegisterData) => 
    api.post<AuthResponse>('/auth/register', data),
  
  login: (data: LoginCredentials) => 
    api.post<AuthResponse>('/auth/login', data),
  
  getMe: () => 
    api.get<{ user: User }>('/auth/me'),
  
  updateProfile: (data: Partial<User>) => 
    api.patch<{ user: User }>('/auth/profile', data)
};

// Job Services
export const jobService = {
  createJob: (data: CreateJobData) => 
    api.post<{ job: Job }>('/jobs/create', data),
  
  getMyJobs: () => 
    api.get<{ jobs: Job[] }>('/jobs/my-jobs'),
  
  getJobById: (jobId: string) => 
    api.get<{ job: Job }>(`/jobs/${jobId}`),
  
  acceptJob: (jobId: string) => 
    api.patch<{ job: Job }>(`/jobs/${jobId}/accept`),
  
  startJob: (jobId: string) => 
    api.patch<{ job: Job }>(`/jobs/${jobId}/start`),
  
  completeJob: (jobId: string) => 
    api.patch<{ job: Job }>(`/jobs/${jobId}/complete`),
  
  cancelJob: (jobId: string, reason: string) => 
    api.patch<{ job: Job }>(`/jobs/${jobId}/cancel`, { reason })
};

// Matching Services
export const matchingService = {
  findWorker: (jobId: string) => 
    api.post<{ worker: User; job: Job }>('/matching/find-worker', { jobId }),
  
  getNearbyJobs: (workerId: string, maxDistance: number = 10000) => 
    api.get<{ jobs: Job[] }>(`/matching/nearby-jobs/${workerId}?maxDistance=${maxDistance}`)
};

// Review Services
export const reviewService = {
  submitReview: (data: {
    jobId: string;
    forUser: string;
    rating: number;
    comment?: string;
  }) => api.post('/reviews/submit', data),
  
  getUserReviews: (userId: string) => 
    api.get<{ reviews: any[] }>(`/reviews/user/${userId}`)
};

// Payment Services
export const paymentService = {
  createOrder: (data: {
    jobId: string;
    amount: number;
    tip?: number;
  }) => api.post('/payments/create-order', data),
  
  verifyPayment: (data: {
    jobId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => api.post('/payments/verify', data),
  
  confirmOffline: (data: {
    jobId: string;
    amount: number;
    tip?: number;
  }) => api.post('/payments/offline-confirm', data)
};

// Category Services
export const categoryService = {
  getAll: () => 
    api.get<{ categories: any[] }>('/categories'),
  
  getStats: () => 
    api.get<{ stats: any[] }>('/categories/stats')
};
