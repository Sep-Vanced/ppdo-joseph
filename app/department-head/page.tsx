"use client";

import Header from "@/components/layout/Header";
import Navbar from "@/components/layout/Navbar";
import Image from "next/image";
import Footer from "@/components/layout/Footer";
import FadeIn from "@/components/ui/FadeIn";

export default function DepartmentHeadPage() {
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
        <div className="max-w-7xl mx-auto px-6">
          {/* PAGE TITLE */}
          <FadeIn>
            <h1 className="text-3xl font-bold text-[#012130] mb-12">
              Department Head
            </h1>
          </FadeIn>

          {/* MAIN CONTENT */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            {/* LEFT: TEXT */}
            <FadeIn>
              <div className="text-[#0c3823] leading-relaxed space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-[#012130]">Name</h2>
                  <p className="font-semibold">Title / Position</p>
                  <p>Provincial Planning and Development Office</p>
                  <p>Province of Tarlac</p>
                </div>

                <p>
                  Department Head brief biography goes here. This section can
                  include information about their education, experience, and
                  accomplishments.
                </p>

                <p>
                  Additional information about the department head can be added
                  here.
                </p>
              </div>
            </FadeIn>

            {/* RIGHT: PHOTO */}
            <FadeIn>
              <div className="flex justify-center lg:justify-end">
                <div className="bg-white p-4 rounded-xl shadow-md">
                  <Image
                    src="/placeholder.jpg"
                    alt="Department Head"
                    width={350}
                    height={420}
                    className="rounded-lg object-cover"
                  />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* Footer */}
            <FadeIn>
            <Footer />
            </FadeIn>
    </>
  );
}
