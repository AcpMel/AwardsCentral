import Link from "next/link";

const branches = [
  {
    name: "Manila Branch",
    address:
      "32 DM Building, Visayas Ave, Congressional Ave, Quezon City, Metro Manila",
    phone: ["0954 183 1131", "0917 137 0586"],
    email: "sales@awardscentral.com.ph",
  },
  {
    name: "Cebu Branch",
    address:
      "Hi-way Central Building, M.C. Briones Highway, Mandaue City, Cebu",
    phone: ["0928 590 9188", "0916 298 3941"],
    email: "cebu@awardscentral.com.ph",
  },
  {
    name: "Cagayan de Oro Branch",
    address: "PS Agro Inc, Lapasan National Highway, Cagayan de Oro City",
    phone: ["0956 062 9238"],
    email: "cdo@awardscentral.com.ph",
  },
];

const quickLinks = [
  { name: "Home", href: "/" },
  { name: "About Us", href: "/about-us" },
  { name: "Products", href: "/products" },
  { name: "Contact Us", href: "/contact" },
];

const productLinks = [
  { name: "Crystal Awards", href: "/products" },
  { name: "Trophies", href: "/products" },
  { name: "Plaques", href: "/products" },
  { name: "Medals", href: "/products" },
  { name: "Corporate Awards", href: "/products" },
];

export default function Footer() {
  return (
    <footer className="bg-[#111111] text-white">
      {/* Main Footer */}
      <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Company Information */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block">
              <h2 className="text-3xl font-bold tracking-wide">
                AWARDS
                <span className="text-[#D4AF37]">CENTRAL</span>
              </h2>
            </Link>

            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.3em] text-[#D4AF37]">
              Recognizing Excellence
            </p>

            <p className="mt-6 max-w-md text-sm leading-7 text-gray-400">
              Celebrating achievements and recognizing excellence through
              quality trophies, plaques, medals, and customized awards. We help
              make every milestone memorable.
            </p>

            <div className="mt-7">
              <p className="text-sm font-semibold text-white">
                Have a project in mind?
              </p>

              <Link
                href="/contact"
                className="mt-3 inline-flex items-center gap-2 rounded-md bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e6c65c]"
              >
                Get in Touch
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-[#D4AF37]">
              Quick Links
            </h3>

            <ul className="space-y-4">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition hover:text-[#D4AF37]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-[#D4AF37]">
              Our Products
            </h3>

            <ul className="space-y-4">
              {productLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-gray-400 transition hover:text-[#D4AF37]"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="mb-6 text-sm font-bold uppercase tracking-wider text-[#D4AF37]">
              Contact Us
            </h3>

            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-300">
                  Email
                </p>

                <a
                  href="mailto:sales@awardscentral.com.ph"
                  className="mt-2 block break-all text-sm text-gray-400 transition hover:text-[#D4AF37]"
                >
                  sales@awardscentral.com.ph
                </a>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-gray-300">
                  Manila
                </p>

                <a
                  href="tel:09541831131"
                  className="mt-2 block text-sm text-gray-400 transition hover:text-[#D4AF37]"
                >
                  0954 183 1131
                </a>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase text-gray-300">
                  Business Hours
                </p>

                <p className="mt-2 text-sm text-gray-400">
                  Contact us for assistance and inquiries.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Branch Locations */}
        <div className="mt-16 border-t border-white/10 pt-10">
          <h3 className="mb-8 text-sm font-bold uppercase tracking-wider text-[#D4AF37]">
            Our Branches
          </h3>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {branches.map((branch) => (
              <div key={branch.name}>
                <h4 className="text-sm font-semibold text-white">
                  {branch.name}
                </h4>

                <p className="mt-3 text-sm leading-6 text-gray-400">
                  {branch.address}
                </p>

                <div className="mt-3 space-y-1">
                  {branch.phone.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replace(/\s/g, "")}`}
                      className="block text-sm text-gray-400 transition hover:text-[#D4AF37]"
                    >
                      {phone}
                    </a>
                  ))}
                </div>

                <a
                  href={`mailto:${branch.email}`}
                  className="mt-2 block break-all text-sm text-gray-400 transition hover:text-[#D4AF37]"
                >
                  {branch.email}
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-6 text-center sm:flex-row sm:text-left lg:px-8">
          <p className="text-xs text-gray-500">
            © 2026 Awards Central. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-xs text-gray-500 transition hover:text-[#D4AF37]"
            >
              Home
            </Link>

            <Link
              href="/contact"
              className="text-xs text-gray-500 transition hover:text-[#D4AF37]"
            >
              Contact
            </Link>
          </div>

          <p className="text-xs text-gray-500">
            Made for recognizing excellence.
          </p>
        </div>
      </div>
    </footer>
  );
}
