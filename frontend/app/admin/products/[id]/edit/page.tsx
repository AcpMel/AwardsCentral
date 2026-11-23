import AddProductForm from "../../add/AddProductForm";

export const instant = false;

type EditProductPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function EditProductPage({
    params,
}: EditProductPageProps) {
    const { id } = await params;
    const productId = Number(id);

    if (!Number.isInteger(productId) || productId <= 0) {
        return (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
                Invalid product ID.
            </div>
        );
    }

    return <AddProductForm productId={productId} />;
}