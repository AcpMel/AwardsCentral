
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Product {
    id: number;
    product_name: string;
    product_type: string;
    price: number | string;
    stocks: number;
    created_at: string;
}

interface ProductResponse {
    results?: Product[];
}

export default function AdminDashboard() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        async function loadDashboard() {
            try {
                const token = localStorage.getItem(
                    "awardscentral_admin_access"
                );

                if (!token) {
                    window.location.href = "/admin/login";
                    return;
                }

                if (!API_URL) {
                    throw new Error("API URL is not configured.");
                }

                const response = await fetch(
                    `${API_URL.replace(/\/$/, "")}/products/`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                        cache: "no-store",
                    }
                );

                if (response.status === 401) {
                    localStorage.removeItem(
                        "awardscentral_admin_access"
                    );
                    localStorage.removeItem(
                        "awardscentral_admin_refresh"
                    );

                    window.location.href = "/admin/login";
                    return;
                }

                if (!response.ok) {
                    throw new Error("Unable to load products.");
                }

                const data: Product[] | ProductResponse =
                    await response.json();

                const productList = Array.isArray(data)
                    ? data
                    : data.results ?? [];

                setProducts(productList);
            } catch (err) {
                console.error(err);
                setError("Unable to load dashboard information.");
            } finally {
                setLoading(false);
            }
        }

        loadDashboard();
    }, []);

    const totalProducts = products.length;

    const totalStocks = products.reduce(
        (total, product) => total + Number(product.stocks || 0),
        0
    );

    const lowStockProducts = products.filter(
        (product) => product.stocks > 0 && product.stocks <= 5
    ).length;

    const outOfStockProducts = products.filter(
        (product) => product.stocks === 0
    ).length;

    const recentProducts = [...products]
        .sort(
            (a, b) =>
                new Date(b.created_at).getTime() -
                new Date(a.created_at).getTime()
        )
        .slice(0, 5);

    const formatPrice = (price: number | string) =>
        new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
        }).format(Number(price));

    return (
        <main className="min-h-screen bg-gray-100 p-6 md:p-8">
            <div className="mx-auto max-w-7xl">

                {/* HEADER */}
                <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">
                            Dashboard
                        </h1>

                        <p className="mt-1 text-sm text-gray-500">
                            Welcome to Awards Central administration.
                        </p>
                    </div>

                    <Link
                        href="/admin/products/add"
                        className="inline-flex items-center justify-center rounded-lg bg-[#D4AF37] px-5 py-3 text-sm font-semibold text-black transition hover:bg-[#e6c65c]"
                    >
                        + Add New Product
                    </Link>
                </div>

                {/* LOADING */}
                {loading && (
                    <div className="rounded-xl bg-white p-8 text-center text-gray-500 shadow-sm">
                        Loading dashboard...
                    </div>
                )}

                {/* ERROR */}
                {!loading && error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {/* STATISTICS */}
                        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

                            <div className="rounded-xl bg-white p-6 shadow-sm">
                                <p className="text-sm text-gray-500">
                                    Total Products
                                </p>

                                <h2 className="mt-3 text-3xl font-bold text-gray-900">
                                    {totalProducts}
                                </h2>

                                <p className="mt-2 text-xs text-gray-400">
                                    Products in catalog
                                </p>
                            </div>

                            <div className="rounded-xl bg-white p-6 shadow-sm">
                                <p className="text-sm text-gray-500">
                                    Total Stocks
                                </p>

                                <h2 className="mt-3 text-3xl font-bold text-gray-900">
                                    {totalStocks.toLocaleString()}
                                </h2>

                                <p className="mt-2 text-xs text-gray-400">
                                    Available inventory units
                                </p>
                            </div>

                            <div className="rounded-xl bg-white p-6 shadow-sm">
                                <p className="text-sm text-gray-500">
                                    Low Stock Products
                                </p>

                                <h2 className="mt-3 text-3xl font-bold text-amber-600">
                                    {lowStockProducts}
                                </h2>

                                <p className="mt-2 text-xs text-gray-400">
                                    Products with 1–5 units
                                </p>
                            </div>

                            <div className="rounded-xl bg-white p-6 shadow-sm">
                                <p className="text-sm text-gray-500">
                                    Out of Stock
                                </p>

                                <h2 className="mt-3 text-3xl font-bold text-red-600">
                                    {outOfStockProducts}
                                </h2>

                                <p className="mt-2 text-xs text-gray-400">
                                    Products requiring replenishment
                                </p>
                            </div>
                        </div>

                        {/* QUICK ACTIONS */}
                        <section className="mt-8">
                            <h2 className="mb-4 text-lg font-bold text-gray-900">
                                Quick Actions
                            </h2>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <Link
                                    href="/admin/products/add"
                                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-[#D4AF37]"
                                >
                                    <h3 className="font-semibold text-gray-900">
                                        Add New Product
                                    </h3>

                                    <p className="mt-2 text-sm text-gray-500">
                                        Add a new product to your inventory.
                                    </p>
                                </Link>

                                <Link
                                    href="/admin/products"
                                    className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition hover:border-[#D4AF37]"
                                >
                                    <h3 className="font-semibold text-gray-900">
                                        Manage Products
                                    </h3>

                                    <p className="mt-2 text-sm text-gray-500">
                                        View and manage your product catalog.
                                    </p>
                                </Link>
                            </div>
                        </section>

                        {/* RECENT PRODUCTS */}
                        <section className="mt-8 rounded-xl bg-white p-6 shadow-sm">
                            <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                                <div>
                                    <h2 className="text-lg font-bold text-gray-900">
                                        Recent Products
                                    </h2>

                                    <p className="mt-1 text-sm text-gray-500">
                                        Your latest added products.
                                    </p>
                                </div>

                                <Link
                                    href="/admin/products"
                                    className="text-sm font-semibold text-[#a17a2b] hover:underline"
                                >
                                    View All Products →
                                </Link>
                            </div>

                            {recentProducts.length === 0 ? (
                                <div className="py-10 text-center text-sm text-gray-500">
                                    No products available yet.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-[650px] text-left">
                                        <thead>
                                            <tr className="border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500">
                                                <th className="px-4 py-3">
                                                    Product
                                                </th>

                                                <th className="px-4 py-3">
                                                    Type
                                                </th>

                                                <th className="px-4 py-3">
                                                    Price
                                                </th>

                                                <th className="px-4 py-3">
                                                    Stocks
                                                </th>
                                            </tr>
                                        </thead>

                                        <tbody>
                                            {recentProducts.map((product) => (
                                                <tr
                                                    key={product.id}
                                                    className="border-b border-gray-100 last:border-0"
                                                >
                                                    <td className="px-4 py-4 text-sm font-medium text-gray-900">
                                                        {product.product_name}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm text-gray-500">
                                                        {product.product_type}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm text-gray-700">
                                                        {formatPrice(product.price)}
                                                    </td>

                                                    <td className="px-4 py-4 text-sm">
                                                        <span
                                                            className={
                                                                product.stocks === 0
                                                                    ? "font-semibold text-red-600"
                                                                    : product.stocks <= 5
                                                                      ? "font-semibold text-amber-600"
                                                                      : "text-gray-700"
                                                            }
                                                        >
                                                            {product.stocks}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}
