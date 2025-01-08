import React, { useState, useEffect } from 'react';
import { useApi } from '../../ApiContext';
import './Categories.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';


interface Category {
    name: string;
    vat: number;
}
interface ErrorResponse {
    Message?: string 
}

const Categories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
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
        console.log(`Edit category with name: ${categoryName}`);
        // Logika edycji z użyciem nazwy
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

    if (loading) {
        return <div>Ładowanie...</div>;
    }

    if (error) {
        return <div>Błąd: {error}</div>;
    }

    return (
        <div className="categories-container">
            <h1>Categories</h1>
            {canAddVal && <button className="add-category-button">
                <FontAwesomeIcon icon={faPlus} /> Dodaj kategorię
            </button>}
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>VAT</th>
                        {canEditVal && canDeleteVal && <th>Akcje</th>}
                    </tr>
                </thead>
                <tbody>
                    {categories.map((category) => (
                        <tr key={category.name}> {/* Używamy nazwy jako key */}
                            <td>{category.name}</td>
                            <td>{category.vat}</td>
                            {canEditVal && canDeleteVal && <td>
                                {canEditVal && <button className="edit-button" onClick={() => handleEdit(category.name)}>
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>}
                                {canDeleteVal && <button className="delete-button" onClick={() => handleDelete(category.name)}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>}
                            </td>}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Categories;