import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { BrowserRouter } from 'react-router-dom'; // Import BrowserRouter
import { ApiProvider } from './ApiContext';
import { API_BASE_URL } from './config.ts'

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
    <React.StrictMode>
        <BrowserRouter> {/* Owijamy App w BrowserRouter */}
            <ApiProvider config={{ baseUrl: API_BASE_URL }}>
                <App />
            </ApiProvider>
        </BrowserRouter>
    </React.StrictMode>
);