"use client";

import { useState } from "react";

const questions = [
    {
        question: "Can I customize my awards?",
        answer:
            "Yes. Selected products support customization. You can explore the product details and customization options available for each item.",
    },
    {
        question: "Can I order awards in bulk?",
        answer:
            "Yes. Awards Central serves organizations and events that require multiple awards. Contact our team to discuss your requirements.",
    },
    {
        question: "Do you offer different types of awards?",
        answer:
            "Yes. Our collections include crystal, glass, acrylic, trophies, medals, and other recognition products.",
    },
    {
        question: "Where are your branches located?",
        answer:
            "Awards Central has branches in Manila, Cebu, and Cagayan de Oro.",
    },
    {
        question: "How can I inquire about a product?",
        answer:
            "You can browse our Products page and contact our team for questions about product availability, customization, and orders.",
    },
];

export default function FAQ() {
    const [activeIndex, setActiveIndex] = useState<number | null>(0);

    return (
        <section className="bg-white px-6 py-24 md:px-10">

            <div className="mx-auto max-w-4xl">

                <div className="text-center">

                    <p className="text-sm font-bold uppercase tracking-[0.3em] text-[#b38b20]">
                        Need Assistance?
                    </p>

                    <h2 className="mt-4 text-4xl font-bold text-[#171717] md:text-5xl">
                        Frequently Asked Questions
                    </h2>

                    <p className="mt-5 text-gray-500">
                        Find answers to common questions about our awards
                        and services.
                    </p>

                </div>

                <div className="mt-12 divide-y divide-gray-200 border-y border-gray-200">

                    {questions.map((item, index) => (
                        <div key={item.question}>

                            <button
                                type="button"
                                onClick={() =>
                                    setActiveIndex(
                                        activeIndex === index ? null : index
                                    )
                                }
                                aria-expanded={activeIndex === index}
                                className="flex w-full items-center justify-between gap-6 py-6 text-left"
                            >

                                <span className="font-semibold text-[#171717]">
                                    {item.question}
                                </span>

                                <span className="text-xl text-[#b38b20]">
                                    {activeIndex === index ? "−" : "+"}
                                </span>

                            </button>

                            {activeIndex === index && (
                                <p className="max-w-3xl pb-6 text-sm leading-7 text-gray-500">
                                    {item.answer}
                                </p>
                            )}

                        </div>
                    ))}

                </div>
            </div>
        </section>
    );
}