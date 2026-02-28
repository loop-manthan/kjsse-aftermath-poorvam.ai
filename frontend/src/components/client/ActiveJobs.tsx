import { useEffect } from 'react';
import { useJobs } from '../../context/JobContext';
import { Clock, MapPin, DollarSign, User, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const ActiveJobs = () => {
  const { jobs, fetchJobs, loading } = useJobs();

  useEffect(() => {
    fetchJobs();
  }, []);

  const activeJobs = jobs.filter(
    (job) => ['assigned', 'accepted', 'in_progress'].includes(job.status)
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'accepted':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in_progress':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/70">Loading jobs...</p>
        </div>
      </div>
    );
  }

  if (activeJobs.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8">
        <div className="text-center py-12">
          <Clock size={48} className="mx-auto text-white/40 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Active Jobs</h3>
          <p className="text-white/60">Create a new job to get started</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Active Jobs</h2>

      <div className="space-y-4">
        {activeJobs.map((job) => (
          <div
            key={job._id}
            className="glass-nested rounded-xl p-5 hover:bg-white/10 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-white">{job.description}</h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      job.status
                    )}`}
                  >
                    {job.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                <p className="text-white/60 text-sm">
                  Job ID: {job.jobId}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-white/70">
                <DollarSign size={16} className="text-green-400" />
                <span className="text-sm">₹{job.paymentOffer}</span>
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

              {typeof job.workerId === 'object' && job.workerId && (
                <div className="flex items-center gap-2 text-white/70">
                  <User size={16} className="text-yellow-400" />
                  <span className="text-sm">{job.workerId.name}</span>
                </div>
              )}
            </div>

            {job.status === 'in_progress' && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-sm text-green-400">Worker is on the way!</span>
              </div>
            )}

            {job.status === 'assigned' && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Clock size={16} className="text-yellow-400" />
                <span className="text-sm text-yellow-400">Waiting for worker to accept</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveJobs;
