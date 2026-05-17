import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './SplashScreen.css';
import { ShoppingBag } from 'lucide-react';

export default function SplashScreen() {
    const navigate = useNavigate();

    useEffect(() => {
        // Simulasi loading 3 detik, persis seperti aslinya
        const timer = setTimeout(() => {
            navigate('/login', { replace: true });
        }, 3000);
        return () => clearTimeout(timer);
    }, [navigate]);

    return (
        <div className="splash-container">
            <div className="splash-icon-container">
                <div className="splash-bag">
                    <ShoppingBag size={80} color="white" />
                </div>
            </div>
            
            <div className="splash-dots">
                <div className="splash-dot dot-1"></div>
                <div className="splash-dot dot-2"></div>
                <div className="splash-dot dot-3"></div>
            </div>

            <div className="splash-footer">
                <p>Developed by</p>
                <h3>V-POS</h3>
            </div>
        </div>
    );
}
