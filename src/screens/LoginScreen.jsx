import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginScreen.css';

export default function LoginScreen() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = () => {
        if (!username || !password) return alert('Username & Password wajib diisi!');
        
        setIsLoading(true);
        // Simulasi login sukses
        setTimeout(() => {
            navigate('/dashboard', { replace: true });
        }, 1000);
    };

    return (
        <div className="login-container">
            <div className="decor-circle circle-1"></div>
            <div className="decor-circle circle-2"></div>
            
            <div className="login-content">
                <div className="login-header">
                    <div className="logo-circle">V</div>
                    <h2>Welcome back</h2>
                    <p>Sign in to your account</p>
                </div>
                
                <div className="login-card">
                    <div className="input-group">
                        <label>Username or Email</label>
                        <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="name@gmail.com" />
                    </div>
                    <div className="input-group">
                        <label>Password</label>
                        <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Masukkan password" />
                    </div>
                    <button className="login-btn" onClick={handleLogin} disabled={isLoading}>
                        {isLoading ? 'Signing in...' : 'Sign in'}
                    </button>
                    
                    <p className="footer-text">
                        No account yet? <b>Sign up</b>
                    </p>
                </div>
            </div>
        </div>
    );
}
