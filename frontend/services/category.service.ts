import type { ProductCategory } from "@/types/category";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function getCategoryTree(): Promise<ProductCategory[]> {
    if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured.");
    }

    const response = await fetch(
        `${API_URL}/categories/tree/`,
        {
            method: "GET",
            cache: "no-store",
        }
    );

    if (!response.ok) {
        throw new Error(
            `Failed to load categories. Status: ${response.status}`
        );
    }

    const data = await response.json();

    return Array.isArray(data) ? data : data.results ?? [];
}