
import { Suspense } from "react";
import ProductCustomizePage from "@/components/storefront/Customizer/ProductCustomizePage";

interface CustomizePageProps {
    params: Promise<{
        id: string;
    }>;
}

export default function CustomizePage({ params }: CustomizePageProps) {
    return (
        <Suspense
            fallback={
                <main className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
                    <p className="text-gray-600">
                        Loading customization page...
                    </p>
                </main>
            }
        >
            <CustomizePageContent params={params} />
        </Suspense>
    );
}

async function CustomizePageContent({
    params,
}: CustomizePageProps) {
    const { id } = await params;

    return <ProductCustomizePage productId={id} />;
}
