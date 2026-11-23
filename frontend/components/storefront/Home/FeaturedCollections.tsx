import Link from "next/link";

const collections = [
    {
        name: "Crystal Awards",
        description: "Elegant awards that capture excellence and prestige.",
        image: "/images/collections/crystal-awards.jpg",
    },
    {
        name: "Corporate Awards",
        description: "Recognize dedication, leadership, and achievement.",
        image: "/images/collections/corporate-awards.jpg",
    },
    {
        name: "Custom Awards",
        description: "Personalized recognition made meaningful.",
        image: "/images/collections/custom-awards.jpg",
    },
];

export default function FeaturedCollections() {
    return (
        <section className="bg-[#101010] px-6 py-24 text-white md:px-10">

            <div className="mx-auto max-w-7xl">

                <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">

                    <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#d4af37]">
                            Explore Our Selection
                        </p>

                        <h2 className="mt-4 text-4xl font-semibold md:text-5xl">
                            Featured Collections
                        </h2>
                    </div>

                    <Link
                        href="/products"
                        className="w-fit border-b border-[#d4af37] pb-2 text-sm font-medium transition hover:text-[#d4af37]"
                    >
                        View All Products →
                    </Link>

                </div>

                <div className="mt-12 grid gap-6 md:grid-cols-3">

                    {collections.map((collection, index) => (
                        <Link
                            href="/products"
                            key={collection.name}
                            className="group relative flex min-h-[380px] flex-col justify-end overflow-hidden bg-[#202020]"
                        >

                            <div
                                className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-110"
                                style={{
                                    backgroundImage: `url('${collection.image}')`,
                                }}
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                            <div className="relative z-10 p-8">

                                <span className="text-sm font-semibold text-[#d4af37]">
                                    COLLECTION 0{index + 1}
                                </span>

                                <h3 className="mt-3 text-3xl font-semibold">
                                    {collection.name}
                                </h3>

                                <p className="mt-3 text-sm leading-7 text-white/70">
                                    {collection.description}
                                </p>

                                <span className="mt-7 inline-flex items-center gap-3 text-sm font-semibold text-[#e5b82f]">
                                    Explore Collection →
                                </span>

                            </div>

                        </Link>
                    ))}

                </div>
            </div>
        </section>
    );
}