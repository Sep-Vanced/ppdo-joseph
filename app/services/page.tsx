"use client";

import Header from "@/components/layout/Header";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FadeIn from "@/components/ui/FadeIn";


export default function ServicesPage() {
  return (
    <>
      {/* TOP SECTION */}
      <FadeIn>
      <Header />
      </FadeIn>
      <Navbar />

      {/* Page content */}
      <section
        className="bg-[#f8f8f8] py-20"
        style={{ fontFamily: "var(--font-cinzel)" }}
      >
        <FadeIn>
          <div className="max-w-6xl mx-auto px-6">
            <h1 className="text-3xl font-bold text-[#012130] mb-10">
              Services
            </h1>

            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "Development Planning",
                "Socio-Economic Profiling",
                "Project Monitoring",
                "Data Analysis",
              ].map((service, i) => (
                <li
                  key={i}
                  className="bg-[#f8f8f8] p-6 rounded-xl text-[#0c3823] font-medium"
                >
                  {service}
                </li>
              ))}
            </ul>
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
