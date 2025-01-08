import React, { useState, useEffect } from 'react';
import { useApi } from '../../ApiContext';
import './Categories.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faPlus } from '@fortawesome/free-solid-svg-icons';


interface Category {
    name: string;
    vat: number;
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
                    throw new Error(`Błąd pobierania danych: ${response.status}`);
                }
                const data = await response.json() as Category[];
                setCategories(data);
            } catch (err: unknown) {
                if (err instanceof Error) {
                    setError(err.message);
                } else {
                    setError("Wystąpił nieznany błąd.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, [baseUrl]);

    const handleDelete = async (categoryName: string) => {
        try {
            const response = await fetch(`${baseUrl}/api/Category/${categoryName}`, { // Używamy nazwy w URL
                method: 'DELETE',
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Błąd usuwania kategorii: ${response.status} - ${errorData.message || 'Brak szczegółów'}`);
            }

            setCategories(categories.filter(category => category.name !== categoryName)); // Filtrujemy po nazwie
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Wystąpił nieznany błąd.");
            }
        }
    };

    const handleEdit = (categoryName: string) => {
        console.log(`Edytuj kategorię o nazwie: ${categoryName}`);
        // Logika edycji z użyciem nazwy
    };

    if (loading) {
        return <div>Ładowanie...</div>;
    }

    if (error) {
        return <div>Błąd: {error}</div>;
    }

    return (
        <div className="categories-container">
            <h1>Kategorie</h1>
            <button className="add-category-button">
                <FontAwesomeIcon icon={faPlus} /> Dodaj kategorię
            </button>
            <table>
                <thead>
                    <tr>
                        <th>Nazwa</th>
                        <th>VAT</th>
                        <th>Akcje</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map((category) => (
                        <tr key={category.name}> {/* Używamy nazwy jako key */}
                            <td>{category.name}</td>
                            <td>{category.vat}</td>
                            <td>
                                <button className="edit-button" onClick={() => handleEdit(category.name)}>
                                    <FontAwesomeIcon icon={faEdit} />
                                </button>
                                <button className="delete-button" onClick={() => handleDelete(category.name)}>
                                    <FontAwesomeIcon icon={faTrash} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Categories;