
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { Product } from "@/types/product";

interface Props {
    slug: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;

function createProductSlug(name: string) {
    return name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

function getImageUrl(image: string | null) {
    if (!image) return null;

    if (image.startsWith("http")) return image;

    const baseUrl = API_URL?.replace(/\/api\/?$/, "") ?? "";

    return `${baseUrl}${image.startsWith("/") ? "" : "/"}${image}`;
}

function formatPrice(price: string) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(Number(price));
}

export default function ProductDetailsClient({ slug }: Props) {
    const [product, setProduct] = useState<Product | null>(null);
    const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function loadProduct() {
            try {
                setLoading(true);
                setError("");

                if (!API_URL) {
                    throw new Error("NEXT_PUBLIC_API_URL is missing.");
                }

                // GET ALL PRODUCTS
                const response = await fetch(
                    `${API_URL.replace(/\/$/, "")}/products/`,
                    { cache: "no-store" }
                );

                if (!response.ok) {
                    throw new Error("Unable to load products.");
                }

                const data = await response.json();

                const allProducts: Product[] = Array.isArray(data)
                    ? data
                    : data.results ?? [];

                // FIND PRODUCT USING ITS URL SLUG
                const currentProduct = allProducts.find(
                    (item) =>
                        createProductSlug(item.product_name) === slug
                );

                if (!currentProduct) {
                    if (!cancelled) {
                        setError("Product not found.");
                    }
                    return;
                }

                if (cancelled) return;

                setProduct(currentProduct);

                // FIND PRODUCTS WITH THE SAME PRODUCT TYPE
                const sameCategory = allProducts.filter(
                    (item) =>
                        item.id !== currentProduct.id &&
                        item.product_type === currentProduct.product_type
                );

                // FALLBACK TO OTHER PRODUCTS IF NO MATCHES EXIST
                const otherProducts = allProducts.filter(
                    (item) => item.id !== currentProduct.id
                );

                const related = sameCategory.length > 0
                    ? sameCategory
                    : otherProducts;

                setRelatedProducts(related.slice(0, 4));

            } catch (err) {
                console.error("Product details error:", err);

                if (!cancelled) {
                    setError(
                        "Unable to load product information. Please try again."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadProduct();

        return () => {
            cancelled = true;
        };
    }, [slug]);

    // LOADING STATE
    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#f8f8f8]">
                <p className="text-gray-500">
                    Loading product details...
                </p>
            </main>
        );
    }

    // ERROR STATE
    if (error || !product) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f8f8f8]">
                <h1 className="text-xl font-semibold text-gray-900">
                    {error || "Product not found."}
                </h1>

                <Link
                    href="/products"
                    className="text-yellow-700 underline"
                >
                    Back to Products
                </Link>
            </main>
        );
    }

    const imageUrl = getImageUrl(product.product_image);

    return (
        <main className="min-h-screen bg-[#f8f8f8] px-4 py-10 md:px-8">

            <div className="mx-auto max-w-7xl">

                {/* BREADCRUMB */}
                <div className="mb-8 text-sm text-gray-500">
                    <Link href="/" className="hover:text-yellow-700">
                        Home
                    </Link>

                    {" / "}

                    <Link href="/products" className="hover:text-yellow-700">
                        Products
                    </Link>

                    {" / "}

                    <span className="text-gray-900">
                        {product.product_name}
                    </span>
                </div>

                {/* PRODUCT DETAILS */}
                <section className="grid gap-10 rounded-xl bg-white p-5 shadow-sm md:grid-cols-2 md:p-10">

                    {/* PRODUCT IMAGE */}
                    <div className="flex min-h-[350px] items-center justify-center rounded-lg bg-gray-100 p-6 md:min-h-[500px]">

                        {imageUrl ? (
                            <Image
                                src={imageUrl}
                                alt={product.product_name}
                                width={700}
                                height={700}
                                unoptimized
                                priority
                                className="max-h-[450px] w-full object-contain"
                            />
                        ) : (
                            <p className="text-gray-400">
                                No product image available
                            </p>
                        )}

                    </div>

                    {/* PRODUCT INFORMATION */}
                    <div className="flex flex-col justify-center">

                        <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-yellow-700">
                            {product.product_type}
                        </p>

                        <h1 className="text-3xl font-bold text-gray-900 md:text-4xl">
                            {product.product_name}
                        </h1>

                        <p className="mt-5 text-2xl font-bold text-yellow-700">
                            {formatPrice(product.price)}
                        </p>

                        {/* DESCRIPTION */}
                        <div className="mt-6 border-y border-gray-200 py-5">
                            <h2 className="mb-3 font-semibold text-gray-900">
                                Product Description
                            </h2>

                            <p className="whitespace-pre-line leading-7 text-gray-600">
                                {product.product_description ||
                                    "No product description available."}
                            </p>
                        </div>

                        {/* STOCKS */}
                        <div className="mt-5">
                            <p className="text-sm text-gray-500">
                                Availability
                            </p>

                            <p
                                className={`mt-1 font-semibold ${
                                    product.stocks > 0
                                        ? "text-green-700"
                                        : "text-red-600"
                                }`}
                            >
                                {product.stocks > 0
                                    ? `${product.stocks} in stock`
                                    : "Out of stock"}
                            </p>
                        </div>

                        {/* PRODUCT TYPE */}
                        <div className="mt-5">
                            <p className="text-sm text-gray-500">
                                Product Category
                            </p>

                            <p className="mt-1 font-medium text-gray-900">
                                {product.product_type}
                            </p>
                        </div>

                        {/* BACK BUTTON */}
                        <div className="mt-8">
                            <Link
                                href="/products"
                                className="inline-block rounded-lg border border-gray-300 px-6 py-3 text-sm font-semibold text-gray-800 transition hover:bg-gray-100"
                            >
                                Back to Products
                            </Link>
                        </div>

                    </div>
                </section>

                {/* RELATED PRODUCTS */}
                <section className="mt-16">

                    <div className="mb-7">
                        <p className="text-sm font-semibold uppercase tracking-widest text-yellow-700">
                            You May Also Like
                        </p>

                        <h2 className="mt-2 text-2xl font-bold text-gray-900 md:text-3xl">
                            Related Products
                        </h2>

                        <p className="mt-2 text-gray-500">
                            Explore more products from our collection.
                        </p>
                    </div>

                    {relatedProducts.length === 0 ? (
                        <p className="rounded-lg bg-white p-6 text-center text-gray-500">
                            No related products available.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 gap-5 md:grid-cols-4">

                            {relatedProducts.map((item) => {
                                const relatedImage = getImageUrl(
                                    item.product_image
                                );

                                const relatedSlug = createProductSlug(
                                    item.product_name
                                );

                                return (
                                    <Link
                                        key={item.id}
                                        href={`/products/${relatedSlug}`}
                                        className="group overflow-hidden rounded-lg bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                                    >
                                        {/* RELATED PRODUCT IMAGE */}
                                        <div className="flex h-48 items-center justify-center bg-gray-100 p-4 md:h-64">

                                            {relatedImage ? (
                                                <Image
                                                    src={relatedImage}
                                                    alt={item.product_name}
                                                    width={400}
                                                    height={400}
                                                    unoptimized
                                                    className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                                                />
                                            ) : (
                                                <span className="text-sm text-gray-400">
                                                    No image
                                                </span>
                                            )}

                                        </div>

                                        {/* RELATED PRODUCT INFORMATION */}
                                        <div className="p-4">

                                            <h3 className="line-clamp-2 font-semibold text-gray-900">
                                                {item.product_name}
                                            </h3>

                                            <p className="mt-2 font-bold text-yellow-700">
                                                {formatPrice(item.price)}
                                            </p>

                                            <p className="mt-2 text-sm text-gray-500">
                                                View Product →
                                            </p>

                                        </div>
                                    </Link>
                                );
                            })}

                        </div>
                    )}

                </section>

            </div>
        </main>
    );
}
