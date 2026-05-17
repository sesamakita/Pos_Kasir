import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Store, Camera, Trash2, Check } from 'lucide-react';
import * as db from '../services/db';

const COLOR_OPTIONS = [
    { label: 'Green', value: '#4CAF7D' },
    { label: 'Blue', value: '#2196F3' },
    { label: 'Purple', value: '#7C3AED' },
    { label: 'Orange', value: '#F97316' },
    { label: 'Red', value: '#EF4444' },
    { label: 'Teal', value: '#14B8A6' },
    { label: 'Dark', value: '#1E293B' },
    { label: 'Gold', value: '#B8860B' },
];

export default function EditStoreScreen() {
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [storeName, setStoreName] = useState('');
    const [storeAddress, setStoreAddress] = useState('');
    const [storePhone, setStorePhone] = useState('');
    const [storeLogo, setStoreLogo] = useState(null);
    const [splashColor, setSplashColor] = useState('#B8860B');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const user = db.getCurrentUser();
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }
        if (user.role !== 'SUPER_ADMIN') {
            alert("Akses Ditolak! Hanya Super Admin yang dapat mengubah profil toko.");
            navigate('/dashboard', { replace: true });
            return;
        }

        const settings = db.getStoreSettings();
        setStoreName(settings.store_name || '');
        setStoreAddress(settings.store_address || '');
        setStorePhone(settings.store_phone || '');
        setStoreLogo(settings.store_logo || null);
        setSplashColor(settings.splash_color || '#B8860B');
    }, [navigate]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert("Ukuran berkas logo terlalu besar! Maksimal adalah 2MB.");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setStoreLogo(reader.result); // Base64 data url
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!storeName.trim()) {
            return alert("Nama toko tidak boleh kosong.");
        }

        setIsLoading(true);

        setTimeout(() => {
            try {
                db.updateStoreSettings({
                    store_name: storeName.trim(),
                    store_address: storeAddress.trim(),
                    store_phone: storePhone.trim(),
                    store_logo: storeLogo,
                    splash_color: splashColor
                });
                setIsLoading(false);
                alert("Pengaturan profil toko berhasil disimpan!");
                navigate('/settings');
            } catch (error) {
                setIsLoading(false);
                alert("Gagal menyimpan profil toko.");
            }
        }, 800);
    };

    return (
        <div className="dashboard-container" style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="pos-header" style={{ borderBottom: '1px solid #B8860B30' }}>
                <div className="header-left">
                    <button className="icon-btn" onClick={() => navigate('/settings')}>
                        <ChevronLeft size={24} color="#8B6508" />
                    </button>
                    <h1 style={{ color: '#8B6508' }}>Edit Toko</h1>
                </div>
            </div>

            <div style={{ padding: 20 }}>
                {/* Logo Section */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '20px 0' }}>
                    <div 
                        style={{ 
                            width: 110, 
                            height: 110, 
                            borderRadius: '50%', 
                            backgroundColor: splashColor, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            overflow: 'hidden',
                            boxShadow: '0 8px 16px rgba(0,0,0,0.1)',
                            border: '3px solid white',
                            position: 'relative'
                        }}
                    >
                        {storeLogo ? (
                            <img src={storeLogo} alt="Logo Toko" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <Store size={44} color="white" />
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            accept="image/*" 
                            style={{ display: 'none' }} 
                        />
                        <button 
                            onClick={() => fileInputRef.current.click()}
                            style={{ 
                                background: 'rgba(184,134,11,0.1)', 
                                border: 'none', 
                                padding: '8px 16px', 
                                borderRadius: 10, 
                                color: '#8B6508', 
                                fontWeight: 'bold', 
                                fontSize: 13, 
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6
                            }}
                        >
                            <Camera size={14} />
                            Ganti Logo
                        </button>
                        {storeLogo && (
                            <button 
                                onClick={() => setStoreLogo(null)}
                                style={{ 
                                    background: 'rgba(231,76,60,0.1)', 
                                    border: 'none', 
                                    padding: '8px 16px', 
                                    borderRadius: 10, 
                                    color: '#e74c3c', 
                                    fontWeight: 'bold', 
                                    fontSize: 13, 
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6
                                }}
                            >
                                <Trash2 size={14} />
                                Hapus
                            </button>
                        )}
                    </div>
                    <span style={{ fontSize: 11, color: '#95a5a6', marginTop: 8, fontStyle: 'italic' }}>
                        *Logo ini akan otomatis tampil di Splash Screen & Struk Belanja.
                    </span>
                </div>

                {/* Form Info Toko */}
                <form onSubmit={handleSave} className="login-card" style={{ border: '2px solid #B8860B30', margin: '0 auto 24px', maxWidth: 500, padding: 24, borderRadius: 24, background: 'white' }}>
                    <h3 className="form-title" style={{ color: '#8B6508', fontSize: 14, fontWeight: 'bold', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Informasi Toko
                    </h3>
                    
                    <div className="input-group">
                        <label style={{ fontWeight: 'bold', color: '#555' }}>Nama Toko</label>
                        <input 
                            type="text" 
                            value={storeName} 
                            onChange={e => setStoreName(e.target.value)} 
                            placeholder="Contoh: Kedai Kopi Sesama" 
                            style={{ border: '2px solid #eef0f2', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ fontWeight: 'bold', color: '#555' }}>Alamat Lengkap Toko</label>
                        <textarea 
                            value={storeAddress} 
                            onChange={e => setStoreAddress(e.target.value)} 
                            placeholder="Masukkan alamat fisik toko Anda..." 
                            rows={3}
                            style={{ 
                                border: '2px solid #eef0f2', 
                                borderRadius: 14, 
                                padding: 14, 
                                width: '100%', 
                                boxSizing: 'border-box',
                                fontFamily: 'Montserrat, sans-serif',
                                fontSize: 13,
                                resize: 'none'
                            }}
                        />
                    </div>

                    <div className="input-group">
                        <label style={{ fontWeight: 'bold', color: '#555' }}>Nomor Telepon Toko</label>
                        <input 
                            type="text" 
                            value={storePhone} 
                            onChange={e => setStorePhone(e.target.value)} 
                            placeholder="Contoh: 08123456789" 
                            style={{ border: '2px solid #eef0f2', width: '100%', boxSizing: 'border-box' }}
                        />
                    </div>

                    {/* Splash Color Grid */}
                    <h3 className="form-title" style={{ color: '#8B6508', fontSize: 14, fontWeight: 'bold', margin: '24px 0 12px', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                        Tema & Warna Splash
                    </h3>
                    
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
                        {COLOR_OPTIONS.map((opt) => {
                            const isActive = splashColor === opt.value;
                            return (
                                <button 
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setSplashColor(opt.value)}
                                    style={{ 
                                        width: 44, 
                                        height: 44, 
                                        borderRadius: '50%', 
                                        backgroundColor: opt.value, 
                                        border: isActive ? '3px solid #1a252f' : '2px solid white',
                                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'transform 0.15s ease'
                                    }}
                                    className="color-btn"
                                >
                                    {isActive && <Check size={18} color="white" />}
                                </button>
                            );
                        })}
                    </div>

                    {/* Splash Live Preview */}
                    <div 
                        style={{ 
                            height: 140, 
                            borderRadius: 20, 
                            backgroundColor: splashColor, 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            color: 'white',
                            boxShadow: 'inset 0 0 40px rgba(0,0,0,0.1)',
                            marginBottom: 24,
                            transition: 'background-color 0.3s ease'
                        }}
                    >
                        {storeLogo ? (
                            <img 
                                src={storeLogo} 
                                alt="Logo Preview" 
                                style={{ width: 44, height: 44, borderRadius: '50%', marginBottom: 8, border: '2px solid white', objectFit: 'cover' }} 
                            />
                        ) : (
                            <Store size={32} color="white" style={{ marginBottom: 8 }} />
                        )}
                        <h4 style={{ margin: 0, fontWeight: 'bold', fontSize: 15, textShadow: '0 1px 3px rgba(0,0,0,0.3)' }}>
                            {storeName || 'Nama Toko Anda'}
                        </h4>
                        <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)', marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' }}>
                            Live Splash Preview
                        </span>
                    </div>

                    <button 
                        type="submit" 
                        className="login-btn" 
                        disabled={isLoading}
                        style={{ 
                            background: '#B8860B', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: 14, 
                            padding: '14px 20px', 
                            fontWeight: 'bold', 
                            cursor: 'pointer',
                            boxShadow: '0 4px 10px rgba(184, 134, 11, 0.2)'
                        }}
                    >
                        {isLoading ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </button>
                </form>
            </div>
        </div>
    );
}
