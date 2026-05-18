import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Receipt, Calendar, AlertCircle, Search, X, Printer, Trash2, ShieldAlert, CheckCircle, Clock, User } from 'lucide-react';
import * as db from '../services/db';
import './HistoryScreen.css';

export default function HistoryScreen() {
    const navigate = useNavigate();
    const [sales, setSales] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);
    const [selectedSale, setSelectedSale] = useState(null);
    
    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [dateFilter, setDateFilter] = useState('all'); // all, today, yesterday, 7days

    useEffect(() => {
        const user = db.getCurrentUser();
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }
        setCurrentUser(user);
        loadHistory();
    }, [navigate]);

    const loadHistory = async () => {
        const historyData = await db.getSales();
        setSales(historyData);
    };

    const isSuper = currentUser?.role === 'SUPER_ADMIN';

    // --- TRANSACTION VOID MANAGER ---
    const handleVoidSale = async (saleId) => {
        if (!isSuper) {
            alert("Akses Ditolak: Hanya Super Admin yang dapat membatalkan transaksi.");
            return;
        }

        const confirmVoid = window.confirm(
            `⚠️ PERINGATAN KONTROL KEAMANAN!\n\nApakah Anda yakin ingin membatalkan (VOID) Transaksi ${saleId}?\nTindakan ini akan mengembalikan seluruh stok barang dan menghapus transaksi dari riwayat selamanya.`
        );

        if (confirmVoid) {
            try {
                await db.voidSale(saleId);
                alert("Transaksi berhasil dibatalkan dan stok dikembalikan!");
                setSelectedSale(null);
                loadHistory(); // Refresh history list
            } catch (error) {
                console.error("Void failed:", error);
                alert("Gagal melakukan void transaksi.");
            }
        }
    };

    // --- PRINT RECEIPT HELPER ---
    const handlePrintReceipt = (sale) => {
        const printWindow = window.open('', '_blank', 'width=300,height=600');
        if (!printWindow) {
            alert("Harap izinkan popup browser untuk mencetak struk.");
            return;
        }

        const store = db.getStoreSettings();
        const itemsHTML = sale.items.map(item => `
            <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:4px;">
                <span>${item.name} x${item.quantity}</span>
                <span>Rp ${(item.price * item.quantity).toLocaleString('id-ID')}</span>
            </div>
        `).join('');

        const signatureHTML = sale.signature ? `
            <div style="text-align:center; margin-top:20px; border-top: 1px dashed #ccc; padding-top:10px;">
                <p style="font-size:10px; margin:0 0 5px;">Tanda Tangan Kasir:</p>
                <img src="${sale.signature}" style="width:100px; height:50px; object-fit:contain;" />
                <p style="font-size:10px; margin:5px 0 0; font-weight:bold;">${sale.waiter_name}</p>
            </div>
        ` : `
            <div style="text-align:center; margin-top:15px; font-size:10px; color:#555;">
                Kasir: ${sale.waiter_name}
            </div>
        `;

        printWindow.document.write(`
            <html>
            <head>
                <title>Cetak Struk ${sale.id}</title>
                <style>
                    body {
                        font-family: 'Courier New', Courier, monospace;
                        padding: 10px;
                        color: #000;
                        width: 280px;
                    }
                    .text-center { text-align: center; }
                    .header-title { font-size: 16px; font-weight: bold; margin: 0 0 5px; }
                    .header-sub { font-size: 10px; margin: 0 0 10px; }
                    .divider { border-top: 1px dashed #000; margin: 10px 0; }
                    .total-row { display:flex; justify-content:space-between; font-weight:bold; font-size:13px; margin-top:8px; }
                </style>
            </head>
            <body onload="window.print(); window.close();">
                <div class="text-center">
                    <p class="header-title">${store.store_name}</p>
                    <p class="header-sub">${store.store_address}<br>Telp: ${store.store_phone}</p>
                </div>
                <div class="divider"></div>
                <div style="font-size:10px; margin-bottom:8px;">
                    <div>No: ${sale.id}</div>
                    <div>Tgl: ${new Date(sale.date).toLocaleString('id-ID')}</div>
                </div>
                <div class="divider"></div>
                ${itemsHTML}
                <div class="divider"></div>
                <div class="total-row">
                    <span>TOTAL</span>
                    <span>Rp ${sale.total.toLocaleString('id-ID')}</span>
                </div>
                <div style="display:flex; justify-content:space-between; font-size:11px; margin-top:4px;">
                    <span>Metode Bayar</span>
                    <span style="text-transform:uppercase;">TUNAI</span>
                </div>
                ${signatureHTML}
                <div class="divider"></div>
                <p class="text-center" style="font-size:9px; margin-top:15px;">Terima Kasih Atas Kunjungan Anda</p>
            </body>
            </html>
        `);
        printWindow.document.close();
    };

    // --- FILTERED SALES COMPUTATION ---
    const filteredSales = useMemo(() => {
        let result = [...sales];

        // 1. Search Query Filter (ID or Cashier)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(sale => 
                sale.id.toLowerCase().includes(q) || 
                (sale.waiter_name && sale.waiter_name.toLowerCase().includes(q))
            );
        }

        // 2. Date Range Filter
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000);
        const startOf7DaysAgo = new Date(startOfToday.getTime() - 7 * 24 * 60 * 60 * 1000);

        if (dateFilter === 'today') {
            result = result.filter(sale => new Date(sale.date) >= startOfToday);
        } else if (dateFilter === 'yesterday') {
            result = result.filter(sale => {
                const d = new Date(sale.date);
                return d >= startOfYesterday && d < startOfToday;
            });
        } else if (dateFilter === '7days') {
            result = result.filter(sale => new Date(sale.date) >= startOf7DaysAgo);
        }

        return result;
    }, [sales, searchQuery, dateFilter]);

    return (
        <div className="dashboard-container" style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="pos-header" style={{ borderBottom: isSuper ? '1px solid #B8860B30' : '1px solid #3498db30' }}>
                <div className="header-left">
                    <button className="icon-btn" onClick={() => navigate('/dashboard')}>
                        <ChevronLeft size={24} color={isSuper ? '#8B6508' : '#2c3e50'} />
                    </button>
                    <h1 style={{ color: isSuper ? '#8B6508' : '#2c3e50' }}>Riwayat Transaksi</h1>
                </div>
            </div>

            <div style={{ padding: '16px 20px' }}>
                {/* Search Bar */}
                <div className="search-filter-row">
                    <div className="history-search-box">
                        <Search size={18} color="#95a5a6" />
                        <input 
                            type="text" 
                            placeholder="Cari ID Struk / Kasir..." 
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="clear-search-btn">
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Chips */}
                <div className="filter-chips-row">
                    <button 
                        className={`filter-chip ${dateFilter === 'all' ? 'active-chip' : ''}`}
                        onClick={() => setDateFilter('all')}
                    >
                        Semua
                    </button>
                    <button 
                        className={`filter-chip ${dateFilter === 'today' ? 'active-chip' : ''}`}
                        onClick={() => setDateFilter('today')}
                    >
                        Hari Ini
                    </button>
                    <button 
                        className={`filter-chip ${dateFilter === 'yesterday' ? 'active-chip' : ''}`}
                        onClick={() => setDateFilter('yesterday')}
                    >
                        Kemarin
                    </button>
                    <button 
                        className={`filter-chip ${dateFilter === '7days' ? 'active-chip' : ''}`}
                        onClick={() => setDateFilter('7days')}
                    >
                        7 Hari Terakhir
                    </button>
                </div>

                <div style={{ marginTop: 20 }}>
                    {filteredSales.length === 0 ? (
                        <div className="empty-catalog" style={{ background: 'white', borderRadius: 20, padding: 40, border: '2px solid #eef0f2' }}>
                            <AlertCircle size={40} color="#bdc3c7" />
                            <p style={{ marginTop: 12, fontWeight: 'bold', color: '#7f8c8d' }}>Tidak ada transaksi yang cocok.</p>
                            <span style={{ fontSize: 11, color: '#bdc3c7' }}>Coba ubah filter pencarian atau tanggal.</span>
                        </div>
                    ) : (
                        <div className="activity-list" style={{ border: '2px solid #eef0f2' }}>
                            {filteredSales.map((sale) => (
                                <div 
                                    key={sale.id} 
                                    className="activity-item-card clickable-history-card" 
                                    onClick={() => setSelectedSale(sale)}
                                    style={{ borderLeft: isSuper ? '4px solid #B8860B' : '4px solid #3498db' }}
                                >
                                    <div className="activity-left">
                                        <div className="activity-icon-receipt" style={{ background: isSuper ? 'rgba(184, 134, 11, 0.1)' : 'rgba(52, 152, 219, 0.1)' }}>
                                            <Receipt size={16} color={isSuper ? '#B8860B' : '#3498db'} />
                                        </div>
                                        <div className="activity-info">
                                            <span className="activity-trx">{sale.id}</span>
                                            <span className="activity-time" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                                <Clock size={10} color="#95a5a6" />
                                                {new Date(sale.date).toLocaleDateString('id-ID')} {new Date(sale.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <span className="waiter-name-tag">
                                                <User size={9} />
                                                {sale.waiter_name}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="activity-right">
                                        <span className="activity-price" style={{ color: isSuper ? '#8B6508' : '#2ecc71', fontWeight: 'bold' }}>
                                            Rp {sale.total.toLocaleString('id-ID')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* DETAILS RECEIPT DIALOG MODAL (COMPLETELY RENDERS LIKE THERMAL RECEIPT!) */}
            {selectedSale && (
                <div className="modal-overlay">
                    <div className="modal-content thermal-receipt-modal animate-slide-up">
                        <div className="thermal-receipt-paper">
                            {/* Tear Effect line */}
                            <div className="tear-edge"></div>
                            
                            <div className="receipt-header">
                                <h2 className="receipt-store-title">{db.getStoreSettings().store_name}</h2>
                                <p className="receipt-store-subtitle">{db.getStoreSettings().store_address}</p>
                                <span className="receipt-store-phone">Telp: {db.getStoreSettings().store_phone}</span>
                            </div>

                            <div className="receipt-divider"></div>

                            <div className="receipt-info-meta">
                                <div><strong>NO. TRX:</strong> {selectedSale.id}</div>
                                <div><strong>TANGGAL:</strong> {new Date(selectedSale.date).toLocaleString('id-ID')}</div>
                                <div><strong>KASIR :</strong> {selectedSale.waiter_name}</div>
                            </div>

                            <div className="receipt-divider"></div>

                            {/* Products purchased list */}
                            <div className="receipt-items-list">
                                {selectedSale.items.map((item, idx) => (
                                    <div key={idx} className="receipt-item-row">
                                        <div className="receipt-item-desc">
                                            <span className="item-name-receipt">{item.name}</span>
                                            <span className="item-qty-price-receipt">{item.quantity} x Rp {item.price.toLocaleString('id-ID')}</span>
                                        </div>
                                        <span className="receipt-item-subtotal">Rp {(item.price * item.quantity).toLocaleString('id-ID')}</span>
                                    </div>
                                ))}
                            </div>

                            <div className="receipt-divider"></div>

                            <div className="receipt-totals">
                                <div className="total-main-row">
                                    <span>TOTAL AKHIR</span>
                                    <span>Rp {selectedSale.total.toLocaleString('id-ID')}</span>
                                </div>
                                <div className="payment-method-row">
                                    <span>METODE BAYAR</span>
                                    <span>TUNAI</span>
                                </div>
                            </div>

                            {/* CASHIER DIGITAL SIGNATURE PREVIEW */}
                            {selectedSale.signature ? (
                                <div className="receipt-signature-section">
                                    <span className="sig-label">Tanda Tangan Kasir:</span>
                                    <img src={selectedSale.signature} alt="Tanda Tangan Kasir" className="receipt-sig-img" />
                                    <span className="sig-waiter">{selectedSale.waiter_name}</span>
                                </div>
                            ) : (
                                <div className="receipt-signature-missing">
                                    <span className="sig-label">Kasir Sesi:</span>
                                    <span className="sig-waiter-nosig">{selectedSale.waiter_name}</span>
                                </div>
                            )}

                            <div className="receipt-footer">
                                <p>*** Terima Kasih ***</p>
                                <p>Silakan Simpan Struk Ini Sebagai Bukti Pembayaran Resmi</p>
                            </div>
                        </div>

                        {/* Modal Action Controls */}
                        <div className="receipt-modal-actions">
                            <button 
                                className="action-btn btn-print-receipt"
                                onClick={() => handlePrintReceipt(selectedSale)}
                            >
                                <Printer size={16} />
                                Cetak Thermal
                            </button>

                            {isSuper && (
                                <button 
                                    className="action-btn btn-void-receipt"
                                    onClick={() => handleVoidSale(selectedSale.id)}
                                >
                                    <Trash2 size={16} />
                                    Void Transaksi
                                </button>
                            )}

                            <button 
                                className="action-btn btn-close-receipt"
                                onClick={() => setSelectedSale(null)}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
