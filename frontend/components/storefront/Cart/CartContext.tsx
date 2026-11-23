
"use client";

import {
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
import type { Product } from "@/types/product";

export interface CartItem {
    product: Product;
    quantity: number;
}

interface CartContextType {
    cartItems: CartItem[];
    cartCount: number;
    addToCart: (product: Product) => void;
    removeFromCart: (productId: number) => void;
    updateQuantity: (productId: number, quantity: number) => void;
    clearCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "awardscentral_cart";

export function CartProvider({ children }: { children: ReactNode }) {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    // Load cart from localStorage when the app starts.
    useEffect(() => {
        try {
            const savedCart = localStorage.getItem(CART_STORAGE_KEY);

            if (savedCart) {
                const parsedCart: CartItem[] = JSON.parse(savedCart);
                setCartItems(parsedCart);
            }
        } catch (error) {
            console.error("Unable to load cart:", error);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    // Save cart whenever its contents change.
    useEffect(() => {
        if (!isInitialized) return;

        try {
            localStorage.setItem(
                CART_STORAGE_KEY,
                JSON.stringify(cartItems)
            );
        } catch (error) {
            console.error("Unable to save cart:", error);
        }
    }, [cartItems, isInitialized]);

    // Add product or increase its quantity if already in cart.
    const addToCart = (product: Product) => {
        setCartItems((currentItems) => {
            const existingItem = currentItems.find(
                (item) => item.product.id === product.id
            );

            if (existingItem) {
                return currentItems.map((item) =>
                    item.product.id === product.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                );
            }

            return [
                ...currentItems,
                {
                    product,
                    quantity: 1,
                },
            ];
        });
    };

    // Remove a product from the cart.
    const removeFromCart = (productId: number) => {
        setCartItems((currentItems) =>
            currentItems.filter(
                (item) => item.product.id !== productId
            )
        );
    };

    // Update product quantity.
    const updateQuantity = (productId: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCartItems((currentItems) =>
            currentItems.map((item) =>
                item.product.id === productId
                    ? { ...item, quantity }
                    : item
            )
        );
    };

    // Empty the entire cart.
    const clearCart = () => {
        setCartItems([]);
    };

    // Total number of individual products in the cart.
    const cartCount = cartItems.reduce(
        (total, item) => total + item.quantity,
        0
    );

    return (
        <CartContext.Provider
            value={{
                cartItems,
                cartCount,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
            }}
        >
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);

    if (!context) {
        throw new Error("useCart must be used inside a CartProvider");
    }

    return context;
}
