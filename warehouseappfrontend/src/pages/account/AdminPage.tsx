import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../ApiContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faTrash, faEdit, faPlus } from '@fortawesome/free-solid-svg-icons';
import '../GeneralStyles.css';
import './AdminPageStyles.css'
interface User {
    firstName: string;
    lastName: string;
    email: string;
    roleName: string;
    password?: string
}
interface UserUpdateData {
    oldEmail: string;
    email?: string;
    password?: string;
    roleName?: string;
    firstName?: string;
    lastName?: string;
}
interface ErrorResponse {
    Message?: string;
}

const Users: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { baseUrl } = useApi();
    const [newUser, setNewUser] = useState<User | null>(null); // Stan dla nowego użytkownika
    const [isAddingNewUser, setIsAddingNewUser] = useState(false); // Stan do kontrolowania widoczności wiersza dodawania
    const availableRoles = ['Admin', 'Manager', 'User']; // Define available roles
    const [editingUser, setEditingUser] = useState<UserUpdateData | null>(null);


    const [showCurrencyInput, setShowCurrencyInput] = useState(false);
    const [currencyValue, setCurrencyValue] = useState('');
    const [showDeleteSeriesInput, setShowDeleteSeriesInput] = useState(false);
    const [stockSeriesValue, setStockSeriesValue] = useState('');

    const [confirmDelStockD, setConfirmDelStockD] = useState(false);
    const [confirmDelSales, setConfirmDelSales] = useState(false);

    const [showDeleteProductInput, setShowDeleteProductInput] = useState(false);
    const [eanValue, setEanValue] = useState('');


    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const url = `${baseUrl}/Account`; // Endpoint dla wszystkich użytkowników

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error ${response.status}: ${errorData.Message || 'Brak szczegółów'}`);
            }

            const data = await response.json() as User[];
            //console.log(data);
            setUsers(data);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Wystąpił błąd.');
            }
        } finally {
            setLoading(false);
        }
    }, [baseUrl]);
    useEffect(() => {
        fetchUsers();
    }, [baseUrl, fetchUsers]);

    const handleAddUserClick = () => {
        setNewUser({ firstName: '', lastName: '', email: '', roleName: 'User', password: '' }); // Resetuj formularz
        setIsAddingNewUser(true);
    };

    const handleSaveNewUser = async () => {
        if (!newUser || !newUser.firstName || !newUser.lastName || !newUser.email || !newUser.roleName || !newUser.password) {
            setError("Wszystkie pola muszą być wypełnione.");
            return;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newUser.email)) {
            setError("Niepoprawny format emaila");
            return
        }

        try {
            const response = await fetch(`${baseUrl}/Account/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify(newUser),
            });

            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error while creating user: ${response.status} - ${errorData.Message || 'No details'}`);
            }
            setUsers(prevUsers => [...prevUsers, { ...newUser }]);
            setNewUser({ firstName: '', lastName: '', email: '', roleName: '', password: '' });
            setIsAddingNewUser(false);
            setError(null);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Wystąpił błąd podczas dodawania użytkownika.');
            }
        }
    };

    const handleCancelNewUser = () => {
        setIsAddingNewUser(false);
        setNewUser(null); // Resetuj formularz
    };
    const handleDeleteUser = async (email: string) => {
        try {
            const response = await fetch(`${baseUrl}/Account/delete/${email}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` },
            });
            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error deleting user: ${response.status} - ${errorData.Message || 'No details'}`);
            }
            setUsers(users.filter((user) => user.email !== email));
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Wystąpił nieznany błąd.");
            }
        }
    };
    const handleEditUser = (user: User) => {
        setEditingUser({
            oldEmail: user.email,
            email: user.email,
            roleName: user.roleName,
            firstName: user.firstName,
            lastName: user.lastName
        });
    };
    const handleCancelEditUser = () => {
        setEditingUser(null);
    };
    const handleSaveEditUser = async () => {
        if (!editingUser) return;

        const updatedFields: UserUpdateData = { oldEmail: editingUser.oldEmail };

        const originalUser = users.find(u => u.email === editingUser.oldEmail);
        if (!originalUser) {
            setError("Nie znaleziono oryginalnego użytkownika.");
            return;
        }

        if (editingUser.email !== originalUser.email) {
            updatedFields.email = editingUser.email;
        }

        if (editingUser.roleName !== originalUser.roleName) {
            updatedFields.roleName = editingUser.roleName;
        }

        if (editingUser.password) { 
            updatedFields.password = editingUser.password;
        }

        if (editingUser.firstName !== originalUser.firstName) {
            updatedFields.firstName = editingUser.firstName;
        }

        if (editingUser.lastName !== originalUser.lastName) {
            updatedFields.lastName = editingUser.lastName;
        }

        try {
            const response = await fetch(`${baseUrl}/Account`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify(updatedFields), // Wysyłamy tylko zmienione pola
            });

            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error updating user: ${response.status} - ${errorData.Message || 'No details'}`);
            }

            setUsers(prevUsers => prevUsers.map(user =>
                (user.email === editingUser.oldEmail)
                    ? {
                        ...user,
                        firstName: editingUser.firstName ?? user.firstName,
                        lastName: editingUser.lastName ?? user.lastName,
                        email: editingUser.email ?? user.email,
                        roleName: editingUser.roleName ?? user.roleName,
                    }
                    : user
            ));
            setEditingUser(null);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Wystąpił nieznany błąd.");
            }
        }
    };
    const handleConfirmCurrency = async () => {
        setShowCurrencyInput(false);
        try {
            const response = await fetch(`${baseUrl}/Admin/currency/${currencyValue}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error updating user: ${response.status} - ${errorData.Message || 'No details'}`);
            }
            localStorage.setItem('currency', currencyValue);
            setCurrencyValue('');
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Error occured.");
            }
        }
    }
    const handleConfirmDeleteStock = async () => {
        setShowDeleteSeriesInput(false);
        try {
            const response = await fetch(`${baseUrl}/Admin/deleteBySeries/${stockSeriesValue}?stockDelivery=${confirmDelStockD}&sales=${confirmDelSales}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error deleting by series: ${response.status} - ${errorData.Message || 'No details'}`);
            }
            setError(null);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Error occured.");
            }
        }
    }
    const handleDeleteProduct = async () => {
        setShowDeleteProductInput(false);
        try {
            const response = await fetch(`${baseUrl}/Admin/deleteProduct/${eanValue}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                },
            });
            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(`Error deleting by series: ${response.status} - ${errorData.Message || 'No details'}`);
            }
            setError(null);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Error occured.");
            }
        }
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="page-container">
            {error && <div className="error-message">{error}</div>}
            <div className="admin-section">
                <h1>Admin tools</h1>

                <div className="admin-tool">
                    <button onClick={() => setShowCurrencyInput(true)}>
                        Change currency
                    </button>
                    {showCurrencyInput && (
                        <div className="input-with-buttons">
                            <input
                                type="text"
                                value={currencyValue}
                                onChange={(e) => setCurrencyValue(e.target.value)}
                                placeholder="Enter new currency (e.g. USD)"
                            />
                            <button className="save-button" onClick={handleConfirmCurrency}>
                                <FontAwesomeIcon icon={faCheck} />
                            </button>
                            <button className="cancel-button" onClick={() => {
                                setShowCurrencyInput(false);
                                setCurrencyValue('');
                            }}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                    )}
                </div>
                <div className="admin-tool">
                    <button onClick={() => setShowDeleteSeriesInput(true)}>
                        Delete product from stock by series
                    </button>
                    {showDeleteSeriesInput && (
                        <div className="delete-product-section">
                            <input
                                type="text"
                                value={stockSeriesValue}
                                onChange={(e) => setStockSeriesValue(e.target.value)}
                                placeholder="Enter series"
                            />
                            <div className="checkbox-group">
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={confirmDelStockD}
                                        onChange={(e) => setConfirmDelStockD(e.target.checked)}
                                    />
                                    Delete from StockDelivery(Historical data)
                                </label>

                                <label>
                                    <input
                                        type="checkbox"
                                        checked={confirmDelSales}
                                        onChange={(e) => setConfirmDelSales(e.target.checked)}
                                    />
                                    Delete from sales
                                </label>
                            </div>
                            <button className="save-button" onClick={handleConfirmDeleteStock}>
                                <FontAwesomeIcon icon={faCheck} />
                            </button>
                            <button className="cancel-button" onClick={() => {
                                setShowDeleteSeriesInput(false);
                                setStockSeriesValue('');
                            }}>
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                    )}
                    <div className="admin-tool">
                        <button onClick={() => setShowDeleteProductInput(true)}>
                            Delete product and all related data
                        </button>
                        {showDeleteProductInput && 
                            <div className="input-with-buttons">
                                <p>Deleting product this way means that -<br/>
                                   - related records in Sales, Stock and Stock Delivery will be also deleted</p>
                                <input
                                    type="text"
                                    value={eanValue}
                                    onChange={(e) => setEanValue(e.target.value)}
                                    placeholder="Ean"
                                />
                                <button className="save-button" onClick={handleDeleteProduct}>
                                    <FontAwesomeIcon icon={faCheck} />
                                </button>
                                <button className="cancel-button" onClick={() => {
                                    setShowDeleteProductInput(false);
                                    setEanValue('');
                                }}>
                                    <FontAwesomeIcon icon={faTimes} />
                                </button>
                            </div>    
                        }
                    </div>
                </div>
            </div>
            <h1>Users - Admin</h1>
            {!loading && users.length === 0 && !error && <div>No users.</div>}
            <button className="add-button" onClick={handleAddUserClick}><FontAwesomeIcon icon={faPlus} /> Add user</button>

            {!loading && users.length > 0 && (
                <table>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Lastname</th>
                            <th>Email</th>
                            <th>Role</th>
                            {isAddingNewUser && <th>Password</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {isAddingNewUser && newUser && ( 
                            <tr>
                                <td><input type="text" value={newUser.firstName} onChange={(e) => setNewUser({ ...newUser, firstName: e.target.value })} /></td>
                                <td><input type="text" value={newUser.lastName} onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })} /></td>
                                <td><input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} /></td>
                                <td>
                                    <select value={newUser.roleName} onChange={(e) => setNewUser({ ...newUser, roleName: e.target.value })}>
                                        {availableRoles.map((role) => (
                                            <option key={role} value={role}>{role}</option>
                                        ))}
                                    </select>
                                </td>
                                <td><input type="text" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} /></td>
                                <td>
                                    <button onClick={handleSaveNewUser}><FontAwesomeIcon icon={faCheck} /></button>
                                    <button onClick={handleCancelNewUser}><FontAwesomeIcon icon={faTimes} /></button>
                                </td>
                            </tr>
                        )}
                        {users.map((user) => (
                            <tr key={user.email}>
                                <td>{editingUser?.oldEmail === user.email ? <input type="text" value={editingUser.firstName ?? user.firstName} onChange={(e) => setEditingUser(prev => prev ? { ...prev, firstName: e.target.value } : null)} /> : user.firstName}</td>
                                <td>{editingUser?.oldEmail === user.email ? <input type="text" value={editingUser.lastName ?? user.lastName} onChange={(e) => setEditingUser(prev => prev ? { ...prev, lastName: e.target.value } : null)} /> : user.lastName}</td>
                                <td>{editingUser?.oldEmail === user.email ? <input type="email" value={editingUser.email ?? user.email} onChange={(e) => setEditingUser(prev => prev ? { ...prev, email: e.target.value } : null)} /> : user.email}</td>
                                <td>
                                    {editingUser?.oldEmail === user.email ? (
                                        <select
                                            value={editingUser.roleName}
                                            
                                            onChange={(e) => setEditingUser(prev => prev ? { ...prev, roleName: e.target.value } : null)}>
                                            {availableRoles.map((role) => (
                                                <option key={role} value={role}>{role}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        user.roleName
                                    )}
                                </td>
                                <td>
                                    {editingUser?.oldEmail === user.email ? (
                                        <div className="adminPanelPasswordDiv">
                                            <input type="password" placeholder="Hasło" onChange={(e) => setEditingUser(prev => prev ? { ...prev, password: e.target.value } : null)} />
                                            <div className="SCbuttons-container">
                                                <button className="save-button" onClick={handleSaveEditUser}><FontAwesomeIcon icon={faCheck} /></button>
                                                <button className="cancel-button" onClick={handleCancelEditUser}><FontAwesomeIcon icon={faTimes} /></button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div>
                                            <button className="edit-button" onClick={() => handleEditUser(user)}><FontAwesomeIcon icon={faEdit}/></button>
                                            <button className="delete-button" onClick={() => handleDeleteUser(user.email)}><FontAwesomeIcon icon={faTrash} /></button>
                                        </div>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Users;