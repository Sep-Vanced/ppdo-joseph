"use client";

import Header from "@/components/layout/Header";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Image from "next/image";
import FadeIn from "@/components/ui/FadeIn";

export default function OrgChartPage() {
  return (
    <>
      {/* TOP SECTION */}
      <FadeIn>
      <Header />
      </FadeIn>
      <Navbar />

      {/* PAGE CONTENT */}
      <section
        className="bg-[#f8f8f8] py-20"
        style={{ fontFamily: "var(--font-cinzel)" }}
      >
        <FadeIn>
          <div className="max-w-6xl mx-auto px-6 text-center">
            <h1 className="text-3xl font-bold text-[#012130] mb-10">
              Organizational Chart
            </h1>

            <Image
              src="/placeholder.jpg"
              alt="Organizational Chart"
              width={900}
              height={500}
              className="mx-auto rounded-xl"
            />
          </div>
        </FadeIn>
      </section>

      {/* Footer */}
            <FadeIn>
            <Footer />
            </FadeIn>
    </>
  );
}
