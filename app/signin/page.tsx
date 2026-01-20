// app/signin/page.tsx

"use client";
import { useAuthActions } from "@convex-dev/auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ThemeToggle } from "../../components/ThemeToggle";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

interface LocationData {
  city: string;
  region: string;
  country: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

// Error type classification for better UX
type ErrorType = 'invalid_credentials' | 'account_locked' | 'account_suspended' | 'account_inactive' | 'network_error' | 'unknown';

interface UserFriendlyError {
  type: ErrorType;
  title: string;
  message: string;
  action?: string;
}

// Centralized error mapping for consistent UX
const parseAuthError = (error: any): UserFriendlyError => {
  const errorMessage = error?.message?.toLowerCase() || '';
  const errorData = error?.data || {};
  
  // Wrong password - Convex throws "InvalidSecret" when password is incorrect
  if (
    errorMessage.includes('invalidsecret') ||
    errorMessage.includes('invalid secret')
  ) {
    return {
      type: 'invalid_credentials',
      title: 'Incorrect Password',
      message: 'The password you entered is wrong.',
      action: 'Try again or click "Forgot password?" below.'
    };
  }
  
  // Account not found - Convex throws "InvalidAccountId" when email doesn't exist
  if (
    errorMessage.includes('invalidaccountid') ||
    errorMessage.includes('invalid account')
  ) {
    return {
      type: 'invalid_credentials',
      title: 'Account Not Found',
      message: 'No account exists with this email address.',
      action: 'Check your email or contact support.'
    };
  }
  
  // Generic invalid credentials fallback
  if (
    errorMessage.includes('invalid credentials') ||
    errorMessage.includes('account not found') ||
    errorMessage.includes('incorrect password') ||
    errorMessage.includes('invalid password') ||
    errorMessage.includes('wrong password')
  ) {
    return {
      type: 'invalid_credentials',
      title: 'Sign In Failed',
      message: 'Your email or password is incorrect.',
      action: 'Try again or click "Forgot password?" below.'
    };
  }
  
  // Account locked
  if (
    errorMessage.includes('locked') ||
    errorMessage.includes('account is locked') ||
    errorData.isLocked
  ) {
    return {
      type: 'account_locked',
      title: 'Account Locked',
      message: 'Your account is locked for security.',
      action: 'Contact support to unlock it.'
    };
  }
  
  // Account suspended
  if (
    errorMessage.includes('suspended') ||
    errorMessage.includes('account suspended') ||
    errorData.status === 'suspended'
  ) {
    return {
      type: 'account_suspended',
      title: 'Account Suspended',
      message: 'Your account has been suspended.',
      action: 'Contact support for help.'
    };
  }
  
  // Account inactive
  if (
    errorMessage.includes('inactive') ||
    errorMessage.includes('account inactive') ||
    errorMessage.includes('account is inactive') ||
    errorData.status === 'inactive'
  ) {
    return {
      type: 'account_inactive',
      title: 'Account Inactive',
      message: 'Your account is not active.',
      action: 'Contact support to activate it.'
    };
  }
  
  // Network or connection errors
  if (
    errorMessage.includes('network') ||
    errorMessage.includes('fetch') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    error?.name === 'NetworkError' ||
    error?.name === 'TypeError'
  ) {
    return {
      type: 'network_error',
      title: 'Connection Error',
      message: 'Cannot connect to the server.',
      action: 'Check your internet and try again.'
    };
  }
  
  // Password requirements error (shouldn't happen on sign in, but just in case)
  if (errorMessage.includes('invalid password') && errorMessage.includes('8 characters')) {
    return {
      type: 'invalid_credentials',
      title: 'Invalid Password',
      message: 'Password must be at least 8 characters.',
      action: 'Enter a longer password.'
    };
  }
  
  // Missing required fields
  if (
    errorMessage.includes('missing') ||
    errorMessage.includes('required')
  ) {
    return {
      type: 'invalid_credentials',
      title: 'Missing Information',
      message: 'Please enter both email and password.',
      action: 'Fill in all fields and try again.'
    };
  }
  
  // Generic fallback
  return {
    type: 'unknown',
    title: 'Sign In Error',
    message: 'Something went wrong, please try again.',
    action: 'Contact support if this keeps happening.'
  };
};

export default function SignIn() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<UserFriendlyError | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientIP, setClientIP] = useState<string>("Unknown");
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [emailInput, setEmailInput] = useState("");
  const [emailHasSpace, setEmailHasSpace] = useState(false);

  const router = useRouter();
  
  // Mutations for login trail tracking
  const recordSuccessfulLogin = useMutation(api.auth.recordSuccessfulLogin);
  const recordFailedLogin = useMutation(api.auth.recordFailedLogin);
  
  // Query to get current user after successful login
  const currentUser = useQuery(api.auth.getCurrentUser);

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
        // Try fallback
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
            // Got coordinates, now reverse geocode
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            try {
              // Use a reverse geocoding service
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
            
            // If reverse geocoding fails, fall back to IP-based location
            await fetchIPBasedLocation(ipAddress);
          },
          async (error) => {
            // Geolocation denied or failed, use IP-based location
            console.log('Geolocation denied or failed, using IP-based location');
            await fetchIPBasedLocation(ipAddress);
          },
          {
            enableHighAccuracy: false,
            timeout: 5000,
            maximumAge: 300000, // Cache for 5 minutes
          }
        );
      } else {
        // Browser doesn't support geolocation
        await fetchIPBasedLocation(ipAddress);
      }
    }

    async function fetchIPBasedLocation(ipAddress: string) {
      try {
        // Use IP-based geolocation service
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
          // Final fallback
          setLocationData({
            city: 'Unknown',
            region: 'Unknown',
            country: 'Unknown'
          });
        }
      } catch (error) {
        // Final fallback
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

  // Handle role-based redirect after successful login
  useEffect(() => {
    if (currentUser && !loading) {
      // Redirect based on role
      if (currentUser.role === "inspector") {
        router.push("/inspector");
      } else {
        router.push("/dashboard");
      }
    }
  }, [currentUser, loading, router]);

  // Helper function to get user agent
  const getUserAgent = () => {
    if (typeof window !== "undefined") {
      return window.navigator.userAgent;
    }
    return undefined;
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
      {/* Dark overlay for better readability */}
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
            {/* Floating elements around the image */}
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

        {/* Right Column - Login Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-12 lg:p-16 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm relative">
          {/* Theme Toggle - Top Right */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6">
            <ThemeToggle />
          </div>

          <div className="w-full max-w-md">
            {/* Logo/Title */}
            <div className="text-center md:text-left mb-8 md:mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                Sign In
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Enter your credentials to continue
              </p>
            </div>

            {/* Modern Error Message */}
            {error && (
              <div
                role="alert"
                className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 dark:from-red-950/40 dark:to-red-900/20 border border-red-200/60 dark:border-red-800/40 shadow-sm backdrop-blur-sm"
              >
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1 pt-0.5">
                    <h3 className="text-sm font-semibold text-red-900 dark:text-red-200 mb-1">
                      {error.title}
                    </h3>
                    <p className="text-sm text-red-700 dark:text-red-300/90 leading-relaxed">
                      {error.message}
                    </p>
                    {error.action && (
                      <p className="text-xs text-red-600 dark:text-red-400/80 mt-2 leading-relaxed">
                        {error.action}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Login Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                setError(null);
                const formData = new FormData(e.target as HTMLFormElement);
                const rawEmail = emailInput;
              const password = formData.get("password") as string;

              // STRICT email validation (no leading/trailing spaces)
              if (!rawEmail || /\s/.test(rawEmail)) {
              setError({
                type: "invalid_credentials",
                title: "Invalid Email Format",
                message: "Email address must not contain spaces.",
                action: "Remove spaces and try again."
              });
              setLoading(false);
              return;
            }


              const email = rawEmail; // keep original value (no trim)

                const ipAddress = clientIP;
                const userAgent = getUserAgent();
                
                // Client-side validation
                if (!email || !password) {
                  setError({
                    type: 'invalid_credentials',
                    title: 'Missing Information',
                    message: 'Please provide both email and password to sign in.',
                    action: 'Fill in all required fields and try again.'
                  });
                  setLoading(false);
                  return;
                }
                
                // Prepare location string
                let locationString = "Unknown";
                if (locationData) {
                  locationString = `${locationData.city}, ${locationData.region}, ${locationData.country}`;
                }
                
                try {
                  // Sign in with Convex Auth
                  formData.set("flow", "signIn");
                  
                  await signIn("password", formData);
                  
                  // Record successful login attempt IMMEDIATELY before redirecting
                  try {
                    await recordSuccessfulLogin({
                      email: email,
                      ipAddress: ipAddress,
                      userAgent: userAgent,
                      location: locationString,
                      geoLocation: locationData ? JSON.stringify({
                        city: locationData.city,
                        region: locationData.region,
                        country: locationData.country,
                        coordinates: locationData.coordinates
                      }) : undefined
                    });
                  } catch (trackingError) {
                    // Continue to dashboard anyway, don't block user entry for logging failure
                    console.error('Failed to record successful login:', trackingError);
                  }
                  
                  // Role-based redirect will be handled by useEffect watching currentUser
                  // No need to manually redirect here
                } catch (error: any) {
                  console.error('Sign in error:', error);
                  
                  // Parse error into user-friendly format
                  const friendlyError = parseAuthError(error);
                  
                  // Determine failure reason for logging
                  let failureReasonForLog = error.message || "Authentication Failed";
                  
                  // Record failed login attempt
                  try {
                    await recordFailedLogin({
                      email,
                      ipAddress,
                      userAgent,
                      failureReason: failureReasonForLog,
                      location: locationString,
                      geoLocation: locationData ? JSON.stringify({
                        city: locationData.city,
                        region: locationData.region,
                        country: locationData.country,
                        coordinates: locationData.coordinates
                      }) : undefined
                    });
                  } catch (trackingError) {
                    // Don't block error display if tracking fails
                    console.error('Failed to record failed login:', trackingError);
                  }
                  
                  // Display user-friendly error
                  setError(friendlyError);
                  setLoading(false);
                }
              }}
              className="space-y-6"
            >
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
                  name="email"
                  required
                  autoComplete="email"
                  disabled={loading}
                  value={emailInput}
                  placeholder="you@example.com"
                  onChange={(e) => {
                    const value = e.target.value;

                    // Detect ANY whitespace
                    const hasSpace = /\s/.test(value);
                    setEmailHasSpace(hasSpace);

                    // Do NOT allow spaces to be entered
                    setEmailInput(value.replace(/\s/g, ""));
                  }}
                  onKeyDown={(e) => {
                    if (e.key === " ") {
                      e.preventDefault();
                      setEmailHasSpace(true);
                    }
                  }}
                  className={`w-full px-4 py-3 rounded-xl border 
                    ${emailHasSpace
                      ? "border-red-500 focus:ring-red-500 focus:border-red-500"
                      : "border-zinc-300 dark:border-zinc-700 focus:ring-[#15803d] focus:border-[#15803d]"
                    }
                    bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100
                    transition-all disabled:opacity-50`}
                />
              {emailHasSpace && (
                <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                  Spaces are not allowed in email addresses.
                </p>
              )}
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    autoComplete="current-password"
                    disabled={loading}
                    minLength={8}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-[#15803d] focus:border-[#15803d] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Forgot Password Link */}
              <div className="flex justify-end">
                <Link
                  href="/forgot-password"
                  className="cursor-pointer text-sm text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || locationLoading}
                className="cursor-pointer w-full py-3 rounded-xl bg-[#15803d] hover:bg-[#16a34a] text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
              >
                <span className="relative z-10">
                  {loading ? "Authenticating..." : locationLoading ? "Detecting location..." : "Sign In"}
                </span>
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                Don't have an account?{" "}
                <span className="text-zinc-400 dark:text-zinc-500">
                    Please contact your admin
                  </span>
                <Link className="hidden" href="/signup">
                  <span className="text-zinc-400 dark:text-zinc-500">
                    temporary signup here
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