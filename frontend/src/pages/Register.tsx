import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { User, Briefcase, Phone, Mail, Lock, Eye, EyeOff } from "lucide-react";
import CategorySelector from "../components/shared/CategorySelector";
import AddressAutocomplete from "../components/shared/AddressAutocomplete";

interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

const testimonials: Testimonial[] = [
  {
    avatarSrc:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    name: "Rajesh Kumar",
    handle: "@rajesh_worker",
    text: "Getting jobs daily through Poorvam.ai. Great platform for workers like me!",
  },
  {
    avatarSrc:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    name: "Priya Sharma",
    handle: "@priya_client",
    text: "Found a plumber in minutes! Amazing service and very professional worker.",
  },
  {
    avatarSrc:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    name: "Anjali Patel",
    handle: "@anjali_client",
    text: "Voice-based booking is so convenient. No need to type, just speak!",
  },
];

const Register = () => {
  const [step, setStep] = useState(1);
  const [userType, setUserType] = useState<"client" | "worker" | "">("");
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    address: "",
    location: {
      type: "Point" as const,
      coordinates: [0, 0] as [number, number],
    },
    categories: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleUserTypeSelect = (type: "client" | "worker") => {
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
              type: "Point",
              coordinates: [
                position.coords.longitude,
                position.coords.latitude,
              ],
            },
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Please enable location access");
        },
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate location before submission
    if (
      formData.location.coordinates[0] === 0 &&
      formData.location.coordinates[1] === 0
    ) {
      alert(
        "Please provide your location using the address autocomplete or 'Use Current Location' button",
      );
      return;
    }

    if (!formData.address) {
      alert("Please provide your address");
      return;
    }

    // Validate worker categories
    if (userType === "worker" && formData.categories.length === 0) {
      alert("Please select at least one skill/category");
      return;
    }

    setLoading(true);

    try {
      const userData = {
        ...formData,
        userType: userType as "client" | "worker",
      };
      const user = await register(userData);
      navigate(`/${user.userType}`);
    } catch (error: any) {
      console.error("Registration error:", error);
      alert(
        error.response?.data?.error || "Registration failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <div className="flex h-screen w-screen overflow-hidden bg-black">
        {/* Left Side - User Type Selection */}
        <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
          <div className="w-full max-w-md">
            <div className="mb-8">
              <h2 className="text-4xl font-bold text-white mb-2">
                Join Poorvam.ai
              </h2>
              <p className="text-white/70">
                Select your account type to get started
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => handleUserTypeSelect("client")}
                className="w-full glass-card glass-hover rounded-2xl p-6 text-left cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full glass-nested flex items-center justify-center group-hover:scale-110 transition-transform">
                    <User size={32} className="text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">
                      I need help
                    </h3>
                    <p className="text-white/70 text-sm">
                      Register as a Client to find workers for your tasks
                    </p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => handleUserTypeSelect("worker")}
                className="w-full glass-card glass-hover rounded-2xl p-6 text-left cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full glass-nested flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Briefcase size={32} className="text-green-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">
                      I offer services
                    </h3>
                    <p className="text-white/70 text-sm">
                      Register as a Worker to accept jobs and earn money
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <p className="text-center mt-8 text-white/60">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-blue-400 hover:underline font-medium"
              >
                Login here
              </button>
            </p>
          </div>
        </div>

        {/* Right Side - Testimonials */}
        <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url(https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=1200&fit=crop)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-sm" />

          <div className="relative z-10 flex flex-col justify-end p-12">
            <div className="space-y-6">
              {testimonials.map((testimonial, index) => (
                <div
                  key={index}
                  className="glass-card rounded-2xl p-6 animate-fadeInUp"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="flex items-start gap-4">
                    <img
                      src={testimonial.avatarSrc}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <p className="text-white/90 mb-2">{testimonial.text}</p>
                      <div>
                        <p className="text-white font-semibold text-sm">
                          {testimonial.name}
                        </p>
                        <p className="text-white/60 text-xs">
                          {testimonial.handle}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Registration Form
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-black">
      {/* Left Side - Registration Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2 overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Register as {userType === "client" ? "Client" : "Worker"}
            </h2>
            <p className="text-white/70">Fill in your details to get started</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-white/70 mb-2 block">
                Full Name *
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
                Phone Number *
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
                Password *
              </label>
              <div className="glass-input rounded-xl flex items-center gap-3 px-4">
                <Lock size={20} className="text-white/40" />
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a strong password"
                  value={formData.password}
                  onChange={handleChange}
                  className="flex-1 bg-transparent py-3 text-white placeholder:text-white/40 focus:outline-none"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-white/40 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white/70 mb-2 block">
                Address *
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
                placeholder="Start typing your address..."
                onLocationCapture={handleLocationCapture}
              />
            </div>

            {userType === "worker" && (
              <div>
                <label className="text-sm font-medium text-white/70 mb-2 block">
                  Skills/Categories *
                </label>
                <CategorySelector
                  selectedCategories={formData.categories}
                  onChange={(categories) =>
                    setFormData({ ...formData, categories })
                  }
                />
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
                className="flex-1 glass-button rounded-xl py-3 text-white bg-blue-500/20 hover:bg-blue-500/30 transition-all disabled:opacity-50 font-medium"
              >
                {loading ? "Creating Account..." : "Register"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right Side - Testimonials */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=1200&fit=crop)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60 backdrop-blur-sm" />

        <div className="relative z-10 flex flex-col justify-end p-12">
          <div className="space-y-6">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="glass-card rounded-2xl p-6 animate-fadeInUp"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-start gap-4">
                  <img
                    src={testimonial.avatarSrc}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="text-white/90 mb-2">{testimonial.text}</p>
                    <div>
                      <p className="text-white font-semibold text-sm">
                        {testimonial.name}
                      </p>
                      <p className="text-white/60 text-xs">
                        {testimonial.handle}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
