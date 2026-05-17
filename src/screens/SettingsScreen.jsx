import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, HelpCircle, Database, Store } from 'lucide-react';
import * as db from '../services/db';

export default function SettingsScreen() {
    const navigate = useNavigate();

    const handleResetDB = async () => {
        if (window.confirm("Apakah Anda yakin ingin MERESET seluruh database? Semua produk, kategori, dan transaksi akan dihapus.")) {
            await db.resetDatabase();
            alert("Database berhasil direset!");
            window.location.reload();
        }
    };

    return (
        <div className="dashboard-container" style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="pos-header">
                <div className="header-left">
                    <button className="icon-btn" onClick={() => navigate('/dashboard')}>
                        <ChevronLeft size={24} color="#2c3e50" />
                    </button>
                    <h1>Pengaturan</h1>
                </div>
            </div>

            <div style={{ padding: 20 }}>
                <h3 className="section-heading">Toko & Aplikasi</h3>
                
                <div className="activity-list" style={{ border: '2px solid #eef0f2', marginBottom: 24 }}>
                    <div className="activity-item-card" style={{ cursor: 'default' }}>
                        <div className="activity-left">
                            <div className="activity-icon-receipt" style={{ background: 'rgba(52,152,219,0.1)' }}><Store size={16} color="#3498db" /></div>
                            <div className="activity-info">
                                <span className="activity-trx">Nama Toko</span>
                                <span className="activity-time">Warung Sesama Kita</span>
                            </div>
                        </div>
                    </div>

                    <div className="activity-item-card" style={{ cursor: 'default' }}>
                        <div className="activity-left">
                            <div className="activity-icon-receipt" style={{ background: 'rgba(155,89,182,0.1)' }}><Info size={16} color="#9b59b6" /></div>
                            <div className="activity-info">
                                <span className="activity-trx">Versi Aplikasi</span>
                                <span className="activity-time">v1.2.0 (React-Vite-Hybrid)</span>
                            </div>
                        </div>
                    </div>

                    <div className="activity-item-card" style={{ cursor: 'default' }}>
                        <div className="activity-left">
                            <div className="activity-icon-receipt" style={{ background: 'rgba(230,126,34,0.1)' }}><HelpCircle size={16} color="#e67e22" /></div>
                            <div className="activity-info">
                                <span className="activity-trx">Bantuan & Panduan</span>
                                <span className="activity-time">Hubungi tim administrator</span>
                            </div>
                        </div>
                    </div>
                </div>

                <h3 className="section-heading" style={{ color: '#e74c3c' }}>Area Risiko Tinggi</h3>
                <div style={{ background: '#fdf2f2', border: '2px solid #fde8e8', borderRadius: 20, padding: 20 }}>
                    <p style={{ margin: '0 0 16px', fontSize: 13, color: '#c0392b', lineHeight: 1.5 }}>
                        Pembersihan data akan menghapus seluruh data barang inventaris, riwayat transaksi kasir, dan kategori dari penyimpanan lokal HP Anda secara permanen.
                    </p>
                    <button 
                        onClick={handleResetDB} 
                        style={{ background: '#e74c3c', color: 'white', border: 'none', borderRadius: 12, padding: '12px 20px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                    >
                        <Database size={16} />
                        Reset Semua Database
                    </button>
                </div>
            </div>
        </div>
    );
}
