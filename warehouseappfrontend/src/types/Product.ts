export interface Product {
    manufacturerName: string;
    name: string;
    tradeName: string;
    categoryName: string;
    unitType: number;
    price: number;
    ean: string;
    description?: string;
}