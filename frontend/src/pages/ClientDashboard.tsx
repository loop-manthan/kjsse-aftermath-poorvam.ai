import { useAuth } from '../context/AuthContext';
import { LogOut, Briefcase, Clock, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import CreateJob from '../components/client/CreateJob';
import ActiveJobs from '../components/client/ActiveJobs';
import { useJobs } from '../context/JobContext';

const ClientDashboard = () => {
  const { user, logout } = useAuth();
  const { jobs } = useJobs();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const stats = {
    totalJobs: jobs.length,
    activeJobs: jobs.filter((j) => ['assigned', 'accepted', 'in_progress'].includes(j.status)).length,
    completedJobs: jobs.filter((j) => j.status === 'completed').length,
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Glassmorphism Navbar */}
      <nav className="glass-navbar sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-600" />
            <span className="text-xl font-semibold text-white">Poorvam.ai</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user?.name}</p>
              <p className="text-xs text-white/60">Client Account</p>
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
          <p className="text-white/70">Manage your jobs and find workers instantly</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card rounded-2xl p-6 glass-hover cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full glass-nested flex items-center justify-center">
                <Briefcase size={24} className="text-blue-400" />
              </div>
              <span className="text-3xl font-bold text-white">{stats.totalJobs}</span>
            </div>
            <p className="text-white/70 text-sm">Total Jobs</p>
          </div>

          <div className="glass-card rounded-2xl p-6 glass-hover cursor-pointer">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-full glass-nested flex items-center justify-center">
                <Clock size={24} className="text-yellow-400" />
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
            <p className="text-white/70 text-sm">Completed Jobs</p>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Job Form */}
          <div>
            <CreateJob />
          </div>

          {/* Active Jobs List */}
          <div>
            <ActiveJobs />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
