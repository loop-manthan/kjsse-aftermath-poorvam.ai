import { useEffect } from 'react';
import { useJobs } from '../../context/JobContext';
import { Clock, MapPin, DollarSign, User, PlayCircle, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const MyJobs = () => {
  const { jobs, fetchJobs, startJob, completeJob, loading } = useJobs();

  useEffect(() => {
    fetchJobs();
  }, []);

  const myJobs = jobs.filter(
    (job) => ['accepted', 'in_progress'].includes(job.status)
  );

  const handleStartJob = async (jobId: string) => {
    try {
      await startJob(jobId);
    } catch (error) {
      console.error('Error starting job:', error);
    }
  };

  const handleCompleteJob = async (jobId: string) => {
    try {
      await completeJob(jobId);
    } catch (error) {
      console.error('Error completing job:', error);
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/70">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  if (myJobs.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8">
        <div className="text-center py-12">
          <Clock size={48} className="mx-auto text-white/40 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Active Jobs</h3>
          <p className="text-white/60">Accept jobs from the available list to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6 text-white">My Active Jobs</h2>

      <div className="space-y-4">
        {myJobs.map((job) => (
          <div
            key={job._id}
            className="glass-nested rounded-xl p-5 hover:bg-white/10 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{job.description}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${
                      job.status === 'accepted'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-green-500/20 text-green-400 border-green-500/30'
                    }`}
                  >
                    {job.status === 'accepted' ? 'ACCEPTED' : 'IN PROGRESS'}
                  </span>
                </div>
                <p className="text-white/60 text-sm">Job ID: {job.jobId}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-white/70">
                <DollarSign size={16} className="text-green-400" />
                <span className="text-sm font-semibold text-green-400">₹{job.paymentOffer}</span>
              </div>

              <div className="flex items-center gap-2 text-white/70">
                <MapPin size={16} className="text-blue-400" />
                <span className="text-sm truncate">{job.address}</span>
              </div>

              <div className="flex items-center gap-2 text-white/70">
                <Clock size={16} className="text-purple-400" />
                <span className="text-sm">
                  {format(new Date(job.createdAt), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>

              {typeof job.clientId === 'object' && job.clientId && (
                <div className="flex items-center gap-2 text-white/70">
                  <User size={16} className="text-yellow-400" />
                  <span className="text-sm">{job.clientId.name}</span>
                </div>
              )}
            </div>

            {job.status === 'accepted' && (
              <button
                onClick={() => handleStartJob(job._id)}
                className="w-full glass-button rounded-xl py-3 flex items-center justify-center gap-2 text-white bg-blue-500/20 hover:bg-blue-500/30 transition-all"
              >
                <PlayCircle size={18} />
                Start Job
              </button>
            )}

            {job.status === 'in_progress' && (
              <button
                onClick={() => handleCompleteJob(job._id)}
                className="w-full glass-button rounded-xl py-3 flex items-center justify-center gap-2 text-white bg-green-500/20 hover:bg-green-500/30 transition-all"
              >
                <CheckCircle size={18} />
                Mark as Complete
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyJobs;
