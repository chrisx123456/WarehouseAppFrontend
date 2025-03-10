﻿import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom'; 
import Navigation from './components/Navigation/Navigation';
import Content from './components/Content/Content';
import Home from './pages/Home';
import Categories from './pages/category/Categories'
import Manufacturers from './pages/manufacturers/Manufacturers'
import Products from './pages/products/Products'
import Stock from './pages/stock/Stock'
import AdminPage from './pages/account/AdminPage'
import UserPage from './pages/account/UserPage'
import Sales from './pages/sales/Sales'
import UserSale from './pages/sales/UserSale'
import { User } from './types/User'; 
import './App.css';
import { useApi } from './ApiContext';

interface LoginProps {
    onLogin: (user: User) => void;
    initialError?: string | null;
}
interface ErrorResponse {
    Message?: string //Wyjątek że duża litera bo używam JsonSerializer ręcznie
}
interface TokenResponse {
    token: string
}
interface Currency {
    currency: string;
}

const Login: React.FC<LoginProps> = ({ onLogin, initialError }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(initialError || null);
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
                throw new Error(`Login error: ${errorLogin.Message}`);
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
                throw new Error(`Error fetching role: ${errorRoleData.Message}`);
            }

            const user = await roleResponse.json() as User;
            const role = user.role;

            const currencyResponse = await fetch(`${baseUrl}/Admin/currency`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!currencyResponse.ok) {
                throw new Error(`Error fetching currency`);
            }
            const currency = await currencyResponse.json() as Currency;

            localStorage.setItem('currency', currency.currency);
            localStorage.setItem('jwtToken', token);
            localStorage.setItem('role', role);
            onLogin({ role });

        } catch (error: unknown) {
            if (error instanceof Error) {
                console.error("Login error:", error);
                setError(error.message);
            } else {
                console.error("Login error:", error); 
                setError("An error occured"); 
            }

        }
    };

    return (
        <div className="login-container">
            <h2>Login</h2>
            {error && <div className="error-message">{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className="input-group">
                    <label htmlFor="username">Email:</label>
                    <input type="text" id="username" value={username} onChange={(e) => setUsername(e.target.value)} required />
                </div>
                <div className="input-group">
                    <label htmlFor="password">Password:</label>
                    <input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <button type="submit">Login</button>
            </form>
        </div>
    );
};

const App: React.FC = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('jwtToken'));
    const [user, setUser] = useState<User | null>(null);
    const { baseUrl } = useApi();
    const navigate = useNavigate();
    const [loginError, setLoginError] = useState<string | null>(null); 

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
                    const currencyResponse = await fetch(`${baseUrl}/Admin/currency`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });

                    if (currencyResponse.ok) {
                        const currency = await currencyResponse.json() as Currency;
                        localStorage.setItem('currency', currency.currency);
                    }


                    if (roleResponse.ok) {
                        const roleData = await roleResponse.json();
                        setUser({ role: roleData.role });
                        setIsLoggedIn(true); 
                    } else {
                        const errorMsg = (await roleResponse.json() as ErrorResponse).Message;
                        setLoginError(errorMsg || null);
                        localStorage.removeItem('jwtToken');
                        setIsLoggedIn(false);
                        setUser(null);
                        navigate("/login"); 
                        return;
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                    localStorage.removeItem('jwtToken');
                    setIsLoggedIn(false);
                    setUser(null);
                    navigate("/login"); 
                }
            } else {
                navigate("/login"); 
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
        return <Login onLogin={handleLogin} initialError={loginError} />;
    }

    return (
        <div className="app-container">
            {user && <Navigation user={user} />}
            <div className="content-wrapper">
                {user && <button onClick={handleLogout} className="logout-button">Logout</button>} 
                <Content>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/categories" element={<Categories />} />
                        <Route path="/manufacturers" element={<Manufacturers />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/stock" element={<Stock />} />
                        <Route path="/sales" element={<Sales />} />
                        <Route path="/usersale" element={<UserSale />} />s
                        <Route path="/admin" element={<AdminPage />} />
                        <Route path="/user" element={<UserPage />} />
                    </Routes>
                </Content>
            </div>
        </div>
    );
};

export default App;