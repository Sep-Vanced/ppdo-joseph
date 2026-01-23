"use client";

import Header from "@/components/layout/Header";
import Navbar from "@/components/layout/Navbar";
import Image from "next/image";
import Footer from "@/components/layout/Footer";
import FadeIn from "@/components/ui/FadeIn";

type NewsItem = {
  title: string;
  image?: string;
};

export default function NewsEventsPage() {
  const newsEvents: NewsItem[] = [
    {
      title: "Official department activity update",
      image: "/news_events/Official department activity update.png",
    },
    {
      title: "Provincial planning meeting highlights",
      image: "/news_events/Provincial planning meeting highlights.png",
    },
    {
      title: "Infrastructure project inspection",
      image: "/news_events/Infrastructure project inspection.png",
    },
    {
      title: "LGU coordination workshop",
      image: "/news_events/LGU coordination workshop.png",
    },
    {
      title: "Monitoring and evaluation briefing",
      image: "/news_events/Monitoring and evaluation briefing.png",
    },
    {
      title: "Public consultation event",
      image: "/news_events/Public consultation event.png",
    },
  ];

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
          <div className="max-w-7xl mx-auto px-6">
            <h1 className="text-3xl font-bold text-[#012130] mb-10">
              News and Events
            </h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
              {newsEvents.map((item, i) => (
                <div
                  key={i}
                  className="bg-[#f8f8f8] p-4 rounded-xl shadow-md hover:shadow-lg transition"
                >
                  <Image
                    src={item.image || "/news-placeholder.png"}
                    alt={item.title}
                    width={400}
                    height={240}
                    className="rounded-lg mb-3 object-cover w-full h-48"
                  />

                  <p className="text-sm text-[#0c3823] font-medium">
                    {item.title}
                  </p>
                </div>
              ))}
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
