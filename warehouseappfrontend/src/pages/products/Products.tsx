import React, { useState, useEffect } from 'react';
import { useApi } from '../../ApiContext';
import '../category/Categories.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';

interface Product {
    manufacturerName: string;
    name: string;
    tradeName: string;
    categoryName: string;
    unitType: number;
    price: number;
    ean: string;
    description?: string;
}

interface ErrorResponse {
    Message?: string;
}

interface UnitTypeMap {
    [key: number]: string;
}

const unitTypeMap: UnitTypeMap = {
    0: "Qt",
    1: "Kg",
    2: "L",
};

const Products: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { baseUrl } = useApi();
    const [newProduct, setNewProduct] = useState<Product | null>(null);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await fetch(`${baseUrl}/Product`, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` },
                });
                if (!response.ok) {
                    const errorData = await response.json() as ErrorResponse;
                    throw new Error(`Error fetching data: ${response.status} - ${errorData.Message || 'No details'}`);
                }
                const data = await response.json() as Product[];
                setProducts(data);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [baseUrl]);

    const canAdd = (role: string) => role === 'Manager' || role === 'Admin';
    const canAddVal = canAdd(localStorage.getItem('role') as string);
    const getUnitTypeLabel = (unitType: number): string => unitTypeMap[unitType] || "Unknown";

    const handleAddProduct = () => setNewProduct({ manufacturerName: "", name: '', tradeName: "", categoryName: "", unitType: 0, price: 0, ean: "", description: "" });

    const handleSaveNewProduct = async () => {
        if (!newProduct) {
            setError("Wprowadź dane produktu.");
            return;
        }

        try {
            const response = await fetch(`${baseUrl}/Product`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify(newProduct),
            });

            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error creating product: ${response.status} - ${errorData.Message || 'No details'}`);
            }

            const createdProduct = await response.json() as Product;
            setProducts([...products, createdProduct]);
            setNewProduct(null); // Resetujemy formularz
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error creating product.");
        }
    };

    const handleCancelNewProduct = () => setNewProduct(null);

    if (loading) return <div>Loading...</div>;

    return (
        <div className="manufacturers-container">
            {error && <div className="error-message">{error}</div>}
            <h1>Products</h1>
            {canAddVal && (
                <button className="add-manufacturer-button" onClick={handleAddProduct}>
                    <FontAwesomeIcon icon={faPlus} /> Dodaj Produkt
                </button>
            )}
            <table>
                <thead>
                    <tr>
                        <th>Manufacturer Name</th>
                        <th>Name</th>
                        <th>Trade Name</th>
                        <th>Category Name</th>
                        <th>Unit Type</th>
                        <th>Price</th>
                        <th>EAN</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {newProduct && ( // Formularz dodawania jest renderowany warunkowo
                        <tr>
                            <td><input type="text" value={newProduct.manufacturerName} onChange={(e) => setNewProduct({ ...newProduct, manufacturerName: e.target.value })} /></td>
                            <td><input type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} /></td>
                            <td><input type="text" value={newProduct.tradeName} onChange={(e) => setNewProduct({ ...newProduct, tradeName: e.target.value })} /></td>
                            <td><input type="text" value={newProduct.categoryName} onChange={(e) => setNewProduct({ ...newProduct, categoryName: e.target.value })} /></td>
                            <td>
                                <select value={newProduct.unitType} onChange={(e) => setNewProduct({ ...newProduct, unitType: parseInt(e.target.value, 10) })}>
                                    {Object.entries(unitTypeMap).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            </td>
                            <td><input type="number" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) || 0 })} /></td>
                            <td><input type="text" value={newProduct.ean} onChange={(e) => setNewProduct({ ...newProduct, ean: e.target.value })} /></td>
                            <td><input type="text" value={newProduct.description || ""} onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })} /></td>
                            <td>
                                <button className="save-button" onClick={handleSaveNewProduct}><FontAwesomeIcon icon={faCheck} /></button>
                                <button className="cancel-button" onClick={handleCancelNewProduct}><FontAwesomeIcon icon={faTimes} /></button>
                            </td>
                        </tr>
                    )}
                    {products.map((product) => (
                        <tr key={`${product.name}-${product.tradeName}`}>
                            <td>{product.manufacturerName}</td>
                            <td>{product.name}</td>
                            <td>{product.tradeName}</td>
                            <td>{product.categoryName}</td>
                            <td>{getUnitTypeLabel(product.unitType)}</td>
                            <td>{product.price}</td>
                            <td>{product.ean}</td>
                            <td>{product.description}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Products;