// app/forgot-password/page.tsx

"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import { ThemeToggle } from "../dashboard/components/ThemeToggle";

interface LocationData {
  city: string;
  region: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [clientIP, setClientIP] = useState<string>("Unknown");
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  
  const submitResetRequest = useMutation(api.passwordReset.submitPasswordResetRequest);
  const resetStatus = useQuery(
    api.passwordReset.checkResetRequestStatus,
    email ? { email } : "skip"
  );

  // Fetch location data on mount
  useEffect(() => {
    async function fetchLocationData() {
      setLocationLoading(true);
      
      // First, try to get IP address
      let ipAddress = "Unknown";
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json', {
          signal: AbortSignal.timeout(3000),
        });
        if (ipResponse.ok) {
          const ipData = await ipResponse.json();
          ipAddress = ipData.ip || 'Unknown';
          setClientIP(ipAddress);
        }
      } catch (error) {
        try {
          const ipResponse = await fetch('https://api.my-ip.io/ip', {
            signal: AbortSignal.timeout(3000),
          });
          if (ipResponse.ok) {
            const ip = await ipResponse.text();
            ipAddress = ip.trim() || 'Unknown';
            setClientIP(ipAddress);
          }
        } catch (error) {
          setClientIP('Unknown');
        }
      }

      // Try browser geolocation first
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            try {
              const geocodeResponse = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
                {
                  headers: {
                    'User-Agent': 'YourAppName/1.0',
                  },
                  signal: AbortSignal.timeout(5000),
                }
              );
              
              if (geocodeResponse.ok) {
                const geocodeData = await geocodeResponse.json();
                const address = geocodeData.address || {};
                
                setLocationData({
                  city: address.city || address.town || address.village || address.municipality || 'Unknown',
                  region: address.state || address.province || address.region || 'Unknown',
                  country: address.country || 'Unknown',
                  coordinates: { lat, lng }
                });
                setLocationLoading(false);
                return;
              }
            } catch (error) {
              console.log('Reverse geocoding failed, falling back to IP location');
            }
            
            await fetchIPBasedLocation(ipAddress);
          },
          async (error) => {
            console.log('Geolocation denied or failed, using IP-based location');
            await fetchIPBasedLocation(ipAddress);
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 300000,
          }
        );
      } else {
        await fetchIPBasedLocation(ipAddress);
      }
    }

    async function fetchIPBasedLocation(ipAddress: string) {
      try {
        const response = await fetch(`https://ipapi.co/${ipAddress}/json/`, {
          signal: AbortSignal.timeout(5000),
        });
        
        if (response.ok) {
          const data = await response.json();
          setLocationData({
            city: data.city || 'Unknown',
            region: data.region || 'Unknown',
            country: data.country_name || 'Unknown',
            coordinates: data.latitude && data.longitude ? {
              lat: data.latitude,
              lng: data.longitude
            } : undefined
          });
        } else {
          setLocationData({
            city: 'Unknown',
            region: 'Unknown',
            country: 'Unknown'
          });
        }
      } catch (error) {
        setLocationData({
          city: 'Unknown',
          region: 'Unknown',
          country: 'Unknown'
        });
      }
      
      setLocationLoading(false);
    }

    fetchLocationData();
  }, []);

  const getUserAgent = () => {
    if (typeof window !== "undefined") {
      return window.navigator.userAgent;
    }
    return undefined;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    if (!resetStatus) {
      toast.error("Loading status... Please try again in a moment.");
      return;
    }

    if (!resetStatus.canSubmit) {
      if (resetStatus.attemptsRemaining === 0) {
        toast.error("You have reached the maximum number of password reset requests for today. Please try again tomorrow.");
      } else if (resetStatus.remainingSeconds && resetStatus.remainingSeconds > 0) {
        toast.error(`Please wait ${resetStatus.remainingSeconds} seconds before submitting another request.`);
      }
      return;
    }

    setLoading(true);

    try {
      const userAgent = getUserAgent();
      let locationString = "Unknown";
      if (locationData) {
        locationString = `${locationData.city}, ${locationData.region}, ${locationData.country}`;
      }

      const result = await submitResetRequest({
        email: email.trim(),
        message: message.trim() || undefined,
        ipAddress: clientIP,
        userAgent: userAgent,
        geoLocation: locationData ? JSON.stringify({
          city: locationData.city,
          region: locationData.region,
          country: locationData.country,
          coordinates: locationData.coordinates
        }) : undefined,
      });

      toast.success(result.message || "Password reset request submitted successfully!");
      setEmail("");
      setMessage("");
    } catch (error: any) {
      console.error("Password reset request error:", error);
      toast.error(error.message || "Failed to submit password reset request. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: `url('/b1.jpg')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/50 via-black/60 to-black/50"></div>

      {/* Container */}
      <div className="w-full max-w-6xl mx-auto flex flex-col md:flex-row rounded-2xl md:rounded-3xl shadow-2xl overflow-hidden relative z-20">
        {/* Left Column - Image */}
        <div className="hidden md:flex md:w-1/2 relative overflow-hidden bg-white dark:bg-zinc-900 flex-col items-start p-8">
          {/* Logos */}
          <div className="flex items-center gap-2 mb-8 w-full">
            <img src="/logo.png" alt="Logo" className="h-12 object-contain" />
            <img src="/y.png" alt="Y Logo" className="h-12 object-contain" />
          </div>
          
          <div className="shrink-0 mb-1 w-full flex justify-center relative">
            {/* Floating elements */}
            <div className="absolute inset-0 pointer-events-none">
              {/* Top Left - Document Icon */}
              <div className="absolute top-8 left-8 w-8 h-8 opacity-20 dark:opacity-10 animate-float-slow">
                <svg
                  className="w-full h-full text-zinc-700 dark:text-zinc-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>

              {/* Top Right - Star Icon */}
              <div className="absolute top-6 right-6 w-10 h-10 opacity-20 dark:opacity-10 animate-float-medium">
                <svg
                  className="w-full h-full text-zinc-700 dark:text-zinc-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>

              {/* Bottom Left - Shield Icon */}
              <div className="absolute bottom-8 left-6 w-9 h-9 opacity-20 dark:opacity-10 animate-float-slow-delayed">
                <svg
                  className="w-full h-full text-zinc-700 dark:text-zinc-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>

              {/* Bottom Right - Building Icon */}
              <div className="absolute bottom-6 right-8 w-8 h-8 opacity-20 dark:opacity-10 animate-float-medium-delayed">
                <svg
                  className="w-full h-full text-zinc-700 dark:text-zinc-300"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
              </div>

              {/* Left Middle - Circle */}
              <div className="absolute top-1/2 left-4 -translate-y-1/2 w-6 h-6 rounded-full border-2 border-zinc-400 dark:border-zinc-600 opacity-30 dark:opacity-20 animate-float-slow"></div>

              {/* Right Middle - Circle */}
              <div className="absolute top-1/2 right-4 -translate-y-1/2 w-8 h-8 rounded-full border-2 border-zinc-400 dark:border-zinc-600 opacity-30 dark:opacity-20 animate-float-medium"></div>
            </div>

            <div className="relative z-10 depth-of-field-container">
              <img
                src="/cy (2).png"
                alt="Profile"
                className="max-w-full max-h-[400px] object-contain relative z-10"
                style={{
                  filter: "drop-shadow(0 25px 50px rgba(0, 0, 0, 0.15))",
                }}
              />
            </div>
          </div>
          
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center">
              <blockquote className="text-xl md:text-2xl font-medium text-zinc-700 dark:text-zinc-300 mb-4 italic">
                "Building a better tomorrow for Tarlac, one system at a time."
              </blockquote>
              <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400">
                — Gov. Christian Yap
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-12 lg:p-16 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm relative">
          {/* Theme Toggle - Top Right */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6">
            <ThemeToggle />
          </div>

          <div className="w-full max-w-md">
            {/* Title */}
            <div className="text-center md:text-left mb-8 md:mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Forgot Password
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Enter your email to request a password reset
              </p>
            </div>

            {/* Status Info */}
            {resetStatus && (
              <div className="mb-6 p-4 rounded-xl bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800">
                <div className="flex items-start gap-3">
                  <svg 
                    className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path 
                      strokeLinecap="round" 
                      strokeLinejoin="round" 
                      strokeWidth={2} 
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
                    />
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <span className="font-semibold">Attempts remaining today:</span> {resetStatus.attemptsRemaining} of 3
                    </p>
                    {resetStatus.remainingSeconds > 0 && (
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Next request available in: <span className="font-semibold">{resetStatus.remainingSeconds}s</span>
                      </p>
                    )}
                    {resetStatus.attemptsRemaining === 0 && (
                      <p className="text-sm text-red-700 dark:text-red-300 mt-1 font-semibold">
                        Maximum requests reached. Try again tomorrow.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  disabled={loading || locationLoading}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="you@example.com"
                />
              </div>

              {/* Message Field */}
              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
                >
                  Message (Optional)
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  disabled={loading || locationLoading}
                  className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] transition-all disabled:opacity-50 disabled:cursor-not-allowed resize-none"
                  placeholder="Tell us why you need to reset your password (optional)"
                />
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  This message will help administrators understand your request.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  loading || 
                  locationLoading || 
                  !resetStatus ||
                  !resetStatus.canSubmit ||
                  !email
                }
                className="w-full py-3 rounded-xl bg-[#15803d] hover:bg-[#16a34a] text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              >
                <span className="relative z-10">
                  {loading 
                    ? "Submitting..." 
                    : locationLoading 
                    ? "Detecting location..." 
                    : resetStatus && resetStatus.remainingSeconds > 0
                    ? `Wait ${resetStatus.remainingSeconds}s`
                    : "Request Password Reset"}
                </span>
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                Remember your password?{" "}
                <Link href="/signin">
                  <span className="text-[#15803d] hover:text-[#16a34a] font-medium transition-colors">
                    Sign In
                  </span>
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}