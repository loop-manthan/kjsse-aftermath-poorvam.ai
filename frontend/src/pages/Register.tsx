import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Briefcase, Phone, Mail, Lock, MapPin } from 'lucide-react';

const Register = () => {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<'client' | 'worker' | ''>('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    password: '',
    address: '',
    location: { type: 'Point' as const, coordinates: [0, 0] as [number, number] },
    categories: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleUserTypeSelect = (type: 'client' | 'worker') => {
    setUserType(type);
    setStep(2);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationCapture = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            location: {
              type: 'Point',
              coordinates: [position.coords.longitude, position.coords.latitude],
            },
          });
          alert('Location captured successfully!');
        },
        (error) => {
          console.error('Error getting location:', error);
          alert('Please enable location access');
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userData = { ...formData, userType: userType as 'client' | 'worker' };
      const user = await register(userData);
      navigate(`/${user.userType}`);
    } catch (error) {
      console.error('Registration error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <div className="glass-card rounded-3xl p-8">
            <h2 className="text-4xl font-bold text-center mb-4 text-white">
              Join Poorvam.ai
            </h2>
            <p className="text-center mb-12 text-white/70">Select your account type</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button
                onClick={() => handleUserTypeSelect('client')}
                className="glass-card glass-hover rounded-2xl p-8 text-center cursor-pointer group"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full glass-nested flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User size={40} className="text-blue-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">I need help</h3>
                  <p className="text-white/70">Register as a Client to find workers for your tasks</p>
                </div>
              </button>

              <button
                onClick={() => handleUserTypeSelect('worker')}
                className="glass-card glass-hover rounded-2xl p-8 text-center cursor-pointer group"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-20 h-20 rounded-full glass-nested flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Briefcase size={40} className="text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">I offer services</h3>
                  <p className="text-white/70">Register as a Worker to accept jobs and earn money</p>
                </div>
              </button>
            </div>

            <p className="text-center mt-8 text-white/60">
              Already have an account?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-blue-400 hover:underline"
              >
                Login here
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-3xl p-8">
          <h2 className="text-3xl font-bold text-center mb-2 text-white">
            Register as {userType === 'client' ? 'Client' : 'Worker'}
          </h2>
          <p className="text-center mb-8 text-white/70">
            Fill in your details to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-white/70 mb-2 block">
                Full Name
              </label>
              <div className="glass-input rounded-xl flex items-center gap-3 px-4">
                <User size={20} className="text-white/40" />
                <input
                  type="text"
                  name="name"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className="flex-1 bg-transparent py-3 text-white placeholder:text-white/40 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white/70 mb-2 block">
                Phone Number
              </label>
              <div className="glass-input rounded-xl flex items-center gap-3 px-4">
                <Phone size={20} className="text-white/40" />
                <input
                  type="tel"
                  name="phone"
                  placeholder="10-digit phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="flex-1 bg-transparent py-3 text-white placeholder:text-white/40 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white/70 mb-2 block">
                Email (Optional)
              </label>
              <div className="glass-input rounded-xl flex items-center gap-3 px-4">
                <Mail size={20} className="text-white/40" />
                <input
                  type="email"
                  name="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="flex-1 bg-transparent py-3 text-white placeholder:text-white/40 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white/70 mb-2 block">
                Password
              </label>
              <div className="glass-input rounded-xl flex items-center gap-3 px-4">
                <Lock size={20} className="text-white/40" />
                <input
                  type="password"
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  className="flex-1 bg-transparent py-3 text-white placeholder:text-white/40 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white/70 mb-2 block">
                Address
              </label>
              <div className="glass-input rounded-xl flex items-center gap-3 px-4">
                <MapPin size={20} className="text-white/40" />
                <input
                  type="text"
                  name="address"
                  placeholder="Your address"
                  value={formData.address}
                  onChange={handleChange}
                  className="flex-1 bg-transparent py-3 text-white placeholder:text-white/40 focus:outline-none"
                  required
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleLocationCapture}
              className="w-full glass-button rounded-xl py-3 flex items-center justify-center gap-2 text-white hover:bg-white/20 transition-all"
            >
              <MapPin size={18} />
              Capture Current Location
            </button>

            {userType === 'worker' && (
              <div>
                <label className="text-sm font-medium text-white/70 mb-2 block">
                  Skills/Categories
                </label>
                <div className="glass-input rounded-xl px-4">
                  <input
                    type="text"
                    name="categories"
                    placeholder="e.g., plumber, electrician"
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        categories: e.target.value.split(',').map((c) => c.trim()),
                      })
                    }
                    className="w-full bg-transparent py-3 text-white placeholder:text-white/40 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 glass-button rounded-xl py-3 text-white hover:bg-white/20 transition-all"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 glass-button rounded-xl py-3 text-white bg-blue-500/20 hover:bg-blue-500/30 transition-all disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Register'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
