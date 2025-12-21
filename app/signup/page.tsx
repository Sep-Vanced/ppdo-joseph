// app/signup/page.tsx

"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Image from "next/image";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { ThemeToggle } from "../dashboard/components/ThemeToggle";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

// Error type classification for better UX
type ErrorType = 'account_exists' | 'weak_password' | 'invalid_email' | 'network_error' | 'unknown';

interface UserFriendlyError {
  type: ErrorType;
  title: string;
  message: string;
  action?: string;
}

// Centralized error mapping for signup
const parseSignUpError = (error: any): UserFriendlyError => {
  // Collect all possible error messages
  const messages = [
    error?.message,
    error?.cause?.message,
    typeof error === "string" ? error : null,
    JSON.stringify(error),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  // 🔴 DUPLICATE / ACCOUNT EXISTS
  if (
    messages.includes("already exists") ||
    messages.includes("account") && messages.includes("exists") ||
    messages.includes("duplicate") ||
    messages.includes("email") && messages.includes("exists")
  ) {
    return {
      type: "account_exists",
      title: "Email Already Registered",
      message: "An account with this email already exists.",
      action: "Please sign in instead or use a different email address.",
    };
  }

  // 🟡 WEAK PASSWORD
  if (
    messages.includes("password") &&
    (messages.includes("weak") || messages.includes("8"))
  ) {
    return {
      type: "weak_password",
      title: "Weak Password",
      message: "Your password must be at least 8 characters long.",
      action: "Choose a stronger password.",
    };
  }

  // 🔵 INVALID EMAIL
  if (messages.includes("invalid email")) {
    return {
      type: "invalid_email",
      title: "Invalid Email Address",
      message: "Please enter a valid email address.",
      action: "Check the email format and try again.",
    };
  }

  // 🌐 NETWORK
  if (
    messages.includes("network") ||
    messages.includes("fetch") ||
    messages.includes("timeout")
  ) {
    return {
      type: "network_error",
      title: "Connection Error",
      message: "We couldn’t reach the server.",
      action: "Check your internet connection and try again.",
    };
  }

  // ⚠️ FALLBACK
  return {
    type: "unknown",
    title: "Sign Up Failed",
    message: "Something went wrong while creating your account.",
    action: "Please try again in a moment.",
  };
};


export default function SignUp() {
  const { signIn } = useAuthActions();
  const [error, setError] = useState<UserFriendlyError | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const updateLastLogin = useMutation(api.myFunctions.updateLastLogin);

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
            <Image src="/convex.svg" alt="Convex Logo" width={48} height={48} className="h-12 object-contain" />
            <Image src="/nextjs-icon-light-background.svg" alt="Next.js Logo" width={48} height={48} className="h-12 object-contain dark:hidden" />
            <Image src="/nextjs-icon-dark-background.svg" alt="Next.js Logo" width={48} height={48} className="h-12 object-contain hidden dark:block" />
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

            <div className="relative z-10 depth-of-field-container flex items-center justify-center w-full">
              <div className="flex items-center gap-6">
                <Image
                  src="/convex.svg"
                  alt="Convex Logo"
                  width={120}
                  height={120}
                  style={{
                    filter: "drop-shadow(0 25px 50px rgba(0, 0, 0, 0.15))",
                  }}
                />
                <div className="w-px h-32 bg-zinc-300 dark:bg-zinc-600"></div>
                <Image
                  src="/nextjs-icon-light-background.svg"
                  alt="Next.js Logo"
                  width={120}
                  height={120}
                  className="dark:hidden"
                  style={{
                    filter: "drop-shadow(0 25px 50px rgba(0, 0, 0, 0.15))",
                  }}
                />
                <Image
                  src="/nextjs-icon-dark-background.svg"
                  alt="Next.js Logo"
                  width={120}
                  height={120}
                  className="hidden dark:block"
                  style={{
                    filter: "drop-shadow(0 25px 50px rgba(0, 0, 0, 0.15))",
                  }}
                />
              </div>
            </div>
          </div>
          <div className="flex-1 flex items-center justify-center px-6">
            <div className="text-center">
              <blockquote className="text-xl md:text-2xl font-medium text-zinc-700 dark:text-zinc-300 mb-4 italic">
                "Convex + Next.js + Convex Auth - The modern stack for building scalable applications."
              </blockquote>
              <p className="text-sm md:text-base text-zinc-500 dark:text-zinc-400">
                — Powered by Convex and Next.js
              </p>
            </div>
          </div>
        </div>

        {/* Right Column - Sign Up Form */}
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 sm:p-8 md:p-12 lg:p-16 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-sm relative">
          {/* Theme Toggle - Top Right */}
          <div className="absolute top-4 right-4 md:top-6 md:right-6">
            <ThemeToggle />
          </div>

          <div className="w-full max-w-md">
            {/* Logo/Title */}
            <div className="text-center md:text-left mb-8 md:mb-12">
              <div className="flex items-center gap-3 justify-center md:justify-start mb-2">
                <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100">
                  Sign Up
                </h1>
                <span className="inline-flex items-center rounded-full border border-yellow-200 bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-800 dark:border-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                  temporary for staging
                </span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400">
                Create your account to get started
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

            {/* Sign Up Form */}
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setLoading(true);
                setError(null);

                const formData = new FormData(e.target as HTMLFormElement);
                const email = formData.get("email") as string;
                const password = formData.get("password") as string;

                // Client-side validation
                if (!email || !password) {
                  setError({
                    type: 'invalid_email',
                    title: 'Missing Information',
                    message: 'Please enter both email and password.',
                    action: 'Fill in all fields and try again.'
                  });
                  setLoading(false);
                  return;
                }

                if (password.length < 8) {
                  setError({
                    type: 'weak_password',
                    title: 'Weak Password',
                    message: 'Password must be at least 8 characters.',
                    action: 'Choose a stronger password.'
                  });
                  setLoading(false);
                  return;
                }
                
                try {
                  // Sign up with Convex Auth
                  formData.set("flow", "signUp");
                  const result = await signIn("password", formData);
                  
                  // The afterUserCreatedOrUpdated callback in auth.ts will automatically
                  // set role, status, createdAt, updatedAt, and lastLogin for new users
                  
                  // Redirect to dashboard
                  router.push("/dashboard");
                } catch (error: any) {
                  console.error("Sign up error:", error);

                  const friendlyError = parseSignUpError(error);
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
                  className="w-full px-4 py-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="you@example.com"
                />
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
                    autoComplete="new-password"
                    disabled={loading}
                    minLength={8}
                    className="w-full px-4 py-3 pr-12 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-slate-700 focus:border-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
                  Password must be at least 8 characters
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="cursor-pointer w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-500 text-white font-medium transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden shadow-md hover:shadow-lg"
              >
                <span className="relative z-10">
                  {loading ? "Creating Account..." : "Sign Up"}
                </span>
              </button>
            </form>

            {/* Divider */}
            <div className="mt-8 pt-8 border-t border-zinc-200 dark:border-zinc-700">
              <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">
                Already have an account?{" "}
                <a href="/signin" className="text-[#15803d] hover:text-[#16a34a] dark:text-[#16a34a] dark:hover:text-[#22c55e] transition-colors font-medium">
                  Sign in now
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}