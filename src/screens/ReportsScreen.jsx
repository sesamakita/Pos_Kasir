import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, BarChart3, TrendingUp, DollarSign, Tag } from 'lucide-react';
import * as db from '../services/db';

export default function ReportsScreen() {
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);

    useEffect(() => {
        loadReports();
    }, []);

    const loadReports = async () => {
        const salesData = await db.getSales();
        setSales(salesData);
        const sum = salesData.reduce((acc, s) => acc + s.total, 0);
        setTotalRevenue(sum);
    };

    return (
        <div className="dashboard-container" style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="pos-header">
                <div className="header-left">
                    <button className="icon-btn" onClick={() => navigate('/dashboard')}>
                        <ChevronLeft size={24} color="#2c3e50" />
                    </button>
                    <h1>Laporan & Statistik</h1>
                </div>
            </div>

            <div style={{ padding: 20 }}>
                {/* Stats Summary Card */}
                <div className="sales-hero-card" style={{ background: 'linear-gradient(135deg, #2ecc71, #27ae60)', boxShadow: '0 10px 20px rgba(46,204,113,0.15)' }}>
                    <div className="sales-card-info">
                        <span className="sales-label">Total Omset Penjualan</span>
                        <h2 className="sales-amount">Rp {totalRevenue.toLocaleString('id-ID')}</h2>
                        <p className="sales-description">Akumulasi Transaksi Offline</p>
                    </div>
                    <div style={{ padding: 12, background: 'rgba(255,255,255,0.2)', borderRadius: '50%' }}>
                        <TrendingUp size={24} color="white" />
                    </div>
                </div>

                {/* Analytical Blocks */}
                <h3 className="section-heading" style={{ marginTop: 24 }}>Ringkasan Performa</h3>
                <div className="stats-row" style={{ margin: 0, gap: 16 }}>
                    <div className="stat-pill" style={{ cursor: 'default' }}>
                        <span className="stat-val">{sales.length}</span>
                        <span className="stat-lbl">Transaksi Berhasil</span>
                    </div>
                    <div className="stat-pill" style={{ cursor: 'default' }}>
                        <span className="stat-val">Rp {sales.length > 0 ? Math.round(totalRevenue / sales.length).toLocaleString('id-ID') : '0'}</span>
                        <span className="stat-lbl">Rata-rata per Struk</span>
                    </div>
                </div>

                {/* Chart Mockup */}
                <h3 className="section-heading" style={{ marginTop: 32 }}>Grafik Penjualan</h3>
                <div style={{ background: 'white', border: '2px solid #eef0f2', borderRadius: 20, padding: 20 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 'bold' }}>
                                <span>Makanan & Minuman</span>
                                <span>65%</span>
                            </div>
                            <div style={{ height: 10, background: '#f1f2f6', borderRadius: 10, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: '65%', background: '#3498db' }} />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 'bold' }}>
                                <span>Kebutuhan Harian</span>
                                <span>25%</span>
                            </div>
                            <div style={{ height: 10, background: '#f1f2f6', borderRadius: 10, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: '25%', background: '#2ecc71' }} />
                            </div>
                        </div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 'bold' }}>
                                <span>Lain-lain</span>
                                <span>10%</span>
                            </div>
                            <div style={{ height: 10, background: '#f1f2f6', borderRadius: 10, overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: '10%', background: '#e67e22' }} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
