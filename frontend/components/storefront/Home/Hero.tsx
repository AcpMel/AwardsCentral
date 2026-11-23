
import Link from "next/link";

const announcementItems = Array.from({ length: 2 });

export default function Hero() {
    return (
        <>
            {/* ANNOUNCEMENT BAR */}
            <div className="w-full overflow-hidden bg-[#e5b82f] py-2">
                <div className="announcement-marquee flex w-max">
                    {announcementItems.map((_, index) => (
                        <div
                            key={index}
                            className="flex shrink-0 items-center"
                            aria-hidden={index === 1}
                        >
                            {Array.from({ length: 8 }).map((_, itemIndex) => (
                                <div
                                    key={itemIndex}
                                    className="flex shrink-0 items-center gap-8 px-5 text-[11px] font-semibold tracking-wide text-black"
                                >
                                    <span>5% DISCOUNT TO ALL PRODUCTS</span>
                                    <span className="text-sm">✳</span>
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            {/* HERO SECTION */}
            <section className="relative flex min-h-[620px] items-center overflow-hidden bg-black md:min-h-[700px]">
                <video
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    className="absolute inset-0 h-full w-full object-cover object-center"
                >
                    <source src="/images/hero_vid.mp4" type="video/mp4" />
                    Your browser supports no video element.
                </video>

                <div className="absolute inset-0 bg-black/30" />

                <div className="relative z-10 mx-auto flex w-full max-w-[1600px] justify-end px-6 py-24 sm:px-10 lg:px-16">
                    <div className="max-w-3xl text-center lg:text-right">
                        <h1 className="text-5xl font-light leading-[1.05] tracking-tight text-white drop-shadow-lg sm:text-6xl md:text-7xl lg:text-[90px]">
                            For Our{" "}
                            <span className="font-medium text-[#e5b82f]">
                                Winners.
                            </span>
                        </h1>

                        <p className="mx-auto mt-5 max-w-2xl text-base font-light leading-relaxed text-white drop-shadow-md sm:text-lg md:text-xl lg:ml-auto">
                            Each award is crafted as a lasting symbol of honor,
                            excellence, and achievement. Designed to celebrate
                            milestones with elegance and meaning.
                        </p>

                        <div className="mt-12 flex justify-center lg:justify-end">
                            <Link
                                href="/products"
                                className="inline-flex items-center gap-3 rounded-full border border-black bg-[#d8ad58] px-7 py-4 text-sm font-semibold text-black shadow-lg transition duration-300 hover:bg-[#f0c66d]"
                            >
                                Explore Collections
                                <span aria-hidden="true">→</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </>
    );
}
