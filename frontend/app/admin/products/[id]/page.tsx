"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const ACCESS_TOKEN_KEY = "awardscentral_admin_access";
const REFRESH_TOKEN_KEY = "awardscentral_admin_refresh";

type ProductCategory = {
    id: number;
    category_name: string;
    slug: string;
};

type Product = {
    id: number;
    product_name: string;
    product_description: string;
    stocks: number;
    meta_description: string;
    product_image: string | null;
    product_glb: string | null;
    price: string | number;
    product_type: string;
    categories: ProductCategory[];
    is_import: boolean;
    is_best_seller: boolean;
    is_customizable: boolean;
    created_at: string;
    updated_at: string;
};

export default function ProductDetailsPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const fetchProduct = useCallback(async () => {
        const token = localStorage.getItem(ACCESS_TOKEN_KEY);

        if (!token) {
            router.push("/admin/login");
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await fetch(
                `${API_URL}/products/${params.id}/`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: "no-store",
                }
            );

            if (response.status === 401) {
                localStorage.removeItem(ACCESS_TOKEN_KEY);
                localStorage.removeItem(REFRESH_TOKEN_KEY);
                router.push("/admin/login");
                return;
            }

            if (!response.ok) {
                throw new Error("Unable to load product details.");
            }

            const data: Product = await response.json();
            setProduct(data);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }, [params.id, router]);

    useEffect(() => {
        fetchProduct();
    }, [fetchProduct]);

    const formatPrice = (price: string | number) =>
        new Intl.NumberFormat("en-PH", {
            style: "currency",
            currency: "PHP",
        }).format(Number(price));

    const formatDate = (date: string) =>
        new Date(date).toLocaleString("en-PH", {
            dateStyle: "medium",
            timeStyle: "short",
        });

    if (loading) {
        return (
            <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-gray-500">
                Loading product details...
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="space-y-4">
                <Link
                    href="/admin/products"
                    className="text-sm font-medium text-gray-500 hover:text-gray-900"
                >
                    ← Back to Products
                </Link>

                <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error || "Product not found."}
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-6xl space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <Link
                        href="/admin/products"
                        className="mb-3 inline-block text-sm font-medium text-gray-500 hover:text-gray-900"
                    >
                        ← Back to Products
                    </Link>

                    <h1 className="text-2xl font-bold text-gray-900">
                        Product Details
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        Product ID: {product.id}
                    </p>
                </div>

                <Link
                    href={`/admin/products/${product.id}/edit`}
                    className="rounded-lg bg-gray-900 px-5 py-3 text-center text-sm font-semibold text-white hover:bg-gray-700"
                >
                    Edit Product
                </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-xl border border-gray-200 bg-white p-6">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        Product Image
                    </h2>

                    {product.product_image ? (
                        <img
                            src={product.product_image}
                            alt={product.product_name}
                            className="max-h-[420px] w-full rounded-lg bg-gray-50 object-contain"
                        />
                    ) : (
                        <div className="flex h-72 items-center justify-center rounded-lg bg-gray-50 text-sm text-gray-400">
                            No product image available
                        </div>
                    )}
                </section>

                <section className="space-y-5 rounded-xl border border-gray-200 bg-white p-6">
                    <div>
                        <p className="text-sm text-gray-500">Product Name</p>
                        <h2 className="mt-1 text-xl font-bold text-gray-900">
                            {product.product_name}
                        </h2>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Price</p>
                            <p className="mt-1 font-semibold text-gray-900">
                                {formatPrice(product.price)}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Stocks</p>
                            <p className="mt-1 font-semibold text-gray-900">
                                {product.stocks}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Product Type</p>
                            <p className="mt-1 font-medium text-gray-900">
                                {product.product_type}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Inventory Status</p>
                            <span
                                className={
                                    product.stocks > 0
                                        ? "mt-1 inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
                                        : "mt-1 inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
                                }
                            >
                                {product.stocks > 0 ? "In Stock" : "Out of Stock"}
                            </span>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Categories</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                            {product.categories?.length ? (
                                product.categories.map((category) => (
                                    <span
                                        key={category.id}
                                        className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
                                    >
                                        {category.category_name}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-gray-400">
                                    No categories assigned
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Product Description</p>
                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                            {product.product_description || "No description provided."}
                        </p>
                    </div>
                </section>
            </div>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    Product Settings
                </h2>

                <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                        <p className="text-sm text-gray-500">Imported Product</p>
                        <p className="mt-1 font-medium text-gray-900">
                            {product.is_import ? "Yes" : "No"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Best Seller</p>
                        <p className="mt-1 font-medium text-gray-900">
                            {product.is_best_seller ? "Yes" : "No"}
                        </p>
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Customizable</p>
                        <p className="mt-1 font-medium text-gray-900">
                            {product.is_customizable ? "Yes" : "No"}
                        </p>
                    </div>
                </div>
            </section>

            <section className="rounded-xl border border-gray-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-semibold text-gray-900">
                    Product Files and SEO
                </h2>

                <div className="space-y-4">
                    <div>
                        <p className="text-sm text-gray-500">3D Model</p>
                        {product.product_glb ? (
                            <a
                                href={product.product_glb}
                                target="_blank"
                                rel="noreferrer"
                                className="mt-1 inline-block text-sm font-medium text-blue-700 underline"
                            >
                                View GLB file
                            </a>
                        ) : (
                            <p className="mt-1 text-sm text-gray-400">
                                No 3D model uploaded
                            </p>
                        )}
                    </div>

                    <div>
                        <p className="text-sm text-gray-500">Meta Description</p>
                        <p className="mt-1 text-sm text-gray-700">
                            {product.meta_description || "No meta description."}
                        </p>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <p className="text-sm text-gray-500">Date Created</p>
                            <p className="mt-1 text-sm text-gray-700">
                                {formatDate(product.created_at)}
                            </p>
                        </div>

                        <div>
                            <p className="text-sm text-gray-500">Last Updated</p>
                            <p className="mt-1 text-sm text-gray-700">
                                {formatDate(product.updated_at)}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}