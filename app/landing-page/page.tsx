"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

import Header from "@/components/layout/Header";
import Navbar from "@/components/layout/Navbar";
import PPDOBanner from "@/components/ppdo/PPDOBanner";
import PPDOFeatures from "@/components/ppdo/PPDOFeatures";
import GovernorMessage from "@/components/layout/GovernorMessage";
import PPDOAbout from "@/components/ppdo/PPDOAbout";
import Officials from "@/components/officials/Officials";
import PPDOActivities from "@/components/ppdo/PPDOActivities";
import Footer from "@/components/layout/Footer";
import FadeIn from "@/components/ui/FadeIn";

export default function Home() {
  const router = useRouter();
  const currentUser = useQuery(api.auth.getCurrentUser);

  useEffect(() => {
    if (currentUser) {
      router.replace("/dashboard");
    }
  }, [currentUser, router]);

  // Prevent flash of landing page while redirecting
  if (currentUser) return null;

  return (
    <main className="min-h-screen w-full bg-[#f8f8f8] text-gray-900">
      <FadeIn>
        <Header />
      </FadeIn>

      <Navbar />

      <FadeIn>
        <PPDOBanner />
      </FadeIn>

      <FadeIn delay={0.05}>
        <PPDOFeatures />
      </FadeIn>

      <FadeIn delay={0.1}>
        <GovernorMessage />
      </FadeIn>

      <FadeIn delay={0.15}>
        <PPDOAbout />
      </FadeIn>


      <FadeIn delay={0.25}>
        <PPDOActivities />
      </FadeIn>

      <FadeIn>
        <Footer />
      </FadeIn>
    </main>
  );
}
