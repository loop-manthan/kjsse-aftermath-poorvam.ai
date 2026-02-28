import api from "./client";
import {
  AuthResponse,
  LoginCredentials,
  RegisterData,
  User,
} from "../types/auth";
import { Job, CreateJobData } from "../types/job";
import { Category, CategoryStats } from "../types/category";

// Auth Services
export const authService = {
  register: (data: RegisterData) =>
    api.post<AuthResponse>("/auth/register", data),

  login: (data: LoginCredentials) =>
    api.post<AuthResponse>("/auth/login", data),

  getMe: () => api.get<{ user: User }>("/auth/me"),

  updateProfile: (data: Partial<User>) =>
    api.patch<{ user: User }>("/auth/profile", data),

  updateAvailability: (isAvailable: boolean) =>
    api.patch<{ user: User; message: string }>("/auth/availability", {
      isAvailable,
    }),
};

// Job Services
export const jobService = {
  createJob: (data: CreateJobData) =>
    api.post<{ job: Job }>("/jobs/create", data),

  getMyJobs: () => api.get<{ jobs: Job[] }>("/jobs/my-jobs"),

  getAvailableJobs: (category?: string, maxDistance?: number) =>
    api.get<{ jobs: Job[] }>("/jobs/available", {
      params: { category, maxDistance },
    }),

  getJobById: (jobId: string) => api.get<{ job: Job }>(`/jobs/${jobId}`),

  applyToJob: (jobId: string, quote?: number) =>
    api.post<{ job: Job; message: string }>(`/jobs/${jobId}/apply`, { quote }),

  acceptJob: (jobId: string) =>
    api.patch<{ job: Job }>(`/jobs/${jobId}/accept`),

  acceptQuote: (jobId: string) =>
    api.patch<{ job: Job; message: string }>(`/jobs/${jobId}/accept-quote`),

  rejectQuote: (jobId: string) =>
    api.patch<{ job: Job; message: string }>(`/jobs/${jobId}/reject-quote`),

  startJob: (jobId: string) => api.patch<{ job: Job }>(`/jobs/${jobId}/start`),

  completeJob: (jobId: string) =>
    api.patch<{ job: Job }>(`/jobs/${jobId}/complete`),

  markPaid: (jobId: string, method: string, transactionId?: string) =>
    api.patch<{ job: Job; message: string }>(`/jobs/${jobId}/mark-paid`, {
      method,
      transactionId,
    }),

  cancelJob: (jobId: string, reason: string) =>
    api.patch<{ job: Job }>(`/jobs/${jobId}/cancel`, { reason }),
};

// Matching Services
export const matchingService = {
  findWorker: (jobId: string) =>
    api.post<{ worker: User; job: Job }>("/matching/find-worker", { jobId }),

  getNearbyJobs: (workerId: string, maxDistance: number = 10000) =>
    api.get<{ jobs: Job[] }>(
      `/matching/nearby-jobs/${workerId}?maxDistance=${maxDistance}`,
    ),

  getNearbyWorkers: (maxDistance: number = 10) =>
    api.get<{ workers: User[] }>(
      `/matching/nearby-workers?maxDistance=${maxDistance}`,
    ),
};

// Review Services
export const reviewService = {
  submitReview: (data: {
    jobId: string;
    forUser: string;
    rating: number;
    comment?: string;
  }) => api.post("/reviews/submit", data),

  getUserReviews: (userId: string) =>
    api.get<{ reviews: any[] }>(`/reviews/user/${userId}`),
};

// Payment Services
export const paymentService = {
  createOrder: (data: { jobId: string; amount: number; tip?: number }) =>
    api.post("/payments/create-order", data),

  verifyPayment: (data: {
    jobId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => api.post("/payments/verify", data),

  confirmOffline: (data: { jobId: string; amount: number; tip?: number }) =>
    api.post("/payments/offline-confirm", data),
};

// Category Services
export const categoryService = {
  getAll: () => api.get<{ categories: Category[] }>("/categories"),

  getStats: () => api.get<{ stats: CategoryStats[] }>("/categories/stats"),
};

// Notification Services
export const notificationService = {
  getNotifications: (limit?: number) =>
    api.get<{ notifications: any[] }>("/notifications", { params: { limit } }),

  getUnreadCount: () =>
    api.get<{ count: number }>("/notifications/unread-count"),

  markAsRead: (notificationId: string) =>
    api.patch(`/notifications/${notificationId}/read`),

  deleteNotification: (notificationId: string) =>
    api.delete(`/notifications/${notificationId}`),
};
