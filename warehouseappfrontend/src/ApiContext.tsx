import React, { createContext, useContext } from 'react';

interface ApiConfig {
    baseUrl: string;
}

const ApiContext = createContext<ApiConfig | null>(null);

export const ApiProvider: React.FC<{ config: ApiConfig; children: React.ReactNode }> = ({ config, children }) => (
    <ApiContext.Provider value={config}>
        {children}
    </ApiContext.Provider>
);

export const useApi = () => {
    const context = useContext(ApiContext);
    if (!context) {
        throw new Error('useApi must be used within an ApiProvider');
    }
    return context;
};