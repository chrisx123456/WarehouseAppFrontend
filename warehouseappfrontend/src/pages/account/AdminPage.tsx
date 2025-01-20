import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../ApiContext';
import '../category/Categories.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
interface User {
    firstName: string;
    lastName: string;
    email: string;
    roleName: string;
    password?: string
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
                                <td>{user.firstName}</td>
                                <td>{user.lastName}</td>
                                <td>{user.email}</td>
                                <td>{user.roleName}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default Users;