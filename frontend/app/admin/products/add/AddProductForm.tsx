
"use client";

import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import CategoryTreeSelect from "../CategoryTreeSelect";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ACCESS_TOKEN_KEY = "awardscentral_admin_access";

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
};

type AddProductFormProps = {
    productId?: number;
    embedded?: boolean;
    onCancel?: () => void;
    onSuccess?: () => void;
};

export default function AddProductForm({
    productId,
    embedded = false,
    onCancel,
    onSuccess,
}: AddProductFormProps) {
    const router = useRouter();
    const isEditing = Boolean(productId);

    const [productName, setProductName] = useState("");
    const [productDescription, setProductDescription] = useState("");
    const [productType, setProductType] = useState("");
    const [price, setPrice] = useState("");
    const [stocks, setStocks] = useState("0");
    const [metaDescription, setMetaDescription] = useState("");

    const [selectedCategories, setSelectedCategories] = useState<number[]>([]);

    const [productImage, setProductImage] = useState<File | null>(null);
    const [productGlb, setProductGlb] = useState<File | null>(null);

    const [currentImage, setCurrentImage] = useState<string | null>(null);
    const [currentGlb, setCurrentGlb] = useState<string | null>(null);

    const [isImport, setIsImport] = useState(false);
    const [isBestSeller, setIsBestSeller] = useState(false);
    const [isCustomizable, setIsCustomizable] = useState(false);

    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(isEditing);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const getToken = () => {
        if (typeof window === "undefined") return null;
        return localStorage.getItem(ACCESS_TOKEN_KEY);
    };

    useEffect(() => {
        if (!productId) {
            setInitialLoading(false);
            return;
        }

        let isMounted = true;

        async function loadProduct() {
            if (!API_URL) {
                if (isMounted) {
                    setError("API URL is not configured.");
                    setInitialLoading(false);
                }
                return;
            }

            try {
                const token = getToken();

                const response = await fetch(
                    `${API_URL}/products/${productId}/`,
                    {
                        headers: {
                            ...(token
                                ? { Authorization: `Bearer ${token}` }
                                : {}),
                        },
                        cache: "no-store",
                    }
                );

                if (!response.ok) {
                    throw new Error("Unable to load the selected product.");
                }

                const product: Product = await response.json();

                if (!isMounted) return;

                setProductName(product.product_name ?? "");
                setProductDescription(product.product_description ?? "");
                setProductType(product.product_type ?? "");
                setPrice(String(product.price ?? ""));
                setStocks(String(product.stocks ?? 0));
                setMetaDescription(product.meta_description ?? "");

                setSelectedCategories(
                    product.categories?.map((category) => category.id) ?? []
                );

                setCurrentImage(product.product_image ?? null);
                setCurrentGlb(product.product_glb ?? null);

                setIsImport(Boolean(product.is_import));
                setIsBestSeller(Boolean(product.is_best_seller));
                setIsCustomizable(Boolean(product.is_customizable));
            } catch (err) {
                if (isMounted) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load product information."
                    );
                }
            } finally {
                if (isMounted) {
                    setInitialLoading(false);
                }
            }
        }

        loadProduct();

        return () => {
            isMounted = false;
        };
    }, [productId]);

    function handleImageChange(file: File | null) {
        setProductImage(file);
        if (file) {
            setCurrentImage(URL.createObjectURL(file));
        }
    }

    function handleGlbChange(file: File | null) {
        setProductGlb(file);
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setError("");
        setSuccess("");

        if (!API_URL) {
            setError("API URL is not configured.");
            return;
        }

        if (!productName.trim()) {
            setError("Please enter a product name.");
            return;
        }

        if (!productType.trim()) {
            setError("Please enter a product type.");
            return;
        }

        if (price.trim() === "" || Number(price) < 0 || !Number.isFinite(Number(price))) {
            setError("Please enter a valid product price.");
            return;
        }

        if (
            stocks.trim() === "" ||
            !Number.isInteger(Number(stocks)) ||
            Number(stocks) < 0
        ) {
            setError("Stocks must be a whole number greater than or equal to zero.");
            return;
        }

        if (productGlb && !productGlb.name.toLowerCase().endsWith(".glb")) {
            setError("Only .glb files are allowed for the 3D model.");
            return;
        }

        setLoading(true);

        try {
            const token = getToken();
            const formData = new FormData();

            formData.append("product_name", productName.trim());
            formData.append("product_description", productDescription);
            formData.append("product_type", productType.trim());
            formData.append("price", price);
            formData.append("stocks", stocks);
            formData.append("meta_description", metaDescription);

            formData.append("is_import", String(isImport));
            formData.append("is_best_seller", String(isBestSeller));
            formData.append("is_customizable", String(isCustomizable));

            selectedCategories.forEach((categoryId) => {
                formData.append("category_ids", String(categoryId));
            });

            if (productImage) {
                formData.append("product_image", productImage);
            }

            if (productGlb) {
                formData.append("product_glb", productGlb);
            }

            const endpoint = isEditing
                ? `${API_URL}/products/${productId}/`
                : `${API_URL}/products/`;

            const response = await fetch(endpoint, {
                method: isEditing ? "PATCH" : "POST",
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
                body: formData,
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                const errorMessage =
                    data && typeof data === "object"
                        ? Object.entries(data)
                              .map(([field, messages]) => {
                                  const message = Array.isArray(messages)
                                      ? messages.join(", ")
                                      : String(messages);

                                  return `${field}: ${message}`;
                              })
                              .join(" | ")
                        : "Unable to save product information.";

                throw new Error(errorMessage);
            }

            setSuccess(
                isEditing
                    ? "Product updated successfully."
                    : "Product added successfully."
            );

            if (embedded) {
                onSuccess?.();
            } else {
                setTimeout(() => {
                    router.push("/admin/products");
                    router.refresh();
                }, 700);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while saving the product."
            );
        } finally {
            setLoading(false);
        }
    }

    if (initialLoading) {
        return (
            <div className="p-8 text-center text-sm text-gray-500">
                Loading product information...
            </div>
        );
    }

    return (
        <div className={embedded ? "w-full" : "mx-auto max-w-5xl"}>
            {!embedded && (
                <div className="mb-6">
                    <button
                        type="button"
                        onClick={() => router.push("/admin/products")}
                        className="mb-3 text-sm font-medium text-blue-600 hover:text-blue-800"
                    >
                        ← Back to Products
                    </button>

                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditing ? "Edit Product" : "Add Product"}
                    </h1>

                    <p className="mt-1 text-sm text-gray-500">
                        {isEditing
                            ? "Update the product information below."
                            : "Enter the details to add a new product."}
                    </p>
                </div>
            )}

            {error && (
                <div className="mb-5 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {success && (
                <div className="mb-5 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700">
                    {success}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <section className="rounded-xl border border-gray-200 bg-white p-5">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        Basic Information
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Product Name *
                            </label>
                            <input
                                type="text"
                                value={productName}
                                onChange={(event) =>
                                    setProductName(event.target.value)
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                                placeholder="Enter product name"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Product Type *
                            </label>
                            <input
                                type="text"
                                value={productType}
                                onChange={(event) =>
                                    setProductType(event.target.value)
                                }
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                                placeholder="Example: Trophy, Plaque, Medal"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Product Description
                            </label>
                            <textarea
                                value={productDescription}
                                onChange={(event) =>
                                    setProductDescription(event.target.value)
                                }
                                rows={5}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                                placeholder="Describe the product..."
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Meta Description
                            </label>
                            <textarea
                                value={metaDescription}
                                onChange={(event) =>
                                    setMetaDescription(event.target.value)
                                }
                                rows={2}
                                maxLength={160}
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                                placeholder="SEO description (maximum 160 characters)"
                            />
                            <p className="mt-1 text-right text-xs text-gray-400">
                                {metaDescription.length}/160 characters
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-5">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        Pricing and Inventory
                    </h2>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Price (PHP) *
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={price}
                                onChange={(event) => setPrice(event.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                                placeholder="0.00"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-gray-700">
                                Stocks *
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="1"
                                value={stocks}
                                onChange={(event) => setStocks(event.target.value)}
                                required
                                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-5">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        Product Categories
                    </h2>

                    <CategoryTreeSelect
                        selectedCategories={selectedCategories}
                        onChange={setSelectedCategories}
                    />

                    <p className="mt-2 text-xs text-gray-500">
                        Select one or more categories for this product.
                    </p>
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-5">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        Product Media
                    </h2>

                    <div className="space-y-5">
                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                Product Image
                            </label>

                            {currentImage && (
                                <div className="mb-3">
                                    <img
                                        src={
                                            currentImage.startsWith("blob:")
                                                ? currentImage
                                                : currentImage.startsWith("http")
                                                  ? currentImage
                                                  : `${API_URL?.replace(/\/api\/?$/, "") ?? ""}${currentImage.startsWith("/") ? "" : "/"}${currentImage}`
                                        }
                                        alt="Product preview"
                                        className="h-36 w-36 rounded-lg border border-gray-200 object-cover"
                                    />
                                    <p className="mt-1 text-xs text-gray-500">
                                        Current product image
                                    </p>
                                </div>
                            )}

                            <input
                                type="file"
                                accept="image/*"
                                onChange={(event) =>
                                    handleImageChange(
                                        event.target.files?.[0] ?? null
                                    )
                                }
                                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Choose a new image to replace the current image.
                            </p>
                        </div>

                        <div>
                            <label className="mb-2 block text-sm font-medium text-gray-700">
                                3D Model (.glb)
                            </label>

                            {currentGlb && (
                                <p className="mb-2 break-all text-xs text-gray-500">
                                    Current file: {currentGlb}
                                </p>
                            )}

                            <input
                                type="file"
                                accept=".glb,model/gltf-binary"
                                onChange={(event) =>
                                    handleGlbChange(
                                        event.target.files?.[0] ?? null
                                    )
                                }
                                className="block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                Only GLB files are accepted. Leave empty to keep the existing model.
                            </p>
                        </div>
                    </div>
                </section>

                <section className="rounded-xl border border-gray-200 bg-white p-5">
                    <h2 className="mb-4 text-lg font-semibold text-gray-900">
                        Product Settings
                    </h2>

                    <div className="space-y-3">
                        <label className="flex cursor-pointer items-center gap-3">
                            <input
                                type="checkbox"
                                checked={isImport}
                                onChange={(event) =>
                                    setIsImport(event.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">
                                Imported Product
                            </span>
                        </label>

                        <label className="flex cursor-pointer items-center gap-3">
                            <input
                                type="checkbox"
                                checked={isBestSeller}
                                onChange={(event) =>
                                    setIsBestSeller(event.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">
                                Best Seller
                            </span>
                        </label>

                        <label className="flex cursor-pointer items-center gap-3">
                            <input
                                type="checkbox"
                                checked={isCustomizable}
                                onChange={(event) =>
                                    setIsCustomizable(event.target.checked)
                                }
                                className="h-4 w-4 rounded border-gray-300 text-blue-600"
                            />
                            <span className="text-sm text-gray-700">
                                Customizable Product
                            </span>
                        </label>
                    </div>
                </section>

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                    {embedded && (
                        <button
                            type="button"
                            onClick={onCancel}
                            disabled={loading}
                            className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {loading
                            ? "Saving..."
                            : isEditing
                              ? "Save Changes"
                              : "Add Product"}
                    </button>
                </div>
            </form>
        </div>
    );
}
