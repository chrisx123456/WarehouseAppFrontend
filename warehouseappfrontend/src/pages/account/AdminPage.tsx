import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../ApiContext';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCheck, faTimes, faTrash, faEdit, faPlus } from '@fortawesome/free-solid-svg-icons';
import '../GeneralStyles.css';

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

        if (editingUser.password) { // Sprawdzamy, czy Password ma jakąkolwiek wartość
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
            //users.map(user => {
            //    console.log(user.email.concat(" ").concat(editingUser.oldEmail));
            //    console.log(user.email === editingUser.oldEmail)
            //}
            //);

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

    if (loading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="users-container">
            <h1>Użytkownicy</h1>

            {error && <div className="error-message">{error}</div>}

            {!loading && users.length === 0 && !error && <div>Brak użytkowników.</div>}
            <button onClick={handleAddUserClick}><FontAwesomeIcon icon={faPlus} /> Dodaj użytkownika</button>

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
                        {isAddingNewUser && newUser && ( // Warunkowe renderowanie wiersza dodawania
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