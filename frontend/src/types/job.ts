export interface Job {
  _id: string;
  jobId: string;
  clientId: string | {
    _id: string;
    name: string;
    phone: string;
    address: string;
  };
  workerId?: string | {
    _id: string;
    name: string;
    phone: string;
    rating: number;
  };
  description: string;
  category: string;
  paymentOffer: number;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: string;
  status: 'pending' | 'assigned' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  distance?: number;
  createdAt: string;
  assignedAt?: string;
  acceptedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  paymentStatus: 'pending' | 'completed' | 'refunded';
  paymentMode?: 'online' | 'offline';
  tip?: number;
  workerRating?: number;
  clientRating?: number;
  updatedAt: string;
}

export interface CreateJobData {
  description: string;
  paymentOffer: number;
  location: {
    type: 'Point';
    coordinates: [number, number];
  };
  address: string;
}

export interface JobContextType {
  jobs: Job[];
  loading: boolean;
  selectedJob: Job | null;
  setSelectedJob: (job: Job | null) => void;
  fetchJobs: () => Promise<void>;
  createJob: (jobData: CreateJobData) => Promise<Job>;
  acceptJob: (jobId: string) => Promise<void>;
  startJob: (jobId: string) => Promise<void>;
  completeJob: (jobId: string) => Promise<void>;
  cancelJob: (jobId: string, reason: string) => Promise<void>;
}
