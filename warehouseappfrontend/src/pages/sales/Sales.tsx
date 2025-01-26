import React, { useState, useEffect } from 'react';
import { useApi } from '../../ApiContext';
import '../GeneralStyles.css';
import './SalesStyles.css';

interface Sale {
    productId: string;
    quantity: number;
    price: number;
    dateSaled: string;
    series: string;
    userId: string;
}

interface SalesStats {
    totalSales: number;
    totalRevenue: number;
    averageSale: number;
    totalTransactions: number;
}

const Sales: React.FC = () => {
    const [sales, setSales] = useState<Sale[]>([]);
    const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
    const [stats, setStats] = useState<SalesStats>({
        totalSales: 0,
        totalRevenue: 0,
        averageSale: 0,
        totalTransactions: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [filters, setFilters] = useState({
        searchTerm: '',
        userId: '',
        startDate: '',
        endDate: ''
    });
    const { baseUrl } = useApi();

    useEffect(() => {
        const fetchSales = async () => {
            try {
                setLoading(true);
                const url = `${baseUrl}/Sale`;
                const params = new URLSearchParams();

                if (filters.startDate) params.append('startDate', filters.startDate);
                if (filters.endDate) params.append('endDate', filters.endDate);

                const response = await fetch(`${url}${params.toString()}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Failed to fetch sales');
                }

                const data = await response.json();
                setSales(Array.isArray(data) ? data : [data]);

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchSales();
    }, [baseUrl, filters.startDate, filters.endDate]);

    useEffect(() => {
        const applyFilters = () => {
            const filtered = sales.filter(sale => {
                const matchesSearch = sale.productId.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
                    sale.series.toLowerCase().includes(filters.searchTerm.toLowerCase());
                const matchesUser = sale.userId.toLowerCase().includes(filters.userId.toLowerCase());
                const saleDate = new Date(sale.dateSaled);
                const matchesStartDate = !filters.startDate || saleDate >= new Date(filters.startDate);
                const matchesEndDate = !filters.endDate || saleDate <= new Date(filters.endDate);

                return matchesSearch && matchesUser && matchesStartDate && matchesEndDate;
            });

            setFilteredSales(filtered);
            calculateStats(filtered);
        };

        applyFilters();
    }, [sales, filters]);

    const calculateStats = (salesData: Sale[]) => {
        const totalSales = salesData.reduce((sum, sale) => sum + sale.quantity, 0);
        const totalRevenue = salesData.reduce((sum, sale) => sum + (sale.quantity * sale.price), 0);
        const totalTransactions = salesData.length;
        const averageSale = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        setStats({
            totalSales,
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            averageSale: parseFloat(averageSale.toFixed(2)),
            totalTransactions
        });
    };

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilters({
            ...filters,
            [e.target.name]: e.target.value
        });
    };

    if (loading) {
        return <div className="loading">Ładowanie danych sprzedaży...</div>;
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="data-container">
            <h1>Historia Sprzedaży</h1>

            {/* Filtry */}
            <div className="filters-container">
                <div className="filter-group">
                    <label>Okres:</label>
                    <input
                        type="date"
                        name="startDate"
                        value={filters.startDate}
                        onChange={handleFilterChange}
                        max={filters.endDate}
                    />
                    <span>-</span>
                    <input
                        type="date"
                        name="endDate"
                        value={filters.endDate}
                        onChange={handleFilterChange}
                        min={filters.startDate}
                    />
                </div>

                <div className="filter-group">
                    <label>Wyszukaj:</label>
                    <input
                        type="text"
                        name="searchTerm"
                        placeholder="Produkt lub seria..."
                        value={filters.searchTerm}
                        onChange={handleFilterChange}
                    />
                </div>

                <div className="filter-group">
                    <label>Użytkownik:</label>
                    <input
                        type="text"
                        name="userId"
                        placeholder="ID użytkownika..."
                        value={filters.userId}
                        onChange={handleFilterChange}
                    />
                </div>
            </div>

            {/* Statystyki */}
            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Łączna sprzedaż</h3>
                    <div className="stat-value">{stats.totalSales} szt.</div>
                </div>
                <div className="stat-card">
                    <h3>Przychód całkowity</h3>
                    <div className="stat-value">${stats.totalRevenue}</div>
                </div>
                <div className="stat-card">
                    <h3>Średnia transakcja</h3>
                    <div className="stat-value">${stats.averageSale}</div>
                </div>
                <div className="stat-card">
                    <h3>Liczba transakcji</h3>
                    <div className="stat-value">{stats.totalTransactions}</div>
                </div>
            </div>

            {/* Tabela */}
            <div className="table-wrapper">
                <table className="sales-table">
                    <thead>
                        <tr>
                            <th>Produkt</th>
                            <th>Ilość</th>
                            <th>Cena</th>
                            <th>Data</th>
                            <th>Seria</th>
                            <th>Użytkownik</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSales.map((sale) => (
                            <tr key={`${sale.productId}-${sale.series}-${sale.dateSaled}`}>
                                <td>{sale.productId}</td>
                                <td>{sale.quantity}</td>
                                <td>${sale.price.toFixed(2)}</td>
                                <td>{new Date(sale.dateSaled).toLocaleDateString()}</td>
                                <td>{sale.series}</td>
                                <td>{sale.userId}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredSales.length === 0 && (
                    <div className="no-results">Brak wyników dla wybranych filtrów</div>
                )}
            </div>
        </div>
    );
};

export default Sales;