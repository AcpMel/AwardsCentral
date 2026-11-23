const advantages = [
    {
        number: "01",
        title: "Recognition Experts",
        description:
            "We understand the importance of recognizing achievements and creating awards that represent meaningful milestones.",
    },
    {
        number: "02",
        title: "Consistent Quality",
        description:
            "We focus on craftsmanship, durable materials, and attention to detail in every recognition piece.",
    },
    {
        number: "03",
        title: "Nationwide Presence",
        description:
            "With branches in key locations, we serve customers and organizations across the Philippines.",
    },
    {
        number: "04",
        title: "Seamless Operations",
        description:
            "From product selection to customization, we aim to make the recognition process convenient and straightforward.",
    },
];

export default function WhyChooseUs() {
    return (
        <section className="bg-[#171717] px-6 py-24 text-white md:px-10">

            <div className="mx-auto max-w-7xl">

                <div className="max-w-3xl">

                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#d4af37]">
                        The Awards Central Difference
                    </p>

                    <h2 className="mt-4 text-4xl font-bold md:text-5xl">
                        Why Choose Awards Central?
                    </h2>

                    <p className="mt-6 leading-8 text-white/60">
                        We believe every achievement deserves recognition.
                        Our commitment is to deliver quality awards that
                        make every milestone memorable.
                    </p>

                </div>

                <div className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">

                    {advantages.map((item) => (
                        <div
                            key={item.number}
                            className="border-t border-white/20 pt-7"
                        >

                            <span className="text-sm font-bold tracking-widest text-[#d4af37]">
                                {item.number}
                            </span>

                            <h3 className="mt-5 text-xl font-semibold">
                                {item.title}
                            </h3>

                            <p className="mt-4 text-sm leading-7 text-white/60">
                                {item.description}
                            </p>

                        </div>
                    ))}

                </div>
            </div>
        </section>
    );
}