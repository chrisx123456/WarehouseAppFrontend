import React, { useState, useEffect } from 'react';
import { useApi } from '../../ApiContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCheck, faTimes, faTrash, faEdit } from '@fortawesome/free-solid-svg-icons';
import Select from 'react-select'; // Importujemy react-select
import ReactModal from 'react-modal'; // Importujemy react-modal
import { unitTypeMap } from '../../types/Units'
import '../GeneralStyles.css';
import { Product } from '../../types/Product'
interface Manufacturer {
    name: string;
}
interface Category {
    name: string;
}
interface ErrorResponse {
    Message?: string;
}

//interface UnitTypeMap {
//    [key: number]: string;
//}

//const unitTypeMap: UnitTypeMap = {
//    0: "Qt",
//    1: "Kg",
//    2: "L",
//};

const Products: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { baseUrl } = useApi();
    const [newProduct, setNewProduct] = useState<Product | null>(null);
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]); // Stan dla producentów
    const [categories, setCategories] = useState<Category[]>([]);       // Stan dla kategorii

    const [descriptionViewModalIsOpen, setDescriptionViewModalIsOpen] = useState(false);
    const [newDescriptionModalIsOpen, setNewDescriptionModalIsOpen] = useState(false);

    const [selectedDescriptionView, setSelectedDescriptionView] = useState<string | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const crncy = localStorage.getItem('currency') as string;

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


    const hasRole = (...allowedRoles: string[]) => (role: string) => allowedRoles.includes(role);
    const userRole = localStorage.getItem('role') as string;
    const { canAdd: canAddVal, canEdit: canEditVal, canDelete: canDeleteVal } = {
        canAdd: hasRole('Manager', 'Admin')(userRole),
        canEdit: hasRole('Manager', 'Admin')(userRole),
        canDelete: hasRole('Manager', 'Admin')(userRole),
    };

    const getUnitTypeLabel = (unitType: number): string => unitTypeMap[unitType] || "Unknown";

    const handleAddProduct = () => setNewProduct({ manufacturerName: "", name: '', tradeName: "", categoryName: "", unitType: 0, price: 0, ean: "", description: "" });

    const handleDeleteProduct = async (ean: string) => {
        try {
            const response = await fetch(`${baseUrl}/Product/${ean}`, { 
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error while deleting: ${response.status} - ${errorData.Message || 'No details'}`);
            }
            setProducts(products.filter((product) => product.ean !== ean)); 
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Error occured while deleting product');
            }
        }
    };
    const handleSaveNewProduct = async () => {
        if (!newProduct) {
            setError("Enter product data.");
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
            setProducts([...products, newProduct]);
            setNewProduct(null); // Resetujemy formularz
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error creating product.");
        }
    };
    const manufacturerOptions = manufacturers.map(m => ({ value: m.name, label: m.name }));
    const categoryOptions = categories.map(c => ({ value: c.name, label: c.name }));
    const handleDescriptionViewClick = (description: string) => {
        setSelectedDescriptionView(description);
        setDescriptionViewModalIsOpen(true);
    };
    const closeDescriptionViewModal = () => {
        setDescriptionViewModalIsOpen(false);
        setSelectedDescriptionView(null);
    };
    const handleSaveEditProduct = async () => {
        if (!editingProduct) return;
        try {
            const changes: { description?: string; price?: number} = {};
            const originalProduct = products.find(p => p.ean === editingProduct.ean);
            if (!originalProduct) return
            if (editingProduct.description !== originalProduct.description) {
                changes.description = editingProduct.description;
            }
            if (editingProduct.price !== originalProduct.price && originalProduct.price) {
                changes.price = editingProduct.price;
            }
            if (Object.keys(changes).length === 0) {
                setEditingProduct(null); // Zamykamy tryb edycji
                return;
            }
            const response = await fetch(`${baseUrl}/Product/${editingProduct.ean}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify(changes), // Wysyłamy tylko zmienione pola
            });
            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error while updating: ${response.status} - ${errorData.Message || 'No details'}`);
            }
            setProducts(
                products.map((product) =>
                    product.ean === editingProduct.ean ? { ...product, ...changes } : product // Aktualizujemy stan produktami z zmianami
                )
            );
            setEditingProduct(null);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Error occurred while updating product');
            }
        }
    };

    if (loading) return <div>Loading...</div>;

    return (
        <div className="manufacturers-container">
            {error && (
                <div className="error-message">
                    {error.split("#").map((line, index) => (
                        <React.Fragment key={index}>
                            {line}
                            <br />
                        </React.Fragment>
                    ))}
                </div>
            )}
            <h1>Products</h1>
            {canAddVal && (
                <button className="add-button" onClick={handleAddProduct}>
                    <FontAwesomeIcon icon={faPlus} /> Add Product
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
                    {newProduct && (
                        <tr> 
                            <td>
                                <Select placeholder="..." styles={{
                                    control: (baseStyles) => ({
                                        ...baseStyles,
                                        minHeight: '32px',
                                        height: '32px',
                                        minWidth: '110px',
                                        width: '110px',
                                        fontSize: '12px',

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
                                    options={manufacturerOptions}
                                    onChange={(selectedOption) => setNewProduct({ ...newProduct, manufacturerName: selectedOption?.value || "" })}
                                    value={manufacturerOptions.find(option => option.value === newProduct.manufacturerName)}
                                />
                            </td>
                            <td><input type="text" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} /></td>
                            <td><input type="text" value={newProduct.tradeName} onChange={(e) => setNewProduct({ ...newProduct, tradeName: e.target.value })} /></td>
                            <td>
                                <Select placeholder="..." styles={{
                                    control: (baseStyles) => ({
                                        ...baseStyles,
                                        minHeight: '32px',
                                        height: '32px',
                                        minWidth: '90px',
                                        width: '90px',
                                        fontSize: '12px',
                                        
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
                                    options={categoryOptions}
                                    onChange={(selectedOption) => setNewProduct({ ...newProduct, categoryName: selectedOption?.value || "" })}
                                    value={categoryOptions.find(option => option.value === newProduct.categoryName)}
                                />
                            </td>
                            <td>
                                <select value={newProduct.unitType} onChange={(e) => {
                                    console.log(e.target.value);
                                    setNewProduct({ ...newProduct, unitType: parseInt(e.target.value) })
                                }}>
                                    {Object.entries(unitTypeMap).map(([key, value]) => (
                                        <option key={key} value={key}>{value}</option>
                                    ))}
                                </select>
                            </td>
                            <td>
                                <input type="number"
                                    value={newProduct.price ?? ""}
                                    onChange={(e) => setNewProduct({ ...newProduct, price: parseFloat(e.target.value) })}
                                    required
                                />
                            </td>
                            <td><input type="text" value={newProduct.ean} onChange={(e) => setNewProduct({ ...newProduct, ean: e.target.value })} /></td>
                            <td style={{ cursor: 'pointer' }}>
                                <span onClick={() => setNewDescriptionModalIsOpen(true)}>
                                    {newProduct.description && newProduct.description.length > 0 ? "..." : "Add description"}
                                </span>
                            </td>
                            <td>
                                <button className="save-button" onClick={(e) => {
                                    e.preventDefault();
                                    let newErrors = "Validation Errors:#";

                                    if (!newProduct.manufacturerName) newErrors += "Choose manufacturer#";
                                    if (!newProduct.name.trim()) newErrors += "Name is required#";
                                    if (!newProduct.categoryName) newErrors += "Choose category#";
                                    if (isNaN(newProduct.unitType)) newErrors += "Choose unit type#";
                                    if (!/^(?:[1-9]\d*|0(?=\.\d{1,2}$)|[1-9]\d*\.\d{1,2}|0\.\d{1,2}|[1-9]\d*)$/.test(newProduct.price ? newProduct.price.toString() : "")) newErrors += ("Price must be an integer or decimal with two decimal places#")
                                    if (!/^(\d{8}|\d{13})$/.test(newProduct.ean)) newErrors += ("EAN must be 13 or 8 long and digits only#");

                                    if (newErrors.length > 20) {
                                        setError(newErrors);
                                    } else {
                                        setError(null);
                                        handleSaveNewProduct();
                                    }
                                }}>
                                    <FontAwesomeIcon icon={faCheck} />
                                </button>
                                <button className="cancel-button" onClick={() => setNewProduct(null)}><FontAwesomeIcon icon={faTimes} /></button>
                            </td>
                        </tr>
                    )}
                    {products.map((product) => (
                        <tr key={product.ean}>
                            <td>{product.manufacturerName}</td>
                            <td>{product.name}</td>
                            <td>{product.tradeName}</td>
                            <td>{product.categoryName}</td>
                            <td>{getUnitTypeLabel(product.unitType)}</td>
                            <td>
                                {editingProduct?.ean === product.ean ? (
                                    <input
                                        type="number"
                                        value={editingProduct.price ?? ""}
                                        onChange={(e) => setEditingProduct({
                                            ...editingProduct,
                                            price: parseFloat(e.target.value)
                                        })}
                                    />
                                ) : (
                                    product.price?.toString() + " " + crncy
                                )}
                            </td>
                            <td>{product.ean}</td>
                            <td style={{ cursor: 'pointer' }}>
                                {editingProduct?.ean === product.ean ? (
                                    <span onClick={() => setNewDescriptionModalIsOpen(true)}>
                                        {editingProduct.description && editingProduct.description.length > 0 ? "..." : "Add description"}
                                    </span>
                                ) : (
                                    product.description && product.description.length > 0 ? (
                                        <span onClick={() => handleDescriptionViewClick(product.description as string)}>...</span>
                                    ) : (
                                        <span>No desc.</span>
                                    )
                                )}
                            </td>
                            {canEditVal && canDeleteVal &&
                                <td>
                                {editingProduct?.ean === product.ean ? (
                                    <div>
                                        <button className="save-button" onClick={handleSaveEditProduct}>
                                            <FontAwesomeIcon icon={faCheck} />
                                        </button>
                                        <button className="cancel-button" onClick={() => setEditingProduct(null)}>
                                            <FontAwesomeIcon icon={faTimes} />
                                        </button>
                                    </div>
                                ) : (
                                    <div>
                                        {canEditVal && <button className="edit-button" onClick={() => setEditingProduct({ ...product })}>
                                            <FontAwesomeIcon icon={faEdit} />
                                        </button>}
                                        {canDeleteVal && <button className="delete-button" onClick={() => handleDeleteProduct(product.ean)}>
                                            <FontAwesomeIcon icon={faTrash} />
                                        </button>}
                                    </div>
                                )}
                            </td>}
                        </tr>
                    ))}
                </tbody>
            </table>
            <ReactModal
                isOpen={descriptionViewModalIsOpen}
                onRequestClose={closeDescriptionViewModal}
                contentLabel="Description Modal"
                style={{
                    overlay: {
                        backgroundColor: 'rgba(0, 0, 0, 0.5)' // Półprzezroczyste tło
                    },
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
                <h2>Description</h2>
                <p>{selectedDescriptionView}</p>
                <button onClick={closeDescriptionViewModal}>Close</button>
            </ReactModal>
            <ReactModal
                isOpen={newDescriptionModalIsOpen}
                onRequestClose={() => setNewDescriptionModalIsOpen(false)}
                contentLabel="Description Modal"
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
                <h2>Description</h2>
                <textarea
                    value={editingProduct ? editingProduct.description : newProduct ? newProduct.description : ""} // Operator ternarny
                    onChange={(e) => {
                        const newValue = e.target.value;
                        if (editingProduct) {
                            setEditingProduct(prev => prev ? { ...prev, description: newValue } : null);
                        } else {
                            setNewProduct(prev => prev ? { ...prev, description: newValue } : null);
                        }

                    }}
                    style={{ width: '100%', height: '200px', marginBottom: '10px' }} // Dodajemy style dla textarea
                />
                <button onClick={() => setNewDescriptionModalIsOpen(false)}>Ok</button>
            </ReactModal>
        </div>
    );
};

export default Products;