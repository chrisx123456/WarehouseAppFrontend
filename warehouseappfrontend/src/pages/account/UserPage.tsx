import React, { useState, useEffect } from 'react';
import { useApi } from '../../ApiContext';
import './UserPanel.css'
// Interfejsy (te same co w poprzednim komponencie)
interface User {
    firstName: string;
    lastName: string;
    email: string;
    roleName: string;
}

interface ErrorResponse {
    message: string;
}

const UserPanel: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { baseUrl } = useApi();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                // Załóżmy, że masz endpoint do pobierania danych JEDNEGO użytkownika po emailu lub ID
                const response = await fetch(`${baseUrl}/Account/owndata`, { // Zmieniony endpoint
                    headers: { Authorization: `Bearer ${localStorage.getItem('jwtToken')}` },
                });

                if (!response.ok) {
                    const errorData = await response.json() as ErrorResponse;
                    throw new Error(`Błąd pobierania danych użytkownika: ${response.status} - ${errorData.message || 'Brak szczegółów'}`);
                }

                const userData = await response.json() as User;
                setUser(userData);
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

        fetchUserData();
    }, [baseUrl]);

    if (loading) return <div>Ładowanie danych użytkownika...</div>;
    if (error) return <div>Błąd: {error}</div>;
    if (!user) return <div>Brak danych użytkownika.</div>;

    return (
        <div className="user-details">
            <h2>Dane Użytkownika</h2>
            <div className="user-info">
                <div className="info-item">
                    <span className="label">Imię:</span>
                    <span className="value">{user.firstName}</span>
                </div>
                <div className="info-item">
                    <span className="label">Nazwisko:</span>
                    <span className="value">{user.lastName}</span>
                </div>
                <div className="info-item">
                    <span className="label">Email:</span>
                    <span className="value">{user.email}</span>
                </div>
                <div className="info-item">
                    <span className="label">Rola:</span>
                    <span className="value">{user.roleName}</span>
                </div>
                {/* Możesz dodać więcej pól w ten sam sposób */}
            </div>
        </div>
    );
};


export default UserPanel;