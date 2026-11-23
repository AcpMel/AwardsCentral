
export interface Product {
    id: number;
    product_name: string;
    product_description: string;
    stocks: number;
    meta_description: string;
    product_image: string | null;
    product_glb: string | null;
    price: string;
    product_type: string;
    is_import: boolean;
    is_best_seller: boolean;
    is_customizable: boolean;
    created_at: string;
    updated_at: string;
}
