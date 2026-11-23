
import Link from "next/link";
import Image from "next/image";

const materials = ["Crystal", "Glass", "Acrylic", "Resin", "Metal"];

const events = [
  "Corporate Recognition",
  "Employee Milestones",
  "Graduation & Moving Up",
  "Beauty Pageants",
  "Sports Competitions",
  "Golf Tournaments",
  "E-Sports Competitions",
];

const branches = [
  {
    name: "Manila",
    subtitle: "Headquarters",
    address:
      "32 DM Building, Visayas Ave, Congressional Ave, Quezon City, 1104 Metro Manila",
    phones: ["0954 183 1131", "0917 137 0586", "0956 062 9230"],
    email: "sales@awardscentral.com.ph",
  },
  {
    name: "Cebu",
    subtitle: "Cebu Branch",
    address:
      "Hi-way Central Building, M.C. Briones Highway, Mandaue City, Cebu, Philippines",
    phones: ["0928 590 9188", "0916 298 3941"],
    email: "cebu@awardscentral.com.ph",
  },
  {
    name: "Cagayan de Oro",
    subtitle: "CDO Branch",
    address:
      "PS Agro Inc, Lapasan National Highway, Cagayan de Oro City, Philippines",
    phones: ["0956 062 9238"],
    email: "cdo@awardscentral.com.ph",
  },
];

export default function AboutUsPage() {
  return (
    <main className="overflow-hidden bg-white text-[#202020]">
      {/* HERO SECTION */}
      <section className="relative flex min-h-[560px] items-center overflow-hidden bg-[#111] md:min-h-[680px]">
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src="/images/about-us.jpg"
            alt="Awards Central team and products"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </div>

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-black/30" />

        {/* Hero Content */}
        <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 md:px-10">
          <div className="max-w-3xl">
            <p className="mb-5 text-sm font-semibold uppercase tracking-[0.35em] text-[#d4af37]">
              Awards Central Philippines
            </p>

            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl md:text-7xl">
              Celebrating Excellence.
              <span className="block text-[#d4af37]">
                Honoring Every Achievement.
              </span>
            </h1>

            <p className="mt-7 max-w-2xl text-base leading-8 text-white/75 md:text-lg">
              We create meaningful recognition awards that celebrate success,
              inspire achievement, and preserve unforgettable milestones.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="inline-flex items-center justify-center bg-[#d4af37] px-8 py-4 text-sm font-bold uppercase tracking-wider text-black transition hover:bg-white"
              >
                Explore Our Products
              </Link>

              <Link
                href="/contact"
                className="inline-flex items-center justify-center border border-white/60 px-8 py-4 text-sm font-bold uppercase tracking-wider text-white transition hover:border-[#d4af37] hover:text-[#d4af37]"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 right-0 hidden h-2 w-1/3 bg-[#d4af37] md:block" />
      </section>

      {/* OUR STORY */}
      <section className="mx-auto grid max-w-7xl gap-14 px-6 py-20 md:grid-cols-2 md:items-center md:px-10 md:py-32">
        <div>
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.3em] text-[#b38b20]">
            Who We Are
          </p>

          <h2 className="text-4xl font-bold leading-tight md:text-5xl">
            Our Story
          </h2>

          <div className="mt-6 h-1 w-20 bg-[#d4af37]" />

          <p className="mt-8 text-base leading-8 text-gray-600">
            Founded in 2018, Awards Central Philippines, Inc. has grown into a
            supplier and manufacturer of recognition awards in the Philippines.
          </p>

          <p className="mt-5 text-base leading-8 text-gray-600">
            By combining modern manufacturing technology with expert
            craftsmanship, we create customized awards using durable and
            long-lasting materials. Every piece is designed to represent an
            achievement worth remembering.
          </p>

          <p className="mt-5 text-base leading-8 text-gray-600">
            From corporate recognition programs and employee milestones to
            graduations, pageants, sports events, and competitions, we help
            organizations celebrate the people and accomplishments that matter.
          </p>

          <Link
            href="/products"
            className="mt-8 inline-flex items-center gap-3 border-b-2 border-[#d4af37] pb-2 text-sm font-bold uppercase tracking-wider transition hover:text-[#b38b20]"
          >
            Discover Our Collections
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <div className="relative mx-2">
          <div className="absolute -right-3 -top-3 h-full w-full border-2 border-[#d4af37] md:-right-5 md:-top-5" />

          <div className="relative flex min-h-[420px] flex-col justify-between overflow-hidden bg-[#171717] p-8 text-white md:min-h-[500px] md:p-12">
            <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full border border-[#d4af37]/30" />
            <div className="absolute -right-10 -top-10 h-52 w-52 rounded-full border border-[#d4af37]/30" />

            <div className="relative">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d4af37]">
                Since
              </p>

              <h3 className="mt-3 text-8xl font-bold tracking-tighter text-white md:text-9xl">
                2018
              </h3>
            </div>

            <div className="relative">
              <div className="mb-5 h-px w-full bg-white/20" />

              <p className="text-2xl font-semibold leading-snug">
                Every achievement deserves to be recognized.
              </p>

              <p className="mt-4 text-sm leading-7 text-white/60">
                Creating lasting symbols of success through quality,
                craftsmanship, and meaningful design.
              </p>
            </div>

            <span
              aria-hidden="true"
              className="absolute bottom-8 right-8 text-7xl text-[#d4af37]/20"
            >
              ★
            </span>
          </div>
        </div>
      </section>

      {/* MATERIALS */}
      <section className="bg-[#f7f6f2] px-6 py-20 md:px-10 md:py-24">
        <div className="mx-auto max-w-7xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#b38b20]">
            Quality & Craftsmanship
          </p>

          <h2 className="mt-4 text-3xl font-bold md:text-5xl">
            Made to Last. Designed to Inspire.
          </h2>

          <p className="mx-auto mt-6 max-w-2xl leading-8 text-gray-600">
            We work with quality materials to create distinctive recognition
            pieces that preserve the importance of every achievement.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-5">
            {materials.map((material) => (
              <div
                key={material}
                className="flex min-h-32 items-center justify-center border border-[#dedbd2] bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#d4af37] hover:shadow-lg"
              >
                <h3 className="text-lg font-bold tracking-wide">{material}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* VISION AND MISSION */}
      <section className="bg-[#171717] px-6 py-20 text-white md:px-10 md:py-32">
        <div className="mx-auto grid max-w-7xl gap-16 md:grid-cols-2">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#d4af37]">
              Where We Are Going
            </p>

            <h2 className="mt-5 text-4xl font-bold md:text-5xl">
              Our Vision
            </h2>

            <div className="mt-6 h-1 w-16 bg-[#d4af37]" />

            <p className="mt-8 text-lg leading-9 text-white/70">
              To become a leading brand in recognition awards in the
              Philippines, known for crafting high-quality, lasting symbols of
              achievement that stand the test of time.
            </p>
          </div>

          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#d4af37]">
              What Drives Us
            </p>

            <h2 className="mt-5 text-4xl font-bold md:text-5xl">
              Our Mission
            </h2>

            <div className="mt-6 h-1 w-16 bg-[#d4af37]" />

            <p className="mt-8 text-lg leading-9 text-white/70">
              To champion the universal need for recognition through beautifully
              crafted trophies, plaques, and awards that celebrate achievements
              in workplaces, sports, pageants, schools, creative fields, and
              beyond.
            </p>
          </div>
        </div>
      </section>

      {/* WHAT WE CELEBRATE */}
      <section className="mx-auto max-w-7xl px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#b38b20]">
            Every Milestone Matters
          </p>

          <h2 className="mt-4 text-4xl font-bold md:text-5xl">
            We Celebrate Every Kind of Achievement
          </h2>

          <p className="mt-6 leading-8 text-gray-600">
            From personal milestones to large-scale events, we help make every
            recognition moment memorable.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event, index) => (
            <div
              key={event}
              className="group flex items-center gap-5 border border-gray-200 p-6 transition duration-300 hover:border-[#d4af37] hover:bg-[#faf9f5]"
            >
              <span className="text-2xl font-bold text-[#d4af37]">
                {String(index + 1).padStart(2, "0")}
              </span>

              <h3 className="font-semibold transition group-hover:translate-x-1">
                {event}
              </h3>
            </div>
          ))}
        </div>
      </section>

      {/* BRANCH LOCATIONS */}
      <section className="bg-[#f7f6f2] px-6 py-20 md:px-10 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#b38b20]">
              Find Us
            </p>

            <h2 className="mt-4 text-4xl font-bold md:text-5xl">
              Our Locations
            </h2>

            <p className="mx-auto mt-6 max-w-2xl leading-8 text-gray-600">
              We serve customers across the Philippines through our branches in
              Manila, Cebu, and Cagayan de Oro.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {branches.map((branch) => (
              <div
                key={branch.name}
                className="flex flex-col border border-gray-200 bg-white p-8 transition duration-300 hover:-translate-y-1 hover:border-[#d4af37] hover:shadow-xl"
              >
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#b38b20]">
                  {branch.subtitle}
                </p>

                <h3 className="mt-3 text-2xl font-bold">{branch.name}</h3>

                <div className="my-6 h-px w-full bg-gray-200" />

                <p className="text-sm leading-7 text-gray-600">
                  {branch.address}
                </p>

                <div className="mt-6">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                    Contact Numbers
                  </p>

                  {branch.phones.map((phone) => (
                    <a
                      key={phone}
                      href={`tel:${phone.replaceAll(" ", "")}`}
                      className="block py-1 text-sm text-gray-700 transition hover:text-[#b38b20]"
                    >
                      {phone}
                    </a>
                  ))}
                </div>

                <div className="mt-auto pt-6">
                  <a
                    href={`mailto:${branch.email}`}
                    className="break-all text-sm font-semibold text-[#9a7517] hover:underline"
                  >
                    {branch.email}
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden bg-[#171717] px-6 py-20 text-center text-white md:py-32">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full border border-[#d4af37]/20" />
        <div className="absolute -bottom-40 -right-20 h-96 w-96 rounded-full border border-[#d4af37]/20" />

        <div className="relative mx-auto max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#d4af37]">
            Your Achievement. Our Craft.
          </p>

          <h2 className="mt-5 text-4xl font-bold leading-tight md:text-6xl">
            Let&apos;s Celebrate Your Next Achievement.
          </h2>

          <p className="mx-auto mt-6 max-w-xl leading-8 text-white/60">
            Discover recognition pieces made to honor success and turn important
            moments into lasting memories.
          </p>

          <Link
            href="/products"
            className="mt-10 inline-flex items-center justify-center bg-[#d4af37] px-10 py-4 text-sm font-bold uppercase tracking-wider text-black transition hover:bg-white"
          >
            Explore Our Products
          </Link>
        </div>
      </section>
    </main>
  );
}
