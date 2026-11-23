export interface ProductCategory {
    id: number;
    category_name: string;
    slug: string;
    description?: string;
    parent: number | null;
    children: ProductCategory[];
}