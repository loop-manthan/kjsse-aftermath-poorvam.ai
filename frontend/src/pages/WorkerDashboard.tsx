import { useAuth } from '../context/AuthContext';
import { LogOut, Briefcase, DollarSign, Star, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AvailableJobs from '../components/worker/AvailableJobs';
import MyJobs from '../components/worker/MyJobs';
import { useJobs } from '../context/JobContext';

const WorkerDashboard = () => {
  const { user, logout } = useAuth();
  const { jobs } = useJobs();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const myJobs = jobs.filter((j) => ['accepted', 'in_progress'].includes(j.status));
  const completedJobs = jobs.filter((j) => j.status === 'completed');
  const totalEarnings = completedJobs.reduce((sum, job) => sum + job.paymentOffer, 0);

  const stats = {
    activeJobs: myJobs.length,
    completedJobs: completedJobs.length,
    totalEarnings: totalEarnings,
    rating: user?.rating || 0,
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Glassmorphism Navbar */}
      <nav className="glass-navbar sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-green-400 to-blue-600" />
            <span className="text-xl font-semibold text-white">Poorvam.ai</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-white/60">Worker Account</p>
            </div>
            <button
              onClick={handleLogout}
              className="glass-button rounded-full p-2 hover:bg-white/20 transition-all"
            >
              <LogOut size={20} className="text-white" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-white/70">Find jobs near you and start earning</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card rounded-2xl p-6 glass-hover cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full glass-nested flex items-center justify-center">
                <Briefcase size={24} className="text-blue-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.activeJobs}</span>
            </div>
            <p className="text-white/70 text-sm">Active Jobs</p>
          </div>

          <div className="glass-card rounded-2xl p-6 glass-hover cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full glass-nested flex items-center justify-center">
                <TrendingUp size={24} className="text-green-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.completedJobs}</span>
            </div>
            <p className="text-white/70 text-sm">Completed</p>
          </div>

          <div className="glass-card rounded-2xl p-6 glass-hover cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full glass-nested flex items-center justify-center">
                <DollarSign size={24} className="text-yellow-400" />
              </div>
              <span className="text-3xl font-bold text-white">₹{stats.totalEarnings}</span>
            </div>
            <p className="text-white/70 text-sm">Total Earnings</p>
          </div>

          <div className="glass-card rounded-2xl p-6 glass-hover cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full glass-nested flex items-center justify-center">
                <Star size={24} className="text-purple-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.rating.toFixed(1)}</span>
            </div>
            <p className="text-white/70 text-sm">Rating</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* My Active Jobs */}
          <div>
            <MyJobs />
          </div>

          {/* Available Jobs */}
          <div>
            <AvailableJobs />
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerDashboard;
