import React, { useState, useEffect } from 'react';
import { useApi } from '../../ApiContext';
import '../GeneralStyles.css';
interface Stock {
    name: string;
    series: string;
    ean: string;
    quantity: number;
    expirationDate: string;
    storageLocationCode: string;
}

interface ErrorResponse {
    Message?: string;
}

const Products: React.FC = () => {
    const [products, setProducts] = useState<Stock[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchBy, setSearchBy] = useState<"ean" | "series" | "expirationDate">('ean');
    const { baseUrl } = useApi();

    useEffect(() => {
        fetchProducts();
    }, [baseUrl]);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            let url = `${baseUrl}/Stock`;

            if (searchTerm) {
                if (searchBy === 'ean') {
                    url = `${baseUrl}/Stock/ean/${searchTerm}`; // Endpoint dla wyszukiwania po nazwie
                } else if (searchBy === 'series') {
                    url = `${baseUrl}/Stock/series/${searchTerm}`; // Endpoint dla wyszukiwania po serii
                } else if (searchBy === 'expirationDate') {
                    url = `${baseUrl}/Stock/date/${searchTerm}`; // Endpoint dla wyszukiwania po dacie ważności
                }
            }
            console.log(url);
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error while fetching data: ${response.status} - ${errorData.Message || 'No details'}`);
            }

            const data = await response.json() as Stock[];
            setProducts(data);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Error occured');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = () => {
        fetchProducts();
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="products-container">
            <h1>Products</h1>
            <div className="search-bar">
                <input
                    type={searchBy === 'expirationDate' ? 'date' : 'text'}
                    placeholder="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <select value={searchBy} onChange={(e) => setSearchBy(e.target.value as "ean" | "series" | "expirationDate")}>
                    <option value="ean">Ean</option>
                    <option value="series">Series</option>
                    <option value="expirationDate">Expiration Date</option>
                </select>
                <button onClick={handleSearch}>Search</button>
            </div>
            {error && <div className="error-message">{error}</div>}
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Ean</th>
                        <th>Series</th>
                        <th>Quantity</th>
                        <th>Expiration Date</th>
                        <th>Storage Location Code</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map((product) => (
                        <tr key={product.series}> {/* Klucz powinien być unikalny */}
                            <td>{product.name}</td>
                            <td>{product.ean}</td>
                            <td>{product.series}</td>
                            <td>{product.quantity}</td>
                            <td>{product.expirationDate}</td>
                            <td>{product.storageLocationCode}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Products;