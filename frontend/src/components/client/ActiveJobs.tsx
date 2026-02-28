import { useEffect, useState } from "react";
import { useJobs } from "../../context/JobContext";
import {
  Clock,
  MapPin,
  DollarSign,
  User,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { jobService } from "../../api/services";
import toast from "react-hot-toast";

const ActiveJobs = () => {
  const { jobs, fetchJobs, loading } = useJobs();
  const [actioningJobId, setActioningJobId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 10000);
    return () => clearInterval(interval);
  }, []);

  const activeJobs = jobs.filter((job) =>
    [
      "assigned",
      "accepted",
      "in_progress",
      "negotiating",
      "completed",
    ].includes(job.status),
  );

  const handleAcceptQuote = async (jobId: string) => {
    setActioningJobId(jobId);
    try {
      await jobService.acceptQuote(jobId);
      toast.success("Quote accepted! Worker will start soon.");
      await fetchJobs();
    } catch (error: any) {
      console.error("Error accepting quote:", error);
      toast.error(error.response?.data?.error || "Failed to accept quote");
    } finally {
      setActioningJobId(null);
    }
  };

  const handleRejectQuote = async (jobId: string) => {
    setActioningJobId(jobId);
    try {
      await jobService.rejectQuote(jobId);
      toast.success("Quote rejected. Job is now available for other workers.");
      await fetchJobs();
    } catch (error: any) {
      console.error("Error rejecting quote:", error);
      toast.error(error.response?.data?.error || "Failed to reject quote");
    } finally {
      setActioningJobId(null);
    }
  };

  const handleMarkPaid = async (method: string) => {
    if (!selectedJob) return;

    setActioningJobId(selectedJob._id);
    try {
      await jobService.markPaid(selectedJob._id, method);
      toast.success("Payment marked as completed!");
      setShowPaymentModal(false);
      setSelectedJob(null);
      await fetchJobs();
    } catch (error: any) {
      console.error("Error marking payment:", error);
      toast.error(error.response?.data?.error || "Failed to mark payment");
    } finally {
      setActioningJobId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "negotiating":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "assigned":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "accepted":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "in_progress":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "completed":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
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
          <h3 className="text-xl font-semibold text-white mb-2">
            No Active Jobs
          </h3>
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
                  <h3 className="text-lg font-semibold text-white">
                    {job.description}
                  </h3>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                      job.status,
                    )}`}
                  >
                    {job.status.replace("_", " ").toUpperCase()}
                  </span>
                </div>
                <p className="text-white/60 text-sm">Job ID: {job.jobId}</p>
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
                  {format(new Date(job.createdAt), "MMM dd, yyyy HH:mm")}
                </span>
              </div>

              {typeof job.workerId === "object" && job.workerId && (
                <div className="flex items-center gap-2 text-white/70">
                  <User size={16} className="text-yellow-400" />
                  <span className="text-sm">{job.workerId.name}</span>
                </div>
              )}
            </div>

            {job.status === "negotiating" && job.pricing && (
              <div className="glass-nested rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 text-orange-400">
                  <AlertCircle size={16} />
                  <span className="text-sm font-semibold">
                    Counter-Offer Received
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-white/60 mb-1">Your Budget</p>
                    <p className="text-lg font-bold text-white">
                      ₹{job.pricing.clientBudget}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 mb-1">Worker's Quote</p>
                    <p className="text-lg font-bold text-blue-400">
                      ₹{job.pricing.workerQuote}
                    </p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => handleAcceptQuote(job._id)}
                    disabled={actioningJobId === job._id}
                    className="flex-1 glass-button rounded-xl py-2 bg-green-500/20 hover:bg-green-500/30 text-white text-sm disabled:opacity-50"
                  >
                    <CheckCircle size={16} className="inline mr-2" />
                    Accept Quote
                  </button>
                  <button
                    onClick={() => handleRejectQuote(job._id)}
                    disabled={actioningJobId === job._id}
                    className="flex-1 glass-button rounded-xl py-2 bg-red-500/20 hover:bg-red-500/30 text-white text-sm disabled:opacity-50"
                  >
                    <XCircle size={16} className="inline mr-2" />
                    Reject
                  </button>
                </div>
              </div>
            )}

            {job.status === "in_progress" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <CheckCircle size={16} className="text-green-400" />
                <span className="text-sm text-green-400">
                  Worker is working on your job!
                </span>
              </div>
            )}

            {job.status === "assigned" && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <Clock size={16} className="text-yellow-400" />
                <span className="text-sm text-yellow-400">
                  Worker assigned - waiting to start
                </span>
              </div>
            )}

            {job.status === "completed" &&
              job.payment?.status === "pending" && (
                <div className="glass-nested rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-purple-400">
                    <CheckCircle size={16} />
                    <span className="text-sm font-semibold">
                      Job Completed!
                    </span>
                  </div>
                  <p className="text-sm text-white/70">
                    Final Amount: ₹{job.pricing.finalPrice}
                  </p>
                  <button
                    onClick={() => {
                      setSelectedJob(job);
                      setShowPaymentModal(true);
                    }}
                    className="w-full glass-button rounded-xl py-3 bg-blue-500/20 hover:bg-blue-500/30 text-white font-medium"
                  >
                    Mark Payment as Completed
                  </button>
                </div>
              )}

            {job.status === "completed" &&
              job.payment?.status === "completed" && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                  <CheckCircle size={16} className="text-purple-400" />
                  <span className="text-sm text-purple-400">
                    Payment completed via {job.payment.method.toUpperCase()}
                  </span>
                </div>
              )}
          </div>
        ))}
      </div>

      {/* Payment Modal */}
      {showPaymentModal && selectedJob && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-2xl font-bold text-white mb-4">
              Mark Payment as Completed
            </h3>

            <div className="space-y-4">
              <div className="glass-nested rounded-xl p-4">
                <p className="text-sm text-white/60 mb-1">Final Amount</p>
                <p className="text-3xl font-bold text-white">
                  ₹{selectedJob.pricing.finalPrice}
                </p>
              </div>

              <div>
                <p className="text-sm text-white/70 mb-3">
                  How did you pay the worker?
                </p>
                <div className="space-y-2">
                  <button
                    onClick={() => handleMarkPaid("cash")}
                    disabled={actioningJobId === selectedJob._id}
                    className="w-full glass-button rounded-xl py-3 bg-green-500/20 hover:bg-green-500/30 text-white font-medium disabled:opacity-50"
                  >
                    💵 Cash Payment
                  </button>
                  <button
                    onClick={() => handleMarkPaid("upi")}
                    disabled={actioningJobId === selectedJob._id}
                    className="w-full glass-button rounded-xl py-3 bg-blue-500/20 hover:bg-blue-500/30 text-white font-medium disabled:opacity-50"
                  >
                    📱 UPI Payment
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                setShowPaymentModal(false);
                setSelectedJob(null);
              }}
              className="w-full mt-4 glass-button rounded-xl py-3 text-white/70 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveJobs;
