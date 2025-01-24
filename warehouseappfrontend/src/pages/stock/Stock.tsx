﻿import React, { useState, useEffect } from 'react';
import ReactModal from 'react-modal';
import { useApi } from '../../ApiContext';
import { unitTypeMap } from '../../types/Units';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import Select, { GroupBase } from 'react-select'; // Importujemy react-select
import '../GeneralStyles.css';
import './StockStyles.css';
import { Product } from '../../types/Product'
interface Stock {
    tradeName: string;
    series: string;
    ean: string;
    quantity: number;
    expirationDate: string;
    storageLocationCode: string;
    unitType: number;
}

type SelectOption = {
    value: string;
    label: string;
};


interface NewStock {
    ean: string;
    series: string;
    quantity: number;
    expirationDate?: string;
    storageLocationCode: string;
}

interface ErrorResponse {
    Message?: string;
}

const Instock: React.FC = () => {
    const [stock, setStock] = useState<Stock[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchBy, setSearchBy] = useState<"ean" | "series" | "expirationDate">('ean');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isNewStockHaveExpDate, setNewStockHaveExpDate] = useState(false);

    const [newStock, setNewStock] = useState<NewStock>({
        ean: '',
        series: '',
        quantity: 0,
        expirationDate: '',
        storageLocationCode: '',
    });
    const [selectValue, setSelectValue] = useState<SelectOption | null>(null);


    const { baseUrl } = useApi();

    useEffect(() => {
        fetchStock();
    }, [baseUrl]);

    const fetchStock = async () => {
        try {
            setLoading(true);
            let url = `${baseUrl}/Stock`;

            if (searchTerm) {
                if (searchBy === 'ean') {
                    url = `${baseUrl}/Stock/ean/${searchTerm}`;
                } else if (searchBy === 'series') {
                    url = `${baseUrl}/Stock/series/${searchTerm}`;
                } else if (searchBy === 'expirationDate') {
                    url = `${baseUrl}/Stock/date/${searchTerm}`;
                }
            }
            const [productsResponse, stockResponse] = await Promise.all([
                fetch(`${baseUrl}/Product`, { method: 'GET', headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,},}),
                fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`, }, })
            ]);


            if (!stockResponse.ok) {
                const errorData = await stockResponse.json() as ErrorResponse;
                throw new Error(`Error while fetching data: ${stockResponse.status} - ${errorData.Message || 'No details'}`);
            }
            const data = await stockResponse.json() as Stock[];
            setStock(data);
            if (!productsResponse.ok) {
                const errorData = await productsResponse.json() as ErrorResponse;
                throw new Error(`Error while fetching data: ${productsResponse.status} - ${errorData.Message || 'No details'}`);
            }
            const dataProds = await productsResponse.json() as Product[];
            setProducts(dataProds);

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

    const handleModalClose = () => {
        setIsModalOpen(false)
        setNewStock({
            ean: '',
            series: '',
            quantity: 0,
            expirationDate: '',
            storageLocationCode: '',
        });

    }

    const handleAddStock = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const response = await fetch(`${baseUrl}/Stock`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify(newStock),
            });

            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error adding stock: ${response.status} - ${errorData.Message || 'No details'}`);
            }

            await fetchStock();
            setIsModalOpen(false);
            setNewStock({
                ean: '',
                series: '',
                quantity: 0,
                expirationDate: '',
                storageLocationCode: '',
            });
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Error adding stock');
            }
        }
    };

    const handleSearch = () => {
        fetchStock();
    };
    const selectOptions: SelectOption[] = products.map((item) => ({
        value: item.ean,
        label: item.tradeName,
    }));

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="products-container">
            <h1>Products</h1>
            <div className="top-controls">
                <button
                    className="add-button"
                    onClick={() => setIsModalOpen(true)}
                >
                    Add Stock
                </button>
                <div className="search-bar">
                    <input
                        type={searchBy === 'expirationDate' ? 'date' : 'text'}
                        placeholder="Search"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <select
                        value={searchBy}
                        onChange={(e) => setSearchBy(e.target.value as "ean" | "series" | "expirationDate")}
                    >
                        <option value="ean">EAN</option>
                        <option value="series">Series</option>
                        <option value="expirationDate">Expiration Date</option>
                    </select>
                    <button onClick={handleSearch}>Search</button>
                </div>
            </div>

            {error && <div className="error-message">{error}</div>}

            <ReactModal
                isOpen={isModalOpen}
                onRequestClose={() => handleModalClose()}
                contentLabel="Add new delivery"
                style={{
                    overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
                    content: {
                        textAlign: 'center',
                        justifyContent: 'center',
                        top: '50%',
                        left: '50%',
                        right: 'auto',
                        bottom: 'auto',
                        marginRight: '-50%',
                        transform: 'translate(-50%, -50%)',
                        padding: '20px',
                        paddingTop: '5px',
                        borderRadius: '8px',
                        maxWidth: '500px', // Ograniczenie szerokości
                    }
                }}
            >
                <h2>Add New Stock</h2>
                <form onSubmit={handleAddStock}>
                    <div className="form-group">
                        <label>EAN:</label>
                        <div>
                            <Select placeholder="..." styles={{
                                control: (baseStyles) => ({
                                    ...baseStyles,
                                    minHeight: '32px',
                                    height: '32px',
                                    minWidth: '90px',
                                    width: '100%',
                                    fontSize: '12px',
                                    marginBottom: '8px'

                                }),
                                dropdownIndicator: (baseStyles) => ({
                                    ...baseStyles,
                                    padding: '4px',
                                }),
                                indicatorSeparator: (baseStyles) => ({
                                    ...baseStyles,
                                    visibility: 'hidden',
                                }),
                                menu: (baseStyles) => ({
                                    ...baseStyles,
                                    fontSize: '14px',
                                    width: '150px'
                                }),

                            }}
                                options={selectOptions}
                                onChange={(selectedOption) => {
                                    setSelectValue(selectedOption);
                                    setNewStock(prev => ({
                                        ...prev,
                                        ean: selectedOption?.value || ''
                                    }));
                                }}
                                value={selectValue}
                            />
                            <input
                                type="text"
                                value={newStock.ean}
                                onChange={(e) => {
                                    const value = e.target.value;

                                    // Aktualizuj wartość inputa
                                    setNewStock(prev => ({ ...prev, ean: value }));

                                    // Szukaj pasującej opcji
                                    const matchingOption = selectOptions.find(option => option.value === value);

                                    if (matchingOption) {
                                        // Jeśli znaleziono pasujący EAN - ustaw select
                                        setSelectValue(matchingOption);
                                    } else {
                                        // Jeśli nie znaleziono - zresetuj select
                                        setSelectValue(null);
                                    }
                                }}
                                required
                                inputMode="numeric"
                                pattern="^(\d{8}|\d{13})$"
                                title="EAN must be 13 or 8 long and digits only"
                            />
                        </div>
                    </div>
                    <div className="form-group">
                        <label>Series:</label>
                        <input
                            type="text"
                            value={newStock.series}
                            onChange={(e) => setNewStock({ ...newStock, series: e.target.value })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Quantity:</label>
                        <input
                            type="number"
                            value={newStock.quantity}
                            onChange={(e) => setNewStock({ ...newStock, quantity: Number(e.target.value) })}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <div className="expdate-div">
                            <input type="checkbox" checked={isNewStockHaveExpDate} onChange={(e) => {
                                if (!isNewStockHaveExpDate) setNewStock({ ...newStock, expirationDate: undefined });
                                setNewStockHaveExpDate(e.target.checked)
                            }} />
                            <label>Expiration Date:</label>
                        </div>
                        {isNewStockHaveExpDate && <input
                            type="date"
                            value={newStock.expirationDate}
                            onChange={(e) => setNewStock({ ...newStock, expirationDate: e.target.value })}
                            required
                        />}
                    </div>
                    <div className="form-group">
                        <label>Storage Location Code:</label>
                        <input
                            type="text"
                            value={newStock.storageLocationCode}
                            onChange={(e) => setNewStock({ ...newStock, storageLocationCode: e.target.value })}
                            required
                        />
                    </div>
                    <div className="modal-buttons">
                        <button type="submit" className="save-button">
                            <FontAwesomeIcon icon={faCheck} />
                        </button>
                        <button type="button" className="cancel-button" onClick={() => handleModalClose()}>
                            <FontAwesomeIcon icon={faTimes} />
                        </button>
                    </div>
                </form>
            </ReactModal>

            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>EAN</th>
                        <th>Series</th>
                        <th>Quantity</th>
                        <th>Expiration Date</th>
                        <th>Storage Location Code</th>
                    </tr>
                </thead>
                <tbody>
                    {stock.map((product) => (
                        <tr key={product.series}>
                            <td>{product.tradeName}</td>
                            <td>{product.ean}</td>
                            <td>{product.series}</td>
                            <td>{product.quantity + " " + unitTypeMap[product.unitType]}</td>
                            <td>{product.expirationDate}</td>
                            <td>{product.storageLocationCode}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Instock;