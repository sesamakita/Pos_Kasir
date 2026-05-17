import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UserPlus, Shield, Trash2 } from 'lucide-react';
import * as db from '../services/db';

export default function UsersScreen() {
    const navigate = useNavigate();
    const [employees, setEmployees] = useState([]);
    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        const user = db.getCurrentUser();
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }
        if (user.role !== 'SUPER_ADMIN') {
            alert("Akses Ditolak! Hanya Super Admin yang dapat mengelola karyawan.");
            navigate('/dashboard', { replace: true });
            return;
        }
        setCurrentUser(user);
        loadEmployees();
    }, [navigate]);

    const loadEmployees = () => {
        const list = db.getUsers();
        setEmployees(list);
    };

    const handleDeleteUser = (emp) => {
        if (emp.username === 'admin') {
            return alert("Akun Super Admin utama dilindungi sistem dan tidak dapat dihapus!");
        }

        if (window.confirm(`Apakah Anda yakin ingin menghapus akun staff "${emp.full_name}"?`)) {
            try {
                db.deleteUser(emp.id);
                alert(`Akun "${emp.full_name}" berhasil dihapus.`);
                loadEmployees();
            } catch (e) {
                alert(e.message || "Gagal menghapus karyawan.");
            }
        }
    };

    if (!currentUser) return null;

    return (
        <div className="dashboard-container" style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="pos-header" style={{ borderBottom: '1px solid #B8860B30' }}>
                <div className="header-left">
                    <button className="icon-btn" onClick={() => navigate('/dashboard')}>
                        <ChevronLeft size={24} color="#8B6508" />
                    </button>
                    <h1 style={{ color: '#8B6508' }}>Kelola Karyawan</h1>
                </div>
            </div>

            <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 className="section-heading" style={{ margin: 0 }}>Daftar Hak Akses</h3>
                    <button 
                        onClick={() => navigate('/register')}
                        style={{ 
                            background: '#B8860B', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: 10, 
                            padding: '8px 14px', 
                            fontSize: 13, 
                            fontWeight: 'bold', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 6,
                            boxShadow: '0 4px 10px rgba(184, 134, 11, 0.2)'
                        }}
                    >
                        <UserPlus size={14} />
                        Tambah Staff
                    </button>
                </div>

                <div className="activity-list" style={{ border: '2px solid #B8860B15' }}>
                    {employees.map((emp) => {
                        const isSuper = emp.role === 'SUPER_ADMIN';
                        return (
                            <div key={emp.id} className="activity-item-card" style={{ cursor: 'default' }}>
                                <div className="activity-left">
                                    <div 
                                        className="activity-icon-receipt" 
                                        style={{ background: isSuper ? 'rgba(184, 134, 11, 0.1)' : 'rgba(52, 152, 219, 0.1)' }}
                                    >
                                        <Shield size={16} color={isSuper ? '#B8860B' : '#3498db'} />
                                    </div>
                                    <div className="activity-info">
                                        <span className="activity-trx">{emp.full_name}</span>
                                        <span className="activity-time">@{emp.username} • PIN: {emp.password}</span>
                                    </div>
                                </div>
                                <div className="activity-right" style={{ gap: 12 }}>
                                    <span 
                                        className="role-tag" 
                                        style={{ 
                                            color: isSuper ? '#B8860B' : '#3498db', 
                                            background: isSuper ? 'rgba(184, 134, 11, 0.1)' : 'rgba(52, 152, 219, 0.1)' 
                                        }}
                                    >
                                        {isSuper ? 'SUPER' : 'KASIR'}
                                    </span>
                                    {emp.username !== 'admin' && (
                                        <button 
                                            onClick={() => handleDeleteUser(emp)}
                                            style={{ 
                                                background: 'none', 
                                                border: 'none', 
                                                cursor: 'pointer', 
                                                padding: 4,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            title="Hapus Staff"
                                        >
                                            <Trash2 size={16} color="#e74c3c" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
