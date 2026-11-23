"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/types/product";
import { useCart } from "../Cart/CartContext";

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
}

export default function ProductModal({ product, onClose }: ProductModalProps) {
  const { addToCart } = useCart();
  const router = useRouter();

  const [addedToCart, setAddedToCart] = useState(false);

  if (!product) return null;

  const formatPrice = (price: string) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
    }).format(Number(price));
  };

  const handleAddToCart = () => {
    addToCart(product);
    setAddedToCart(true);
  };

  // Proceed to the product customization page
  const handleCustomize = () => {
    const productId = product.id;

    onClose();
    router.push(`/customize/${productId}`);
  };

  function createProductSlug(name: string) {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-modal-title"
        className="relative w-full max-w-4xl overflow-hidden rounded-xl border border-yellow-500/30 bg-[#111] text-white shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close product details"
          className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-black/70 text-2xl text-white transition hover:bg-yellow-500 hover:text-black"
        >
          &times;
        </button>

        <div className="grid md:grid-cols-2">
          {/* Product Image */}
          <div className="relative flex min-h-[300px] items-center justify-center bg-[#1a1a1a] p-6">
            {product.product_image ? (
              <Image
                src={product.product_image}
                alt={product.product_name}
                width={600}
                height={600}
                unoptimized
                className="max-h-[420px] w-full object-contain"
              />
            ) : (
              <div className="text-gray-500">No product image available</div>
            )}
          </div>

          {/* Product Information */}
          <div className="flex flex-col justify-center p-6 md:p-8">
            <p className="mb-3 text-sm uppercase tracking-[0.2em] text-yellow-500">
              {product.product_type}
            </p>

            <h2
              id="product-modal-title"
              className="mb-4 text-2xl font-semibold md:text-3xl"
            >
              {product.product_name}
            </h2>

            <p className="mb-5 text-2xl font-bold text-yellow-500">
              {formatPrice(product.price)}
            </p>

            {/* Product Description */}
            <div className="mb-6">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-300">
                Product Description
              </h3>

              <p className="whitespace-pre-line text-sm leading-7 text-gray-400">
                {product.product_description ||
                  "No product description available."}
              </p>
            </div>

            {/* Stocks */}
            <p className="mb-6 text-sm text-gray-400">
              Stocks:{" "}
              <span className="font-semibold text-white">{product.stocks}</span>
            </p>

            {/* Customize Product */}
            <button
              type="button"
              onClick={handleCustomize}
              disabled={!product.product_glb}
              title={
                !product.product_glb
                  ? "No 3D model available for customization"
                  : "Customize this product"
              }
              className="mb-3 w-full rounded-md border border-yellow-500 bg-transparent px-5 py-3 text-sm font-semibold text-yellow-500 transition hover:bg-yellow-500 hover:text-black disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-yellow-500"
            >
              Customize Product
            </button>

            {/* Action Buttons */}
            <div className="mt-auto flex flex-col gap-3 sm:flex-row">
              {/* Add to Cart */}
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stocks <= 0}
                className="flex-1 rounded-md bg-yellow-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-yellow-400 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {product.stocks <= 0
                  ? "Out of Stock"
                  : addedToCart
                    ? "Add Again"
                    : "Add to Cart"}
              </button>

              {/* View More */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  router.push(
                    `/products/${createProductSlug(product.product_name)}`,
                  );
                }}
              >
                View More
              </button>
            </div>

            {/* Cart Confirmation */}
            {addedToCart && (
              <p role="status" className="mt-4 text-sm text-green-400">
                {product.product_name} has been added to your cart.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
