
"use client";

import { useEffect, useState } from "react";
import type { ProductCategory } from "@/types/category";
import { getCategoryTree } from "@/services/category.service";

interface CategoryTreeSelectProps {
    selectedCategories: number[];
    onChange: (categories: number[]) => void;
}

interface CategoryItemProps {
    category: ProductCategory;
    selectedCategories: number[];
    onToggle: (id: number) => void;
    level?: number;
}

function CategoryItem({
    category,
    selectedCategories,
    onToggle,
    level = 0,
}: CategoryItemProps) {
    const [expanded, setExpanded] = useState(level === 0);

    const hasChildren = (category.children?.length ?? 0) > 0;
    const isSelected = selectedCategories.includes(category.id);

    return (
        <div>
            <div
                className="flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-gray-100"
                style={{ paddingLeft: `${12 + level * 20}px` }}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        onClick={() => setExpanded((previous) => !previous)}
                        className="flex h-5 w-5 items-center justify-center rounded text-gray-600 hover:bg-gray-200"
                        aria-label={
                            expanded ? "Collapse category" : "Expand category"
                        }
                    >
                        {expanded ? "−" : "+"}
                    </button>
                ) : (
                    <span className="w-5" />
                )}

                <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => onToggle(category.id)}
                    className="h-4 w-4 cursor-pointer accent-yellow-600"
                    aria-label={`Select ${category.category_name}`}
                />

                <button
                    type="button"
                    onClick={() => {
                        if (hasChildren) {
                            setExpanded((previous) => !previous);
                        } else {
                            onToggle(category.id);
                        }
                    }}
                    className="text-left text-sm text-gray-800"
                >
                    {category.category_name}
                </button>
            </div>

            {expanded && hasChildren && (
                <div>
                    {category.children.map((child) => (
                        <CategoryItem
                            key={child.id}
                            category={child}
                            selectedCategories={selectedCategories}
                            onToggle={onToggle}
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function CategoryTreeSelect({
    selectedCategories,
    onChange,
}: CategoryTreeSelectProps) {
    const [categories, setCategories] = useState<ProductCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function loadCategories() {
            try {
                setLoading(true);
                setError("");

                const data = await getCategoryTree();

                if (active) {
                    setCategories(data);
                }
            } catch (err) {
                if (active) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Unable to load categories."
                    );
                }
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        }

        loadCategories();

        return () => {
            active = false;
        };
    }, []);

    function handleToggle(id: number) {
        const updated = selectedCategories.includes(id)
            ? selectedCategories.filter((categoryId) => categoryId !== id)
            : [...selectedCategories, id];

        onChange(updated);
    }

    return (
        <div className="rounded-xl border border-gray-300 bg-white p-4">
            <div className="mb-4">
                <h3 className="font-semibold text-gray-900">
                    Product Categories
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                    Expand the categories and select the applicable categories
                    for this product.
                </p>
            </div>

            {loading && (
                <p className="py-5 text-center text-sm text-gray-500">
                    Loading categories...
                </p>
            )}

            {!loading && error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                    {error}
                </div>
            )}

            {!loading && !error && categories.length === 0 && (
                <p className="py-5 text-center text-sm text-gray-500">
                    No categories found. Please add categories first.
                </p>
            )}

            {!loading && !error && categories.length > 0 && (
                <div className="max-h-96 overflow-y-auto">
                    {categories.map((category) => (
                        <CategoryItem
                            key={category.id}
                            category={category}
                            selectedCategories={selectedCategories}
                            onToggle={handleToggle}
                        />
                    ))}
                </div>
            )}

            <div className="mt-4 border-t border-gray-200 pt-3">
                <p className="text-xs text-gray-600">
                    Selected categories:{" "}
                    <span className="font-semibold text-gray-900">
                        {selectedCategories.length}
                    </span>
                </p>
            </div>
        </div>
    );
}
