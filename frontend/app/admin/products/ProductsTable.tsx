"use client";

import { useCallback, useEffect, useState } from "react";
import AddProductForm from "./add/AddProductForm";

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ITEMS_PER_PAGE = 20;
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
  product_type: string;
  price: string | number;
  stocks: number;
  meta_description: string;
  product_image: string | null;
  product_glb?: string | null;
  categories: ProductCategory[];
  is_import: boolean;
  is_best_seller: boolean;
  is_customizable: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

type ProductResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: Product[];
};

type ProductsTableProps = {
  showDeleted?: boolean;
};

type ModalType = "view" | "edit" | "delete" | null;

function getImageUrl(image: string | null) {
  if (!image) return null;
  if (image.startsWith("http")) return image;

  const baseUrl = API_URL?.replace(/\/api\/?$/, "") ?? "";
  return `${baseUrl}${image.startsWith("/") ? "" : "/"}${image}`;
}

function formatPrice(price: string | number) {
  return Number(price).toLocaleString("en-PH", {
    style: "currency",
    currency: "PHP",
  });
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-PH", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function ProductsTable({
  showDeleted = false,
}: ProductsTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState("");
  const [ordering, setOrdering] = useState("-created_at");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeModal, setActiveModal] = useState<ModalType>(null);

  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));

  const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  };

  const loadProducts = useCallback(async () => {
    if (!API_URL) {
      setError("API URL is not configured.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const token = getToken();

      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("page_size", String(ITEMS_PER_PAGE));
      params.set("ordering", ordering);

      if (search.trim()) {
        params.set("search", search.trim());
      }

      if (stockFilter) {
        params.set("stock_filter", stockFilter);
      }

      const endpoint = showDeleted
        ? `${API_URL}/products/deleted/`
        : `${API_URL}/products/`;

      const response = await fetch(`${endpoint}?${params.toString()}`, {
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Unable to load products.");
      }

      const data: ProductResponse = await response.json();

      setProducts(data.results ?? []);
      setTotalCount(data.count ?? 0);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while loading products.",
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, stockFilter, ordering, showDeleted]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function openModal(type: ModalType, product: Product) {
    setSelectedProduct(product);
    setActiveModal(type);
  }

  function closeModal() {
    if (actionLoading) return;
    setActiveModal(null);
    setSelectedProduct(null);
  }

  async function confirmDelete() {
    if (!selectedProduct) return;

    setActionLoading(true);
    setError("");

    try {
      const token = getToken();

      const response = await fetch(
        `${API_URL}/products/${selectedProduct.id}/`,
        {
          method: "DELETE",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || "Unable to delete this product.");
      }

      setActiveModal(null);
      setSelectedProduct(null);
      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete product.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  async function restoreProduct(product: Product) {
    const confirmed = window.confirm(`Restore "${product.product_name}"?`);

    if (!confirmed) return;

    setActionLoading(true);
    setError("");

    try {
      const token = getToken();

      const response = await fetch(
        `${API_URL}/products/${product.id}/restore/`,
        {
          method: "POST",
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        },
      );

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.detail || "Unable to restore product.");
      }

      await loadProducts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to restore product.",
      );
    } finally {
      setActionLoading(false);
    }
  }

  function handleEditSuccess() {
    setActiveModal(null);
    setSelectedProduct(null);
    loadProducts();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {showDeleted ? "Deleted Products" : "Products"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {showDeleted
              ? "View and restore previously deleted products."
              : "Manage your product inventory and information."}
          </p>
        </div>

        {!showDeleted && (
          <a
            href="/admin/products/add"
            className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            + Add Product
          </a>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">
            {showDeleted ? "Deleted Products" : "Products Shown"}
          </p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalCount}</p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Current Page</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {page} / {totalPages}
          </p>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">Items Per Page</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">
            {ITEMS_PER_PAGE}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4 md:flex-row">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search products..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500 md:flex-1"
        />

        {!showDeleted && (
          <select
            value={stockFilter}
            onChange={(event) => {
              setStockFilter(event.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500"
          >
            <option value="">All Stock Levels</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        )}

        <select
          value={ordering}
          onChange={(event) => {
            setOrdering(event.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-500"
        >
          <option value="-created_at">Newest First</option>
          <option value="created_at">Oldest First</option>
          <option value="product_name">Name: A to Z</option>
          <option value="-product_name">Name: Z to A</option>
          <option value="price">Price: Low to High</option>
          <option value="-price">Price: High to Low</option>
        </select>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Loading products...
          </div>
        ) : products.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-medium text-gray-700">No products found.</p>
            <p className="mt-1 text-sm text-gray-500">
              Try changing your search or filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-5 py-4">Product</th>
                  <th className="px-5 py-4">Category</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Price</th>
                  <th className="px-5 py-4">Stocks</th>
                  <th className="px-5 py-4">Date Added</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {product.product_image ? (
                          <img
                            src={getImageUrl(product.product_image) ?? ""}
                            alt={product.product_name}
                            className="h-12 w-12 rounded-lg border border-gray-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                            No Image
                          </div>
                        )}

                        <div>
                          <p className="font-semibold text-gray-900">
                            {product.product_name}
                          </p>
                          <p className="text-xs text-gray-500">
                            ID: {product.id}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {product.categories?.length
                        ? product.categories
                            .map((category) => category.category_name)
                            .join(", ")
                        : "Uncategorized"}
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {product.product_type}
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-900">
                      {formatPrice(product.price)}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          product.stocks <= 0
                            ? "bg-red-100 text-red-700"
                            : product.stocks <= 10
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                        }`}
                      >
                        {product.stocks}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {formatDate(product.created_at)}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openModal("view", product)}
                          className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                        >
                          View
                        </button>

                        {!showDeleted ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openModal("edit", product)}
                              className="rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-50"
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => openModal("delete", product)}
                              className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50"
                            >
                              Delete
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            disabled={actionLoading}
                            onClick={() => restoreProduct(product)}
                            className="rounded-lg border border-green-200 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-50 disabled:opacity-50"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          Showing {products.length} of {totalCount} products
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            disabled={page <= 1 || loading}
            onClick={() => setPage((current) => current - 1)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <button
            type="button"
            disabled={page >= totalPages || loading}
            onClick={() => setPage((current) => current + 1)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>

      {activeModal && selectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">
                  {activeModal === "view"
                    ? "Product Details"
                    : activeModal === "edit"
                      ? "Edit Product"
                      : "Delete Product"}
                </h2>
                <p className="text-xs text-gray-500">
                  {selectedProduct.product_name}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={actionLoading}
                aria-label="Close modal"
                className="rounded-lg px-3 py-1 text-2xl text-gray-500 hover:bg-gray-100 disabled:opacity-50"
              >
                ×
              </button>
            </div>

            {activeModal === "view" && (
              <div className="space-y-6 p-6">
                <div className="flex flex-col gap-5 sm:flex-row">
                  {selectedProduct.product_image ? (
                    <img
                      src={getImageUrl(selectedProduct.product_image) ?? ""}
                      alt={selectedProduct.product_name}
                      className="h-48 w-full rounded-xl border border-gray-200 object-contain sm:w-48"
                    />
                  ) : (
                    <div className="flex h-48 w-full items-center justify-center rounded-xl bg-gray-100 text-sm text-gray-400 sm:w-48">
                      No product image
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase text-gray-400">
                      Product #{selectedProduct.id}
                    </p>
                    <h3 className="mt-1 text-2xl font-bold text-gray-900">
                      {selectedProduct.product_name}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500">
                      {selectedProduct.product_type}
                    </p>
                    <p className="mt-4 text-2xl font-bold text-blue-700">
                      {formatPrice(selectedProduct.price)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Detail
                    label="Stocks"
                    value={String(selectedProduct.stocks)}
                  />
                  <Detail
                    label="Product Type"
                    value={selectedProduct.product_type}
                  />
                  <Detail
                    label="Categories"
                    value={
                      selectedProduct.categories?.length
                        ? selectedProduct.categories
                            .map((category) => category.category_name)
                            .join(", ")
                        : "Uncategorized"
                    }
                  />
                  <Detail
                    label="Meta Description"
                    value={selectedProduct.meta_description || "Not provided"}
                  />
                  <Detail
                    label="Created At"
                    value={formatDate(selectedProduct.created_at)}
                  />
                  <Detail
                    label="Last Updated"
                    value={formatDate(selectedProduct.updated_at)}
                  />
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">
                    Product Description
                  </h3>
                  <p className="whitespace-pre-wrap rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                    {selectedProduct.product_description ||
                      "No description provided."}
                  </p>
                </div>

                <div>
                  <h3 className="mb-2 font-semibold text-gray-900">
                    Product Settings
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedProduct.is_import && <Tag>Imported</Tag>}
                    {selectedProduct.is_best_seller && <Tag>Best Seller</Tag>}
                    {selectedProduct.is_customizable && <Tag>Customizable</Tag>}
                    {!selectedProduct.is_import &&
                      !selectedProduct.is_best_seller &&
                      !selectedProduct.is_customizable && (
                        <span className="text-sm text-gray-500">
                          No special settings
                        </span>
                      )}
                  </div>
                </div>

                {selectedProduct.product_glb && (
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900">
                      3D Model
                    </h3>
                    <p className="break-all text-sm text-blue-700">
                      {selectedProduct.product_glb}
                    </p>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

            {activeModal === "edit" && (
              <div className="p-6">
                <AddProductForm
                  productId={selectedProduct.id}
                  embedded
                  onCancel={closeModal}
                  onSuccess={handleEditSuccess}
                />
              </div>
            )}

            {activeModal === "delete" && (
              <div className="space-y-5 p-6">
                <div className="flex flex-col gap-4 rounded-xl border border-gray-200 p-4 sm:flex-row">
                  {selectedProduct.product_image ? (
                    <img
                      src={getImageUrl(selectedProduct.product_image) ?? ""}
                      alt={selectedProduct.product_name}
                      className="h-24 w-24 rounded-lg border border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="flex h-24 w-24 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                      No Image
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="text-xs text-gray-500">
                      Product ID: {selectedProduct.id}
                    </p>
                    <h3 className="mt-1 font-bold text-gray-900">
                      {selectedProduct.product_name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">
                      {selectedProduct.product_type}
                    </p>
                    <p className="mt-2 font-semibold text-gray-900">
                      {formatPrice(selectedProduct.price)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Stocks: {selectedProduct.stocks}
                    </p>
                    <p className="mt-1 text-sm text-gray-500">
                      Categories:{" "}
                      {selectedProduct.categories?.length
                        ? selectedProduct.categories
                            .map((category) => category.category_name)
                            .join(", ")
                        : "Uncategorized"}
                    </p>
                  </div>
                </div>

                <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                  <div className="flex gap-3">
                    <span className="text-xl text-red-600">⚠</span>
                    <div>
                      <h3 className="font-semibold text-red-800">
                        Are you sure you want to delete this product?
                      </h3>
                      <p className="mt-1 text-sm text-red-700">
                        This product will be moved to Deleted Products and will
                        no longer appear in the active product list. You can
                        restore it later.
                      </p>
                      <p className="mt-2 text-sm text-red-700">
                        Existing sales history will be preserved.
                      </p>
                    </div>
                  </div>
                </div>

                {error && <p className="text-sm text-red-600">{error}</p>}

                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={actionLoading}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    disabled={actionLoading}
                    className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {actionLoading ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-gray-50 p-3">
      <p className="text-xs font-medium uppercase text-gray-400">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-gray-800">
        {value}
      </p>
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
      {children}
    </span>
  );
}
