"use client";

import Header from "@/components/layout/Header";
import Navbar from "@/components/layout/Navbar";
import Image from "next/image";
import Footer from "@/components/layout/Footer";
import FadeIn from "@/components/ui/FadeIn";

export default function ContactUsPage() {
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
          <div className="max-w-4xl mx-auto px-6">
            {/* PAGE TITLE */}
            <h1 className="text-3xl font-bold text-[#012130] mb-10">
              Contact Us
            </h1>

            {/* CONTACT CARD */}
            <div className="bg-[#f8f8f8] p-8 rounded-xl text-[#0c3823] space-y-8">
              {/* ADDRESS */}
              <div>
                <h2 className="text-lg font-bold text-[#012130] mb-1">
                  Address
                </h2>
                <p className="text-sm leading-relaxed">
                  Capitol Site Street, Tarlac, Philippines, 2300
                </p>
              </div>

              {/* LANDLINE */}
              <div>
                <h2 className="text-lg font-bold text-[#012130] mb-1">
                  Landline Number
                </h2>
                <p className="text-sm">(000) 000-0000</p>
              </div>

              {/* EMAIL */}
              <div>
                <h2 className="text-lg font-bold text-[#012130] mb-1">
                  E-mail Address
                </h2>
                <p className="text-sm">ppdotarlac@gmail.com</p>
              </div>
            </div>
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
