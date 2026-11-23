import Link from "next/link";

export default function AboutSection() {
    return (
        <section className="bg-white px-6 py-24 md:px-10">

            <div className="mx-auto grid max-w-7xl gap-12 md:grid-cols-2 md:items-center">

                <div className="relative flex min-h-[400px] items-center justify-center overflow-hidden bg-[#171717] p-10 text-center">

                    <div className="absolute inset-6 border border-[#d4af37]/50" />

                    <div className="relative">

                        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#d4af37]">
                            Awards Central Philippines
                        </p>

                        <h3 className="mt-6 text-5xl font-bold text-white md:text-6xl">
                            For Our
                            <span className="block text-[#d4af37]">
                                Winners.
                            </span>
                        </h3>

                        <p className="mt-5 text-sm tracking-widest text-white/60">
                            CELEBRATING EXCELLENCE SINCE 2018
                        </p>

                    </div>
                </div>

                <div>

                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#b38b20]">
                        Get to Know Us
                    </p>

                    <h2 className="mt-4 text-4xl font-bold text-[#171717] md:text-5xl">
                        Every Achievement Deserves to Be Celebrated.
                    </h2>

                    <p className="mt-7 leading-8 text-gray-600">
                        Awards Central Philippines, Inc. is dedicated to
                        creating recognition awards that honor excellence,
                        achievement, and meaningful milestones.
                    </p>

                    <p className="mt-5 leading-8 text-gray-600">
                        Through craftsmanship, quality materials, and
                        customization, we help businesses, organizations,
                        schools, and event organizers celebrate success.
                    </p>

                    <Link
                        href="/about-us"
                        className="mt-9 inline-flex items-center gap-3 border-b-2 border-[#d4af37] pb-2 text-sm font-bold text-gray-600 uppercase tracking-wider transition hover:text-[#b38b20]"
                    >
                        Learn More About Us →
                    </Link>

                </div>
            </div>
        </section>
    );
}