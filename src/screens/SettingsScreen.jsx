import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Info, HelpCircle, Database, Store, MapPin, Phone, Edit2, ShieldAlert } from 'lucide-react';
import * as db from '../services/db';

export default function SettingsScreen() {
    const navigate = useNavigate();
    const [storeSettings, setStoreSettings] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const user = db.getCurrentUser();
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }
        setCurrentUser(user);
        
        const settings = db.getStoreSettings();
        setStoreSettings(settings);
    }, [navigate]);

    const handleResetDB = async () => {
        if (window.confirm("Apakah Anda yakin ingin MERESET seluruh database? Semua produk, kategori, dan transaksi akan dihapus.")) {
            await db.resetDatabase();
            alert("Database berhasil direset!");
            window.location.reload();
        }
    };

    if (!currentUser || !storeSettings) return null;

    const isSuper = currentUser.role === 'SUPER_ADMIN';

    // Theme color matching
    const headerBorderColor = isSuper ? '#B8860B30' : '#3498db30';
    const headerTitleColor = isSuper ? '#8B6508' : '#2c3e50';

    return (
        <div className="dashboard-container" style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="pos-header" style={{ borderBottom: `1px solid ${headerBorderColor}` }}>
                <div className="header-left">
                    <button className="icon-btn" onClick={() => navigate('/dashboard')}>
                        <ChevronLeft size={24} color={isSuper ? '#8B6508' : '#2c3e50'} />
                    </button>
                    <h1 style={{ color: headerTitleColor }}>Pengaturan</h1>
                </div>
            </div>

            <div style={{ padding: 20 }}>
                {/* Store Profile Section */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <h3 className="section-heading" style={{ margin: 0 }}>Profil Toko</h3>
                    {isSuper && (
                        <button 
                            onClick={() => navigate('/edit-store')}
                            style={{ 
                                background: '#B8860B', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: 10, 
                                padding: '6px 12px', 
                                fontSize: 12, 
                                fontWeight: 'bold', 
                                cursor: 'pointer', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 6,
                                boxShadow: '0 4px 8px rgba(184,134,11,0.15)'
                            }}
                        >
                            <Edit2 size={12} />
                            Edit Profil
                        </button>
                    )}
                </div>
                
                <div className="activity-list" style={{ border: isSuper ? '2px solid #B8860B15' : '2px solid #eef0f2', marginBottom: 24 }}>
                    <div className="activity-item-card" style={{ cursor: 'default' }}>
                        <div className="activity-left">
                            <div className="activity-icon-receipt" style={{ background: isSuper ? 'rgba(184, 134, 11, 0.1)' : 'rgba(52,152,219,0.1)' }}>
                                <Store size={16} color={isSuper ? '#B8860B' : '#3498db'} />
                            </div>
                            <div className="activity-info">
                                <span className="activity-trx">Nama Toko</span>
                                <span className="activity-time" style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: 13 }}>
                                    {storeSettings.store_name}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="activity-item-card" style={{ cursor: 'default' }}>
                        <div className="activity-left">
                            <div className="activity-icon-receipt" style={{ background: 'rgba(46,204,113,0.1)' }}><MapPin size={16} color="#2ecc71" /></div>
                            <div className="activity-info">
                                <span className="activity-trx">Alamat Toko</span>
                                <span className="activity-time" style={{ fontSize: 12 }}>
                                    {storeSettings.store_address || 'Belum diatur'}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="activity-item-card" style={{ cursor: 'default' }}>
                        <div className="activity-left">
                            <div className="activity-icon-receipt" style={{ background: 'rgba(230,126,34,0.1)' }}><Phone size={16} color="#e67e22" /></div>
                            <div className="activity-info">
                                <span className="activity-trx">No. Telepon</span>
                                <span className="activity-time" style={{ fontSize: 12 }}>
                                    {storeSettings.store_phone || 'Belum diatur'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Application Section */}
                <h3 className="section-heading">Informasi Aplikasi</h3>
                <div className="activity-list" style={{ border: '2px solid #eef0f2', marginBottom: 24 }}>
                    <div className="activity-item-card" style={{ cursor: 'default' }}>
                        <div className="activity-left">
                            <div className="activity-icon-receipt" style={{ background: 'rgba(155,89,182,0.1)' }}><Info size={16} color="#9b59b6" /></div>
                            <div className="activity-info">
                                <span className="activity-trx">Versi Aplikasi</span>
                                <span className="activity-time">v1.3.0 (Vite-Capacitor Hybrid)</span>
                            </div>
                        </div>
                    </div>

                    <div className="activity-item-card" style={{ cursor: 'default' }}>
                        <div className="activity-left">
                            <div className="activity-icon-receipt" style={{ background: 'rgba(52,73,94,0.1)' }}><HelpCircle size={16} color="#34495e" /></div>
                            <div className="activity-info">
                                <span className="activity-trx">Hak Akses Anda</span>
                                <span className="activity-time" style={{ fontWeight: 'bold', color: isSuper ? '#B8860B' : '#3498db' }}>
                                    {isSuper ? '👑 SUPER ADMIN (Full Owner)' : '👤 STAFF KASIR (Transaksi Only)'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Risk Area for Super Admin */}
                {isSuper ? (
                    <>
                        <h3 className="section-heading" style={{ color: '#e74c3c' }}>Area Risiko Tinggi</h3>
                        <div style={{ background: '#fdf2f2', border: '2px solid #fde8e8', borderRadius: 20, padding: 20 }}>
                            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#c0392b', lineHeight: 1.5 }}>
                                Pembersihan data akan menghapus seluruh data barang inventaris, riwayat transaksi kasir, daftar karyawan tambahan, dan pengaturan profil toko dari penyimpanan lokal secara permanen.
                            </p>
                            <button 
                                onClick={handleResetDB} 
                                style={{ 
                                    background: '#e74c3c', 
                                    color: 'white', 
                                    border: 'none', 
                                    borderRadius: 12, 
                                    padding: '12px 20px', 
                                    fontWeight: 'bold', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    gap: 8,
                                    boxShadow: '0 4px 10px rgba(231,76,60,0.2)'
                                }}
                            >
                                <Database size={16} />
                                Reset Semua Database
                            </button>
                        </div>
                    </>
                ) : (
                    <div style={{ display: 'flex', gap: 10, padding: 16, background: '#f8f9fa', borderRadius: 16, border: '2px dashed #ddd', alignItems: 'center' }}>
                        <ShieldAlert size={20} color="#7f8c8d" />
                        <span style={{ fontSize: 12, color: '#7f8c8d', lineHeight: 1.4 }}>
                            Pengaturan tingkat lanjut (Edit Toko, Kelola Staff, Reset DB) hanya dapat diakses oleh Super Admin.
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
