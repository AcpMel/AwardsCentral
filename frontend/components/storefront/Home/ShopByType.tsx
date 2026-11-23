import Link from "next/link";

const productTypes = [
    {
        name: "Crystal Awards",
        description: "Elegant and timeless recognition pieces.",
        number: "01",
    },
    {
        name: "Glass Awards",
        description: "Refined awards with a polished finish.",
        number: "02",
    },
    {
        name: "Acrylic Awards",
        description: "Modern designs for every occasion.",
        number: "03",
    },
    {
        name: "Wooden Awards",
        description: "Classic craftsmanship and character.",
        number: "04",
    },
    {
        name: "Trophies",
        description: "Celebrate victories and milestones.",
        number: "05",
    },
    {
        name: "Medals",
        description: "Honor outstanding performance.",
        number: "06",
    },
];

export default function ShopByType() {
    return (
        <section className="bg-white px-6 py-24 md:px-10">

            <div className="mx-auto max-w-7xl">

                <div className="text-center">

                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#b38b20]">
                        Find Your Perfect Award
                    </p>

                    <h2 className="mt-4 text-4xl font-bold text-[#171717] md:text-5xl">
                        Shop by Award Type
                    </h2>

                    <p className="mx-auto mt-5 max-w-2xl leading-8 text-gray-500">
                        Discover recognition pieces for every achievement,
                        occasion, and celebration.
                    </p>

                </div>

                <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

                    {productTypes.map((type) => (
                        <Link
                            href="/products"
                            key={type.number}
                            className="group border border-gray-200 p-8 transition duration-300 hover:-translate-y-1 hover:border-[#d4af37] hover:shadow-lg"
                        >

                            <div className="flex items-center justify-between">

                                <span className="text-3xl font-light text-[#d4af37]">
                                    {type.number}
                                </span>

                                <span className="text-2xl text-gray-300 transition group-hover:text-[#d4af37]">
                                    ↗
                                </span>

                            </div>

                            <h3 className="mt-8 text-xl font-bold text-[#171717]">
                                {type.name}
                            </h3>

                            <p className="mt-3 text-sm leading-7 text-gray-500">
                                {type.description}
                            </p>

                        </Link>
                    ))}

                </div>
            </div>
        </section>
    );
}