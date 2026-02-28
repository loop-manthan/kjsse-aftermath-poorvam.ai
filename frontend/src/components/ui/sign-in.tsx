import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// --- TYPE DEFINITIONS ---

export interface Testimonial {
  avatarSrc: string;
  name: string;
  handle: string;
  text: string;
}

interface SignInPageProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  heroImageSrc?: string;
  testimonials?: Testimonial[];
  onSignIn?: (event: React.FormEvent<HTMLFormElement>) => void;
  onResetPassword?: () => void;
  onCreateAccount?: () => void;
  emailLabel?: string;
  emailPlaceholder?: string;
  passwordLabel?: string;
  passwordPlaceholder?: string;
  rememberMeLabel?: string;
  signInButtonText?: string;
  orContinueText?: string;
  newUserText?: string;
  createAccountText?: string;
}

// --- SUB-COMPONENTS ---

const GlassInputWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="glass-input rounded-2xl transition-colors focus-within:border-blue-400/70 focus-within:bg-blue-500/10">
    {children}
  </div>
);

const TestimonialCard = ({ testimonial, delay }: { testimonial: Testimonial, delay: string }) => (
  <div className={`animate-testimonial ${delay} flex items-start gap-3 rounded-3xl glass-card p-5 w-64`}>
    <img src={testimonial.avatarSrc} className="h-10 w-10 object-cover rounded-2xl" alt="avatar" />
    <div className="text-sm leading-snug">
      <p className="flex items-center gap-1 font-medium">{testimonial.name}</p>
      <p className="text-white/60">{testimonial.handle}</p>
      <p className="mt-1 text-white/80">{testimonial.text}</p>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

export const SignInPage: React.FC<SignInPageProps> = ({
  title = <span className="font-light text-white tracking-tighter">Welcome Back</span>,
  description = "Sign in to your Poorvam.ai account",
  heroImageSrc,
  testimonials = [],
  onSignIn,
  onResetPassword,
  onCreateAccount,
  emailLabel = "Phone Number",
  emailPlaceholder = "Enter your phone number",
  passwordLabel = "Password",
  passwordPlaceholder = "Enter your password",
  rememberMeLabel = "Keep me signed in",
  signInButtonText = "Sign In",
  orContinueText = "Or continue with",
  newUserText = "New to Poorvam.ai?",
  createAccountText = "Create Account",
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="h-[100dvh] flex flex-col md:flex-row font-sans w-[100dvw] bg-black">
      {/* Left column: sign-in form */}
      <section className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <h1 className="animate-element animate-delay-100 text-4xl md:text-5xl font-semibold leading-tight text-white">{title}</h1>
            <p className="animate-element animate-delay-200 text-white/70">{description}</p>

            <form className="space-y-5" onSubmit={onSignIn}>
              <div className="animate-element animate-delay-300">
                <label className="text-sm font-medium text-white/70">{emailLabel}</label>
                <GlassInputWrapper>
                  <input 
                    name="phone" 
                    type="tel" 
                    placeholder={emailPlaceholder} 
                    className="w-full bg-transparent text-sm p-4 rounded-2xl focus:outline-none text-white placeholder:text-white/40" 
                  />
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-400">
                <label className="text-sm font-medium text-white/70">{passwordLabel}</label>
                <GlassInputWrapper>
                  <div className="relative">
                    <input 
                      name="password" 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder={passwordPlaceholder} 
                      className="w-full bg-transparent text-sm p-4 pr-12 rounded-2xl focus:outline-none text-white placeholder:text-white/40" 
                    />
                    <button 
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute inset-y-0 right-3 flex items-center"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5 text-white/60 hover:text-white transition-colors" />
                      ) : (
                        <Eye className="w-5 h-5 text-white/60 hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>
                </GlassInputWrapper>
              </div>

              <div className="animate-element animate-delay-500 flex items-center justify-between text-sm">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" name="rememberMe" className="w-4 h-4 rounded border-white/20 bg-white/10" />
                  <span className="text-white/90">{rememberMeLabel}</span>
                </label>
                <button 
                  type="button"
                  onClick={onResetPassword}
                  className="hover:underline text-blue-400 transition-colors"
                >
                  Reset password
                </button>
              </div>

              <button 
                type="submit" 
                className="animate-element animate-delay-600 w-full rounded-2xl glass-button py-4 font-medium text-white hover:bg-white/20 transition-all"
              >
                {signInButtonText}
              </button>
            </form>

            <div className="animate-element animate-delay-700 relative flex items-center justify-center">
              <span className="w-full border-t border-white/10"></span>
              <span className="px-4 text-sm text-white/60 bg-black absolute">{orContinueText}</span>
            </div>

            <p className="animate-element animate-delay-900 text-center text-sm text-white/60">
              {newUserText}{' '}
              <button 
                onClick={onCreateAccount}
                className="text-blue-400 hover:underline transition-colors"
              >
                {createAccountText}
              </button>
            </p>
          </div>
        </div>
      </section>

      {/* Right column: hero image + testimonials */}
      {heroImageSrc && (
        <section className="hidden md:block flex-1 relative p-4">
          <div 
            className="animate-slide-right animate-delay-300 absolute inset-4 rounded-3xl bg-cover bg-center" 
            style={{ backgroundImage: `url(${heroImageSrc})` }}
          ></div>
          {testimonials.length > 0 && (
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-4 px-8 w-full justify-center">
              <TestimonialCard testimonial={testimonials[0]} delay="animate-delay-1000" />
              {testimonials[1] && (
                <div className="hidden xl:flex">
                  <TestimonialCard testimonial={testimonials[1]} delay="animate-delay-1200" />
                </div>
              )}
              {testimonials[2] && (
                <div className="hidden 2xl:flex">
                  <TestimonialCard testimonial={testimonials[2]} delay="animate-delay-1400" />
                </div>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
