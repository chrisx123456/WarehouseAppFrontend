import React, { useState, useEffect } from 'react';
import { useApi } from '../../ApiContext';
import '../GeneralStyles.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEdit, faTrash, faCheck, faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';

interface Manufacturer {
    name: string;
    //isEditing?: boolean;
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

    const [editingManufacturerName, setEditingManufacturerName] = useState<string | null>(null);
    const [tempManufacturerName, setTempManufacturerName] = useState('');
    const [searchTerm, setSearchTerm] = useState("");

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
        setEditingManufacturerName(manufacturerName);
        setTempManufacturerName(manufacturers.find(m => m.name === manufacturerName)?.name || '');
        setManufacturers(manufacturers.map(m =>
            m.name === manufacturerName ? { ...m, oldName: m.name } : m
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
            setManufacturers(manufacturers.map(m =>
                m.name === oldName ? { ...m, name: tempManufacturerName, isEditing: false } : m
            ));

            setEditingManufacturerName(null);
            setTempManufacturerName('');
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Error occured");
            }
        }
    };

    const handleEdittingCancel = () => {
        setEditingManufacturerName(null);
        setTempManufacturerName('');
    };

    const canEdit = (role: string) => role === 'Manager' || role === 'Admin';
    const canDelete = (role: string) => role === 'Manager' || role === 'Admin';
    const canAdd = (role: string) => role === 'Manager' || role === 'Admin';

    const canEditVal = canEdit(localStorage.getItem('role') as string);
    const canDeleteVal = canDelete(localStorage.getItem('role') as string);
    const canAddVal = canAdd(localStorage.getItem('role') as string);

    const handleAddManufacturer = () => {
        const newname = '';
        setNewManufacturer({ name: newname });
        setEditingManufacturerName(newname);
        setTempManufacturerName(manufacturers.find(m => m.name === newname)?.name || '');
    }

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
            setManufacturers([...manufacturers, { ...newManufacturer }]);
            setEditingManufacturerName(null);
            setTempManufacturerName('');
            setNewManufacturer(null);
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Error creating manufacturer.");
        }
    };

    const handleCancelNewManufacturer = () => setNewManufacturer(null);

    const handleSearch = () => {
        if (searchTerm === "") {
            window.location.reload();
            return;
        }
        setManufacturers(manufacturers.filter(man => man.name.toLowerCase().includes(searchTerm.toLocaleLowerCase())))
        setSearchTerm("");
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="manufacturers-container">
            {error && <div className="error-message">{error}</div>}
            <h1>Manufacturers</h1>
            <div className="search-container">
                <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button onClick={handleSearch}>Search</button>
            </div>
            {canAddVal && (
                <button className="add-button" onClick={handleAddManufacturer}>
                    <FontAwesomeIcon icon={faPlus} /> Add Manufacturer
                </button>
            )}
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                       {/* {canEditVal && canDeleteVal && <th>Actions</th>}*/}
                    </tr>
                </thead>
                <tbody>
                    {newManufacturer && (
                        <tr>
                            <td>
                                <input
                                    type="text"
                                    value={newManufacturer.name}
                                    onChange={(e) => {
                                        if (!/^[^a-zA-Z0-9\s]*$|^$/.test(e.target.value) || e.target.value === "")
                                            setNewManufacturer({ ...newManufacturer, name: e.target.value })
                                    }}
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
                                {editingManufacturerName === manufacturer.name ? (
                                    <input
                                        type="text"
                                        value={tempManufacturerName}
                                        onChange={(e) => setTempManufacturerName(e.target.value)}

                                    />
                                ) : (
                                    manufacturer.name
                                )}
                            </td>
                            {canEditVal && canDeleteVal && (
                                <td>
                                    {editingManufacturerName === manufacturer.name ? (
                                        <>
                                            <button className="save-button" onClick={() => handleEditSave(manufacturer.name, tempManufacturerName)}>
                                                <FontAwesomeIcon icon={faCheck} />
                                            </button>
                                            <button className="cancel-button" onClick={() => handleEdittingCancel()}>
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