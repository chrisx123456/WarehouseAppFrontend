import React, { useState, useEffect } from 'react';
import { useApi } from '../../ApiContext';
import './UserPanel.css'
//import '../GeneralStyles.css';
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
interface INewPassword {
    password: string;
}

const UserPanel: React.FC = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { baseUrl } = useApi();

    const [changingEmail, setChangingEmail] = useState(false);
    const [newEmail, setNewEmail] = useState("");
    const [confirmNewEmail, setConfirmNewEmail] = useState("");

    const [changingPassword, setChangingPassword] = useState(false);
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    const [changeError, setChangeError] = useState<string | null>(null);

    const handleEmailChange = async () => {
        if (newEmail !== confirmNewEmail) {
            setChangeError("Podane adresy email nie są identyczne.");
            return;
        }

        try {
            const response = await fetch(`${baseUrl}/Account/newemail/${newEmail}`, { // Endpoint do zmiany emaila
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                },
            });

            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(errorData.message || `Błąd zmiany emaila: ${response.status}`);
            }

            // Aktualizacja stanu user
            setUser(prevUser => prevUser ? { ...prevUser, email: newEmail } : null)

            setChangingEmail(false);
            setNewEmail("");
            setConfirmNewEmail("");
            setError(null); // Czyścimy błąd po sukcesie
            setChangeError(null);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Wystąpił nieznany błąd.");
            }
        }
    };

    const handlePasswordChange = async () => {
        if (newPassword !== confirmNewPassword) {
            setChangeError("Podane hasła nie są identyczne.");
            return;
        }
        try {

            const response = await fetch(`${baseUrl}/Account/newpassword`, { // Endpoint do zmiany hasła
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                },
                body: JSON.stringify({ password: newPassword }), // Wysyłamy email i nowe hasło
            });

            if (!response.ok) {
                const errorData = await response.json() as ErrorResponse;
                throw new Error(errorData.message || `Błąd zmiany hasła: ${response.status}`);
            }

            setChangingPassword(false);
            setNewPassword("");
            setConfirmNewPassword("");
            setError(null); // Czyścimy błąd po sukcesie
            setChangeError(null);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("Wystąpił nieznany błąd.");
            }
        }
    };


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
    //if (error) return <div>Błąd: {error}</div>;
    if (!user) return <div>Brak danych użytkownika.</div>;

    return (
        <div className="user-details">
            <h2>Dane Użytkownika</h2>
            {error && <div className="error-message">{error}</div>} {/* Używamy istniejącego stanu error */}
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
                <div className="buttons-container"> {/* Kontener dla przycisków */}
                    {changeError && <div className="error-message">{changeError}</div>}

                    {!changingEmail && !changingPassword && (
                        <button onClick={() => setChangingEmail(true)}>Zmień Email</button>
                    )}
                    {changingEmail && (
                        <div className="change-form">
                            <input type="email" placeholder="New Email" value={newEmail} onChange={e => setNewEmail(e.target.value)} />
                            <input type="email" placeholder="Confirm New Email" value={confirmNewEmail} onChange={e => setConfirmNewEmail(e.target.value)} />
                            <button onClick={handleEmailChange}>Zapisz Email</button>
                            <button onClick={() => { setChangingEmail(false); setNewEmail(""); setConfirmNewEmail(""); setChangeError(null) }}>Anuluj</button>
                        </div>
                    )}

                    {!changingPassword && !changingEmail && (
                        <button onClick={() => setChangingPassword(true)}>Zmień Hasło</button>
                    )}
                    {changingPassword && (
                        <div className="change-form">
                            <input type="password" placeholder="New Password" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                            <input type="password" placeholder="Confirm New Password" value={confirmNewPassword} onChange={e => setConfirmNewPassword(e.target.value)} />
                            <button onClick={handlePasswordChange}>Zapisz Hasło</button>
                            <button onClick={() => { setChangingPassword(false); setNewPassword(""); setConfirmNewPassword(""); setChangeError(null) }}>Anuluj</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


export default UserPanel;