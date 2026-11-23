
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const navigation = [
    { label: "Dashboard", href: "/admin", icon: "▦" },
    { label: "Products", href: "/admin/products", icon: "□" },
    { label: "Categories", href: "/admin/categories", icon: "▤" },
    { label: "Orders", href: "/admin/orders", icon: "▣" },
    { label: "Customers", href: "/admin/customers", icon: "♙" },
];

export default function AdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    const isLoginPage = pathname === "/admin/login";

    const [checking, setChecking] = useState(!isLoginPage);
    const [authorized, setAuthorized] = useState(isLoginPage);

    useEffect(() => {
        if (isLoginPage) {
            setChecking(false);
            setAuthorized(false);
            return;
        }

        let active = true;

        async function verifyAdmin() {
            const token = localStorage.getItem("awardscentral_admin_access");

            if (!token || !API_URL) {
                router.replace("/admin/login");
                return;
            }

            try {
                const response = await fetch(`${API_URL}/auth/profile/`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error("Session expired.");
                }

                const profile = await response.json();

                if (!profile.is_staff) {
                    throw new Error("Administrator access required.");
                }

                if (active) {
                    setAuthorized(true);
                    setChecking(false);
                }
            } catch {
                localStorage.removeItem("awardscentral_admin_access");
                localStorage.removeItem("awardscentral_admin_refresh");

                router.replace("/admin/login");
            }
        }

        verifyAdmin();

        return () => {
            active = false;
        };
    }, [pathname, isLoginPage, router]);

    const handleLogout = () => {
        localStorage.removeItem("awardscentral_admin_access");
        localStorage.removeItem("awardscentral_admin_refresh");

        router.replace("/admin/login");
    };

    if (isLoginPage) {
        return <>{children}</>;
    }

    if (checking || !authorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#111111] text-white">
                <div className="text-center">
                    <div className="w-10 h-10 border-4 border-[#D4AF37] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm text-gray-300">
                        Verifying administrator access...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F5F6F8] flex">

            {/* SIDEBAR */}
            <aside className="w-64 bg-[#171717] text-white fixed inset-y-0 left-0 z-40 flex flex-col">

                <div className="h-20 flex items-center px-6 border-b border-white/10">
                    <div className="w-10 h-10 rounded-lg bg-[#D4AF37] flex items-center justify-center text-black font-bold mr-3">
                        AC
                    </div>

                    <div>
                        <h1 className="font-bold tracking-wide">
                            AWARDS CENTRAL
                        </h1>
                        <p className="text-[10px] tracking-[0.2em] text-[#D4AF37]">
                            ADMIN PANEL
                        </p>
                    </div>
                </div>

                <div className="px-5 py-6">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-4">
                        Main Menu
                    </p>

                    <nav className="space-y-2">
                        {navigation.map((item) => {
                            const active =
                                item.href === "/admin"
                                    ? pathname === "/admin"
                                    : pathname.startsWith(item.href);

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition ${
                                        active
                                            ? "bg-[#D4AF37] text-black font-bold"
                                            : "text-gray-300 hover:bg-white/10 hover:text-white"
                                    }`}
                                >
                                    <span className="text-lg">{item.icon}</span>
                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto p-5 border-t border-white/10">
                    <Link
                        href="/"
                        className="block text-sm text-gray-400 hover:text-white mb-4"
                    >
                        ← View Storefront
                    </Link>

                    <button
                        onClick={handleLogout}
                        className="w-full rounded-lg border border-red-500/40 px-4 py-3 text-sm text-red-400 hover:bg-red-500 hover:text-white transition"
                    >
                        Sign Out
                    </button>
                </div>

            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 min-w-0 ml-64">

                <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-8">
                    <div>
                        <p className="text-xs text-gray-400">
                            AWARDS CENTRAL / ADMIN
                        </p>
                        <h2 className="font-semibold text-gray-800">
                            {pathname === "/admin"
                                ? "Dashboard"
                                : pathname.startsWith("/admin/products/add")
                                ? "Add Product"
                                : pathname.startsWith("/admin/products")
                                ? "Product Management"
                                : pathname.split("/").pop()?.replaceAll("-", " ")}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-[#D4AF37] text-black flex items-center justify-center font-bold">
                            A
                        </div>
                        <span className="text-sm font-medium text-gray-700">
                            Administrator
                        </span>
                    </div>
                </header>

                <main className="p-8">
                    {children}
                </main>

            </div>

        </div>
    );
}
