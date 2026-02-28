import { useState, useEffect } from 'react';
import { matchingService } from '../../api/services';
import { useAuth } from '../../context/AuthContext';
import { useJobs } from '../../context/JobContext';
import { MapPin, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const AvailableJobs = () => {
  const { user } = useAuth();
  const { acceptJob } = useJobs();
  const [nearbyJobs, setNearbyJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [acceptingJobId, setAcceptingJobId] = useState<string | null>(null);

  useEffect(() => {
    fetchNearbyJobs();
  }, []);

  const fetchNearbyJobs = async () => {
    if (!user) return;
    
    try {
      const { data } = await matchingService.getNearbyJobs(user._id, 10000);
      setNearbyJobs(data.jobs);
    } catch (error) {
      console.error('Error fetching nearby jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptJob = async (jobId: string) => {
    setAcceptingJobId(jobId);
    try {
      await acceptJob(jobId);
      await fetchNearbyJobs();
    } catch (error) {
      console.error('Error accepting job:', error);
    } finally {
      setAcceptingJobId(null);
    }
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
          <p className="text-white/70">Finding jobs near you...</p>
        </div>
      </div>
    );
  }

  if (nearbyJobs.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-8">
        <div className="text-center py-12">
          <MapPin size={48} className="mx-auto text-white/40 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Jobs Available</h3>
          <p className="text-white/60">Check back later for new opportunities</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Available Jobs Near You</h2>

      <div className="space-y-4">
        {nearbyJobs.map((job) => (
          <div
            key={job._id}
            className="glass-nested rounded-xl p-5 hover:bg-white/10 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{job.description}</h3>
                <p className="text-white/60 text-sm">Job ID: {job.jobId}</p>
              </div>
              {job.distance && (
                <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {(job.distance / 1000).toFixed(1)} km away
                </span>
              )}
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
                  {format(new Date(job.createdAt), 'MMM dd, HH:mm')}
                </span>
              </div>

              {typeof job.clientId === 'object' && job.clientId && (
                <div className="flex items-center gap-2 text-white/70">
                  <span className="text-sm">Client: {job.clientId.name}</span>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => handleAcceptJob(job._id)}
                disabled={acceptingJobId === job._id}
                className="flex-1 glass-button rounded-xl py-3 flex items-center justify-center gap-2 text-white bg-green-500/20 hover:bg-green-500/30 transition-all disabled:opacity-50"
              >
                <CheckCircle size={18} />
                {acceptingJobId === job._id ? 'Accepting...' : 'Accept Job'}
              </button>
              
              <button className="glass-button rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-white hover:bg-red-500/20 transition-all">
                <XCircle size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AvailableJobs;
