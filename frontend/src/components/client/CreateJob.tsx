import { useState } from 'react';
import { useJobs } from '../../context/JobContext';
import { useAuth } from '../../context/AuthContext';
import { MapPin, DollarSign, FileText } from 'lucide-react';

const CreateJob = () => {
  const { user } = useAuth();
  const { createJob } = useJobs();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    paymentOffer: '',
    address: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLocationCapture = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            address: `${position.coords.latitude}, ${position.coords.longitude}`,
          });
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) return;

      await createJob({
        description: formData.description,
        paymentOffer: parseFloat(formData.paymentOffer),
        location: {
          type: 'Point',
          coordinates: user.location.coordinates,
        },
        address: formData.address || user.address,
      });

      setFormData({ description: '', paymentOffer: '', address: '' });
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Create New Job</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="text-sm font-medium text-white/70 mb-2 block">
            Job Description
          </label>
          <div className="glass-input rounded-xl flex items-start gap-3 px-4">
            <FileText size={20} className="text-white/40 mt-3" />
            <textarea
              name="description"
              placeholder="Describe the work you need done..."
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="flex-1 bg-transparent py-3 text-white placeholder:text-white/40 focus:outline-none resize-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-white/70 mb-2 block">
            Payment Offer (₹)
          </label>
          <div className="glass-input rounded-xl flex items-center gap-3 px-4">
            <DollarSign size={20} className="text-white/40" />
            <input
              type="number"
              name="paymentOffer"
              placeholder="Enter amount"
              value={formData.paymentOffer}
              onChange={handleChange}
              className="flex-1 bg-transparent py-3 text-white placeholder:text-white/40 focus:outline-none"
              required
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-white/70 mb-2 block">
            Location
          </label>
          <div className="glass-input rounded-xl flex items-center gap-3 px-4">
            <MapPin size={20} className="text-white/40" />
            <input
              type="text"
              name="address"
              placeholder="Job location"
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
          Use Current Location
        </button>

        <button
          type="submit"
          disabled={loading}
          className="w-full glass-button rounded-xl py-3 text-white bg-blue-500/20 hover:bg-blue-500/30 transition-all disabled:opacity-50 font-medium"
        >
          {loading ? 'Creating Job...' : 'Post Job & Find Worker'}
        </button>
      </form>
    </div>
  );
};

export default CreateJob;
