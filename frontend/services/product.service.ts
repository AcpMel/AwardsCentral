
import type { Product } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getBestSellerProducts(): Promise<Product[]> {
    if (!API_URL) {
        throw new Error(
            "NEXT_PUBLIC_API_URL is not configured."
        );
    }

    const endpoint = `${API_URL.replace(/\/$/, "")}/products/best-sellers/?limit=6`;

    console.log("API Request:", endpoint);

    try {
        const response = await fetch(endpoint, {
            method: "GET",
            cache: "no-store",
        });

        if (!response.ok) {
            const error = await response.text();

            throw new Error(
                `API Error ${response.status}: ${error}`
            );
        }

        return await response.json();

    } catch (error) {
        console.error("Best Sellers Fetch Error:", error);
        throw error;
    }
}


export async function getProductById(id: number): Promise<Product> {
    if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL is missing.");
    }

    const response = await fetch(
        `${API_URL.replace(/\/$/, "")}/products/${id}/`,
        {
            method: "GET",
            cache: "no-store",
        }
    );

    if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.status}`);
    }

    return response.json();
}

