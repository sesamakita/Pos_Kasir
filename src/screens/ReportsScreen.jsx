import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, TrendingUp, BarChart3, Clock, AlertTriangle, ShieldCheck, Printer, Calendar, FileText, Activity } from 'lucide-react';
import * as db from '../services/db';
import './ReportsScreen.css';

export default function ReportsScreen() {
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [logs, setLogs] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const user = db.getCurrentUser();
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }
        if (user.role !== 'SUPER_ADMIN') {
            alert("Akses ditolak! Menu laporan hanya dapat diakses oleh Super Admin.");
            navigate('/dashboard', { replace: true });
            return;
        }
        setCurrentUser(user);
        loadReports();
    }, [navigate]);

    const loadReports = async () => {
        const salesData = await db.getSales();
        setSales(salesData);
        
        const sum = salesData.reduce((acc, s) => acc + s.total, 0);
        setTotalRevenue(sum);

        const activityLogs = db.getActivityLogs();
        setLogs(activityLogs);
    };

    const isSuper = currentUser?.role === 'SUPER_ADMIN';

    // --- COMPUTE TOP SELLING PRODUCTS ---
    const topProducts = useMemo(() => {
        const counts = {};
        let maxQty = 0;

        sales.forEach(sale => {
            sale.items.forEach(item => {
                if (!counts[item.name]) {
                    counts[item.name] = { name: item.name, quantity: 0, revenue: 0 };
                }
                counts[item.name].quantity += item.quantity;
                counts[item.name].revenue += (item.price * item.quantity);
                if (counts[item.name].quantity > maxQty) {
                    maxQty = counts[item.name].quantity;
                }
            });
        });

        return Object.values(counts)
            .sort((a, b) => b.quantity - a.quantity)
            .slice(0, 5) // Show top 5
            .map(p => ({
                ...p,
                percentage: maxQty > 0 ? Math.round((p.quantity / maxQty) * 100) : 0
            }));
    }, [sales]);

    // --- COMPUTE DYNAMIC REVENUE BY CATEGORIES ---
    const categoryStats = useMemo(() => {
        const cats = {};
        let totalVal = 0;

        sales.forEach(sale => {
            sale.items.forEach(item => {
                const catName = item.categoryName || 'Lain-lain';
                if (!cats[catName]) {
                    cats[catName] = 0;
                }
                cats[catName] += (item.price * item.quantity);
                totalVal += (item.price * item.quantity);
            });
        });

        return Object.entries(cats).map(([name, val]) => ({
            name,
            value: val,
            percentage: totalVal > 0 ? Math.round((val / totalVal) * 100) : 0
        })).sort((a, b) => b.value - a.value);
    }, [sales]);

    // --- LOG ACTION BADGES HELPER ---
    const getBadgeStyle = (action) => {
        switch (action) {
            case 'LOGIN':
                return { background: 'rgba(46, 204, 113, 0.1)', color: '#27ae60' };
            case 'LOGOUT':
                return { background: 'rgba(127, 140, 141, 0.1)', color: '#7f8c8d' };
            case 'TRANSAKSI_POS':
                return { background: 'rgba(52, 152, 219, 0.1)', color: '#2980b9' };
            case 'RESTOCK_PRODUK':
                return { background: 'rgba(155, 89, 182, 0.1)', color: '#8e44ad' };
            case 'TAMBAH_PRODUK':
            case 'TAMBAH_KATEGORI':
                return { background: 'rgba(230, 126, 34, 0.1)', color: '#d35400' };
            case 'VOID_TRANSAKSI':
            case 'HAPUS_PRODUK':
            case 'RESET_DATABASE':
                return { background: 'rgba(231, 76, 60, 0.1)', color: '#c0392b' };
            default:
                return { background: 'rgba(52, 73, 94, 0.1)', color: '#2c3e50' };
        }
    };

    // --- DAILY CLOSING REPORT EXPORTER (BROWSER PRINT TEMPLATE) ---
    const handleExportClosingReport = () => {
        const printWindow = window.open('', '_blank', 'width=600,height=800');
        if (!printWindow) {
            alert("Harap izinkan popup browser untuk mengekspor laporan.");
            return;
        }

        const store = db.getStoreSettings();
        
        // Category rows
        const catRowsHTML = categoryStats.map(c => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${c.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${c.percentage}%</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Rp ${c.value.toLocaleString('id-ID')}</td>
            </tr>
        `).join('');

        // Top products rows
        const prodRowsHTML = topProducts.map(p => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #ddd;">${p.name}</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${p.quantity} unit</td>
                <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">Rp ${p.revenue.toLocaleString('id-ID')}</td>
            </tr>
        `).join('');

        // User signature rendering
        const signatureHTML = currentUser?.signature ? `
            <div style="float: right; text-align: center; margin-top: 40px; width: 200px;">
                <p style="font-size: 12px; margin: 0 0 10px;">Penanggung Jawab,</p>
                <img src="${currentUser.signature}" style="width: 150px; height: 70px; object-fit: contain;" />
                <p style="font-size: 12px; font-weight: bold; margin: 5px 0 0; border-top: 1px solid #000; padding-top: 5px;">${currentUser.full_name}</p>
                <p style="font-size: 10px; color: #555; text-transform: uppercase; margin: 2px 0 0;">${currentUser.role}</p>
            </div>
        ` : `
            <div style="float: right; text-align: center; margin-top: 40px; width: 200px;">
                <p style="font-size: 12px; margin: 0 0 50px;">Penanggung Jawab,</p>
                <p style="font-size: 12px; font-weight: bold; margin: 5px 0 0; border-top: 1px solid #000; padding-top: 5px;">${currentUser?.full_name}</p>
                <p style="font-size: 10px; color: #555; text-transform: uppercase; margin: 2px 0 0;">${currentUser?.role}</p>
            </div>
        `;

        printWindow.document.write(`
            <html>
            <head>
                <title>Laporan Penutupan Harian - ${store.store_name}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 30px; color: #333; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .header h1 { margin: 0; font-size: 24px; color: #2c3e50; }
                    .header p { margin: 5px 0 0; font-size: 12px; color: #7f8c8d; }
                    .meta-info { margin-bottom: 25px; font-size: 13px; line-height: 1.6; }
                    .section-title { font-size: 16px; font-weight: bold; border-bottom: 2px solid #2c3e50; padding-bottom: 5px; margin-top: 30px; margin-bottom: 15px; color: #2c3e50; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                    th { background: #f2f2f2; text-align: left; padding: 8px; font-size: 12px; border-bottom: 2px solid #ddd; }
                </style>
            </head>
            <body onload="window.print(); window.close();">
                <div class="header">
                    <h1>LAPORAN PENUTUPAN KASIR KEUANGAN</h1>
                    <p style="font-weight: bold; font-size: 14px;">${store.store_name}</p>
                    <p>${store.store_address} | Telp: ${store.store_phone}</p>
                </div>

                <div class="meta-info">
                    <div style="float: left;">
                        <strong>Dicetak Oleh:</strong> ${currentUser?.full_name} (${currentUser?.role})<br>
                        <strong>Waktu Cetak :</strong> ${new Date().toLocaleString('id-ID')}
                    </div>
                    <div style="float: right; text-align: right;">
                        <strong>Sifat Dokumen:</strong> Rahasia Perusahaan<br>
                        <strong>Metode Sync :</strong> Offline Local Database
                    </div>
                    <div style="clear: both;"></div>
                </div>

                <div class="section-title">Ringkasan Omset Harian</div>
                <table style="font-size: 14px;">
                    <tr style="background:#2c3e50; color:white;">
                        <th style="padding: 12px; text-align: left; color:white;">KPI Penjualan</th>
                        <th style="padding: 12px; text-align: right; color:white;">Hasil Akumulasi</th>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">Total Transaksi Sukses</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">${sales.length} Transaksi</td>
                    </tr>
                    <tr style="background: #fbfbfb;">
                        <td style="padding: 10px; border-bottom: 1px solid #ddd;">Rata-rata Nilai per Struk</td>
                        <td style="padding: 10px; border-bottom: 1px solid #ddd; text-align: right; font-weight: bold;">Rp ${sales.length > 0 ? Math.round(totalRevenue / sales.length).toLocaleString('id-ID') : '0'}</td>
                    </tr>
                    <tr style="background: #f9f9f9; font-size: 16px;">
                        <td style="padding: 12px; font-weight: bold; color: #27ae60;">TOTAL OMSET (PENDAPATAN BERSIH)</td>
                        <td style="padding: 12px; text-align: right; font-weight: bold; color: #27ae60;">Rp ${totalRevenue.toLocaleString('id-ID')}</td>
                    </tr>
                </table>

                <div class="section-title">Kontribusi Omset Per Kategori</div>
                <table style="font-size: 12px;">
                    <thead>
                        <tr>
                            <th>Kategori Produk</th>
                            <th style="text-align: right;">Kontribusi Persentase</th>
                            <th style="text-align: right;">Nilai Penjualan</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${catRowsHTML || '<tr><td colspan="3" style="text-align:center; padding:10px;">Belum ada kontribusi kategori.</td></tr>'}
                    </tbody>
                </table>

                <div class="section-title">5 Produk Terlaris (Top Selling)</div>
                <table style="font-size: 12px;">
                    <thead>
                        <tr>
                            <th>Nama Barang</th>
                            <th style="text-align: center;">Kuantitas Terjual</th>
                            <th style="text-align: right;">Jumlah Nilai (Rp)</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${prodRowsHTML || '<tr><td colspan="3" style="text-align:center; padding:10px;">Belum ada data barang terjual.</td></tr>'}
                    </tbody>
                </table>

                ${signatureHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    return (
        <div className="dashboard-container" style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="pos-header" style={{ borderBottom: isSuper ? '1px solid #B8860B30' : '1px solid #3498db30' }}>
                <div className="header-left">
                    <button className="icon-btn" onClick={() => navigate('/dashboard')}>
                        <ChevronLeft size={24} color={isSuper ? '#8B6508' : '#2c3e50'} />
                    </button>
                    <h1 style={{ color: isSuper ? '#8B6508' : '#2c3e50' }}>Laporan & Statistik</h1>
                </div>
                <div className="header-right">
                    <button 
                        className="btn-export-closing" 
                        onClick={handleExportClosingReport}
                        title="Cetak Laporan Closing"
                        style={{ background: isSuper ? '#B8860B' : '#27ae60' }}
                    >
                        <Printer size={16} />
                        <span>Closing</span>
                    </button>
                </div>
            </div>

            <div style={{ padding: 20 }}>
                {/* Stats Summary Card */}
                <div 
                    className="sales-hero-card" 
                    style={{ 
                        background: isSuper ? 'linear-gradient(135deg, #8B6508, #B8860B)' : 'linear-gradient(135deg, #2ecc71, #27ae60)', 
                        boxShadow: isSuper ? '0 10px 20px rgba(184, 134, 11, 0.15)' : '0 10px 20px rgba(46,204,113,0.15)' 
                    }}
                >
                    <div className="sales-card-info">
                        <span className="sales-label">Total Omset Toko (Harian)</span>
                        <h2 className="sales-amount">Rp {totalRevenue.toLocaleString('id-ID')}</h2>
                        <p className="sales-description">{isSuper ? 'Hak Akses Super Admin Global' : 'Hak Akses Sesi Staff'}</p>
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
                        <span className="stat-lbl">Transaksi Sukses</span>
                    </div>
                    <div className="stat-pill" style={{ cursor: 'default' }}>
                        <span className="stat-val">Rp {sales.length > 0 ? Math.round(totalRevenue / sales.length).toLocaleString('id-ID') : '0'}</span>
                        <span className="stat-lbl">Rerata per Struk</span>
                    </div>
                </div>

                {/* DYNAMIC TOP PRODUCTS GRAPHICS */}
                <h3 className="section-heading" style={{ marginTop: 32 }}><BarChart3 size={16} style={{ marginRight: 6, display: 'inline' }} />Grafik Penjualan Barang Terlaris</h3>
                <div className="report-chart-box">
                    {topProducts.length === 0 ? (
                        <p style={{ fontSize: 12, color: '#95a5a6', fontStyle: 'italic', textAlign: 'center', margin: 0 }}>Belum ada data produk terjual.</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {topProducts.map((p, idx) => (
                                <div key={idx}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, fontWeight: 'bold' }}>
                                        <span style={{ color: '#2c3e50' }}>{p.name} <span style={{ fontWeight: 'normal', color: '#7f8c8d' }}>(${p.quantity} unit)</span></span>
                                        <span style={{ color: isSuper ? '#8B6508' : '#3498db' }}>{p.percentage}%</span>
                                    </div>
                                    <div style={{ height: 10, background: '#f1f2f6', borderRadius: 10, overflow: 'hidden' }}>
                                        <div 
                                            style={{ 
                                                height: '100%', 
                                                width: `${p.percentage}%`, 
                                                background: isSuper ? '#B8860B' : '#3498db',
                                                transition: 'width 0.8s ease'
                                            }} 
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* DYNAMIC CONTRIB BY CATEGORY PILLS */}
                <h3 className="section-heading" style={{ marginTop: 28 }}><FileText size={16} style={{ marginRight: 6, display: 'inline' }} />Kontribusi Omset Per Kategori</h3>
                <div className="report-chart-box" style={{ background: '#fbfcfc' }}>
                    {categoryStats.length === 0 ? (
                        <p style={{ fontSize: 12, color: '#95a5a6', fontStyle: 'italic', textAlign: 'center', margin: 0 }}>Belum ada transaksi kategori.</p>
                    ) : (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                            {categoryStats.map((c, idx) => (
                                <div 
                                    key={idx} 
                                    style={{ 
                                        flex: '1 1 40%', 
                                        background: 'white', 
                                        border: '1px solid #eef0f2', 
                                        borderRadius: 14, 
                                        padding: '10px 14px', 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        gap: 4 
                                    }}
                                >
                                    <span style={{ fontSize: 11, fontWeight: 'bold', color: '#7f8c8d' }}>{c.name}</span>
                                    <span style={{ fontSize: 14, fontWeight: '800', color: '#2c3e50' }}>Rp {c.value.toLocaleString('id-ID')}</span>
                                    <span style={{ fontSize: 10, color: '#2ecc71', fontWeight: 'bold' }}>{c.percentage}% Kontribusi</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* DYNAMIC SECURITY AUDIT USER LAUNCH LOGS */}
                <h3 className="section-heading" style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Activity size={16} color="#e74c3c" />
                    Log Keamanan & Audit Karyawan
                </h3>
                <div className="security-audit-box">
                    {logs.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 20 }}>
                            <ShieldCheck size={32} color="#bdc3c7" />
                            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#95a5a6' }}>Belum ada log audit aktivitas karyawan.</p>
                        </div>
                    ) : (
                        <div className="audit-logs-list">
                            {logs.map((log) => (
                                <div key={log.id} className="audit-log-item">
                                    <div className="audit-log-header">
                                        <span 
                                            className="action-badge" 
                                            style={getBadgeStyle(log.action)}
                                        >
                                            {log.action}
                                        </span>
                                        <span className="audit-time-stamp">
                                            {new Date(log.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} • {new Date(log.timestamp).toLocaleDateString('id-ID')}
                                        </span>
                                    </div>
                                    <p className="audit-log-details">{log.details}</p>
                                    <div className="audit-log-footer">
                                        <span>Operator: <strong>{log.user_name}</strong> ({log.user_role})</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
}
