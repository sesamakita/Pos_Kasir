import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, Trash2, Plus, Minus, Search, Check, AlertCircle, Archive, ArrowUpDown, Filter, Printer, RefreshCw, Sparkles, WifiOff, PenTool, ScanLine } from 'lucide-react';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import * as db from '../services/db';
import { printReceipt } from '../services/PrinterService';
import './POSScreen.css';

export default function POSScreen() {
    const navigate = useNavigate();
    const searchInputRef = useRef(null);
    const canvasRef = useRef(null);

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCatId, setSelectedCatId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    
    // Drafts / Parked Orders state
    const [drafts, setDrafts] = useState([]);
    const [showDraftsModal, setShowDraftsModal] = useState(false);

    // Sorting & Filtering state
    const [sortMode, setSortMode] = useState('az'); // az, za, price_asc, price_desc
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Payment Modal State
    const [isPayModalVisible, setPayModalVisible] = useState(false);
    const [cashAmount, setCashAmount] = useState('');
    const [checkoutTrx, setCheckoutTrx] = useState(null);

    // Signature Pad State
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasDrawn, setHasDrawn] = useState(false);

    // Dynamic Store settings & Cashier state
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

        loadPOSData();
        loadDrafts();
    }, [navigate]);

    const loadPOSData = async () => {
        const prodData = await db.getProducts();
        const catData = await db.getCategories();
        setProducts(prodData);
        // Tambahkan opsi "Semua" di awal kategori
        setCategories([{ id: null, name: 'Semua Kategori' }, ...catData]);
    };

    const loadDrafts = () => {
        const savedDrafts = localStorage.getItem('pos_drafts');
        if (savedDrafts) {
            setDrafts(JSON.parse(savedDrafts));
        }
    };

    // Filter & Sort Products
    const filteredProducts = useMemo(() => {
        let result = [...products];

        // Filter kategori
        if (selectedCatId !== null) {
            result = result.filter(p => p.category_id === selectedCatId);
        }

        // Filter kata kunci pencarian & barcode
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase().trim();
            result = result.filter(p => 
                p.name.toLowerCase().includes(q) || 
                (p.barcode && p.barcode.includes(q))
            );
        }

        // Urutkan
        if (sortMode === 'az') {
            result.sort((a, b) => a.name.localeCompare(b.name));
        } else if (sortMode === 'za') {
            result.sort((a, b) => b.name.localeCompare(a.name));
        } else if (sortMode === 'price_asc') {
            result.sort((a, b) => a.price - b.price);
        } else if (sortMode === 'price_desc') {
            result.sort((a, b) => b.price - a.price);
        }

        return result;
    }, [products, selectedCatId, searchQuery, sortMode]);

    const addToCart = (product) => {
        if (product.stock <= 0) {
            alert("Stok produk habis!");
            return;
        }
        
        const existingIdx = cart.findIndex(item => item.id === product.id);
        if (existingIdx > -1) {
            const updatedCart = [...cart];
            if (updatedCart[existingIdx].quantity >= product.stock) {
                alert("Stok di toko tidak mencukupi!");
                return;
            }
            updatedCart[existingIdx].quantity += 1;
            setCart(updatedCart);
        } else {
            setCart([...cart, { ...product, quantity: 1 }]);
        }
    };

    const updateQty = (productId, change) => {
        const updatedCart = cart.map(item => {
            if (item.id === productId) {
                const newQty = item.quantity + change;
                if (newQty <= 0) return null;
                if (newQty > item.stock) {
                    alert("Stok di toko tidak mencukupi!");
                    return item;
                }
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(Boolean);
        setCart(updatedCart);
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.id !== productId));
    };

    const totalAmount = useMemo(() => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [cart]);

    // Barcode Physical Scanner Handler (Enter Key)
    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            const query = searchQuery.trim();
            if (!query) return;

            // Cari kecocokan barcode eksak
            const matched = products.find(p => p.barcode && p.barcode.trim() === query);
            if (matched) {
                addToCart(matched);
                setSearchQuery(''); // Kosongkan input agar siap scan berikutnya
            } else {
                alert(`Produk dengan barcode "${query}" tidak ditemukan.`);
            }
        }
    };

    // --- BARCODE / QR SCANNER HANDLER WITH NATIVE AND WEB FALLBACK ---
    const handleCameraScan = async () => {
        const isNative = window.Capacitor && window.Capacitor.isNativePlatform();
        if (isNative) {
            try {
                await BarcodeScanner.requestPermissions();
                const { barcodes } = await BarcodeScanner.scan();
                if (barcodes.length > 0) {
                    const scannedBarcode = barcodes[0].displayValue;
                    const matched = products.find(p => p.barcode && p.barcode.trim() === scannedBarcode.trim());
                    if (matched) {
                        addToCart(matched);
                        alert(`Berhasil memindai: ${matched.name}`);
                    } else {
                        alert(`Produk dengan barcode "${scannedBarcode}" tidak terdaftar.`);
                    }
                }
                return;
            } catch (err) {
                console.warn("Capacitor Barcode Scanner native failure:", err);
            }
        }

        // Web Fallback (dev server / Vercel web demo)
        const fallbackCode = prompt("Pindai Barcode / QR Code (Masukkan kode barcode produk secara manual):");
        if (fallbackCode) {
            const matched = products.find(p => p.barcode && p.barcode.trim() === fallbackCode.trim());
            if (matched) {
                addToCart(matched);
            } else {
                alert(`Produk dengan barcode "${fallbackCode}" tidak ditemukan.`);
            }
        }
    };

    // Hold/Park Order (Draft)
    const parkOrder = () => {
        if (cart.length === 0) return alert("Keranjang belanja kosong!");
        
        const newDraft = {
            id: Date.now().toString(),
            date: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            items: cart,
            total: totalAmount
        };

        const updatedDrafts = [...drafts, newDraft];
        setDrafts(updatedDrafts);
        localStorage.setItem('pos_drafts', JSON.stringify(updatedDrafts));
        
        setCart([]); // Kosongkan keranjang
        alert("Transaksi berhasil ditangguhkan (Draft disimpan)!");
    };

    const restoreDraft = (draft) => {
        setCart(draft.items);
        deleteDraft(draft.id);
        setShowDraftsModal(false);
    };

    const deleteDraft = (draftId) => {
        const updated = drafts.filter(d => d.id !== draftId);
        setDrafts(updated);
        localStorage.setItem('pos_drafts', JSON.stringify(updated));
    };

    // --- INTERACTIVE DIGITAL SIGNATURE PAD ---
    const startDrawing = (e) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.strokeStyle = '#2c3e50';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        
        const rect = canvas.getBoundingClientRect();
        const clientX = e.clientX || (e.touches && e.touches[0].clientX);
        const clientY = e.clientY || (e.touches && e.touches[0].clientY);
        
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        ctx.lineTo(x, y);
        ctx.stroke();
        setHasDrawn(true);
    };

    const endDrawing = () => {
        setIsDrawing(false);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasDrawn(false);
    };

    // Payment Processing
    const handleCheckout = () => {
        if (cart.length === 0) return alert("Keranjang belanja kosong!");
        setPayModalVisible(true);
        setCashAmount(totalAmount.toString()); // Default nominal pas
        setHasDrawn(false);
    };

    const submitPayment = async () => {
        const payVal = parseInt(cashAmount);
        if (isNaN(payVal) || payVal < totalAmount) {
            alert("Jumlah uang tunai kurang dari total tagihan!");
            return;
        }

        // Capture digital signature (base64)
        let signatureData = currentUser?.signature || null;
        if (!signatureData && hasDrawn && canvasRef.current) {
            signatureData = canvasRef.current.toDataURL('image/png');
        }

        const saleItems = cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }));

        try {
            // Save sale to database with signature parameter
            const transaction = await db.addSale(saleItems, totalAmount, signatureData);
            
            const receiptData = {
                id: transaction.id,
                total: totalAmount,
                cash: payVal,
                change: payVal - totalAmount,
                items: saleItems,
                date: transaction.date,
                signature: signatureData
            };

            setCheckoutTrx(receiptData);

            // Auto-Print Receipt
            await printReceipt({
                storeName: storeSettings?.store_name || "V-POS Store",
                storeAddress: storeSettings?.store_address || "Alamat Toko Belum Diatur",
                storePhone: storeSettings?.store_phone,
                items: saleItems,
                total: totalAmount,
                paid: payVal,
                change: payVal - totalAmount,
                date: transaction.date,
                cashierName: currentUser?.full_name || 'Admin',
                orderId: transaction.id,
                signature: signatureData
            });

            // Reset states
            setCart([]);
            setPayModalVisible(false);
            loadPOSData(); // Reload stocks
        } catch (err) {
            console.error(err);
            alert("Gagal memproses transaksi.");
        }
    };

    const handlePrintManual = async () => {
        if (!checkoutTrx) return;
        await printReceipt({
            storeName: storeSettings?.store_name || "V-POS Store",
            storeAddress: storeSettings?.store_address || "Alamat Toko Belum Diatur",
            storePhone: storeSettings?.store_phone,
            items: checkoutTrx.items,
            total: checkoutTrx.total,
            paid: checkoutTrx.cash,
            change: checkoutTrx.change,
            date: checkoutTrx.date,
            cashierName: currentUser?.full_name || 'Admin',
            orderId: checkoutTrx.id,
            signature: checkoutTrx.signature
        });
    };

    const closeSuccessModal = () => {
        setCheckoutTrx(null);
        setCashAmount('');
    };

    // Real-time payment calculation helpers
    const currentChange = useMemo(() => {
        const val = parseInt(cashAmount) || 0;
        return val - totalAmount;
    }, [cashAmount, totalAmount]);

    const isSuper = currentUser?.role === 'SUPER_ADMIN';

    // Premium styling helpers
    const brandColor = isSuper ? '#B8860B' : '#3498db';
    const brandBgLight = isSuper ? 'rgba(184, 134, 11, 0.05)' : 'rgba(52, 152, 219, 0.05)';
    const brandBorderLight = isSuper ? 'rgba(184, 134, 11, 0.3)' : 'rgba(52, 152, 219, 0.3)';

    return (
        <div className="pos-container">
            {/* Header */}
            <div className="pos-header" style={{ borderBottom: isSuper ? '1px solid #B8860B30' : '1px solid #3498db30' }}>
                <div className="header-left">
                    <button className="icon-btn" onClick={() => navigate('/dashboard')}>
                        <ChevronLeft size={24} color={isSuper ? '#8B6508' : '#2c3e50'} />
                    </button>
                    <h1 style={{ color: isSuper ? '#8B6508' : '#2c3e50' }}>Kasir POS</h1>
                    
                    {/* Offline Session Mode Badge */}
                    <div className="offline-mode-badge-pill">
                        <WifiOff size={11} />
                        <span>Offline Local</span>
                    </div>
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    {/* Draft Button */}
                    <button 
                        className="icon-btn" 
                        onClick={() => setShowDraftsModal(true)}
                        style={{ position: 'relative', background: 'rgba(230,126,34,0.1)', border: 'none', borderRadius: 12, padding: 8 }}
                    >
                        <Archive size={20} color="#e67e22" />
                        {drafts.length > 0 && <span className="cart-badge-count" style={{ background: '#e67e22' }}>{drafts.length}</span>}
                    </button>

                    {/* Shopping Cart Icon (Only Visible on Mobile via CSS Media Query) */}
                    <div className="cart-badge-container">
                        <ShoppingCart size={20} color={brandColor} />
                        {cart.length > 0 && <span className="cart-badge-count" style={{ background: brandColor }}>{cart.length}</span>}
                    </div>
                </div>
            </div>

            {/* Main Area */}
            <div className="pos-content">
                {/* Left Pane: Catalog */}
                <div className="catalog-pane">
                    {/* Search & Category Pills */}
                    <div className="search-pill-container">
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            <div className="search-box">
                                <Search size={18} color="#95a5a6" />
                                <input 
                                    ref={searchInputRef}
                                    type="text" 
                                    placeholder="Cari barang atau scan barcode..." 
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={handleSearchKeyDown}
                                />
                            </div>

                            {/* Barcode Camera Scanner Button */}
                            <button 
                                className="icon-btn-filter"
                                onClick={handleCameraScan}
                                title="Pindai Barcode / QR Code"
                                style={{ 
                                    background: brandBgLight,
                                    border: `2px solid ${brandBorderLight}`,
                                    borderRadius: 12,
                                    width: 48,
                                    height: 48,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <ScanLine size={18} color={brandColor} />
                            </button>

                            {/* Sort Button */}
                            <button 
                                className="icon-btn-filter"
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                style={{ 
                                    background: isFilterOpen ? brandBgLight : '#f8f9fa',
                                    border: isFilterOpen ? `2px solid ${brandColor}` : '2px solid #eef0f2',
                                    borderRadius: 12,
                                    width: 48,
                                    height: 48,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    boxSizing: 'border-box'
                                }}
                            >
                                <ArrowUpDown size={18} color={isFilterOpen ? brandColor : '#7f8c8d'} />
                            </button>
                        </div>

                        {/* Dropdown Filters & Sorting Mode */}
                        {isFilterOpen && (
                            <div style={{ background: '#f8f9fa', border: '2px solid #eef0f2', borderRadius: 16, padding: 14, marginTop: 4, display: 'flex', flexDirection: 'column', gap: 10 }}>
                                <span style={{ fontSize: 11, fontWeight: 'bold', color: '#7f8c8d', textTransform: 'uppercase', letterSpacing: 0.5 }}>Urutan Tampilan Barang</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                    <button onClick={() => setSortMode('az')} style={{ border: 'none', padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', background: sortMode === 'az' ? brandColor : '#eaeded', color: sortMode === 'az' ? 'white' : '#7f8c8d' }}>A - Z</button>
                                    <button onClick={() => setSortMode('za')} style={{ border: 'none', padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', background: sortMode === 'za' ? brandColor : '#eaeded', color: sortMode === 'za' ? 'white' : '#7f8c8d' }}>Z - A</button>
                                    <button onClick={() => setSortMode('price_asc')} style={{ border: 'none', padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', background: sortMode === 'price_asc' ? brandColor : '#eaeded', color: sortMode === 'price_asc' ? 'white' : '#7f8c8d' }}>Harga Terendah</button>
                                    <button onClick={() => setSortMode('price_desc')} style={{ border: 'none', padding: '6px 12px', borderRadius: 10, fontSize: 12, fontWeight: 'bold', cursor: 'pointer', background: sortMode === 'price_desc' ? brandColor : '#eaeded', color: sortMode === 'price_desc' ? 'white' : '#7f8c8d' }}>Harga Tertinggi</button>
                                </div>
                            </div>
                        )}
                        
                        <div className="categories-pill-row" style={{ marginTop: 10 }}>
                            {categories.map(c => (
                                <button 
                                    key={c.id} 
                                    className={`category-pill ${selectedCatId === c.id ? 'active-pill' : ''}`}
                                    onClick={() => setSelectedCatId(c.id)}
                                    style={{
                                        background: selectedCatId === c.id 
                                            ? brandColor 
                                            : '#f1f2f6',
                                        color: selectedCatId === c.id ? 'white' : '#2c3e50'
                                    }}
                                >
                                    {c.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Catalog Grid */}
                    <div className="catalog-grid">
                        {filteredProducts.length === 0 ? (
                            <div className="empty-catalog">
                                <AlertCircle size={40} color="#bdc3c7" />
                                <p>Tidak ada produk yang cocok.</p>
                            </div>
                        ) : (
                            filteredProducts.map(p => (
                                <div 
                                    key={p.id} 
                                    className={`product-card ${p.stock <= 0 ? 'out-of-stock-card' : ''}`}
                                    onClick={() => p.stock > 0 && addToCart(p)}
                                    style={{ border: '2px solid #eef0f2' }}
                                >
                                    {p.image_uri ? (
                                        <img 
                                            src={p.image_uri} 
                                            alt={p.name} 
                                            className="product-image" 
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className="product-image-placeholder" style={{ display: p.image_uri ? 'none' : 'flex' }}>
                                        📦
                                    </div>
                                    <div className="product-info-box">
                                        <h4 className="prod-title">{p.name}</h4>
                                        <div className="prod-footer-row">
                                            <span className="prod-price" style={{ color: brandColor }}>Rp {p.price.toLocaleString('id-ID')}</span>
                                            <span className={`prod-stock ${p.stock < 10 ? 'low-stock-lbl' : ''}`}>
                                                Stok: {p.stock}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Pane: Cart & Totals */}
                <div className="cart-pane" style={{ borderLeft: '2px solid #eef0f2' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <h3 className="cart-title" style={{ margin: 0 }}>Keranjang Belanja</h3>
                        {cart.length > 0 && (
                            <button 
                                onClick={parkOrder}
                                style={{ 
                                    background: 'rgba(230,126,34,0.1)', 
                                    border: 'none', 
                                    padding: '6px 12px', 
                                    borderRadius: 10, 
                                    color: '#e67e22', 
                                    fontSize: 11, 
                                    fontWeight: 'bold', 
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6
                                }}
                            >
                                <Archive size={12} />
                                Parkir Order
                            </button>
                        )}
                    </div>
                    
                    <div className="cart-list">
                        {cart.length === 0 ? (
                            <div className="empty-cart-view">
                                <ShoppingCart size={48} color="#eef0f2" />
                                <p>Keranjang kosong</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="cart-item-row" style={{ borderBottom: '1px solid #f1f2f6' }}>
                                    <div className="cart-item-left">
                                        <span className="cart-item-name">{item.name}</span>
                                        <span className="cart-item-price">Rp {item.price.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="cart-item-right">
                                        <div className="qty-control-box" style={{ background: '#f8f9fa' }}>
                                            <button className="qty-btn" onClick={() => updateQty(item.id, -1)}><Minus size={14} /></button>
                                            <span className="qty-val">{item.quantity}</span>
                                            <button className="qty-btn" onClick={() => updateQty(item.id, 1)}><Plus size={14} /></button>
                                        </div>
                                        <button className="btn-cart-remove" onClick={() => removeFromCart(item.id)}>
                                            <Trash2 size={16} color="#e74c3c" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="cart-checkout-box" style={{ borderTop: '2px solid #eef0f2' }}>
                        <div className="subtotal-row">
                            <span>Subtotal</span>
                            <strong style={{ color: '#2c3e50' }}>Rp {totalAmount.toLocaleString('id-ID')}</strong>
                        </div>
                        <button 
                            className="btn-pay-action" 
                            disabled={cart.length === 0}
                            onClick={handleCheckout}
                            style={{ 
                                background: brandColor,
                                boxShadow: isSuper ? '0 4px 10px rgba(184, 134, 11, 0.2)' : '0 4px 10px rgba(52, 152, 219, 0.2)'
                            }}
                        >
                            Bayar Sekarang (Rp {totalAmount.toLocaleString('id-ID')})
                        </button>
                    </div>
                </div>
            </div>

            {/* DRAFTS MODAL */}
            {showDraftsModal && (
                <div className="modal-overlay">
                    <div className="modal-content payment-modal" style={{ maxWidth: 450 }}>
                        <h3 style={{ color: '#e67e22', display: 'flex', alignItems: 'center', gap: 8, margin: '0 0 8px' }}>
                            <Archive size={20} />
                            Transaksi Ditangguhkan (Draft)
                        </h3>
                        <p style={{ margin: '0 0 16px', fontSize: 12, color: '#7f8c8d' }}>
                            Pilih draft transaksi pelanggan untuk dikembalikan ke keranjang POS.
                        </p>

                        <div style={{ maxHeight: 250, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                            {drafts.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 24, background: '#f8f9fa', borderRadius: 16, border: '2px dashed #ddd' }}>
                                    <span style={{ fontSize: 12, color: '#7f8c8d' }}>Tidak ada transaksi yang diparkir.</span>
                                </div>
                            ) : (
                                drafts.map(d => (
                                    <div 
                                        key={d.id} 
                                        style={{ 
                                            background: '#fcfcfc', 
                                            border: '2px solid #eaeded', 
                                            borderRadius: 16, 
                                            padding: 14, 
                                            display: 'flex', 
                                            justifyContent: 'space-between', 
                                            alignItems: 'center' 
                                        }}
                                    >
                                        <div>
                                            <strong style={{ fontSize: 13, color: '#2c3e50', display: 'block' }}>Rp {d.total.toLocaleString('id-ID')}</strong>
                                            <span style={{ fontSize: 11, color: '#95a5a6' }}>Jam: {d.date} • {d.items.length} Barang</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: 8 }}>
                                            <button 
                                                onClick={() => restoreDraft(d)}
                                                style={{ border: 'none', background: '#e67e22', color: 'white', fontWeight: 'bold', padding: '6px 12px', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}
                                            >
                                                Ambil
                                            </button>
                                            <button 
                                                onClick={() => deleteDraft(d.id)}
                                                style={{ border: 'none', background: 'rgba(231,76,60,0.1)', color: '#e74c3c', fontWeight: 'bold', padding: '6px 10px', borderRadius: 10, fontSize: 12, cursor: 'pointer' }}
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="modal-actions">
                            <button 
                                className="cancel-button" 
                                onClick={() => setShowDraftsModal(false)}
                                style={{ width: '100%' }}
                            >
                                Tutup
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PAYMENT INPUT MODAL */}
            {isPayModalVisible && (
                <div className="modal-overlay">
                    <div className="modal-content payment-modal" style={{ maxWidth: 440 }}>
                        <h3>Input Pembayaran</h3>
                        <p className="pay-total-lbl">Total Tagihan: <b>Rp {totalAmount.toLocaleString('id-ID')}</b></p>
                        
                        <div className="input-group" style={{marginTop: 16}}>
                            <label>Uang Tunai Diterima</label>
                            <input 
                                type="number" 
                                autoFocus
                                placeholder="cth: 50000" 
                                value={cashAmount} 
                                onChange={e => setCashAmount(e.target.value)} 
                            />
                        </div>
                        
                        {/* Quick cash denomination selector (5-column premium grid) */}
                        <div className="quick-cash-row">
                            <button className="btn-quick-cash" onClick={() => setCashAmount(totalAmount.toString())}>Pas</button>
                            <button className="btn-quick-cash" onClick={() => setCashAmount((Math.ceil(totalAmount/10000)*10000).toString())}>Bulat</button>
                            <button className="btn-quick-cash" onClick={() => setCashAmount("20000")}>20k</button>
                            <button className="btn-quick-cash" onClick={() => setCashAmount("50000")}>50k</button>
                            <button className="btn-quick-cash" onClick={() => setCashAmount("100000")}>100k</button>
                        </div>

                        {/* Real-time Change Indicator */}
                        <div style={{ marginTop: 16, padding: 14, borderRadius: 16, background: '#f8f9fa', border: '1px solid #eef0f2', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, color: '#7f8c8d', fontWeight: 'bold' }}>Kembalian Kasir:</span>
                            {currentChange >= 0 ? (
                                <strong style={{ fontSize: 18, color: '#2ecc71' }}>Rp {currentChange.toLocaleString('id-ID')}</strong>
                            ) : (
                                <span style={{ fontSize: 12, color: '#e74c3c', fontWeight: 'bold', background: 'rgba(231,76,60,0.1)', padding: '4px 8px', borderRadius: 8 }}>
                                    Kurang Rp {Math.abs(currentChange).toLocaleString('id-ID')}
                                </span>
                            )}
                        </div>

                        {/* CASHIER DIGITAL SIGNATURE WRAPPER */}
                        <div className="pos-checkout-signature-section" style={{ marginTop: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <span style={{ fontSize: 12, fontWeight: 'bold', color: '#7f8c8d', display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <PenTool size={13} color={brandColor} />
                                    Tanda Tangan Kasir
                                </span>
                                {(!currentUser?.signature && hasDrawn) && (
                                    <button 
                                        type="button" 
                                        onClick={clearSignature}
                                        style={{ background: 'transparent', border: 'none', color: '#e74c3c', fontSize: 11, fontWeight: 'bold', cursor: 'pointer' }}
                                    >
                                        Hapus
                                    </button>
                                )}
                            </div>

                            {currentUser?.signature ? (
                                <div style={{ background: '#f8f9fa', border: '2px solid #eef0f2', borderRadius: 16, padding: '10px 14px', display: 'flex', gap: 14, alignItems: 'center' }}>
                                    <img src={currentUser.signature} alt="" style={{ width: 80, height: 40, objectFit: 'contain', background: 'white', border: '1px solid #ddd', borderRadius: 8 }} />
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: 12, fontWeight: 'bold', color: '#2c3e50' }}>{currentUser.full_name}</span>
                                        <span style={{ fontSize: 10, color: '#95a5a6' }}>Tanda Tangan Otomatis Profil</span>
                                    </div>
                                </div>
                            ) : (
                                <div style={{ border: '2px dashed #bdc3c7', borderRadius: 16, overflow: 'hidden', background: '#fcfcfc', position: 'relative' }}>
                                    <canvas 
                                        ref={canvasRef}
                                        width={390}
                                        height={90}
                                        onMouseDown={startDrawing}
                                        onMouseMove={draw}
                                        onMouseUp={endDrawing}
                                        onMouseLeave={endDrawing}
                                        onTouchStart={startDrawing}
                                        onTouchMove={draw}
                                        onTouchEnd={endDrawing}
                                        style={{ cursor: 'crosshair', display: 'block', width: '100%' }}
                                    />
                                    {!hasDrawn && (
                                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', background: 'transparent', gap: 8 }}>
                                            <span style={{ fontSize: 11, color: '#bdc3c7', fontWeight: 'bold' }}>Goreskan tanda tangan di sini...</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="modal-actions" style={{ marginTop: 20 }}>
                            <button className="cancel-button" onClick={() => setPayModalVisible(false)}>Batal</button>
                            <button 
                                className="primary-button" 
                                onClick={submitPayment}
                                disabled={currentChange < 0 || (!currentUser?.signature && !hasDrawn)}
                                style={{
                                    background: (currentChange < 0 || (!currentUser?.signature && !hasDrawn)) 
                                        ? '#bdc3c7' 
                                        : brandColor,
                                    cursor: (currentChange < 0 || (!currentUser?.signature && !hasDrawn)) ? 'not-allowed' : 'pointer'
                                }}
                            >
                                Konfirmasi Pembayaran
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUCCESS TRX MODAL */}
            {checkoutTrx && (
                <div className="modal-overlay">
                    <div className="modal-content success-trx-modal">
                        <div className="success-icon-circle" style={{ background: isSuper ? '#B8860B' : '#2ecc71' }}><Check size={36} color="white" /></div>
                        <h3>Transaksi Sukses!</h3>
                        <p className="success-trx-id" style={{ fontSize: 11, color: '#7f8c8d' }}>No. TRX: {checkoutTrx.id}</p>
                        
                        <div className="receipt-summary-box" style={{ border: '2px solid #eef0f2', background: '#fbfcfc', borderRadius: 20, padding: 16, margin: '16px 0' }}>
                            <div className="receipt-line">
                                <span>Total Belanja:</span>
                                <strong>Rp {checkoutTrx.total.toLocaleString('id-ID')}</strong>
                            </div>
                            <div className="receipt-line">
                                <span>Uang Tunai:</span>
                                <span>Rp {checkoutTrx.cash.toLocaleString('id-ID')}</span>
                            </div>
                            <hr className="receipt-divider" style={{ borderTop: '1px dashed #d5dbdb', margin: '8px 0' }} />
                            <div className="receipt-line change-line">
                                <span style={{ color: '#7f8c8d' }}>Uang Kembali:</span>
                                <strong style={{ color: '#2ecc71', fontSize: 16 }}>Rp {checkoutTrx.change.toLocaleString('id-ID')}</strong>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                            <button 
                                className="primary-button" 
                                onClick={handlePrintManual}
                                style={{ 
                                    flex: 1, 
                                    background: 'rgba(52,152,219,0.1)', 
                                    color: '#3498db',
                                    border: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 8
                                }}
                            >
                                <Printer size={16} />
                                Cetak Struk
                            </button>
                            <button 
                                className="primary-button" 
                                onClick={closeSuccessModal}
                                style={{ 
                                    flex: 1,
                                    background: isSuper ? '#B8860B' : '#2ecc71'
                                }}
                            >
                                Selesai
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
