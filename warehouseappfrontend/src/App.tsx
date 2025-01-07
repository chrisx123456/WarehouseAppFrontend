﻿import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Navigation from './components/Navigation/Navigation';
import Content from './components/Content/Content';
import Home from './pages/Home';
import { User } from './types/User'; // Upewnij się, że masz zdefiniowany typ User
import './App.css';
import { useApi } from './ApiContext';

interface LoginProps {
    onLogin: (user: User) => void;
}
interface ErrorResponse {
    Message?: string //Wyjątek że duża litera bo używam JsonSerializer ręcznie
}
interface TokenResponse {
    token: string
}


const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const { baseUrl } = useApi();

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);

        try {
            const response = await fetch(`${baseUrl}/Account/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email: username, password: password }),
            });

            if (!response.ok) {
                const errorLogin = await response.json() as ErrorResponse;
                throw new Error(`Błąd logowania: ${errorLogin.Message}`);
            }

            const tokenResponse = await response.json() as TokenResponse;
            const token = tokenResponse.token;

            const roleResponse = await fetch(`${baseUrl}/account/getrole`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!roleResponse.ok) {
                const errorRoleData = await roleResponse.json() as ErrorResponse;
                throw new Error(`Błąd pobierania roli: ${errorRoleData.Message}`);
            }

            const user = await roleResponse.json() as User;
            const role = user.role;

            localStorage.setItem('jwtToken', token);
            onLogin({ role });

        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Login error:", error);
                setError(error.message);
            } else {
                console.error("Login error:", error); // Logujemy cały obiekt błędu
                setError("Wystąpił nieznany błąd."); // Wyświetlamy ogólny komunikat
            }

        }
    };

    return (
        <div className="login-container">
            <h2>Logowanie</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="username">Nazwa użytkownika:</label>
                    <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Hasło:</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit">Zaloguj</button>
            </form>
        </div>
    );
};

const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('jwtToken'));
    const [user, setUser] = useState<User | null>(null);
    const { baseUrl } = useApi();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchRole = async () => {
            const token = localStorage.getItem('jwtToken');
            if (token) {
                try {
                    const roleResponse = await fetch(`${baseUrl}/account/getrole`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });

                    if (roleResponse.ok) {
                        const roleData = await roleResponse.json();
                        setUser({ role: roleData.role });
                        setIsLoggedIn(true); // Ustawiamy isLoggedIn na true, gdy rola zostanie pobrana
                    } else {
                        localStorage.removeItem('jwtToken');
                        setIsLoggedIn(false);
                        setUser(null);
                        navigate("/login"); // Przekierowanie do logowania, gdy token jest nieprawidłowy
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    localStorage.removeItem('jwtToken');
                    setIsLoggedIn(false);
                    setUser(null);
                    navigate("/login"); // Przekierowanie do logowania w przypadku błędu
                }
            } else {
                navigate("/login"); // Przekierowanie do logowania, gdy brak tokenu
            }
        };

        fetchRole();
    }, [baseUrl, navigate]);

    const handleLogin = (newUser: User) => {
        setIsLoggedIn(true);
        setUser(newUser);
        navigate("/");
    };

    const handleLogout = () => {
        localStorage.removeItem('jwtToken');
        setIsLoggedIn(false);
        setUser(null);
        navigate("/login");
    };

    if (!isLoggedIn) {
        return <Login onLogin={handleLogin} />;
    }

    return (
            <div className="app-container">
                {user && <Navigation user={user} />}
                <div className="content-wrapper">
                    {user && <button onClick={handleLogout} className="logout-button">Wyloguj</button>} {/* Warunkowe renderowanie */}
                    <Content>
                        <Routes>
                            <Route path="/" element={<Home />} />
                            {/* Inne route'y */}
                        </Routes>
                    </Content>
                </div>
            </div>
    );
};

export default App;