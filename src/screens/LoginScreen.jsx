import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as db from '../services/db';
import './LoginScreen.css';

export default function LoginScreen() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Jika sudah login sebelumnya, langsung arahkan ke dashboard
        const current = db.getCurrentUser();
        if (current) {
            navigate('/dashboard', { replace: true });
        }
    }, [navigate]);

    const handleLogin = () => {
        if (!username.trim() || !password.trim()) {
            return alert('Username & Password wajib diisi!');
        }
        
        setIsLoading(true);
        
        // Menambahkan sedikit waktu jeda realistis
        setTimeout(() => {
            const user = db.loginUser(username, password);
            setIsLoading(false);
            if (user) {
                navigate('/dashboard', { replace: true });
            } else {
                alert('Username atau Password/PIN salah!');
            }
        }, 800);
    };

    return (
        <div className="login-container">
            <div className="decor-circle circle-1"></div>
            <div className="decor-circle circle-2"></div>
            
            <div className="login-content">
                <div className="login-header">
                    <div className="logo-circle">V</div>
                    <h2>POS Kasir Hybrid</h2>
                    <p>Masukkan akun Super Admin atau Staff Kasir</p>
                </div>
                
                <div className="login-card" style={{ border: '2px solid #eef0f2' }}>
                    <div className="input-group">
                        <label>Username</label>
                        <input 
                            type="text" 
                            value={username} 
                            onChange={e => setUsername(e.target.value)} 
                            placeholder="admin atau kasir" 
                            autoCapitalize="none"
                        />
                    </div>
                    <div className="input-group">
                        <label>PIN / Password</label>
                        <input 
                            type="password" 
                            value={password} 
                            onChange={e => setPassword(e.target.value)} 
                            placeholder="admin123 atau kasir123" 
                        />
                    </div>
                    <button className="login-btn" onClick={handleLogin} disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                    
                    <div className="footer-text" style={{ fontSize: 11, color: '#7f8c8d', textAlign: 'center', marginTop: 15, lineHeight: 1.4 }}>
                        💡 <b>Akun Default Demo:</b><br />
                        Super Admin: <b>admin</b> / PIN: <b>admin123</b><br />
                        Staff Kasir: <b>kasir</b> / PIN: <b>kasir123</b>
                    </div>
                </div>
            </div>
        </div>
    );
}
