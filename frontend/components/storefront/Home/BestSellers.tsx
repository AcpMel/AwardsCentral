
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Product } from "@/types/product";
import { getBestSellerProducts } from "@/services/product.service";
import ProductModal from "./ProductModal";

export default function BestSellers() {
    const sliderRef = useRef<HTMLDivElement>(null);

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProduct, setSelectedProduct] =
        useState<Product | null>(null);

    // Fetch Best Seller Products
    useEffect(() => {
        async function fetchProducts() {
            try {
                setLoading(true);
                setError(null);

                const data = await getBestSellerProducts();
                setProducts(data);
            } catch (err) {
                console.error("Failed to load best sellers:", err);
                setError("Unable to load best seller products.");
            } finally {
                setLoading(false);
            }
        }

        fetchProducts();
    }, []);

    // Scroll Carousel
    const scrollProducts = (direction: "left" | "right") => {
        if (!sliderRef.current) return;

        const slider = sliderRef.current;
        const scrollAmount = slider.clientWidth * 0.8;

        slider.scrollBy({
            left:
                direction === "left"
                    ? -scrollAmount
                    : scrollAmount,
            behavior: "smooth",
        });
    };

    return (
        <section className="bg-[#0a0a0a] px-5 py-20 text-white md:px-10 lg:px-16">
            <div className="mx-auto max-w-7xl">

                {/* SECTION HEADER */}
                <div className="mb-10 flex flex-col items-center justify-between gap-5 text-center sm:flex-row sm:text-left">
                    <div>
                        <p className="mb-3 text-sm font-medium uppercase tracking-[0.3em] text-yellow-500">
                            Our Collection
                        </p>

                        <h2 className="text-3xl font-bold uppercase tracking-wide md:text-4xl">
                            Best Sellers
                        </h2>

                        <p className="mt-3 text-sm text-gray-400">
                            Discover our most popular awards and trophies.
                        </p>
                    </div>

                    {/* VIEW ALL PRODUCTS */}
                    <Link
                        href="/products"
                        className="border border-yellow-500 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-yellow-500 transition hover:bg-yellow-500 hover:text-black"
                    >
                        View All Products
                    </Link>
                </div>

                {/* LOADING STATE */}
                {loading && (
                    <div className="flex min-h-[300px] items-center justify-center">
                        <div className="text-center">
                            <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-yellow-500/30 border-t-yellow-500" />

                            <p className="text-sm text-gray-400">
                                Loading best sellers...
                            </p>
                        </div>
                    </div>
                )}

                {/* ERROR STATE */}
                {!loading && error && (
                    <div className="flex min-h-[250px] items-center justify-center">
                        <p className="text-center text-sm text-red-400">
                            {error}
                        </p>
                    </div>
                )}

                {/* EMPTY STATE */}
                {!loading && !error && products.length === 0 && (
                    <div className="flex min-h-[250px] items-center justify-center">
                        <p className="text-center text-sm text-gray-400">
                            No best seller products available at the moment.
                        </p>
                    </div>
                )}

                {/* PRODUCTS CAROUSEL */}
                {!loading && !error && products.length > 0 && (
                    <div className="relative">

                        {/* PREVIOUS BUTTON */}
                        <button
                            type="button"
                            onClick={() => scrollProducts("left")}
                            aria-label="Previous products"
                            className="absolute -left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-yellow-500 bg-black text-xl text-yellow-500 transition hover:bg-yellow-500 hover:text-black md:-left-5"
                        >
                            &#8249;
                        </button>

                        {/* PRODUCT SLIDER */}
                        <div
                            ref={sliderRef}
                            className="flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth pb-5 scrollbar-hide"
                        >
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    className="w-[calc(50%-8px)] flex-none snap-start sm:w-[calc(33.333%-11px)] lg:w-[calc(16.666%-14px)]"
                                >
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setSelectedProduct(product)
                                        }
                                        aria-label={`View details for ${product.product_name}`}
                                        className="group w-full text-left"
                                    >
                                        {/* PRODUCT IMAGE */}
                                        <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[#171717] p-4 transition duration-300 group-hover:bg-[#222]">
                                            {product.product_image ? (
                                                <Image
                                                    src={product.product_image}
                                                    alt={product.product_name}
                                                    width={400}
                                                    height={400}
                                                    unoptimized
                                                    className="h-full w-full object-contain transition duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="flex h-full w-full items-center justify-center text-center text-xs text-gray-500">
                                                    No Image Available
                                                </div>
                                            )}

                                            {/* HOVER OVERLAY */}
                                            <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition duration-300 group-hover:bg-black/40">
                                                <span className="translate-y-3 border border-yellow-500 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-yellow-500 opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                                                    View Details
                                                </span>
                                            </div>
                                        </div>

                                        {/* PRODUCT DETAILS */}
                                        <div className="pt-4">
                                            <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-yellow-500">
                                                {product.product_type}
                                            </p>

                                            <h3 className="line-clamp-2 min-h-[40px] text-sm font-medium text-white transition group-hover:text-yellow-500">
                                                {product.product_name}
                                            </h3>

                                            <p className="mt-2 text-sm font-semibold text-yellow-500">
                                                {new Intl.NumberFormat(
                                                    "en-PH",
                                                    {
                                                        style: "currency",
                                                        currency: "PHP",
                                                    }
                                                ).format(Number(product.price))}
                                            </p>
                                        </div>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* NEXT BUTTON */}
                        <button
                            type="button"
                            onClick={() => scrollProducts("right")}
                            aria-label="Next products"
                            className="absolute -right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-yellow-500 bg-black text-xl text-yellow-500 transition hover:bg-yellow-500 hover:text-black md:-right-5"
                        >
                            &#8250;
                        </button>
                    </div>
                )}
            </div>

            {/* PRODUCT INFORMATION MODAL */}
            <ProductModal
                product={selectedProduct}
                onClose={() => setSelectedProduct(null)}
            />
        </section>
    );
}
