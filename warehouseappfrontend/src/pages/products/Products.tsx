﻿import React, { useState, useEffect } from 'react';
import { useApi } from '../../ApiContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import Select from 'react-select'; // Importujemy react-select
import '../category/Categories.css';

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
interface Manufacturer {
    name: string;
}
interface Category {
    name: string;
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
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]); // Stan dla producentów
    const [categories, setCategories] = useState<Category[]>([]);       // Stan dla kategorii

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsResponse, manufacturersResponse, categoriesResponse] = await Promise.all([
                    fetch(`${baseUrl}/Product`, { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } }),
                    fetch(`${baseUrl}/Manufacturer`, { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } }),
                    fetch(`${baseUrl}/Category`, { headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` } }),
                ]);

                if (!productsResponse.ok) throw new Error(`Error fetching products: ${productsResponse.status}`);
                if (!manufacturersResponse.ok) throw new Error(`Error fetching manufacturers: ${manufacturersResponse.status}`);
                if (!categoriesResponse.ok) throw new Error(`Error fetching categories: ${categoriesResponse.status}`);


                const productsData = await productsResponse.json() as Product[];
                const manufacturersData = await manufacturersResponse.json() as Manufacturer[];
                const categoriesData = await categoriesResponse.json() as Category[];

                setProducts(productsData);
                setManufacturers(manufacturersData);
                setCategories(categoriesData);

            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
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

    const manufacturerOptions = manufacturers.map(m => ({ value: m.name, label: m.name }));
    const categoryOptions = categories.map(c => ({ value: c.name, label: c.name }));


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
                        <th>Manufacturer</th>
                        <th>Name</th>
                        <th>Trade Name</th>
                        <th>Category</th>
                        <th>Unit Type</th>
                        <th>Price</th>
                        <th>EAN</th>
                        <th>Description</th>
                    </tr>
                </thead>
                <tbody>
                    {newProduct && ( // Formularz dodawania jest renderowany warunkowo
                        <tr>
                            <td>
                                <Select placeholder="..." styles={{
                                    control: (baseStyles, state) => ({
                                        ...baseStyles,
                                        minHeight: '32px',
                                        height: '32px',
                                        minWidth: '110px',
                                        width: '110px',
                                        fontSize: '12px',

                                    }),
                                    dropdownIndicator: (baseStyles, state) => ({
                                        ...baseStyles,
                                        padding: '4px',
                                    }),
                                    indicatorSeparator: (baseStyles, state) => ({
                                        ...baseStyles,
                                        visibility: 'hidden',
                                    }),
                                    menu: (baseStyles, state) => ({
                                        ...baseStyles,
                                        fontSize: '14px',
                                        width: '150px'
                                    }),

                                }}
                                    options={manufacturerOptions}
                                    onChange={(selectedOption) => setNewProduct({ ...newProduct, manufacturerName: selectedOption?.value || "" })}
                                    value={manufacturerOptions.find(option => option.value === newProduct.manufacturerName)}
                                />
                            </td>
                            <td><input type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} /></td>
                            <td><input type="text" value={newProduct.tradeName} onChange={(e) => setNewProduct({ ...newProduct, tradeName: e.target.value })} /></td>
                            <td>
                                <Select placeholder="..." styles={{
                                    control: (baseStyles, state) => ({
                                        ...baseStyles,
                                        minHeight: '32px',
                                        height: '32px',
                                        minWidth: '90px',
                                        width: '90px',
                                        fontSize: '12px',
                                        
                                    }),
                                    dropdownIndicator: (baseStyles, state) => ({
                                        ...baseStyles,
                                        padding: '4px',
                                    }),
                                    indicatorSeparator: (baseStyles, state) => ({
                                        ...baseStyles,
                                        visibility: 'hidden',
                                    }),
                                    menu: (baseStyles, state) => ({
                                        ...baseStyles,
                                        fontSize: '14px',
                                        width: '150px'
                                    }),

                                }}
                                    options={categoryOptions}
                                    onChange={(selectedOption) => setNewProduct({ ...newProduct, categoryName: selectedOption?.value || "" })}
                                    value={categoryOptions.find(option => option.value === newProduct.categoryName)}
                                />
                            </td>
                            <td>
                                <select value={newProduct.unitType} onChange={(e) => setNewProduct({ ...newProduct, unitType: parseInt(e.target.value) })}>
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