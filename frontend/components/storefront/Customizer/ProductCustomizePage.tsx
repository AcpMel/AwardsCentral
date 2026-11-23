
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/types/product";
import { getProductById } from "@/services/product.service";
import ProductCustomizer from "./ProductCustomizer";

interface Props {
    productId: string;
}

export default function ProductCustomizePage({ productId }: Props) {
    const router = useRouter();

    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const id = Number(productId);

        if (!Number.isInteger(id) || id <= 0) {
            setError("Invalid product ID.");
            setLoading(false);
            return;
        }

        let cancelled = false;

        async function loadProduct() {
            try {
                const result = await getProductById(id);

                if (!cancelled) {
                    setProduct(result);
                }
            } catch (err) {
                console.error("Product loading error:", err);

                if (!cancelled) {
                    setError("Unable to load this product.");
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
    }, [productId]);

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
                <p className="text-gray-600">
                    Loading product...
                </p>
            </main>
        );
    }

    if (error || !product) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f5f5f5]">
                <h1 className="text-xl font-semibold text-gray-900">
                    {error || "Product not found."}
                </h1>

                <button
                    type="button"
                    onClick={() => router.back()}
                    className="rounded bg-black px-5 py-2 text-white hover:bg-gray-800"
                >
                    Go Back
                </button>
            </main>
        );
    }

    if (!product.product_glb) {
        return (
            <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#f5f5f5]">
                <h1 className="text-xl font-semibold text-gray-900">
                    No 3D model available for this product.
                </h1>

                <Link
                    href="/products"
                    className="text-yellow-700 underline"
                >
                    Browse Products
                </Link>
            </main>
        );
    }

    return <ProductCustomizer product={product} />;
}
