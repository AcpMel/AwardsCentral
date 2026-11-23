
"use client";

import Link from "next/link";
import type { FormEvent } from "react";

const branches = [
    {
        name: "Manila",
        label: "Head Office",
        address:
            "32 DM Building, Visayas Ave, Congressional Ave, Quezon City, 1104 Metro Manila",
        phones: ["0954 183 1131", "0917 137 0586", "0956 062 9230"],
        email: "sales@awardscentral.com.ph",
    },
    {
        name: "Cebu",
        label: "Cebu Branch",
        address:
            "Hi-way Central Building, M.C. Briones Highway, Mandaue City, Cebu",
        phones: ["0928 590 9188", "0916 298 3941"],
        email: "cebu@awardscentral.com.ph",
    },
    {
        name: "Cagayan de Oro",
        label: "CDO Branch",
        address:
            "PS Agro Inc, Lapasan National Highway, Cagayan de Oro City",
        phones: ["0956 062 9238"],
        email: "cdo@awardscentral.com.ph",
    },
];

export default function ContactPage() {
    function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const form = event.currentTarget;
        const formData = new FormData(form);

        const name = String(formData.get("name") || "");
        const email = String(formData.get("email") || "");
        const phone = String(formData.get("phone") || "");
        const subject = String(formData.get("subject") || "");
        const message = String(formData.get("message") || "");

        const emailSubject = encodeURIComponent(
            `Website Inquiry: ${subject}`
        );

        const emailBody = encodeURIComponent(
            `Name: ${name}\n` +
            `Email: ${email}\n` +
            `Phone: ${phone}\n\n` +
            `Subject: ${subject}\n\n` +
            `Message:\n${message}`
        );

        window.location.href =
            `mailto:sales@awardscentral.com.ph?subject=${emailSubject}&body=${emailBody}`;
    }

    return (
        <main className="min-h-screen bg-white text-[#171717]">

            {/* HERO SECTION */}
            <section className="relative flex min-h-[420px] items-center overflow-hidden bg-[#111111] md:min-h-[520px]">

                <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-[#29220e]" />

                <div className="absolute -right-20 -top-40 h-[500px] w-[500px] rounded-full border border-[#d4af37]/20" />

                <div className="absolute -right-10 -top-28 h-[400px] w-[400px] rounded-full border border-[#d4af37]/20" />

                <div className="relative z-10 mx-auto w-full max-w-7xl px-6 py-24 md:px-10">

                    <p className="text-sm font-bold uppercase tracking-[0.35em] text-[#d4af37]">
                        We're Here to Help
                    </p>

                    <h1 className="mt-5 text-5xl font-bold leading-tight text-white md:text-7xl">
                        Contact
                        <span className="text-[#d4af37]"> Us.</span>
                    </h1>

                    <p className="mt-6 max-w-2xl text-base leading-8 text-white/65 md:text-lg">
                        Have questions about our products, customization,
                        or orders? Get in touch with our team. We'd be
                        happy to help you create something worth celebrating.
                    </p>

                    <div className="mt-9">
                        <a
                            href="#contact-form"
                            className="inline-flex items-center gap-3 rounded-full bg-[#d4af37] px-8 py-4 text-sm font-bold text-black transition hover:bg-[#f0c66d]"
                        >
                            Send an Inquiry
                            <span>→</span>
                        </a>
                    </div>

                </div>
            </section>


            {/* CONTACT INFORMATION */}
            <section className="px-6 py-20 md:px-10 md:py-24">

                <div className="mx-auto max-w-7xl">

                    <div className="text-center">

                        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#a78325]">
                            Get in Touch
                        </p>

                        <h2 className="mt-4 text-3xl font-bold md:text-5xl">
                            We'd Love to Hear From You
                        </h2>

                        <p className="mx-auto mt-5 max-w-2xl leading-8 text-gray-500">
                            Whether you're planning a corporate event,
                            looking for personalized awards, or simply
                            have a question, our team is ready to assist.
                        </p>

                    </div>

                    <div className="mt-14 grid gap-6 md:grid-cols-3">

                        {/* EMAIL */}
                        <div className="border border-gray-200 p-8 transition hover:-translate-y-1 hover:border-[#d4af37] hover:shadow-lg">

                            <div className="flex h-14 w-14 items-center justify-center bg-[#f8f4e9] text-2xl text-[#a78325]">
                                ✉
                            </div>

                            <h3 className="mt-6 text-xl font-bold">
                                Email Us
                            </h3>

                            <p className="mt-3 text-sm leading-7 text-gray-500">
                                Send us your questions and inquiries.
                            </p>

                            <a
                                href="mailto:sales@awardscentral.com.ph"
                                className="mt-5 block break-all text-sm font-semibold text-[#a78325] hover:underline"
                            >
                                sales@awardscentral.com.ph
                            </a>

                        </div>

                        {/* PHONE */}
                        <div className="border border-gray-200 p-8 transition hover:-translate-y-1 hover:border-[#d4af37] hover:shadow-lg">

                            <div className="flex h-14 w-14 items-center justify-center bg-[#f8f4e9] text-2xl text-[#a78325]">
                                ☎
                            </div>

                            <h3 className="mt-6 text-xl font-bold">
                                Call Us
                            </h3>

                            <p className="mt-3 text-sm leading-7 text-gray-500">
                                Talk to our team about your requirements.
                            </p>

                            <a
                                href="tel:09541831131"
                                className="mt-5 block text-sm font-semibold text-[#a78325] hover:underline"
                            >
                                0954 183 1131
                            </a>

                        </div>

                        {/* LOCATION */}
                        <div className="border border-gray-200 p-8 transition hover:-translate-y-1 hover:border-[#d4af37] hover:shadow-lg">

                            <div className="flex h-14 w-14 items-center justify-center bg-[#f8f4e9] text-2xl text-[#a78325]">
                                ⌖
                            </div>

                            <h3 className="mt-6 text-xl font-bold">
                                Visit Us
                            </h3>

                            <p className="mt-3 text-sm leading-7 text-gray-500">
                                Visit one of our branches in the Philippines.
                            </p>

                            <p className="mt-5 text-sm font-semibold text-[#a78325]">
                                Manila · Cebu · Cagayan de Oro
                            </p>

                        </div>

                    </div>
                </div>
            </section>


            {/* CONTACT FORM */}
            <section
                id="contact-form"
                className="bg-[#f7f6f2] px-6 py-20 md:px-10 md:py-28"
            >

                <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2">

                    {/* LEFT CONTENT */}
                    <div>

                        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#a78325]">
                            Send Us a Message
                        </p>

                        <h2 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
                            Let's Make Your Next Achievement Memorable.
                        </h2>

                        <p className="mt-7 leading-8 text-gray-600">
                            Tell us what you're looking for. Whether it's
                            a customized trophy, corporate recognition
                            award, or a bulk order, provide your details
                            and we'll help you with your inquiry.
                        </p>

                        <div className="mt-10 space-y-6">

                            <div className="flex gap-4">
                                <span className="text-xl text-[#a78325]">✦</span>

                                <div>
                                    <h3 className="font-bold">
                                        Product Inquiries
                                    </h3>

                                    <p className="mt-1 text-sm leading-7 text-gray-500">
                                        Ask about product details, availability,
                                        and pricing.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <span className="text-xl text-[#a78325]">✦</span>

                                <div>
                                    <h3 className="font-bold">
                                        Customization Requests
                                    </h3>

                                    <p className="mt-1 text-sm leading-7 text-gray-500">
                                        Discuss your design ideas, logos,
                                        and personalized awards.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <span className="text-xl text-[#a78325]">✦</span>

                                <div>
                                    <h3 className="font-bold">
                                        Bulk Orders
                                    </h3>

                                    <p className="mt-1 text-sm leading-7 text-gray-500">
                                        Get in touch for events, organizations,
                                        and corporate orders.
                                    </p>
                                </div>
                            </div>

                        </div>

                    </div>


                    {/* FORM */}
                    <div className="bg-white p-7 shadow-sm md:p-10">

                        <h3 className="text-2xl font-bold">
                            Send an Inquiry
                        </h3>

                        <p className="mt-2 text-sm text-gray-500">
                            Fill out the form and we'll help you with your request.
                        </p>

                        <form onSubmit={handleSubmit} className="mt-8 space-y-5">

                            <div>
                                <label
                                    htmlFor="name"
                                    className="mb-2 block text-sm font-semibold"
                                >
                                    Full Name *
                                </label>

                                <input
                                    id="name"
                                    name="name"
                                    type="text"
                                    required
                                    placeholder="Enter your full name"
                                    className="w-full border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#d4af37]"
                                />
                            </div>


                            <div className="grid gap-5 sm:grid-cols-2">

                                <div>
                                    <label
                                        htmlFor="email"
                                        className="mb-2 block text-sm font-semibold"
                                    >
                                        Email Address *
                                    </label>

                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        required
                                        placeholder="example@email.com"
                                        className="w-full border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#d4af37]"
                                    />
                                </div>

                                <div>
                                    <label
                                        htmlFor="phone"
                                        className="mb-2 block text-sm font-semibold"
                                    >
                                        Phone Number
                                    </label>

                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        placeholder="09XX XXX XXXX"
                                        className="w-full border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#d4af37]"
                                    />
                                </div>

                            </div>


                            <div>
                                <label
                                    htmlFor="subject"
                                    className="mb-2 block text-sm font-semibold"
                                >
                                    Subject *
                                </label>

                                <select
                                    id="subject"
                                    name="subject"
                                    required
                                    defaultValue=""
                                    className="w-full border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-[#d4af37]"
                                >
                                    <option value="" disabled>
                                        Select an inquiry type
                                    </option>

                                    <option value="Product Inquiry">
                                        Product Inquiry
                                    </option>

                                    <option value="Customization Request">
                                        Customization Request
                                    </option>

                                    <option value="Bulk Order">
                                        Bulk Order
                                    </option>

                                    <option value="Order Follow-up">
                                        Order Follow-up
                                    </option>

                                    <option value="Other">
                                        Other
                                    </option>
                                </select>
                            </div>


                            <div>
                                <label
                                    htmlFor="message"
                                    className="mb-2 block text-sm font-semibold"
                                >
                                    Your Message *
                                </label>

                                <textarea
                                    id="message"
                                    name="message"
                                    required
                                    rows={5}
                                    placeholder="Tell us how we can help you..."
                                    className="w-full resize-y border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-[#d4af37]"
                                />
                            </div>


                            <button
                                type="submit"
                                className="flex w-full items-center justify-center gap-3 bg-[#d4af37] px-6 py-4 text-sm font-bold text-black transition hover:bg-[#e8c45e]"
                            >
                                Send Message
                                <span>→</span>
                            </button>

                            <p className="text-xs leading-6 text-gray-400">
                                Submitting this form opens your default email
                                application with your inquiry prepared.
                            </p>

                        </form>

                    </div>

                </div>
            </section>


            {/* BRANCH LOCATIONS */}
            <section className="px-6 py-24 md:px-10">

                <div className="mx-auto max-w-7xl">

                    <div className="text-center">

                        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#a78325]">
                            Our Locations
                        </p>

                        <h2 className="mt-4 text-4xl font-bold md:text-5xl">
                            Find a Branch Near You
                        </h2>

                        <p className="mx-auto mt-5 max-w-2xl leading-8 text-gray-500">
                            Connect with our team through our branches
                            across the Philippines.
                        </p>

                    </div>

                    <div className="mt-14 grid gap-6 md:grid-cols-3">

                        {branches.map((branch) => (
                            <div
                                key={branch.name}
                                className="flex flex-col border border-gray-200 p-8 transition duration-300 hover:-translate-y-1 hover:border-[#d4af37] hover:shadow-lg"
                            >

                                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#a78325]">
                                    {branch.label}
                                </p>

                                <h3 className="mt-3 text-2xl font-bold">
                                    {branch.name}
                                </h3>

                                <div className="my-6 h-px bg-gray-200" />

                                <div>
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                        Address
                                    </p>

                                    <p className="mt-2 text-sm leading-7 text-gray-600">
                                        {branch.address}
                                    </p>
                                </div>

                                <div className="mt-6">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                        Contact Numbers
                                    </p>

                                    <div className="mt-2 space-y-2">
                                        {branch.phones.map((phone) => (
                                            <a
                                                key={phone}
                                                href={`tel:${phone.replace(/\s/g, "")}`}
                                                className="block text-sm text-gray-600 transition hover:text-[#a78325]"
                                            >
                                                {phone}
                                            </a>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-auto pt-7">
                                    <a
                                        href={`mailto:${branch.email}`}
                                        className="break-all text-sm font-semibold text-[#a78325] hover:underline"
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
            <section className="bg-[#171717] px-6 py-20 text-center text-white md:px-10 md:py-28">

                <div className="mx-auto max-w-3xl">

                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#d4af37]">
                        Awards Central Philippines
                    </p>

                    <h2 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">
                        Every Achievement Deserves Recognition.
                    </h2>

                    <p className="mt-6 leading-8 text-white/60">
                        Explore our collections and discover awards
                        designed to make every achievement unforgettable.
                    </p>

                    <Link
                        href="/products"
                        className="mt-9 inline-flex items-center gap-3 bg-[#d4af37] px-9 py-4 text-sm font-bold text-black transition hover:bg-[#f0c66d]"
                    >
                        Explore Our Products
                        <span>→</span>
                    </Link>

                </div>
            </section>

        </main>
    );
}
