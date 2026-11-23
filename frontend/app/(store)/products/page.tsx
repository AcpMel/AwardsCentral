
"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Product } from "@/types/product";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface ProductCategory {
    id: number;
    category_name: string;
    slug: string;
    description?: string;
    parent?: number | null;
    children?: ProductCategory[];
}

type CategorizedProduct = Product & {
    categories?: ProductCategory[];
};

type SortOption =
    | "recommended"
    | "newest"
    | "price-low"
    | "price-high";

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

    const baseUrl =
        API_URL?.replace(/\/api\/?$/, "").replace(/\/$/, "") ?? "";

    return `${baseUrl}${image.startsWith("/") ? "" : "/"}${image}`;
}

function formatPrice(price: string | number) {
    return new Intl.NumberFormat("en-PH", {
        style: "currency",
        currency: "PHP",
    }).format(Number(price));
}

function getProductList(data: any): CategorizedProduct[] {
    return Array.isArray(data) ? data : data.results ?? [];
}

function getCategoryList(data: any): ProductCategory[] {
    return Array.isArray(data) ? data : data.results ?? [];
}

// Get the selected parent category and all its descendants.
function getDescendantCategoryIds(category: ProductCategory): number[] {
    const ids: number[] = [category.id];

    function collectChildren(parent: ProductCategory) {
        parent.children?.forEach((child) => {
            ids.push(child.id);
            collectChildren(child);
        });
    }

    collectChildren(category);

    return ids;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<CategorizedProduct[]>([]);
    const [categories, setCategories] = useState<ProductCategory[]>([]);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [selectedCategory, setSelectedCategory] = useState("all");
    const [search, setSearch] = useState("");
    const [sortBy, setSortBy] = useState<SortOption>("recommended");

    const [maxPrice, setMaxPrice] = useState(0);

    useEffect(() => {
        let cancelled = false;

        async function loadProducts() {
            try {
                if (!API_URL) {
                    throw new Error("NEXT_PUBLIC_API_URL is missing.");
                }

                const baseUrl = API_URL.replace(/\/$/, "");

                const [productsResponse, categoriesResponse] =
                    await Promise.all([
                        fetch(`${baseUrl}/products/`, {
                            cache: "no-store",
                        }),
                        fetch(`${baseUrl}/categories/tree/`, {
                            cache: "no-store",
                        }),
                    ]);

                if (!productsResponse.ok) {
                    throw new Error("Unable to retrieve products.");
                }

                const productData = await productsResponse.json();
                const productList = getProductList(productData);

                let categoryList: ProductCategory[] = [];

                // Categories are optional. A category API issue
                // will not prevent the product catalog from loading.
                if (categoriesResponse.ok) {
                    const categoryData = await categoriesResponse.json();
                    categoryList = getCategoryList(categoryData);
                }

                if (!cancelled) {
                    setProducts(productList);
                    setCategories(categoryList);

                    const highestPrice = productList.length
                        ? Math.max(
                              ...productList.map((product) =>
                                  Number(product.price)
                              )
                          )
                        : 0;

                    setMaxPrice(highestPrice);
                }
            } catch (err) {
                console.error("Products loading error:", err);

                if (!cancelled) {
                    setError(
                        "Unable to load products. Please try again."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadProducts();

        return () => {
            cancelled = true;
        };
    }, []);

    const minimumPrice = products.length
        ? Math.min(...products.map((product) => Number(product.price)))
        : 0;

    const highestPrice = products.length
        ? Math.max(...products.map((product) => Number(product.price)))
        : 0;

    const filteredProducts = useMemo(() => {
        let result = [...products];

        // CATEGORY FILTER:
        // Include products assigned to the selected parent
        // or any of its nested child categories.
        if (selectedCategory !== "all") {
            const selectedParent = categories.find(
                (category) => category.slug === selectedCategory
            );

            if (selectedParent) {
                const categoryIds =
                    getDescendantCategoryIds(selectedParent);

                result = result.filter((product) =>
                    product.categories?.some((category) =>
                        categoryIds.includes(category.id)
                    )
                );
            }
        }

        // SEARCH FILTER
        if (search.trim()) {
            const searchTerm = search.toLowerCase().trim();

            result = result.filter((product) => {
                const matchesName = product.product_name
                    .toLowerCase()
                    .includes(searchTerm);

                const matchesDescription = product.product_description
                    ?.toLowerCase()
                    .includes(searchTerm);

                const matchesCategory = product.categories?.some(
                    (category) =>
                        category.category_name
                            .toLowerCase()
                            .includes(searchTerm)
                );

                return (
                    matchesName ||
                    matchesDescription ||
                    matchesCategory
                );
            });
        }

        // PRICE FILTER
        result = result.filter(
            (product) => Number(product.price) <= maxPrice
        );

        // SORTING
        switch (sortBy) {
            case "price-low":
                result.sort(
                    (a, b) => Number(a.price) - Number(b.price)
                );
                break;

            case "price-high":
                result.sort(
                    (a, b) => Number(b.price) - Number(a.price)
                );
                break;

            case "newest":
                result.sort(
                    (a, b) =>
                        new Date(b.created_at).getTime() -
                        new Date(a.created_at).getTime()
                );
                break;

            default:
                // Preserve the original API ordering.
                break;
        }

        return result;
    }, [products, categories, selectedCategory, search, maxPrice, sortBy]);

    function clearFilters() {
        setSelectedCategory("all");
        setSearch("");
        setSortBy("recommended");
        setMaxPrice(highestPrice);
    }

    return (
        <main className="min-h-screen bg-white text-gray-900">
            <div className="mx-auto max-w-[1500px] px-4 py-8 md:px-8">

                {/* BREADCRUMB */}
                <nav className="mb-8 flex items-center gap-2 text-sm text-gray-500">
                    <Link
                        href="/"
                        className="transition hover:text-[#b28a32]"
                    >
                        Home
                    </Link>

                    <span>/</span>

                    <span className="font-medium text-gray-900">
                        Products
                    </span>
                </nav>

                {/* MOBILE CATEGORY NAVIGATION */}
                <div className="mb-7 lg:hidden">
                    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider">
                        Browse by
                    </h2>

                    <div className="flex gap-2 overflow-x-auto pb-2">
                        <button
                            type="button"
                            onClick={() => setSelectedCategory("all")}
                            className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                                selectedCategory === "all"
                                    ? "border-[#b28a32] bg-[#b28a32] text-white"
                                    : "border-gray-300 text-gray-700"
                            }`}
                        >
                            All Products
                        </button>

                        {categories.map((category) => (
                            <button
                                key={category.id}
                                type="button"
                                onClick={() =>
                                    setSelectedCategory(category.slug)
                                }
                                className={`shrink-0 rounded-full border px-4 py-2 text-sm transition ${
                                    selectedCategory === category.slug
                                        ? "border-[#b28a32] bg-[#b28a32] text-white"
                                        : "border-gray-300 text-gray-700"
                                }`}
                            >
                                {category.category_name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-10 lg:grid-cols-[250px_minmax(0,1fr)]">

                    {/* SIDEBAR */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-24 space-y-9">

                            {/* CATEGORY FILTER */}
                            <section>
                                <h2 className="mb-5 text-lg font-semibold">
                                    Browse by
                                </h2>

                                <button
                                    type="button"
                                    onClick={() => setSelectedCategory("all")}
                                    className={`mb-3 block text-left text-sm transition ${
                                        selectedCategory === "all"
                                            ? "font-semibold text-[#b28a32]"
                                            : "text-gray-600 hover:text-[#b28a32]"
                                    }`}
                                >
                                    All Products
                                </button>

                                <div className="space-y-3">
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            type="button"
                                            onClick={() =>
                                                setSelectedCategory(category.slug)
                                            }
                                            className={`flex w-full items-center justify-between gap-2 text-left text-sm transition ${
                                                selectedCategory === category.slug
                                                    ? "font-semibold text-[#b28a32]"
                                                    : "text-gray-600 hover:text-[#b28a32]"
                                            }`}
                                        >
                                            <span>
                                                {category.category_name}
                                            </span>

                                            <span className="text-gray-400">
                                                ›
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <div className="border-t border-gray-200" />

                            {/* PRICE FILTER */}
                            <section>
                                <h2 className="mb-5 text-lg font-semibold">
                                    Filter by
                                </h2>

                                <h3 className="mb-4 text-sm font-medium">
                                    Price
                                </h3>

                                {products.length > 0 ? (
                                    <>
                                        <input
                                            type="range"
                                            min={minimumPrice}
                                            max={highestPrice || minimumPrice + 1}
                                            step={1}
                                            value={Math.min(
                                                maxPrice,
                                                highestPrice
                                            )}
                                            onChange={(event) =>
                                                setMaxPrice(
                                                    Number(event.target.value)
                                                )
                                            }
                                            className="w-full cursor-pointer accent-[#b28a32]"
                                        />

                                        <div className="mt-3 flex justify-between text-xs text-gray-500">
                                            <span>
                                                {formatPrice(minimumPrice)}
                                            </span>

                                            <span>
                                                {formatPrice(
                                                    Math.min(
                                                        maxPrice,
                                                        highestPrice
                                                    )
                                                )}
                                            </span>
                                        </div>
                                    </>
                                ) : (
                                    <p className="text-xs text-gray-400">
                                        Price filter unavailable.
                                    </p>
                                )}
                            </section>

                            <div className="border-t border-gray-200" />

                            <button
                                type="button"
                                onClick={clearFilters}
                                className="text-sm font-medium text-gray-500 underline transition hover:text-[#b28a32]"
                            >
                                Clear all filters
                            </button>
                        </div>
                    </aside>

                    {/* MAIN PRODUCT CONTENT */}
                    <section className="min-w-0">

                        {/* CATEGORY HEADER */}
                        <div className="mb-7">
                            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
                                {selectedCategory === "all"
                                    ? "All Products"
                                    : categories.find(
                                          (category) =>
                                              category.slug === selectedCategory
                                      )?.category_name ?? "Products"}
                            </h1>

                            <p className="mt-2 text-sm text-gray-500">
                                {filteredProducts.length}{" "}
                                {filteredProducts.length === 1
                                    ? "product"
                                    : "products"}
                            </p>
                        </div>

                        {/* SEARCH AND SORT */}
                        <div className="mb-7 flex flex-col gap-4 border-b border-gray-200 pb-5 sm:flex-row sm:items-center sm:justify-between">

                            <div className="relative w-full sm:max-w-sm">
                                <input
                                    type="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search products..."
                                    className="w-full border-b border-gray-300 bg-transparent py-3 pr-8 text-sm outline-none transition placeholder:text-gray-400 focus:border-[#b28a32]"
                                />

                                <span className="absolute right-2 top-3 text-gray-400">
                                    ⌕
                                </span>
                            </div>

                            <div className="flex items-center gap-3">
                                <label
                                    htmlFor="sort-products"
                                    className="shrink-0 text-sm text-gray-500"
                                >
                                    Sort by:
                                </label>

                                <select
                                    id="sort-products"
                                    value={sortBy}
                                    onChange={(event) =>
                                        setSortBy(
                                            event.target.value as SortOption
                                        )
                                    }
                                    className="w-full max-w-[190px] border-b border-gray-300 bg-white py-2 text-sm outline-none focus:border-[#b28a32]"
                                >
                                    <option value="recommended">
                                        Recommended
                                    </option>
                                    <option value="newest">
                                        Newest
                                    </option>
                                    <option value="price-low">
                                        Price: Low to High
                                    </option>
                                    <option value="price-high">
                                        Price: High to Low
                                    </option>
                                </select>
                            </div>
                        </div>

                        {/* LOADING */}
                        {loading && (
                            <div className="flex min-h-[350px] items-center justify-center">
                                <p className="text-sm text-gray-500">
                                    Loading products...
                                </p>
                            </div>
                        )}

                        {/* ERROR */}
                        {!loading && error && (
                            <div className="flex min-h-[350px] flex-col items-center justify-center gap-4">
                                <p className="text-red-600">{error}</p>

                                <button
                                    type="button"
                                    onClick={() => window.location.reload()}
                                    className="bg-[#b28a32] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#967128]"
                                >
                                    Try Again
                                </button>
                            </div>
                        )}

                        {/* EMPTY */}
                        {!loading &&
                            !error &&
                            filteredProducts.length === 0 && (
                                <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 text-center">
                                    <h2 className="text-lg font-semibold">
                                        No products found
                                    </h2>

                                    <p className="text-sm text-gray-500">
                                        Try changing your category or filters.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="mt-2 text-sm font-semibold text-[#b28a32] underline"
                                    >
                                        Clear filters
                                    </button>
                                </div>
                            )}

                        {/* PRODUCT GRID */}
                        {!loading &&
                            !error &&
                            filteredProducts.length > 0 && (
                                <div className="grid grid-cols-2 gap-x-4 gap-y-9 sm:grid-cols-2 sm:gap-x-6 md:grid-cols-3 xl:grid-cols-4">

                                    {filteredProducts.map((product) => {
                                        const imageUrl = getImageUrl(
                                            product.product_image
                                        );

                                        const slug = createProductSlug(
                                            product.product_name
                                        );

                                        const inStock = product.stocks > 0;

                                        return (
                                            <Link
                                                key={product.id}
                                                href={`/products/${slug}`}
                                                className="group min-w-0"
                                            >
                                                {/* IMAGE */}
                                                <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-[#f6f6f6] p-4">

                                                    {imageUrl ? (
                                                        <Image
                                                            src={imageUrl}
                                                            alt={product.product_name}
                                                            width={500}
                                                            height={500}
                                                            unoptimized
                                                            className="h-full w-full object-contain transition duration-500 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <span className="text-xs text-gray-400">
                                                            No image available
                                                        </span>
                                                    )}

                                                    {/* AVAILABILITY */}
                                                    <span
                                                        className={`absolute left-2 top-2 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide sm:left-3 sm:top-3 ${
                                                            inStock
                                                                ? "bg-white text-green-700"
                                                                : "bg-white text-amber-700"
                                                        }`}
                                                    >
                                                        {inStock
                                                            ? `${product.stocks} pcs`
                                                            : "Pre-Order"}
                                                    </span>
                                                </div>

                                                {/* PRODUCT INFORMATION */}
                                                <div className="pt-4">

                                                    {/* CATEGORY TAGS */}
                                                    <div className="mb-2 flex flex-wrap gap-1">
                                                        {product.categories
                                                            ?.slice(0, 2)
                                                            .map((category) => (
                                                                <span
                                                                    key={category.id}
                                                                    className="text-[10px] font-medium uppercase tracking-wider text-[#a17a2b]"
                                                                >
                                                                    {category.category_name}
                                                                </span>
                                                            ))}
                                                    </div>

                                                    <h2 className="line-clamp-2 min-h-10 text-sm font-medium text-gray-900 transition group-hover:text-[#a17a2b] sm:text-base">
                                                        {product.product_name}
                                                    </h2>

                                                    <p className="mt-2 text-sm font-semibold text-gray-900">
                                                        {formatPrice(product.price)}
                                                    </p>

                                                    <p
                                                        className={`mt-3 text-xs font-medium ${
                                                            inStock
                                                                ? "text-green-700"
                                                                : "text-amber-700"
                                                        }`}
                                                    >
                                                        {inStock
                                                            ? "Available"
                                                            : "Contact Us"}
                                                    </p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                    </section>
                </div>
            </div>
        </main>
    );
}
