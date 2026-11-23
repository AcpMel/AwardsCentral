import ProductsTable from "../ProductsTable";

export const instant = false;

export default function DeletedProductsPage() {
    return <ProductsTable showDeleted />;
}