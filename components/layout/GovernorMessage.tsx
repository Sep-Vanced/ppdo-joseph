"use client";

import Image from "next/image";

export default function GovernorMessage() {
  return (
    <section className="w-full bg-[#f8f8f8] py-20">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-block mb-4">
            
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-2"
              style={{ fontFamily: "var(--font-cinzel)" }}>
            Office of the Governor
          </h1>
          <div className="h-0.5 w-150 bg-slate-800 mx-auto mb-2"></div>
          <p className="text-slate-600 text-lg">Message from the Governor</p>
        </div>

        {/* Single Container with Capitol Background */}
        <div className="relative bg-white rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Capitol Background Image */}
          <div className="absolute inset-0">
            <Image
              src="/Capitol.jpg"
              alt="Tarlac Provincial Capitol Building"
              fill
              className="object-cover opacity-100"
              priority
            />
            {/* Gradient Overlay for readability */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/95 via-white/90 to-white/85"></div>
          </div>

          {/* Message Content */}
          <div className="relative z-10 p-10 lg:p-16">
            
            {/* Decorative Quote Mark */}
            <div className="absolute top-8 left-8 text-8xl text-green-900/10 font-serif leading-none">"</div>
            
            <div className="relative max-w-3xl mx-auto space-y-6">
              
              <p className="text-slate-800 leading-relaxed text-lg font-semibold" 
                 style={{ fontFamily: "var(--font-cinzel)" }}>
                Welcome to the official portal of the Provincial Government of
                Tarlac. This platform is dedicated to transparent and efficient
                public service—bringing vital information, services, and
                opportunities closer to our communities across the province.
              </p>

              <p className="text-slate-800 leading-relaxed text-lg font-semibold" 
                 style={{ fontFamily: "var(--font-cinzel)" }}>
                As we continue to modernize public service delivery, our priority
                remains the well-being of every Tarlaqueño. We invite you to
                explore our programs, engage with our offices, and take part in
                building a more inclusive and progressive Tarlac.
              </p>

              <div className="pt-6 border-t border-slate-300 ">
                <p className="italic text-slate-800 text-lg" 
                   style={{ fontFamily: "Georgia, serif" }}>
                  Maraming salamat at mabuhay ang Lalawigan ng Tarlac.
                </p>
              </div>

              {/* Signature */}
              <div className="pt-8">
                <div className="inline-block">
                  <p className="text-sm text-slate-600 mb-1" 
                     style={{ fontFamily: "var(--font-cinzel)" }}>
                    Respectfully,
                  </p>
                  <div className="h-px w-48 bg-slate-400 mb-2"></div>
                  <p className="font-semibold text-slate-900" 
                     style={{ fontFamily: "var(--font-cinzel)" }}>
                    Office of the Governor
                  </p>
                </div>
              </div>
            </div>

            {/* Watermark Seal */}
            <div className="absolute bottom-8 right-8 opacity-20 pointer-events-none">
              <Image
                src="/logo.png"
                alt="Official Seal"
                width={200}
                height={200}
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}