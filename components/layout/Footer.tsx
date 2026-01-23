import Link from "next/link";
import Image from "next/image";

export default function Footer() {
  return (
    <footer className="relative bg-[#012130] text-white text-sm overflow-hidden" style={{  }}>
      {/* Decorative background */}
      <div className="absolute bottom-0 left-0 w-full h-full pointer-events-none opacity-20">
        <Image
          src="/bg.png"
          alt="Background"
          fill
          className="object-cover"
        />
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#012130] via-[#012130]/95 to-[#012130]/90"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">

          {/* COLUMN 1 */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold  text-white border-b-2 border-green-600 pb-2 mb-4" style={{ fontFamily: "var(--font-cinzel)" }}>
              Republic of the Philippines
            </h4>

            <p className="text-gray-300 leading-relaxed">
              All content is in the public domain unless otherwise stated.
            </p>

            <div>
              <p className="font-bold text-white mb-2" style={{ fontFamily: "var(--font-cinzel)" }}>Official Disclaimer:</p>
              <p className="text-gray-300 leading-relaxed">
                This website is maintained by the Provincial Government of
                Tarlac for informational purposes only.
              </p>
            </div>

            <div>
              <p className="font-bold text-white mb-2" style={{ fontFamily: "var(--font-cinzel)" }}>Accuracy:</p>
              <p className="text-gray-300 leading-relaxed">
                While we strive for accuracy, information may change without notice.
              </p>
            </div>

            <p className="text-gray-300 pt-4">
              <strong className="text-white" style={{ fontFamily: "var(--font-cinzel)" }}>Copyright:</strong> © 2026 Province of Tarlac.
              <br />
              All rights reserved.
            </p>
          </div>

          {/* COLUMN 2 */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white border-b-2 border-green-600 pb-2 mb-4" style={{ fontFamily: "var(--font-cinzel)" }}>
              About GOVPH
            </h4>

            <p className="text-gray-300 leading-relaxed">
              Learn more about the Philippine government, its structure,
              how government works and the people behind it.
            </p>

            <div>
              <p className="font-bold text-white mb-3" style={{ fontFamily: "var(--font-cinzel)" }}>GOV.PH</p>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-green-400 hover:text-green-300 transition-colors duration-200 flex items-center gap-2">
                    <span className="text-green-600">›</span> Open Data Portal
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-green-400 hover:text-green-300 transition-colors duration-200 flex items-center gap-2">
                    <span className="text-green-600">›</span> Official Gazette
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          {/* COLUMN 3 */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white border-b-2 border-green-600 pb-2 mb-4" style={{ fontFamily: "var(--font-cinzel)" }}>
              Government Links
            </h4>

            <ul className="space-y-2">
              {[
                "Office of the President",
                "Office of the Vice President",
                "Senate of the Philippines",
                "House of Representatives",
                "Supreme Court",
                "Court of Appeals",
                "Sandiganbayan",
              ].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-green-400 hover:text-green-300 transition-colors duration-200 flex items-center gap-2">
                    <span className="text-green-600">›</span> {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* COLUMN 4 */}
          <div className="space-y-4">
            <h4 className="text-lg font-bold text-white border-b-2 border-green-600 pb-2 mb-4" style={{ fontFamily: "var(--font-cinzel)" }}>
              Legal Compliance
            </h4>

            <div>
              <p className="font-bold text-white mb-3" style={{ fontFamily: "var(--font-cinzel)" }}>Transparency & Accountability</p>
              <ul className="space-y-2 mb-6">
                <li>
                  <Link href="#" className="text-green-400 hover:text-green-300 transition-colors duration-200 flex items-center gap-2">
                    <span className="text-green-600">›</span> Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-green-400 hover:text-green-300 transition-colors duration-200 flex items-center gap-2">
                    <span className="text-green-600">›</span> Accessibility Statement
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-green-400 hover:text-green-300 transition-colors duration-200 flex items-center gap-2">
                    <span className="text-green-600">›</span> FOI Manual
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-green-400 hover:text-green-300 transition-colors duration-200 flex items-center gap-2">
                    <span className="text-green-600">›</span> Terms of Use
                  </Link>
                </li>
              </ul>

              <p className="font-bold text-white mb-3" style={{ fontFamily: "var(--font-cinzel)" }}>Government Standards</p>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="text-green-400 hover:text-green-300 transition-colors duration-200 flex items-center gap-2">
                    <span className="text-green-600">›</span> Anti-Red Tape Act Compliance
                  </Link>
                </li>
                <li>
                  <Link href="#" className="text-green-400 hover:text-green-300 transition-colors duration-200 flex items-center gap-2">
                    <span className="text-green-600">›</span> Data Privacy Act Compliance
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* BOTTOM BAR */}
        <div className="border-t border-gray-700 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-400">
              © 2026 Provincial Government of Tarlac. All rights reserved.
            </p>

            <div className="flex gap-6">
              <Link href="#" className="text-green-400 hover:text-green-300 transition-colors duration-200">
                Accessibility Statement
              </Link>
              <Link href="#" className="text-green-400 hover:text-green-300 transition-colors duration-200">
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>

      </div>
    </footer>
  );
}