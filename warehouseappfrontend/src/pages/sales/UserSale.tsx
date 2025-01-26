import React, { useState, useEffect } from 'react';
import ReactModal from 'react-modal';
import { useApi } from '../../ApiContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faPlus, faTrash } from '@fortawesome/free-solid-svg-icons';
import Select, { SingleValue } from 'react-select';
import { v4 as uuidv4 } from 'uuid';
import '../GeneralStyles.css';
import './UserSaleStyles.css'
import { Product } from '../../types/Product';

interface Sale {
    id: string;
    productEAN: string;
    quantity: number;
    amountPaid: number;
    date: string;
    status: 'pending' | 'completed';
}

interface SaleItem {
    id: string;
    ean: string;
    quantity: number;
}

interface ProductPreview {
    ean: string;
    name: string;
    tradeName: string;
    series: string;
    quantity: number;
    amountToBePaid: number;
    profit: number;
}

interface SaleSummary {
    pendingSaleId: string;
    productPreviews: ProductPreview[];
}

type SelectOption = {
    value: string;
    label: string;
};

const UserSales: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [saleItems, setSaleItems] = useState<SaleItem[]>([{ id: uuidv4(), ean: '', quantity: 0 }]);
    const [summaryData, setSummaryData] = useState<SaleSummary | null>(null);
    const [selectValues, setSelectValues] = useState<(SingleValue<SelectOption> | null)[]>([]);

    const { baseUrl } = useApi();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [salesResponse, productsResponse] = await Promise.all([
                    fetch(`${baseUrl}/Sales`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` },
                    }),
                    fetch(`${baseUrl}/Product`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` },
                    })
                ]);

               // if (!salesResponse.ok) throw new Error('Error fetching sales');
                if (!productsResponse.ok) throw new Error('Error fetching products');

                //setSales(await salesResponse.json());
                setProducts(await productsResponse.json());
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [baseUrl]);

    const getProductDetails = (ean: string) => {
        const product = products.find(p => p.ean === ean);
        return product ? `${product.tradeName} (${ean})` : ean;
    };

    const handleAddSaleItem = () => {
        setSaleItems([...saleItems, { id: uuidv4(), ean: '', quantity: 0 }]);
        setSelectValues([...selectValues, null]);
    };

    const handleSaleItemChange = (id: string, field: keyof SaleItem, value: string | number) => {
        setSaleItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, [field]: value } : item
            )
        );

        if (field === 'ean') {
            const matchingProduct = products.find(p => p.ean === value);
            setSelectValues(prevValues =>
                prevValues.map((val, index) => {
                    if (saleItems[index].id === id) {
                        return matchingProduct ?
                            { value: matchingProduct.ean, label: matchingProduct.tradeName } :
                            null;
                    }
                    return val;
                })
            );
        }
    };

    const handleSelectChange = (id: string, selectedOption: SingleValue<SelectOption>) => {
        setSaleItems(prevItems =>
            prevItems.map(item =>
                item.id === id ? { ...item, ean: selectedOption?.value || '' } : item
            )
        );

        setSelectValues(prevValues =>
            prevValues.map((val, index) =>
                saleItems[index].id === id ? selectedOption : val
            )
        );
    };
    const handleDeleteItem = (id: string) => {
        if (saleItems.length === 1) return; // Zapobiegaj usunięciu ostatniego elementu

        setSaleItems(prev => prev.filter(item => item.id !== id));
        setSelectValues(prev => prev.filter((_, index) => saleItems[index].id !== id));
    };

    const handleAddSaleSubmit = async () => {
        try {
            const response = await fetch(`${baseUrl}/Sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify({ items: saleItems }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.Message || 'Failed to create sale');
            }

            const summary = await response.json();
            setSummaryData(summary);
            setIsNewSaleModalOpen(false);
            setIsSummaryModalOpen(true);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create sale');
        }
    };

    const handleConfirmSale = async () => {
        try {
            const response = await fetch(`${baseUrl}/Sales/${summaryData?.pendingSaleId}/confirm`, {
                method: 'PUT',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                },
            });

            if (!response.ok) throw new Error('Confirmation failed');

            setIsSummaryModalOpen(false);
            window.location.reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Confirmation failed');
        }
    };

    const selectOptions = products.map(product => ({
        value: product.ean,
        label: `${product.tradeName}`
    }));

    return (
        <div className="products-container">
            <h1>My Sales</h1>
            <button className="add-button" onClick={() => setIsNewSaleModalOpen(true)}>
                New Sale
            </button>

            {loading && <div>Loading...</div>}
            {error && <div className="error-message">{error}</div>}

            <table>
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Amount Paid</th>
                        <th>Status</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map((sale) => (
                        <tr key={sale.id}>
                            <td>{getProductDetails(sale.productEAN)}</td>
                            <td>{sale.quantity}</td>
                            <td>{sale.amountPaid.toFixed(2)} PLN</td>
                            <td>{sale.status}</td>
                            <td>{new Date(sale.date).toLocaleDateString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <ReactModal
                isOpen={isNewSaleModalOpen}
                onRequestClose={() => setIsNewSaleModalOpen(false)}
                style={modalStyle}>
                <div className="US-NewSaleModalDiv">
                    <h2>New Sale</h2>
                    <button type="button" onClick={handleAddSaleItem} className="add-item-button">
                        <FontAwesomeIcon icon={faPlus} /> Add Product
                        </button>
                </div>
                {saleItems.map((item, index) => (
                    <div key={item.id} className="form-group">
                        <label>Product {index + 1}:</label>
                        <div>
                            <Select
                                options={selectOptions}
                                onChange={(selected) => handleSelectChange(item.id, selected)}
                                value={selectValues[index]}
                                placeholder="Select product..."
                                styles={{
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
                                    menu: (baseStyles) => ({
                                        ...baseStyles,
                                        fontSize: '14px',
                                        width: '100%',
                                    }),
                                    menuList: (baseStyles) => ({
                                        ...baseStyles,
                                        height: '120px'
                                    }),
                                }}
                            />
                            <input
                                type="text"
                                value={item.ean}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    handleSaleItemChange(item.id, 'ean', value);

                                    // Automatyczna aktualizacja selecta
                                    const matchingProduct = products.find(p => p.ean === value);
                                    setSelectValues(prev => {
                                        const newValues = [...prev];
                                        newValues[index] = matchingProduct ?
                                            { value: matchingProduct.ean, label: matchingProduct.tradeName } :
                                            null;
                                        return newValues;
                                    });
                                }}
                                inputMode="numeric"
                                pattern="^(\d{8}|\d{13})$"
                                title="EAN must be 8 or 13 digits"
                                className="ean-input"
                                placeholder="Enter EAN"
                            />
                        </div>
                        <div className="form-group">
                            <label>Quantity:</label>
                            <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleSaleItemChange(item.id, 'quantity', parseInt(e.target.value))}
                                min="1"
                                placeholder="Quantity"
                            />
                        </div>
                        {saleItems.length > 1 && (
                            <button
                                type="button"
                                className="US-NewSaleModal-delete-button"
                                onClick={() => handleDeleteItem(item.id)}
                            > 
                                <FontAwesomeIcon icon={faTrash} /> Delete
                            </button>
                        )}
                    </div>

                ))}
                <div className="modal-buttons">
                    <button type="button" onClick={handleAddSaleSubmit} className="save-button">
                        <FontAwesomeIcon icon={faCheck} /> Submit
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsNewSaleModalOpen(false)}
                        className="cancel-button"
                    >
                        <FontAwesomeIcon icon={faTimes} /> Cancel
                    </button>
                </div>
            </ReactModal>

            <ReactModal
                isOpen={isSummaryModalOpen}
                onRequestClose={() => setIsSummaryModalOpen(false)}
                style={modalStyle}
            >
                <h2>Sale Summary</h2>
                <pre>{JSON.stringify(summaryData, null, 2)}</pre>
                <div className="modal-buttons">
                    <button type="button" onClick={handleConfirmSale} className="save-button">
                        <FontAwesomeIcon icon={faCheck} /> Confirm
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsSummaryModalOpen(false)}
                        className="cancel-button"
                    >
                        <FontAwesomeIcon icon={faTimes} /> Cancel
                    </button>
                </div>
            </ReactModal>
        </div>
    );
};

const modalStyle = {
    overlay: { backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '600px',
    }
};


export default UserSales;