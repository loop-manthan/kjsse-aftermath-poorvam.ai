import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { jobService, matchingService } from '../api/services';
import toast from 'react-hot-toast';
import { Job, CreateJobData, JobContextType } from '../types/job';

const JobContext = createContext<JobContextType | undefined>(undefined);

export const useJobs = () => {
  const context = useContext(JobContext);
  if (!context) {
    throw new Error('useJobs must be used within JobProvider');
  }
  return context;
};

interface JobProviderProps {
  children: ReactNode;
}

export const JobProvider = ({ children }: JobProviderProps) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

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

  const createJob = async (jobData: CreateJobData): Promise<Job> => {
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

  const acceptJob = async (jobId: string) => {
    try {
      await jobService.acceptJob(jobId);
      await fetchJobs();
      toast.success('Job accepted!');
    } catch (error) {
      throw error;
    }
  };

  const startJob = async (jobId: string) => {
    try {
      await jobService.startJob(jobId);
      await fetchJobs();
      toast.success('Job started!');
    } catch (error) {
      throw error;
    }
  };

  const completeJob = async (jobId: string) => {
    try {
      await jobService.completeJob(jobId);
      await fetchJobs();
      toast.success('Job completed!');
    } catch (error) {
      throw error;
    }
  };

  const cancelJob = async (jobId: string, reason: string) => {
    try {
      await jobService.cancelJob(jobId, reason);
      await fetchJobs();
      toast.success('Job cancelled');
    } catch (error) {
      throw error;
    }
  };

  return (
    <JobContext.Provider
      value={{
        jobs,
        loading,
        selectedJob,
        setSelectedJob,
        fetchJobs,
        createJob,
        acceptJob,
        startJob,
        completeJob,
        cancelJob,
      }}
    >
      {children}
    </JobContext.Provider>
  );
};
