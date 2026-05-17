import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UserPlus, Lock, User, AtSign, ShieldAlert } from 'lucide-react';
import * as db from '../services/db';

export default function RegisterScreen() {
    const navigate = useNavigate();
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const user = db.getCurrentUser();
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }
        if (user.role !== 'SUPER_ADMIN') {
            alert("Akses Ditolak! Hanya Super Admin yang dapat menambahkan staff kasir baru.");
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    const handleRegister = (e) => {
        e.preventDefault();
        
        if (!fullName.trim() || !username.trim() || !password.trim()) {
            return alert("Semua kolom form wajib diisi!");
        }

        if (password !== confirmPassword) {
            return alert("Konfirmasi PIN/Password tidak cocok!");
        }

        setIsLoading(true);

        setTimeout(() => {
            try {
                db.registerUser({
                    username: username.trim(),
                    password: password,
                    fullName: fullName.trim(),
                    role: 'ADMIN' // Default role kasir staff
                });
                
                alert(`Akun staff "${fullName}" berhasil dibuat!`);
                setIsLoading(false);
                navigate('/users');
            } catch (error) {
                setIsLoading(false);
                alert(error.message || "Gagal membuat akun staff.");
            }
        }, 800);
    };

    return (
        <div className="dashboard-container" style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="pos-header" style={{ borderBottom: '1px solid #B8860B30' }}>
                <div className="header-left">
                    <button className="icon-btn" onClick={() => navigate('/users')}>
                        <ChevronLeft size={24} color="#8B6508" />
                    </button>
                    <h1 style={{ color: '#8B6508' }}>Tambah Staff</h1>
                </div>
            </div>

            <div style={{ padding: 20 }}>
                <div style={{ textAlign: 'center', margin: '20px 0 30px' }}>
                    <div style={{ 
                        width: 72, 
                        height: 72, 
                        borderRadius: '50%', 
                        background: '#FFF8DC', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        margin: '0 auto 16px',
                        border: '2px solid #B8860B30',
                        boxShadow: '0 4px 10px rgba(184, 134, 11, 0.1)'
                    }}>
                        <UserPlus size={32} color="#B8860B" />
                    </div>
                    <h2 style={{ fontSize: 20, fontWeight: 'bold', color: '#1a252f', margin: '0 0 8px' }}>Daftarkan Kasir Baru</h2>
                    <p style={{ fontSize: 13, color: '#7f8c8d', margin: 0, padding: '0 20px', lineHeight: 1.5 }}>
                        Buat akun dengan hak akses kasir terbatas untuk staff Anda.
                    </p>
                </div>

                <form onSubmit={handleRegister} className="login-card" style={{ border: '2px solid #B8860B30', margin: '0 auto', maxWidth: 450, padding: 24, borderRadius: 24, background: 'white' }}>
                    <div className="input-group">
                        <label style={{ color: '#8B6508', fontWeight: 'bold' }}>Nama Lengkap Staff</label>
                        <div style={{ position: 'relative' }}>
                            <User size={16} color="#B8860B" style={{ position: 'absolute', left: 14, top: 15 }} />
                            <input 
                                type="text" 
                                value={fullName} 
                                onChange={e => setFullName(e.target.value)} 
                                placeholder="Masukkan nama lengkap"
                                style={{ paddingLeft: 40, border: '2px solid #eef0f2', width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label style={{ color: '#8B6508', fontWeight: 'bold' }}>Username Login</label>
                        <div style={{ position: 'relative' }}>
                            <AtSign size={16} color="#B8860B" style={{ position: 'absolute', left: 14, top: 15 }} />
                            <input 
                                type="text" 
                                value={username} 
                                onChange={e => setUsername(e.target.value)} 
                                placeholder="Pilih username unik"
                                autoCapitalize="none"
                                style={{ paddingLeft: 40, border: '2px solid #eef0f2', width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label style={{ color: '#8B6508', fontWeight: 'bold' }}>PIN / Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} color="#B8860B" style={{ position: 'absolute', left: 14, top: 15 }} />
                            <input 
                                type="password" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                placeholder="Buat PIN login yang aman"
                                style={{ paddingLeft: 40, border: '2px solid #eef0f2', width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
                    </div>

                    <div className="input-group">
                        <label style={{ color: '#8B6508', fontWeight: 'bold' }}>Ulangi PIN / Password</label>
                        <div style={{ position: 'relative' }}>
                            <Lock size={16} color="#B8860B" style={{ position: 'absolute', left: 14, top: 15 }} />
                            <input 
                                type="password" 
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)} 
                                placeholder="Ketik ulang PIN"
                                style={{ paddingLeft: 40, border: '2px solid #eef0f2', width: '100%', boxSizing: 'border-box' }}
                            />
                        </div>
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
                            marginTop: 10,
                            boxShadow: '0 4px 10px rgba(184, 134, 11, 0.2)'
                        }}
                    >
                        {isLoading ? 'Mendaftarkan Akun...' : 'Daftarkan Staff Kasir'}
                    </button>
                </form>

                <div 
                    style={{ 
                        margin: '30px auto 0', 
                        maxWidth: 450, 
                        display: 'flex', 
                        gap: 10, 
                        padding: 16, 
                        background: '#FFF8DC50', 
                        border: '2px dashed #B8860B20', 
                        borderRadius: 16,
                        alignItems: 'flex-start'
                    }}
                >
                    <ShieldAlert size={18} color="#B8860B" style={{ flexShrink: 0, marginTop: 2 }} />
                    <p style={{ margin: 0, fontSize: 12, color: '#8B6508', lineHeight: 1.5 }}>
                        Akun kasir baru akan otomatis memiliki hak akses terbatas yang disesuaikan untuk kelancaran transaksi pos harian Anda.
                    </p>
                </div>
            </div>
        </div>
    );
}
