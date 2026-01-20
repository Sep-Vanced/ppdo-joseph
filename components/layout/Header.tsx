"use client";

import Image from "next/image";
import Link from "next/link";

export default function Header() {
  const leftLogos = [
    "/logo.png",
    "/y.png",
  ];

  const rightLogos = [
    "/dpo_dps_logo.png",
    "/Bagong_Pilipinas_logo.png",
  ];

  return (
    <header className="w-full">
      {/* TOP GOVPH BAR */}
      <div className="w-full bg-[#0a1a0a] text-white text-xs py-2">
        <div className="max-w-7xl mx-auto px-5 flex justify-between items-center">
          {/* LEFT */}
          <div className="hidden sm:flex items-center gap-6">
            <span className="font-extrabold text-lg tracking-wide">GOVPH</span>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4 justify-center sm:justify-end">
            <Link
              href="/signin"
              className="flex items-center gap-1 px-3 hover:underline"
            >
              🔒 Secure Login
            </Link>
          </div>
        </div>
      </div>

      {/* GREEN HEADER */}
      <section className="relative w-full bg-[#30ad20] py-6 lg:py-10">
        {/* BACKGROUND */}
        <div className="absolute inset-0">
          <Image
            src="/Capitol.jpg"
            alt="Capitol"
            fill
            className="object-cover opacity-25"
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-6 text-white">
          {/* MOBILE & TABLET LOGOS */}
          <div className="flex lg:hidden justify-center items-center gap-4 mb-6">
            {[
              "/Bagong_Pilipinas_logo.png",
              "/capitol-logo.png",
              "/dpo_dps_logo.png",
              "/y.png",
            ].map((src, i) => (
              <div
                key={i}
                className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center"
              >
                <Image
                  src={src}
                  alt={`Logo ${i + 1}`}
                  width={96}
                  height={96}
                  className="object-contain"
                />
              </div>
            ))}
          </div>

          {/* DESKTOP LAYOUT */}
          <div className="hidden lg:grid grid-cols-[auto_520px_auto] items-center gap-4 w-full justify-center">
            {/* LEFT LOGOS */}
            <div className="flex items-center justify-end gap-1">
              {leftLogos.map((src, i) => (
                <div key={i} className="w-20 h-20 flex items-center justify-center">
                  <Image
                    src={src}
                    alt="left logo"
                    width={76}
                    height={76}
                    className="object-contain"
                  />
                </div>
              ))}
            </div>

            {/* CENTER TEXT */}
            <div
              className="flex flex-col items-start justify-center w-[520px] px-2"
              style={{ fontFamily: "var(--font-cinzel)" }}
            >
              <p className="uppercase tracking-widest text-xs mb-1">
                Republic of the Philippines
              </p>

              <div className="w-full max-w-[395px] border-b-2 border-white my-1" />

              <h1 className="text-lg md:text-xl font-bold tracking-wide">
                Provincial Government of Tarlac
              </h1>

              <p className="text-xs mt-1 tracking-wide">
                TARLAC, PHILIPPINES | TARLAC@GOV.PH
              </p>
            </div>

            {/* RIGHT LOGOS */}
            <div className="flex items-center justify-start gap-1">
              {rightLogos.map((src, i) => (
                <div key={i} className="w-20 h-20 flex items-center justify-center">
                  <Image
                    src={src}
                    alt="right logo"
                    width={76}
                    height={76}
                    className="object-contain"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* MOBILE & TABLET TEXT */}
          <div
            className="lg:hidden flex flex-col items-center text-center justify-center py-4"
            style={{ fontFamily: "var(--font-cinzel)" }}
          >
            <p className="uppercase tracking-widest text-xs mb-1">
              Republic of the Philippines
            </p>

            <div className="w-3/4 border-b-2 border-white my-1" />

            <h1 className="text-lg sm:text-xl font-bold tracking-wide">
              Provincial Government of Tarlac
            </h1>

            <p className="text-xs mt-1 tracking-wide">
              TARLAC, PHILIPPINES | TARLAC@GOV.PH
            </p>
          </div>
        </div>
      </section>
    </header>
  );
}
