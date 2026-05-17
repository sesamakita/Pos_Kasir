import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Receipt, Calendar, AlertCircle } from 'lucide-react';
import * as db from '../services/db';

export default function HistoryScreen() {
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        const historyData = await db.getSales();
        setSales(historyData);
    };

    return (
        <div className="dashboard-container" style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="pos-header">
                <div className="header-left">
                    <button className="icon-btn" onClick={() => navigate('/dashboard')}>
                        <ChevronLeft size={24} color="#2c3e50" />
                    </button>
                    <h1>Riwayat Transaksi</h1>
                </div>
            </div>

            <div style={{ padding: 20 }}>
                <h3 className="section-heading">Semua Penjualan</h3>
                
                {sales.length === 0 ? (
                    <div className="empty-catalog" style={{ background: 'white', borderRadius: 20, padding: 40, border: '2px solid #eef0f2' }}>
                        <AlertCircle size={40} color="#bdc3c7" />
                        <p style={{ marginTop: 12 }}>Belum ada transaksi penjualan.</p>
                    </div>
                ) : (
                    <div className="activity-list" style={{ border: '2px solid #eef0f2' }}>
                        {sales.map((sale) => (
                            <div key={sale.id} className="activity-item-card" style={{ cursor: 'default' }}>
                                <div className="activity-left">
                                    <div className="activity-icon-receipt"><Receipt size={16} color="#3498db" /></div>
                                    <div className="activity-info">
                                        <span className="activity-trx">{sale.id}</span>
                                        <span className="activity-time" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <Calendar size={10} />
                                            {new Date(sale.date).toLocaleDateString('id-ID')} - {new Date(sale.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                <div className="activity-right">
                                    <span className="activity-price" style={{ color: '#2ecc71' }}>Rp {sale.total.toLocaleString('id-ID')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
