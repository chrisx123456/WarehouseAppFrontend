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

interface SalesSearchParams {
    series: string | undefined;
    ean: string | undefined;
    dateFrom: string | undefined;
    dateTo: string | undefined;
}

interface Sale {
    id: string;
    tradeName: string;
    quantity: number;
    amountPaid: number;
    profit: number;
    dateSaled: string;
    series: string;
    ean: string
}

interface SaleItem {
    id: string;
    ean: string;
    count: number;
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
interface ErrorResponse {
    Message?: string;
}

const UserSales: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isNewSaleModalOpen, setIsNewSaleModalOpen] = useState(false);
    const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
    const [products, setProducts] = useState<Product[]>([]);
    const [saleItems, setSaleItems] = useState<SaleItem[]>([{ id: uuidv4(), ean: '', count: 0 }]);
    const [summaryData, setSummaryData] = useState<SaleSummary | null>(null);
    const [selectValues, setSelectValues] = useState<(SingleValue<SelectOption> | null)[]>([]);

    const { baseUrl } = useApi();

    const [seriesSearch, setSeriesSearch] = useState<string | undefined>(undefined);
    const [eanSearch, setEanSearch] = useState<string | undefined>(undefined);
    const [dateFromSearch, setDateFromSearch] = useState<string | undefined>(undefined);
    const [dateToSearch, setDateToSearch] = useState<string | undefined>(undefined);

    const crncy: string | null = localStorage.getItem('currency')
    const fetchDataSerach = async (searchParams: SalesSearchParams) => {
        try {
            setLoading(true);
            setError(null);
            const query = new URLSearchParams();
            if (searchParams.series) query.append('series', searchParams.series);
            if (searchParams.ean) query.append('ean', searchParams.ean);
            if (searchParams.dateFrom) query.append('dateFrom', searchParams.dateFrom);
            if (searchParams.dateTo) query.append('dateTo', searchParams.dateTo);

            const url = `${baseUrl}/Sale/userSales/search?${query.toString()}`;


            const salesResponse = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
                },
            });
            if (!salesResponse.ok) {
                throw new Error((await salesResponse.json() as ErrorResponse).Message ?? "Error searching sales")
            }
            const saleData = await salesResponse.json().then(data =>
                data.map((sale: Sale) => ({ ...sale, id: uuidv4() }))
            ) as Sale[];
            setSales(saleData);

        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Error searching sales");
        }
        finally {
            setLoading(false);
        }

    }

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const searchParams: SalesSearchParams = {
            series: seriesSearch,
            ean: eanSearch,
            dateFrom: dateFromSearch,
            dateTo: dateToSearch
        };
        fetchDataSerach(searchParams); // Przekaż *aktualne* parametry
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [salesResponse, productsResponse] = await Promise.all([
                    fetch(`${baseUrl}/Sale/userSales`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` },
                    }),
                    fetch(`${baseUrl}/Product`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` },
                    })
                ]);

                if (!salesResponse.ok) throw new Error((salesResponse as ErrorResponse)?.Message || 'Error fetching sales');
                if (!productsResponse.ok) throw new Error((salesResponse as ErrorResponse)?.Message || 'Error fetching products');

                const saleData = await salesResponse.json().then(data => {
                    return data.map((sale: Sale) => ({ ...sale, id: uuidv4(), }));
                });

                setSales(saleData);

                setProducts(await productsResponse.json());
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [baseUrl]);

    //const getProductDetails = (ean: string) => {
    //    const product = products.find(p => p.ean === ean);
    //    return product ? `${product.tradeName} (${ean})` : ean;
    //};

    const handleAddSaleItem = () => {
        setSaleItems([...saleItems, { id: uuidv4(), ean: '', count: 0 }]);
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

    const handleAddSaleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const itemsToSend = saleItems.map(({ id, ...rest }) => rest);
            console.log(itemsToSend);
            const response = await fetch(`${baseUrl}/Sale/GeneratePendingSales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify(itemsToSend),
            });
            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(errorData?.Message || 'Failed to create sale');
            }

            const summary = await response.json();
            setSummaryData(summary);
            setIsNewSaleModalOpen(false);
            setIsSummaryModalOpen(true);
        } catch (err) {
            setIsNewSaleModalOpen(false);
            setSaleItems([]);
            setError(err instanceof Error ? err.message : 'Failed to create sale');
        }
    };

    const handleConfirmSale = async () => {
        try {
            const response = await fetch(`${baseUrl}/Sale/confirm/${summaryData?.pendingSaleId}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(errorData?.Message ?? 'Confirmation failed');
            }

            setIsSummaryModalOpen(false);
            window.location.reload();
        } catch (err) {
            setIsSummaryModalOpen(false);
            setError(err instanceof Error ? err.message : 'Confirmation failed');
        }
    };
    const handleRejectSale = async () => {
        try {
            const response = await fetch(`${baseUrl}/Sale/reject/${summaryData?.pendingSaleId}`, {
                method: 'DELETE',
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                },
            });

            if (!response.ok) {
                const errorData = response.json() as ErrorResponse;
                throw new Error(errorData.Message || 'Rejection failed');
            }
            setIsSummaryModalOpen(false);
            window.location.reload();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Rejection failed');
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
            <div className="search-form">
                <form onSubmit={handleSearchSubmit}>
                    <input
                        type="text"
                        placeholder="Series"
                        value={seriesSearch}
                        onChange={(e) => setSeriesSearch(e.target.value)}
                    />
                    <input
                        type="text"
                        placeholder="EAN"
                        value={eanSearch}
                        onChange={(e) => setEanSearch(e.target.value)}
                    />
                    <div className="date-input-group">
                        <label htmlFor="dateFrom">Date from</label>
                        <input
                            id="dateFrom"
                            type="date"
                            value={dateFromSearch}
                            onChange={(e) => setDateFromSearch(e.target.value)}
                        />
                    </div>
                    <div className="date-input-group">
                        <label htmlFor="dateTo">Date to</label>
                        <input
                            id="dateTo"
                            type="date"
                            value={dateToSearch}
                            onChange={(e) => setDateToSearch(e.target.value)}
                        />
                    </div>
                    <button type="submit">Search</button>
                </form>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Trade Name</th>
                        <th>EAN</th>
                        <th>Quantity</th>
                        <th>Amount Paid</th>
                        <th>Profit</th>
                        <th>Series</th>
                        <th>Date</th>
                    </tr>
                </thead>
                <tbody>
                    {sales.map((sale) => (
                        <tr key={sale.id}>
                            <td>{sale.tradeName}</td>
                            <td>{sale.ean}</td>
                            <td>{sale.quantity}</td>
                            <td>{sale.amountPaid.toFixed(2) + " " + crncy}</td>
                            <td>{sale.profit + " " + crncy}</td>
                            <td>{sale.series}</td>
                            <td>{new Date(sale.dateSaled).toLocaleDateString('pl-PL')}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <ReactModal
                isOpen={isNewSaleModalOpen}
                onRequestClose={() => {
                    setSaleItems([]);
                    setIsNewSaleModalOpen(false);
                }}
                style={modalStyle}
            >
                <form onSubmit={handleAddSaleSubmit}>
                    <div className="US-NewSaleModalDiv">
                        <h2>New Sale</h2>
                        <button
                            type="button"
                            onClick={handleAddSaleItem}
                            className="add-item-button"
                        >
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
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label>Quantity:</label>
                                <input
                                    type="number"
                                    value={item.count}
                                    onChange={(e) => handleSaleItemChange(item.id, 'count', parseFloat(e.target.value))}
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
                        <button type="submit" className="save-button">
                            <FontAwesomeIcon icon={faCheck} /> Submit
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setSaleItems([{ id: uuidv4(), ean: '', count: 0 }]);
                                setIsNewSaleModalOpen(false);
                            }}
                            className="cancel-button"
                        >
                            <FontAwesomeIcon icon={faTimes} /> Cancel
                        </button>
                    </div>
                </form>
            </ReactModal>

            <ReactModal
                isOpen={isSummaryModalOpen}
                onRequestClose={() => {
                    setIsSummaryModalOpen(false)
                    setSummaryData(null);
                }}
                style={modalSummaryStyle}
            >
                <div className="summary-modal">
                    <h2>Sale Summary</h2>
                    <div className="pending-id">
                        Pending Sale ID: {summaryData?.pendingSaleId}
                    </div>

                    <div className="product-previews-container">
                        <div className="product-previews-scroll">
                            {summaryData?.productPreviews?.map((product, index) => (
                                <div key={index} className="product-preview-card">
                                    <h3>Product {index + 1}</h3>
                                    <div className="product-detail">
                                        <span>EAN:</span> {product.ean}
                                    </div>
                                    <div className="product-detail">
                                        <span>Name:</span> {product.name}
                                    </div>
                                    <div className="product-detail">
                                        <span>Trade Name:</span> {product.tradeName}
                                    </div>
                                    <div className="product-detail">
                                        <span>Series:</span> {product.series}
                                    </div>
                                    <div className="product-detail">
                                        <span>Quantity:</span> {product.quantity}
                                    </div>
                                    <div className="product-detail">
                                        <span>Amount:</span> {product.amountToBePaid.toFixed(2) + " " + crncy} 
                                    </div>
                                    <div className="product-detail">
                                        <span>Profit:</span> {product.profit.toFixed(2) + " " + crncy}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="modal-buttons">
                        <button type="button" onClick={handleConfirmSale} className="save-button">
                            <FontAwesomeIcon icon={faCheck} /> Confirm
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                handleRejectSale();
                                setIsSummaryModalOpen(false)
                                setSummaryData(null);
                            }}
                            className="cancel-button"
                        >
                            <FontAwesomeIcon icon={faTimes} /> Cancel
                        </button>
                    </div>
                </div>
            </ReactModal>
        </div>
    );
};

const modalStyle: ReactModal.Styles = {
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000
    },
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
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column' as React.CSSProperties['flexDirection'],
        overflow: 'hidden',
        boxSizing: 'border-box',
        overflowY: 'auto'
    }
};
const modalSummaryStyle: ReactModal.Styles = {
    overlay: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        zIndex: 1000
    },
    content: {
        top: '50%',
        left: '50%',
        right: 'auto',
        bottom: 'auto',
        marginRight: '-50%',
        transform: 'translate(-50%, -50%)',
        padding: '20px',
        borderRadius: '8px',
        maxWidth: '800px',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column' as React.CSSProperties['flexDirection'],
        overflow: 'hidden'
    }
};

export default UserSales;