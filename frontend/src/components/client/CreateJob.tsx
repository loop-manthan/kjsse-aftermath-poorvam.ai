import { useState } from "react";
import { useJobs } from "../../context/JobContext";
import { useAuth } from "../../context/AuthContext";
import { MapPin, FileText } from "lucide-react";
import toast from "react-hot-toast";
import AddressAutocomplete from "../shared/AddressAutocomplete";

const CreateJob = () => {
  const { user } = useAuth();
  const { createJob } = useJobs();
  const [loading, setLoading] = useState(false);
  const [locationCoordinates, setLocationCoordinates] = useState<
    [number, number] | null
  >(null);
  const [formData, setFormData] = useState({
    description: "",
    payment: "",
    location: ""
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const postGig = async () => {
    setLoading(true);

    // Capture the form values NOW before any async re-renders
    const gigData = {
      description: formData.description,
      payment: formData.payment,
      location: formData.location,
    };

    try {
      // Post to backend first
      await createJob({
        description: gigData.description,
        paymentOffer: parseFloat(gigData.payment),
        location: {
          type: "Point",
          coordinates: locationCoordinates || user?.location?.coordinates || [0, 0],
        },
        address: gigData.location,
      });

      // Trigger Bolna call
      await fetch(
        "https://hook.eu1.make.com/lb6ffub10nnzutskiof8eyxxyjknatt9",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(gigData),
        },
      );
      toast.success("Job created successfully!");

      setFormData({ description: "", payment: "", location: "" });
      setLocationCoordinates(null);
    } catch (error) {
      console.error("Error posting gig:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card rounded-2xl p-6">
      <h2 className="text-2xl font-bold mb-6 text-white">Create New Job</h2>

      <div className="space-y-5">
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
            <span className="text-white/40">₹</span>
            <input
              type="number"
              name="payment"
              placeholder="Enter your budget in ₹"
              value={formData.payment}
              onChange={handleChange}
              className="flex-1 bg-transparent py-3 text-white placeholder:text-white/40 focus:outline-none"
              required
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="text-sm font-medium text-white/70 mb-2 block">
            Job Location *
          </label>
          <AddressAutocomplete
            value={formData.location}
            onChange={(address, coordinates) => {
              setFormData((prev) => ({ ...prev, location: address }));
              setLocationCoordinates(coordinates || null);
            }}
            placeholder="Start typing job location..."
          />
        </div>

        <button
          type="button"
          disabled={loading}
          onClick={postGig}
          className="w-full glass-button rounded-xl py-3 text-white bg-blue-500/20 hover:bg-blue-500/30 transition-all disabled:opacity-50 font-medium"
        >
          {loading ? "Creating Job..." : "Post Job & Find Worker"}
        </button>
      </div>
    </div>
  );
};

export default CreateJob;
