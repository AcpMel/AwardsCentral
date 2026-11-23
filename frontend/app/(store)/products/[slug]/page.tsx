
import { Suspense } from "react";
import ProductDetailsClient from "./ProductDetailsClient";

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
}

async function ProductDetailsContent({ params }: PageProps) {
    const { slug } = await params;

    return <ProductDetailsClient slug={slug} />;
}

export default function ProductDetailsPage({ params }: PageProps) {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen items-center justify-center bg-[#f8f8f8]">
                    <p className="text-gray-500">
                        Loading product details...
                    </p>
                </main>
            }
        >
            <ProductDetailsContent params={params} />
        </Suspense>
    );
}
