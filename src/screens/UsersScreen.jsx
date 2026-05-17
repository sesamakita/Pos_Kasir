import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, UserPlus, Shield } from 'lucide-react';

export default function UsersScreen() {
    const navigate = useNavigate();

    const employees = [
        { id: 1, name: "Admin Utama (Anda)", role: "OWNER", email: "owner@kasir.com" },
        { id: 2, name: "Rina Kasir", role: "KASIR (STAFF)", email: "rina@kasir.com" },
        { id: 3, name: "Budi Gudang", role: "INVENTARIS", email: "budi@kasir.com" }
    ];

    return (
        <div className="dashboard-container" style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="pos-header">
                <div className="header-left">
                    <button className="icon-btn" onClick={() => navigate('/dashboard')}>
                        <ChevronLeft size={24} color="#2c3e50" />
                    </button>
                    <h1>Kelola Karyawan</h1>
                </div>
            </div>

            <div style={{ padding: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <h3 className="section-heading" style={{ margin: 0 }}>Daftar Hak Akses</h3>
                    <button 
                        onClick={() => alert("Fitur tambah karyawan hanya tersedia di versi Cloud.")}
                        style={{ background: '#3498db', color: 'white', border: 'none', borderRadius: 10, padding: '8px 14px', fontSize: 13, fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                    >
                        <UserPlus size={14} />
                        Tambah
                    </button>
                </div>

                <div className="activity-list" style={{ border: '2px solid #eef0f2' }}>
                    {employees.map((emp) => (
                        <div key={emp.id} className="activity-item-card" style={{ cursor: 'default' }}>
                            <div className="activity-left">
                                <div className="activity-icon-receipt" style={{ background: emp.role === 'OWNER' ? 'rgba(212,172,13,0.1)' : 'rgba(52,152,219,0.1)' }}>
                                    <Shield size={16} color={emp.role === 'OWNER' ? '#d4ac0d' : '#3498db'} />
                                </div>
                                <div className="activity-info">
                                    <span className="activity-trx">{emp.name}</span>
                                    <span className="activity-time">{emp.email}</span>
                                </div>
                            </div>
                            <div className="activity-right">
                                <span className="role-tag" style={{ color: emp.role === 'OWNER' ? '#d4ac0d' : '#3498db', background: emp.role === 'OWNER' ? 'rgba(212,172,13,0.1)' : 'rgba(52,152,219,0.1)' }}>
                                    {emp.role}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
