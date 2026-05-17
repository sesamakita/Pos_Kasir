import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Store } from 'lucide-react';
import * as db from '../services/db';
import './SplashScreen.css';

export default function SplashScreen() {
    const navigate = useNavigate();
    const [storeSettings, setStoreSettings] = useState(null);

    useEffect(() => {
        // Load dynamic store settings (white-labeled branding)
        const settings = db.getStoreSettings();
        setStoreSettings(settings);

        // Simulasi loading 3 detik, persis seperti aslinya
        const timer = setTimeout(() => {
            navigate('/login', { replace: true });
        }, 3000);
        return () => clearTimeout(timer);
    }, [navigate]);

    if (!storeSettings) return null;

    const bgColor = storeSettings.splash_color || '#B8860B';
    const storeName = storeSettings.store_name || 'V-POS Store';
    const storeLogo = storeSettings.store_logo || null;

    return (
        <div className="splash-container" style={{ backgroundColor: bgColor, transition: 'background-color 0.5s ease' }}>
            <div className="splash-icon-container">
                <div 
                    className="splash-bag" 
                    style={{ 
                        width: 120, 
                        height: 120, 
                        borderRadius: '50%', 
                        background: 'rgba(255,255,255,0.15)',
                        border: '3px solid rgba(255,255,255,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)'
                    }}
                >
                    {storeLogo ? (
                        <img src={storeLogo} alt="Store Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                        <Store size={56} color="white" />
                    )}
                </div>
            </div>
            
            <h2 
                style={{ 
                    color: 'white', 
                    fontWeight: 800, 
                    fontSize: 24, 
                    marginTop: 20, 
                    textAlign: 'center',
                    textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                    letterSpacing: 0.5
                }}
            >
                {storeName}
            </h2>
            
            <div className="splash-dots" style={{ marginTop: 24 }}>
                <div className="splash-dot dot-1" style={{ backgroundColor: 'white' }}></div>
                <div className="splash-dot dot-2" style={{ backgroundColor: 'rgba(255,255,255,0.6)' }}></div>
                <div className="splash-dot dot-3" style={{ backgroundColor: 'rgba(255,255,255,0.3)' }}></div>
            </div>

            <div className="splash-footer">
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase' }}>Developed by</p>
                <h3 style={{ color: 'white', fontWeight: 800, letterSpacing: 0.5 }}>V-POS HYBRID</h3>
            </div>
        </div>
    );
}
