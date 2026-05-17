import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ShoppingCart, Trash2, Plus, Minus, Search, Check, AlertCircle } from 'lucide-react';
import * as db from '../services/db';
import './POSScreen.css';

export default function POSScreen() {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [selectedCatId, setSelectedCatId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState([]);
    
    // Payment Modal State
    const [isPayModalVisible, setPayModalVisible] = useState(false);
    const [cashAmount, setCashAmount] = useState('');
    const [checkoutTrx, setCheckoutTrx] = useState(null);

    useEffect(() => {
        loadPOSData();
    }, []);

    const loadPOSData = async () => {
        const prodData = await db.getProducts();
        const catData = await db.getCategories();
        setProducts(prodData);
        setCategories(catData);
        if (catData.length > 0) {
            setSelectedCatId(catData[0].id);
        }
    };

    const filteredProducts = useMemo(() => {
        return products.filter(p => {
            const matchesCat = selectedCatId ? p.category_id === selectedCatId : true;
            const matchesSearch = searchQuery 
                ? p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery)
                : true;
            return matchesCat && matchesSearch;
        });
    }, [products, selectedCatId, searchQuery]);

    const addToCart = (product) => {
        if (product.stock <= 0) {
            alert("Stok habis!");
            return;
        }
        
        const existingIdx = cart.findIndex(item => item.id === product.id);
        if (existingIdx > -1) {
            const updatedCart = [...cart];
            if (updatedCart[existingIdx].quantity >= product.stock) {
                alert("Stok tidak mencukupi!");
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
                    alert("Stok tidak mencukupi!");
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

    const handleCheckout = () => {
        if (cart.length === 0) return alert("Keranjang belanja kosong!");
        setPayModalVisible(true);
        setCashAmount(totalAmount.toString()); // default nominal pas
    };

    const submitPayment = async () => {
        const payVal = parseInt(cashAmount);
        if (isNaN(payVal) || payVal < totalAmount) {
            alert("Jumlah bayar kurang!");
            return;
        }

        const saleItems = cart.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity
        }));

        const transaction = await db.addSale(saleItems, totalAmount);
        setCheckoutTrx({
            ...transaction,
            cash: payVal,
            change: payVal - totalAmount
        });
        
        // Reset states
        setCart([]);
        setPayModalVisible(false);
        loadPOSData(); // Reload products to sync stocks
    };

    const closeSuccessModal = () => {
        setCheckoutTrx(null);
        setCashAmount('');
    };

    return (
        <div className="pos-container">
            {/* Header */}
            <div className="pos-header">
                <div className="header-left">
                    <button className="icon-btn" onClick={() => navigate('/dashboard')}>
                        <ChevronLeft size={24} color="#2c3e50" />
                    </button>
                    <h1>Kasir POS</h1>
                </div>
                <div className="cart-badge-container">
                    <ShoppingCart size={20} color="#3498db" />
                    {cart.length > 0 && <span className="cart-badge-count">{cart.length}</span>}
                </div>
            </div>

            {/* Main Area */}
            <div className="pos-content">
                {/* Left Pane: Catalog */}
                <div className="catalog-pane">
                    {/* Search & Category Pills */}
                    <div className="search-pill-container">
                        <div className="search-box">
                            <Search size={18} color="#95a5a6" />
                            <input 
                                type="text" 
                                placeholder="Cari barang atau scan barcode..." 
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        
                        <div className="categories-pill-row">
                            {categories.map(c => (
                                <button 
                                    key={c.id} 
                                    className={`category-pill ${selectedCatId === c.id ? 'active-pill' : ''}`}
                                    onClick={() => setSelectedCatId(c.id)}
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
                                            <span className="prod-price">Rp {p.price.toLocaleString('id-ID')}</span>
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
                <div className="cart-pane">
                    <h3 className="cart-title">Keranjang Belanja</h3>
                    
                    <div className="cart-list">
                        {cart.length === 0 ? (
                            <div className="empty-cart-view">
                                <ShoppingCart size={48} color="#eef0f2" />
                                <p>Keranjang kosong</p>
                            </div>
                        ) : (
                            cart.map(item => (
                                <div key={item.id} className="cart-item-row">
                                    <div className="cart-item-left">
                                        <span className="cart-item-name">{item.name}</span>
                                        <span className="cart-item-price">Rp {item.price.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="cart-item-right">
                                        <div className="qty-control-box">
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

                    <div className="cart-checkout-box">
                        <div className="subtotal-row">
                            <span>Subtotal</span>
                            <strong>Rp {totalAmount.toLocaleString('id-ID')}</strong>
                        </div>
                        <button 
                            className="btn-pay-action" 
                            disabled={cart.length === 0}
                            onClick={handleCheckout}
                        >
                            Bayar Sekarang (Rp {totalAmount.toLocaleString('id-ID')})
                        </button>
                    </div>
                </div>
            </div>

            {/* PAYMENT INPUT MODAL */}
            {isPayModalVisible && (
                <div className="modal-overlay">
                    <div className="modal-content payment-modal">
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
                        
                        <div className="quick-cash-row">
                            <button className="btn-quick-cash" onClick={() => setCashAmount(totalAmount.toString())}>Pas</button>
                            <button className="btn-quick-cash" onClick={() => setCashAmount((Math.ceil(totalAmount/10000)*10000).toString())}>Pas Kelipatan</button>
                            <button className="btn-quick-cash" onClick={() => setCashAmount("50000")}>50k</button>
                            <button className="btn-quick-cash" onClick={() => setCashAmount("100000")}>100k</button>
                        </div>

                        <div className="modal-actions">
                            <button className="cancel-button" onClick={() => setPayModalVisible(false)}>Batal</button>
                            <button className="primary-button" onClick={submitPayment}>Konfirmasi Pembayaran</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SUCCESS TRX MODAL */}
            {checkoutTrx && (
                <div className="modal-overlay">
                    <div className="modal-content success-trx-modal">
                        <div className="success-icon-circle"><Check size={36} color="white" /></div>
                        <h3>Transaksi Sukses!</h3>
                        <p className="success-trx-id">{checkoutTrx.id}</p>
                        
                        <div className="receipt-summary-box">
                            <div className="receipt-line">
                                <span>Total Belanja:</span>
                                <strong>Rp {checkoutTrx.total.toLocaleString('id-ID')}</strong>
                            </div>
                            <div className="receipt-line">
                                <span>Uang Tunai:</span>
                                <span>Rp {checkoutTrx.cash.toLocaleString('id-ID')}</span>
                            </div>
                            <hr className="receipt-divider" />
                            <div className="receipt-line change-line">
                                <span>Uang Kembali:</span>
                                <strong>Rp {checkoutTrx.change.toLocaleString('id-ID')}</strong>
                            </div>
                        </div>

                        <button className="primary-button full-width-btn" onClick={closeSuccessModal}>Selesai</button>
                    </div>
                </div>
            )}
        </div>
    );
}
