"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";

const navigationLinks = [
    { name: "Home", href: "/" },
    { name: "Products", href: "/products" },
    { name: "About Us", href: "/about-us" },
    { name: "Contact", href: "/contact" },
];

export default function Navbar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 w-full border-b border-[#292929] bg-[#080808]">

            <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4">

                {/* LOGO */}
                {/* LOGO */}
                {/* LOGO AND BRAND NAME */}
                <Link href="/" className="flex items-center gap-3">
                    <Image
                        src="/images/acp_logo.png"
                        alt="Awards Central Logo"
                        width={110}
                        height={110}
                        priority
                        className="h-12 w-auto object-contain"
                    />

                    <span className="text-base font-lgiht tracking-tight text-white">
                        Awards <span className="text-yellow-500">Central</span>
                        <span className="block text-base font-light tracking-[0.2em] text-gray-300">
                            PHILIPPINES
                        </span>
                    </span>
                </Link>

                {/* DESKTOP NAVIGATION */}
                <nav className="hidden items-center gap-8 md:flex">
                    {navigationLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            className="text-sm font-normal text-white-700 transition hover:text-yellow-500"
                        >
                            {link.name}
                        </Link>
                    ))}
                </nav>

                {/* ACTION BUTTONS */}
                <div className="hidden items-center gap-5 md:flex">
                    <Link
                        href="/cart"
                        className="text-sm font-medium text-gray-700 hover:text-amber-600"
                    >
                        Cart
                    </Link>

                    <Link
                        href="/login"
                        className="rounded-full bg-gray-900 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-amber-600"
                    >
                        Sign In
                    </Link>
                </div>

                {/* MOBILE MENU BUTTON */}
                <button
                    type="button"
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="text-2xl text-gray-900 md:hidden"
                    aria-label="Toggle navigation menu"
                    aria-expanded={menuOpen}
                >
                    {menuOpen ? "✕" : "☰"}
                </button>
            </div>

            {/* MOBILE NAVIGATION */}
            {menuOpen && (
                <nav className="border-t border-gray-200 bg-white px-5 py-4 md:hidden">
                    {navigationLinks.map((link) => (
                        <Link
                            key={link.name}
                            href={link.href}
                            onClick={() => setMenuOpen(false)}
                            className="block border-b border-gray-100 py-3 text-sm font-medium text-gray-700 hover:text-amber-600"
                        >
                            {link.name}
                        </Link>
                    ))}

                    <Link
                        href="/cart"
                        onClick={() => setMenuOpen(false)}
                        className="block py-3 text-sm font-medium text-gray-700"
                    >
                        Shopping Cart
                    </Link>

                    <Link
                        href="/login"
                        onClick={() => setMenuOpen(false)}
                        className="mt-2 block rounded-lg bg-gray-900 px-4 py-3 text-center text-sm font-medium text-white"
                    >
                        Sign In
                    </Link>
                </nav>
            )}
        </header>
    );
}
