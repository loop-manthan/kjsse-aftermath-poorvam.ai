import { useState } from "react";
import { useJobs } from "../../context/JobContext";
import { useAuth } from "../../context/AuthContext";
import { MapPin, DollarSign, FileText } from "lucide-react";
import AddressAutocomplete from "../shared/AddressAutocomplete";

const CreateJob = () => {
  const { user } = useAuth();
  const { createJob } = useJobs();
  const [loading, setLoading] = useState(false);
  const [aiCategory, setAiCategory] = useState<{
    category: string;
    displayName: string;
    confidence: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    description: "",
    paymentOffer: "",
    address: "",
    location: {
      type: "Point" as const,
      coordinates: [0, 0] as [number, number],
    },
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
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
          console.error("Error getting location:", error);
        },
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!user) return;

      const response = await createJob({
        description: formData.description,
        paymentOffer: parseFloat(formData.paymentOffer),
        location:
          formData.location.coordinates[0] !== 0
            ? formData.location
            : {
                type: "Point",
                coordinates: user.location.coordinates,
              },
        address: formData.address || user.address,
      });

      // Show AI categorization result
      if ((response as any)?.aiCategorization) {
        setAiCategory((response as any).aiCategorization);
        setTimeout(() => setAiCategory(null), 5000);
      }

      setFormData({
        description: "",
        paymentOffer: "",
        address: "",
        location: { type: "Point", coordinates: [0, 0] },
      });
    } catch (error) {
      console.error("Error creating job:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Create New Job</h2>

      {aiCategory && (
        <div className="mb-4 p-4 rounded-xl bg-green-500/20 border border-green-500/30 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/30 flex items-center justify-center">
            <FileText size={20} className="text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-white font-medium">
              AI Detected Category: {aiCategory.displayName}
            </p>
            <p className="text-white/60 text-sm">
              Confidence: {aiCategory.confidence}
            </p>
          </div>
        </div>
      )}

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
              placeholder="Enter your budget in ₹"
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
            Job Location *
          </label>
          <AddressAutocomplete
            value={formData.address}
            onChange={(address, coordinates) => {
              setFormData({
                ...formData,
                address,
                location: coordinates
                  ? { type: "Point", coordinates }
                  : formData.location,
              });
            }}
            placeholder="Start typing job location..."
            onLocationCapture={handleLocationCapture}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full glass-button rounded-xl py-3 text-white bg-blue-500/20 hover:bg-blue-500/30 transition-all disabled:opacity-50 font-medium"
        >
          {loading ? "Creating Job..." : "Post Job & Find Worker"}
        </button>
      </form>
    </div>
  );
};

export default CreateJob;
