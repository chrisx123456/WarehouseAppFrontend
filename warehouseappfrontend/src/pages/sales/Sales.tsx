import React, { useState, useEffect } from 'react';
import { useApi } from '../../ApiContext';
import { v4 as uuidv4 } from 'uuid';
import '../GeneralStyles.css';
import './SalesStyles.css';

interface Sale {
    id: string;
    tradeName: string;
    quantity: number;
    amountPaid: number;
    profit: number;
    dateSaled: string;
    series: string;
    ean: string;
    userFullName: string;
}
interface SalesSearchParams {
    series: string | undefined;
    ean: string | undefined;
    dateFrom: string | undefined;
    dateTo: string | undefined;
    fullName: string | undefined
}

interface SalesStats {
    totalRevenue: number;
    averageSale: number;
    totalTransactions: number;
}
interface ErrorResponse {
    Message?: string;
}

const Sales: React.FC = () => {
    const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
    const [stats, setStats] = useState<SalesStats>({
        totalRevenue: 0,
        averageSale: 0,
        totalTransactions: 0
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { baseUrl } = useApi();

    const [seriesSearch, setSeriesSearch] = useState<string | undefined>(undefined);
    const [eanSearch, setEanSearch] = useState<string | undefined>(undefined);
    const [dateFromSearch, setDateFromSearch] = useState<string | undefined>(undefined);
    const [dateToSearch, setDateToSearch] = useState<string | undefined>(undefined);
    const [fullNameSearch, setFullNameSearch] = useState<string | undefined>(undefined);
    const crncy: string | null = localStorage.getItem('currency')

    useEffect(() => {
        const fetchSales = async () => {
            try {
                setLoading(true);
                const url = `${baseUrl}/Sale`;

                const response = await fetch(`${url}`, {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('jwtToken')}`,
                    },
                });

                if (!response.ok) {
                    const errorData = await response.json() as ErrorResponse;
                    throw new Error(errorData.Message || 'Failed to fetch sales');
                }

                const saleData = await response.json().then(data =>
                    data.map((sale: Sale) => ({ ...sale, id: uuidv4() }))
                ) as Sale[];
                setFilteredSales(saleData);
                calculateStats(saleData);

            } catch (err) {
                setError(err instanceof Error ? err.message : 'Unknown error occurred');
            } finally {
                setLoading(false);
            }
        };

        fetchSales();
    }, [baseUrl]);

    const fetchSearch = async (searchParams: SalesSearchParams) => {
        try {
            setLoading(true);
            setError(null);
            const query = new URLSearchParams();
            if (searchParams.series) query.append('series', searchParams.series);
            if (searchParams.ean) query.append('ean', searchParams.ean);
            if (searchParams.dateFrom) query.append('dateFrom', searchParams.dateFrom);
            if (searchParams.dateTo) query.append('dateTo', searchParams.dateTo);
            if (searchParams.fullName) query.append('fullName', searchParams.fullName);

            const url = `${baseUrl}/Sale/salesFullData/search?${query.toString()}`;


            const salesResponse = await fetch(url, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}`
                },
            });
            if (!salesResponse.ok) {
                throw new Error((await salesResponse.json() as ErrorResponse).Message ?? "Error searching sales")
            }
            const saleData = await salesResponse.json().then(data =>
                data.map((sale: Sale) => ({ ...sale, id: uuidv4() }))
            ) as Sale[];
            setFilteredSales(saleData);

        }
        catch (err) {
            setError(err instanceof Error ? err.message : "Error searching sales");
        }
        finally {
            setLoading(false);
        }

    }
    const calculateStats = (salesData: Sale[]) => {
        const totalRevenue = salesData.reduce((sum, sale) => sum + sale.profit, 0);
        const totalTransactions = salesData.length;
        const averageSale = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

        setStats({
            totalRevenue: parseFloat(totalRevenue.toFixed(2)),
            averageSale: parseFloat(averageSale.toFixed(2)),
            totalTransactions
        });
    };
    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const searchParams: SalesSearchParams = {
            series: seriesSearch,
            ean: eanSearch,
            dateFrom: dateFromSearch,
            dateTo: dateToSearch,
            fullName: fullNameSearch
        };
        fetchSearch(searchParams); // Przekaż *aktualne* parametry
    };

    if (loading) {
        return <div className="loading">Loading data...</div>;
    }

    return (
        <div className="data-container">
            <h1>Sales history</h1>
            {error && <div className="error-message">{error}</div>}
            <div className="filters-container">
                <div className="search-form">
                    <form onSubmit={handleSearchSubmit}>
                        <input
                            type="text"
                            placeholder="Full Name"
                            value={fullNameSearch}
                            onChange={(e) => setFullNameSearch(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Series"
                            value={seriesSearch}
                            onChange={(e) => setSeriesSearch(e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="EAN"
                            value={eanSearch}
                            onChange={(e) => setEanSearch(e.target.value)}
                        />
                        <div className="date-input-group">
                            <label htmlFor="dateFrom">Date from</label>
                            <input
                                id="dateFrom"
                                type="date"
                                value={dateFromSearch}
                                onChange={(e) => setDateFromSearch(e.target.value)}
                            />
                        </div>
                        <div className="date-input-group">
                            <label htmlFor="dateTo">Date to</label>
                            <input
                                id="dateTo"
                                type="date"
                                value={dateToSearch}
                                onChange={(e) => setDateToSearch(e.target.value)}
                            />
                        </div>
                        <button type="submit">Search</button>
                    </form>
                </div>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>Total income</h3>
                    <div className="stat-value">{stats.totalRevenue + " " + crncy}</div>
                </div>
                <div className="stat-card">
                    <h3>Average sale</h3>
                    <div className="stat-value">${stats.averageSale + " " + crncy}</div>
                </div>
                <div className="stat-card">
                    <h3>No. of transactions</h3>
                    <div className="stat-value">{stats.totalTransactions}</div>
                </div>
            </div>

            <div className="table-wrapper">
                <table className="sales-table">
                    <thead>
                        <tr>
                            <th>Trade Name</th>
                            <th>EAN</th>
                            <th>Quantity</th>
                            <th>Amount paid</th>
                            <th>Profit</th>
                            <th>Series</th>
                            <th>Date</th>
                            <th>Employee</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSales.map((sale) => (
                            <tr key={sale.id}>
                                <td>{sale.tradeName}</td>
                                <td>{sale.ean}</td>
                                <td>{sale.quantity}</td>
                                <td>${sale.amountPaid.toFixed(2)}</td>
                                <td>${sale.profit.toFixed(2)}</td>
                                <td>{sale.series}</td>
                                <td>{new Date(sale.dateSaled).toLocaleDateString('pl-PL')}</td>
                                <td>{sale.userFullName}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {filteredSales.length === 0 && (
                    <div className="no-results">No results</div>
                )}
            </div>
        </div>
    );
};

export default Sales;