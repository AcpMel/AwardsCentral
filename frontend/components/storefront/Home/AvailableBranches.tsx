const branches = [
    {
        name: "Manila",
        location: "Quezon City, Metro Manila",
    },
    {
        name: "Cebu",
        location: "Mandaue City, Cebu",
    },
    {
        name: "Cagayan de Oro",
        location: "Lapasan, Cagayan de Oro City",
    },
];

export default function AvailableBranches() {
    return (
        <section className="bg-[#f7f6f2] px-6 py-24 md:px-10">

            <div className="mx-auto max-w-7xl">

                <div className="text-center">

                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#b38b20]">
                        Our Presence
                    </p>

                    <h2 className="mt-4 text-4xl font-bold text-[#171717] md:text-5xl">
                        Serving Across the Philippines
                    </h2>

                    <p className="mx-auto mt-5 max-w-2xl leading-8 text-gray-500">
                        Our branches help us serve organizations and
                        individuals looking for quality recognition awards.
                    </p>

                </div>

                <div className="mt-12 grid gap-6 md:grid-cols-3">

                    {branches.map((branch, index) => (
                        <div
                            key={branch.name}
                            className="border border-gray-200 bg-white p-8 transition hover:border-[#d4af37] hover:shadow-lg"
                        >

                            <span className="text-sm font-bold text-[#b38b20]">
                                BRANCH 0{index + 1}
                            </span>

                            <h3 className="mt-5 text-2xl font-bold text-[#171717]">
                                {branch.name}
                            </h3>

                            <p className="mt-3 text-sm text-gray-500">
                                {branch.location}
                            </p>

                        </div>
                    ))}

                </div>
            </div>
        </section>
    );
}