import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, Shield, User, Mail, Phone, FileText, Check } from 'lucide-react';
import * as db from '../services/db';
import './EditProfileScreen.css';

export default function EditProfileScreen() {
    const navigate = useNavigate();
    const canvasRef = useRef(null);

    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [bio, setBio] = useState('');
    const [pin, setPin] = useState('');
    const [profilePhoto, setProfilePhoto] = useState(null);
    
    // Canvas drawing states
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const currentUser = db.getCurrentUser();
        if (!currentUser) {
            navigate('/login', { replace: true });
            return;
        }
        setUser(currentUser);
        setName(currentUser.full_name || '');
        setEmail(currentUser.email || `${currentUser.username}@vpos.com`);
        setPhone(currentUser.phone || '');
        setBio(currentUser.bio || '');
        setPin(currentUser.password || '');
        setProfilePhoto(currentUser.profile_photo || null);

        // Load existing signature if any
        if (currentUser.signature) {
            setTimeout(() => {
                loadExistingSignature(currentUser.signature);
            }, 100);
        }
    }, [navigate]);

    const loadExistingSignature = (signatureBase64) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const img = new Image();
        img.onload = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            setHasSignature(true);
        };
        img.src = signatureBase64;
    };

    // Photo Loader Helper (Base64)
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfilePhoto(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // --- HTML5 CANVAS SIGNATURE DRAWING PAD ---
    const getCoordinates = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        
        // Handle touch events vs mouse events
        if (e.touches && e.touches[0]) {
            return {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        } else {
            return {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
        }
    };

    const startDrawing = (e) => {
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const coords = getCoordinates(e);

        ctx.beginPath();
        ctx.moveTo(coords.x, coords.y);
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#2c3e50';
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const coords = getCoordinates(e);

        ctx.lineTo(coords.x, coords.y);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!name.trim()) return alert("Nama tidak boleh kosong.");
        if (!pin.trim() || pin.length < 3) return alert("PIN login minimal 3 digit.");

        // Get signature image as Base64 if exists
        let signatureBase64 = null;
        if (hasSignature) {
            signatureBase64 = canvasRef.current.toDataURL('image/png');
        }

        try {
            await db.updateUser(user.id, {
                fullName: name.trim(),
                password: pin.trim(),
                email: email.trim(),
                phone: phone.trim(),
                bio: bio.trim(),
                profile_photo: profilePhoto,
                signature: signatureBase64
            });

            alert("Profil berhasil diperbarui!");
            navigate('/settings');
        } catch (error) {
            console.error("Save profile failed:", error);
            alert("Gagal memperbarui profil.");
        }
    };

    if (!user) return null;

    const isSuper = user.role === 'SUPER_ADMIN';

    // initials for avatar fallback
    const initials = name
        ? name.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2)
        : '??';

    return (
        <div className="dashboard-container" style={{ paddingBottom: 40 }}>
            {/* Header */}
            <div className="pos-header" style={{ borderBottom: isSuper ? '1px solid #B8860B30' : '1px solid #3498db30' }}>
                <div className="header-left">
                    <button className="icon-btn" onClick={() => navigate('/settings')}>
                        <ChevronLeft size={24} color={isSuper ? '#8B6508' : '#2c3e50'} />
                    </button>
                    <h1 style={{ color: isSuper ? '#8B6508' : '#2c3e50' }}>Edit Profil</h1>
                </div>
            </div>

            <form onSubmit={handleSave} style={{ padding: 20 }}>
                {/* Avatar Section */}
                <div className="avatar-upload-container">
                    <div className="avatar-wrapper" style={{ border: isSuper ? '3px solid #B8860B' : '3px solid #3498db' }}>
                        {profilePhoto ? (
                            <img src={profilePhoto} alt="Avatar" className="avatar-img" />
                        ) : (
                            <span className="avatar-text">{initials}</span>
                        )}
                        <label htmlFor="photo-upload" className="camera-badge" style={{ background: isSuper ? '#B8860B' : '#3498db' }}>
                            <Camera size={14} color="white" />
                            <input 
                                id="photo-upload" 
                                type="file" 
                                accept="image/*" 
                                style={{ display: 'none' }} 
                                onChange={handlePhotoChange} 
                            />
                        </label>
                    </div>
                    <span className="avatar-hint">Klik kamera untuk ganti foto profil</span>
                </div>

                {/* Form Group */}
                <h3 className="section-heading" style={{ marginTop: 24 }}>Informasi Dasar</h3>
                <div className="form-card-box">
                    <div className="form-group-item">
                        <label><User size={14} /> Nama Lengkap</label>
                        <input 
                            type="text" 
                            placeholder="Nama Lengkap Anda" 
                            value={name} 
                            onChange={e => setName(e.target.value)} 
                            required
                        />
                    </div>

                    <div className="form-group-item">
                        <label><Mail size={14} /> Alamat Email</label>
                        <input 
                            type="email" 
                            placeholder="nama@toko.com" 
                            value={email} 
                            onChange={e => setEmail(e.target.value)} 
                        />
                    </div>

                    <div className="form-group-item">
                        <label><Phone size={14} /> Nomor Telepon</label>
                        <input 
                            type="text" 
                            placeholder="Contoh: 0812xxxx" 
                            value={phone} 
                            onChange={e => setPhone(e.target.value)} 
                        />
                    </div>

                    <div className="form-group-item">
                        <label><FileText size={14} /> Posisi / Bio Singkat</label>
                        <textarea 
                            rows="2"
                            placeholder="Contoh: Kasir Shift Pagi / Pemilik Utama" 
                            value={bio} 
                            onChange={e => setBio(e.target.value)} 
                        />
                    </div>
                </div>

                {/* Signature Pad */}
                <h3 className="section-heading" style={{ marginTop: 24 }}>Tanda Tangan Digital</h3>
                <p className="signature-info-label">Gunakan jari atau mouse Anda untuk menandatangani laporan closing struk.</p>
                <div className="signature-card-box">
                    <div className="canvas-wrapper">
                        <canvas 
                            ref={canvasRef}
                            width="320"
                            height="160"
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                        />
                        {!hasSignature && <div className="canvas-placeholder">Tanda Tangan di Sini</div>}
                    </div>
                    <div className="canvas-actions">
                        <button type="button" className="btn-canvas-clear" onClick={clearSignature}>Reset</button>
                    </div>
                </div>

                {/* Security PIN Section */}
                <h3 className="section-heading" style={{ marginTop: 24 }}>Keamanan Akun</h3>
                <div className="form-card-box">
                    <div className="form-group-item">
                        <label><Shield size={14} /> PIN Login Kasir</label>
                        <input 
                            type="password" 
                            maxLength="6"
                            placeholder="Masukkan PIN baru" 
                            value={pin} 
                            onChange={e => setPin(e.target.value)} 
                            required
                        />
                        <span className="input-hint">Gunakan angka unik (minimal 3 digit) untuk login cepat ke HP.</span>
                    </div>
                </div>

                {/* Save Button */}
                <button 
                    type="submit" 
                    className="btn-save-profile"
                    style={{ background: isSuper ? '#B8860B' : '#3498db', marginTop: 30 }}
                >
                    <Check size={18} />
                    Simpan Perubahan
                </button>
            </form>
        </div>
    );
}
