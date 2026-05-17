import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    LayoutDashboard, Box, Receipt, BarChart3, Settings, 
    Users, LogOut, ChevronRight, ShoppingBag, ArrowUpRight 
} from 'lucide-react';
import * as db from '../services/db';
import './DashboardScreen.css';

export default function DashboardScreen() {
    const navigate = useNavigate();
    const [todaySales, setTodaySales] = useState(0);
    const [recentSales, setRecentSales] = useState([]);
    const [stats, setStats] = useState({ productsCount: 0, lowStockCount: 0 });

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        const salesTotal = await db.getTodaySalesTotal();
        const activity = await db.getRecentActivity(4);
        const products = await db.getProducts();

        setTodaySales(salesTotal);
        setRecentSales(activity);
        
        const lowStock = products.filter(p => p.stock < 10).length;
        setStats({
            productsCount: products.length,
            lowStockCount: lowStock
        });
    };

    const handleLogout = () => {
        if (window.confirm("Apakah Anda yakin ingin keluar?")) {
            navigate('/login', { replace: true });
        }
    };

    const formatDate = () => {
        return new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    return (
        <div className="dashboard-container">
            {/* Header */}
            <div className="dashboard-header">
                <div className="header-left-info">
                    <div className="user-greeting">
                        <h1>Hello, Admin</h1>
                        <span className="role-tag">👑 Owner</span>
                    </div>
                    <p className="current-date">{formatDate()}</p>
                </div>
                <button className="logout-button" onClick={handleLogout} title="Log Out">
                    <LogOut size={20} color="#e74c3c" />
                </button>
            </div>

            {/* Sales Card */}
            <div className="sales-hero-card">
                <div className="sales-card-info">
                    <span className="sales-label">Total Penjualan Hari Ini</span>
                    <h2 className="sales-amount">Rp {todaySales.toLocaleString('id-ID')}</h2>
                    <p className="sales-description">Sesi Shift Aktif</p>
                </div>
                <button className="open-pos-btn" onClick={() => navigate('/pos')}>
                    <span>Buka POS</span>
                    <ArrowUpRight size={18} />
                </button>
            </div>

            {/* Quick Stats Banner */}
            <div className="stats-row">
                <div className="stat-pill" onClick={() => navigate('/inventory')}>
                    <span className="stat-val">{stats.productsCount}</span>
                    <span className="stat-lbl">Produk Terdaftar</span>
                </div>
                <div className="stat-pill danger-pill" onClick={() => navigate('/inventory')}>
                    <span className="stat-val">{stats.lowStockCount}</span>
                    <span className="stat-lbl">Stok Menipis (&lt;10)</span>
                </div>
            </div>

            {/* Management Menu Grid */}
            <div className="menu-section">
                <h3 className="section-heading">Manajemen Kasir</h3>
                <div className="menu-grid">
                    <div className="grid-card card-blue" onClick={() => navigate('/pos')}>
                        <div className="grid-icon-box"><ShoppingBag size={24} color="#3498db" /></div>
                        <h4>Kasir (POS)</h4>
                        <p>Transaksi Baru</p>
                    </div>
                    
                    <div className="grid-card card-purple" onClick={() => navigate('/inventory')}>
                        <div className="grid-icon-box"><Box size={24} color="#9b59b6" /></div>
                        <h4>Inventaris</h4>
                        <p>Kelola Stok & Barang</p>
                    </div>

                    <div className="grid-card card-orange" onClick={() => navigate('/history')}>
                        <div className="grid-icon-box"><Receipt size={24} color="#e67e22" /></div>
                        <h4>Riwayat</h4>
                        <p>Data Transaksi</p>
                    </div>

                    <div className="grid-card card-green" onClick={() => navigate('/reports')}>
                        <div className="grid-icon-box"><BarChart3 size={24} color="#2ecc71" /></div>
                        <h4>Laporan</h4>
                        <p>Statistik Keuntungan</p>
                    </div>

                    <div className="grid-card card-teal" onClick={() => navigate('/users')}>
                        <div className="grid-icon-box"><Users size={24} color="#1abc9c" /></div>
                        <h4>Karyawan</h4>
                        <p>Hak Akses Tim</p>
                    </div>

                    <div className="grid-card card-grey" onClick={() => navigate('/settings')}>
                        <div className="grid-icon-box"><Settings size={24} color="#7f8c8d" /></div>
                        <h4>Pengaturan</h4>
                        <p>Konfigurasi Toko</p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="activity-section">
                <div className="activity-header">
                    <h3 className="section-heading">Aktivitas Terakhir</h3>
                    <button className="view-all-link" onClick={() => navigate('/history')}>Lihat Semua</button>
                </div>
                <div className="activity-list">
                    {recentSales.length === 0 ? (
                        <div className="empty-activity">
                            <p>Belum ada transaksi hari ini.</p>
                        </div>
                    ) : (
                        recentSales.map((sale) => (
                            <div key={sale.id} className="activity-item-card" onClick={() => navigate('/history')}>
                                <div className="activity-left">
                                    <div className="activity-icon-receipt"><Receipt size={16} color="#3498db" /></div>
                                    <div className="activity-info">
                                        <span className="activity-trx">{sale.id}</span>
                                        <span className="activity-time">
                                            {new Date(sale.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                </div>
                                <div className="activity-right">
                                    <span className="activity-price">Rp {sale.total.toLocaleString('id-ID')}</span>
                                    <ChevronRight size={16} color="#bdc3c7" />
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
