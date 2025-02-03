import React, { useState, useEffect } from 'react';
import { useApi } from '../../ApiContext';
import '../GeneralStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCheck, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';


interface Category {
    name: string;
    vat: number;
    isEditing?: boolean;
    oldVat?: number;
}
interface ErrorResponse {
    Message?: string 
}

const Categories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [newCategory, setNewCategory] = useState<Category | null>(null);


    const { baseUrl } = useApi();

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await fetch(`${baseUrl}/Category`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                    },
                });
                if (!response.ok) {
                    throw new Error(`Error while fetching data: ${response.status}`);
                }
                const data = await response.json() as Category[];
                setCategories(data);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Error occured");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, [baseUrl]);
    const handleDelete = async (categoryName: string) => {
        try {
            const response = await fetch(`${baseUrl}/Category/${categoryName}`, { // Używamy nazwy w URL
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                }
            });

            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error while deleting: ${response.status} - ${errorData.Message || 'No details'}`);
            }

            setCategories(categories.filter(category => category.name !== categoryName)); // Filtrujemy po nazwie
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Error occured");
            }
        }
    };

    const handleEdit = (categoryName: string) => {
        setCategories(
            categories.map((category) =>
                category.name === categoryName ? { ...category, isEditing: true, oldVat: category.vat } : category
            )
        );
    };
    const handleEditSave = async (categoryName: string, newVat: number) => {
        try {
            const response = await fetch(`${baseUrl}/Category/${categoryName}?newVat=${newVat}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                }
            });
            
            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error while updating: ${response.status} - ${errorData.Message || 'No details'}`);
            }

            setCategories(
                categories.map((category) =>
                    category.name === categoryName
                        ? { ...category, vat: newVat, isEditing: false }
                        : category
                )
            );
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Error occured");
            }
        }
    };
    const handleEdittingCancel = (categoryName: string) => {
        setCategories(
            categories.map((category) =>
                category.name === categoryName ? { ...category, isEditing: false, vat: category.oldVat as number } : category
            )
        );
    };

    const canEdit = (role: string) => {
         return role === 'Manager' || role === 'Admin';
    };
    const canDelete = (role: string) => {
        return role === 'Manager' || role === 'Admin';
    };
    const canAdd = (role: string) => {
        return role === 'Manager' || role === 'Admin';
    };
    const canEditVal = canEdit(localStorage.getItem('role') as string);
    const canDeleteVal = canDelete (localStorage.getItem('role') as string);
    const canAddVal = canAdd(localStorage.getItem('role') as string);

    const handleAddCategory = () => {
        setNewCategory({ name: '', vat: 0, isEditing: true });
    };
    const handleSaveNewCategory = async () => {
        if (!newCategory || !/^[a-zA-Z]+$/.test(newCategory.name) || newCategory.vat < 0 || newCategory.vat > 99) {
            setError("Name of category must containy only letters, VAT must be a number inbetween 0 and 99.");
            return;
        }

        try {
            const response = await fetch(`${baseUrl}/Category`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify({ name: newCategory.name, vat: newCategory.vat }),
            });

            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error while creating: ${response.status} - ${errorData.Message || 'No details'}`);
            }

            //const createdCategory = await response.json() as Category;
            setCategories([...categories, { ...newCategory, isEditing: false }]); // ??????
            setNewCategory(null);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Error occured while adding new category");
            }
        }
    };
    const handleCancelNewCategory = () => {
        setNewCategory(null);
    };

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="categories-container">
            <h1>Categories</h1>
            {error && <div className="error-message">{error}</div>} 
            {canAddVal && <button className="add-button" onClick={handleAddCategory}> <FontAwesomeIcon icon={faPlus} /> Add new category</button>}
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>VAT</th>
                        {/*{canEditVal && canDeleteVal && <th>Akcje</th>}*/}
                    </tr>
                </thead>
                <tbody>
                    {newCategory && (
                        <tr>
                            <td>
                                <input
                                    type="text"
                                    value={newCategory.name}
                                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                                />
                            </td>
                            <td>
                                <input
                                    type="number"
                                    min="0"
                                    max="99"
                                    value={newCategory.vat}
                                    onChange={(e) => setNewCategory({ ...newCategory, vat: parseInt(e.target.value) })}
                                />
                            </td>
                            <td>
                                <button className="save-button" onClick={handleSaveNewCategory}>
                                    <FontAwesomeIcon icon={faCheck} />
                                </button>
                                <button className="cancel-button" onClick={handleCancelNewCategory}>
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </td>
                        </tr>
                    )}
                    {categories.map((category) => (
                        <tr key={category.name}>
                            <td>{category.name}</td>
                            <td>
                                {category.isEditing ? (
                                    <input
                                        type="number"
                                        min="0"
                                        max="99"
                                        value={category.vat}
                                        onChange={(e) => {
                                            setCategories(categories.map((c) => c.name === category.name ? { ...c, vat: parseFloat(e.target.value) } : c));
                                        }} />
                                    ) : (
                                    category.vat
                                )}
                            </td>
                            {canEditVal && canDeleteVal && (
                                <td>
                                    {category.isEditing ? (
                                        <div>
                                            <button className="save-button" onClick={() => handleEditSave(category.name, category.vat)}>
                                                <FontAwesomeIcon icon={faCheck} />
                                            </button>
                                            <button className="cancel-button" onClick={() => handleEdittingCancel(category.name)}>
                                                <FontAwesomeIcon icon={faTimes} />
                                            </button>
                                        </div>
                                    ) :  (
                                        <div>
                                            {canEditVal && <button className="edit-button" onClick={() => handleEdit(category.name)}>
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>}
                                            {canDeleteVal && < button className="delete-button" onClick={() => handleDelete(category.name)}>
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>}
                                        </div>
                                    )}
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Categories;