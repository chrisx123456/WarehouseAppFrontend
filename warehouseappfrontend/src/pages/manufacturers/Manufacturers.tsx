import React, { useState, useEffect } from 'react';
import { useApi } from '../../ApiContext';
import '../category/Categories.css'; //Może potem do dodac jaki uniwersalny styl do tych prostyszych stron
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCheck, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';

interface Manufacturer {
    name: string;
    isEditing?: boolean;
    oldName?: string;
}

interface ErrorResponse {
    Message?: string;
}

const Manufacturers: React.FC = () => {
    
    const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { baseUrl } = useApi();
    const [newManufacturer, setNewManufacturer] = useState<Manufacturer | null>(null);

    useEffect(() => {
        const fetchManufacturers = async () => {
            try {
                const response = await fetch(`${baseUrl}/Manufacturer`, {
                    method: 'GET',
                    headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` },
                });

                if (!response.ok) {
                    const errorData = await response.json() as ErrorResponse;
                    throw new Error(`Error fetching data: ${response.status} - ${errorData.Message || 'No details'}`);
                }

                const data = await response.json() as Manufacturer[];
                setManufacturers(data);
            } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "An unexpected error occurred.");
            } finally {
                setLoading(false);
            }
        };

        fetchManufacturers();
    }, [baseUrl]);

    const handleDelete = async (manufacturerName: string) => {
        try {
            const response = await fetch(`${baseUrl}/Manufacturer/${manufacturerName}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` },
            });

            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error deleting: ${response.status} - ${errorData.Message || 'No details'}`);
            }

            setManufacturers(manufacturers.filter(m => m.name !== manufacturerName));
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error during deletion.");
        }
    };

    const handleEdit = (manufacturerName: string) => {
        setManufacturers(manufacturers.map(m =>
            m.name === manufacturerName ? { ...m, isEditing: true, oldName: m.name } : m
        ));
    };

    const handleEditSave = async (oldName: string, newName: string) => {
        try {
            const response = await fetch(`${baseUrl}/Manufacturer/${oldName}?newName=${newName}`, {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` },
            });

            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error updating: ${response.status} - ${errorData.Message || 'No details'}`);
            }

            setManufacturers(
                manufacturers.map(m =>
                    m.name === newName ?
                        { ...m, name: newName, isEditing: false }
                        : m
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

    const handleEdittingCancel = (manufacturerName: string) => {
        setManufacturers(manufacturers.map(m =>
            m.name === manufacturerName ? { ...m, isEditing: false, name: m.oldName as string } : m
        ));
    };

    const canEdit = (role: string) => role === 'Manager' || role === 'Admin';
    const canDelete = (role: string) => role === 'Manager' || role === 'Admin';
    const canAdd = (role: string) => role === 'Manager' || role === 'Admin';

    const canEditVal = canEdit(localStorage.getItem('role') as string);
    const canDeleteVal = canDelete(localStorage.getItem('role') as string);
    const canAddVal = canAdd(localStorage.getItem('role') as string);

    const handleAddManufacturer = () => setNewManufacturer({ name: '', isEditing: true });

    const handleSaveNewManufacturer = async () => {
        //Wsm moze byc firma co ma w nazwie cyfry
        if (!newManufacturer /*|| !/^[a-zA-Z\s]+$/.test(newManufacturer.name)*/) {
            setError("Name must contain only letters and spaces.");
            return;
        } 

        try {
            const response = await fetch(`${baseUrl}/Manufacturer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify({ name: newManufacturer.name }),
            });

            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error creating: ${response.status} - ${errorData.Message || 'No details'}`);
            }

            //const createdManufacturer = newManufacturer;
            setManufacturers([...manufacturers, { ...newManufacturer, isEditing: false }]);
            setNewManufacturer(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error creating manufacturer.");
        }
    };

    const handleCancelNewManufacturer = () => setNewManufacturer(null);

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="manufacturers-container">
            {error && <div className="error-message">{error}</div>}
            <h1>Manufacturers</h1>
            {canAddVal && (
                <button className="add-manufacturer-button" onClick={handleAddManufacturer}>
                    <FontAwesomeIcon icon={faPlus} /> Add Manufacturer
                </button>
            )}
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        {canEditVal && canDeleteVal && <th>Actions</th>}
                    </tr>
                </thead>
                <tbody>
                    {newManufacturer && (
                        <tr>
                            <td>
                                <input
                                    type="text"
                                    value={newManufacturer.name}
                                    onChange={(e) => setNewManufacturer({ ...newManufacturer, name: e.target.value })}
                                />
                            </td>
                            <td>
                                <button className="save-button" onClick={handleSaveNewManufacturer}>
                                    <FontAwesomeIcon icon={faCheck} />
                                </button>
                                <button className="cancel-button" onClick={handleCancelNewManufacturer}>
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </td>
                        </tr>
                    )}
                    {manufacturers.map((manufacturer) => (
                        <tr key={manufacturer.name}>
                            <td>
                                {manufacturer.isEditing ? (
                                    <input
                                        type="text"
                                        value={manufacturer.name}
                                        onChange={(e) => setManufacturers(manufacturers.map((m) =>
                                            m.name === manufacturer.name ? { ...m, name: e.target.value } : m))}
                                    />
                                ) : (
                                    manufacturer.name
                                )}
                            </td>
                            {canEditVal && canDeleteVal && (
                                <td>
                                    {manufacturer.isEditing ? (
                                        <>
                                            <button className="save-button" onClick={() => handleEditSave(manufacturer.oldName as string, manufacturer.name)}>
                                                <FontAwesomeIcon icon={faCheck} />
                                            </button>
                                            <button className="cancel-button" onClick={() => handleEdittingCancel(manufacturer.name)}>
                                                <FontAwesomeIcon icon={faTimes} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="edit-button" onClick={() => handleEdit(manufacturer.name)}>
                                                <FontAwesomeIcon icon={faEdit} />
                                            </button>
                                            <button className="delete-button" onClick={() => handleDelete(manufacturer.name)}>
                                                <FontAwesomeIcon icon={faTrash} />
                                            </button>
                                        </>
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

export default Manufacturers;