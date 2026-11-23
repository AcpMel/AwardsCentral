import Navbar from "@/components/storefront/navbar";
import Footer from "@/components/storefront/footer";
import { CartProvider } from "@/components/storefront/Cart/CartContext";

export default function StoreLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <CartProvider>
            <Navbar />
            {children}
            <Footer/>
        </CartProvider>
    );
}