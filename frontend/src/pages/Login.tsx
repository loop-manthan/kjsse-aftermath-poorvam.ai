import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { SignInPage, Testimonial } from "../components/ui/sign-in";

const testimonials: Testimonial[] = [
  {
    avatarSrc:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
    name: "Priya Sharma",
    handle: "@priya_client",
    text: "Found a plumber in minutes! Amazing service and very professional worker.",
  },
  {
    avatarSrc:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
    name: "Rajesh Kumar",
    handle: "@rajesh_worker",
    text: "Getting jobs daily through Poorvam.ai. Great platform for workers like me!",
  },
  {
    avatarSrc:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
    name: "Anjali Patel",
    handle: "@anjali_client",
    text: "Voice-based booking is so convenient. No need to type, just speak!",
  },
];

const Login = () => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const formData = new FormData(event.currentTarget);
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;

    try {
      const user = await login({ phone, password });
      navigate(`/${user.userType}`);
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = () => {
    // TODO: Implement password reset
    alert("Password reset functionality coming soon!");
  };

  const handleCreateAccount = () => {
    navigate("/register");
  };

  return (
    <SignInPage
      title={
        <span className="font-light text-white tracking-tighter">
          Welcome to <span className="font-semibold">Poorvam.ai</span>
        </span>
      }
      description="Sign in to connect with local workers or find jobs nearby"
      heroImageSrc="https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&h=1200&fit=crop"
      testimonials={testimonials}
      onSignIn={handleSubmit}
      onResetPassword={handleResetPassword}
      onCreateAccount={handleCreateAccount}
      emailLabel="Phone Number"
      emailPlaceholder="Enter your 10-digit phone number"
      passwordLabel="Password"
      passwordPlaceholder="Enter your password"
      rememberMeLabel="Keep me signed in"
      signInButtonText={loading ? "Signing in..." : "Sign In"}
      orContinueText="Or"
      newUserText="New to Poorvam.ai?"
      createAccountText="Create Account"
    />
  );
};

export default Login;
