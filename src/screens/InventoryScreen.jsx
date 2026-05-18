import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './InventoryScreen.css';
import { Camera, CameraResultType } from '@capacitor/camera';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { Ocr } from '@jcesarmobile/capacitor-ocr';
import * as db from '../services/db';
import { Search, SlidersHorizontal, Plus, Trash2, Box, AlertCircle, Camera as CameraIcon, ScanLine, X, ChevronLeft, ChevronDown, Check } from 'lucide-react';

const SORT_OPTIONS = [
    { key: 'az', label: 'Nama A-Z' },
    { key: 'za', label: 'Nama Z-A' },
    { key: 'price_asc', label: 'Harga Terendah' },
    { key: 'price_desc', label: 'Harga Tertinggi' },
    { key: 'stock_asc', label: 'Stok Terendah' }
];

export default function InventoryScreen() {
    const navigate = useNavigate();
    const [currentUser, setCurrentUser] = useState(null);

    const [inventory, setInventory] = useState([]);
    const [categories, setCategories] = useState([]);

    const [searchQuery, setSearchQuery] = useState('');
    
    // Sort and Filter States
    const [sortMode, setSortMode] = useState('az');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');
    const [isFilterModalVisible, setFilterModalVisible] = useState(false);

    // Restock Modal State
    const [isRestockVisible, setRestockVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [restockQty, setRestockQty] = useState('');

    // Add Product Modal State
    const [isAddVisible, setAddVisible] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '', price: '', stock: '', category_id: 1, image_uri: null, barcode: ''
    });

    const [isScannerVisible, setScannerVisible] = useState(false);
    const [isLoadingOCR, setIsLoadingOCR] = useState(false);
    const [ocrWords, setOcrWords] = useState([]);
    
    // States untuk modal Add Category baru yang interaktif
    const [isAddCategoryVisible, setAddCategoryVisible] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    
    // State untuk Custom Category Picker
    const [isCategoryPickerVisible, setIsCategoryPickerVisible] = useState(false);

    useEffect(() => {
        const user = db.getCurrentUser();
        if (!user) {
            navigate('/login', { replace: true });
            return;
        }
        setCurrentUser(user);
        loadData();
    }, [navigate]);

    const loadData = async () => {
        const prodData = await db.getProducts();
        const catData = await db.getCategories();
        setInventory(prodData);
        setCategories(catData);
    };

    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    const handleRestock = async () => {
        const qty = parseInt(restockQty);
        if (isNaN(qty) || qty <= 0) return alert("Jumlah tidak valid");
        await db.updateStock(selectedProduct.id, qty);
        setRestockVisible(false);
        setRestockQty('');
        loadData();
    };

    const handleClearInventory = async () => {
        if(window.confirm("Hapus semua data produk dan kategori? Semua riwayat penjualan juga akan dibersihkan.")) {
            await db.resetDatabase();
            loadData();
        }
    };

    const handleAddProduct = async () => {
        const parsedPrice = parseFloat(newProduct.price);
        const parsedStock = parseInt(newProduct.stock);

        if (!newProduct.name) return alert("Nama produk wajib diisi.");
        if (isNaN(parsedPrice) || parsedPrice <= 0) return alert("Harga tidak valid.");

        await db.addProduct({
            name: newProduct.name,
            price: parsedPrice,
            stock: parsedStock || 0,
            category_id: newProduct.category_id,
            image_uri: newProduct.image_uri,
            barcode: newProduct.barcode
        });

        setAddVisible(false);
        setNewProduct({ name: '', price: '', stock: '', category_id: categories[0]?.id || 1, image_uri: null, barcode: '' });
        setOcrWords([]);
        loadData();
    };

    const handleDeleteProduct = async (product) => {
        if(window.confirm(`Hapus "${product.name}"?`)) {
            try {
                await db.deleteProduct(product.id);
                loadData();
            } catch (err) {
                alert("Gagal menghapus produk.");
            }
        }
    };

    // BARCODE & OCR LOGIC WITH WEB FALLBACKS
    const handleScanBarcode = async () => {
        try {
            await BarcodeScanner.requestPermissions();
            const { barcodes } = await BarcodeScanner.scan();
            if (barcodes.length > 0) {
                setNewProduct(p => ({ ...p, barcode: barcodes[0].displayValue }));
                handlePhotoOCR();
            }
        } catch (err) {
            console.error(err);
            const manualBarcode = prompt("Masukkan barcode secara manual (Web Fallback):");
            if (manualBarcode) {
                setNewProduct(p => ({ ...p, barcode: manualBarcode }));
            }
        }
    };

    const handlePhotoOCR = async () => {
        try {
            setIsLoadingOCR(true);
            const photo = await Camera.getPhoto({
                quality: 90, allowEditing: false, resultType: CameraResultType.Uri
            });
            
            setNewProduct(p => ({ ...p, image_uri: photo.webPath }));

            console.log("Processing OCR for image path:", photo.path);
            const result = await Ocr.process({ image: photo.path });
            console.log("OCR raw result:", result);

            if (result.results && result.results.length > 0) {
                const detectedText = result.results.map(r => r.text.trim()).filter(Boolean).join(' ');
                const words = detectedText.split(/\s+/).filter(Boolean);
                setOcrWords(words);
                setNewProduct(p => ({ ...p, name: words.join(' ') }));
            } else {
                // If OCR fails but photo was taken on web, provide direct typing
                const inputName = prompt("Foto berhasil diambil. Ketik nama barang:");
                if (inputName) {
                    setNewProduct(p => ({ ...p, name: inputName }));
                }
            }
        } catch (err) {
            console.error("OCR Error detail:", err);
            // Web browser file upload input fallback
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setNewProduct(p => ({ ...p, image_uri: reader.result }));
                        const manualName = prompt("Kemasan terunggah. Masukkan Nama Produk:");
                        if (manualName) {
                            setNewProduct(p => ({ ...p, name: manualName }));
                        }
                    };
                    reader.readAsDataURL(file);
                }
            };
            input.click();
        } finally {
            setIsLoadingOCR(false);
        }
    };

    const handleRemoveOcrWord = (indexToRemove) => {
        const updatedWords = ocrWords.filter((_, index) => index !== indexToRemove);
        setOcrWords(updatedWords);
        setNewProduct(p => ({ ...p, name: updatedWords.join(' ') }));
    };

    const handleOpenAddCategory = () => {
        setNewCategoryName('');
        setAddCategoryVisible(true);
    };

    const handleSaveCategory = async () => {
        if (!newCategoryName || !newCategoryName.trim()) {
            return alert("Nama kategori tidak boleh kosong.");
        }
        const cleanName = newCategoryName.trim();
        await db.addCategory(cleanName);
        
        const catData = await db.getCategories();
        setCategories(catData);
        
        const newCat = catData.find(c => c.name === cleanName);
        if (newCat) {
            setNewProduct(p => ({ ...p, category_id: newCat.id }));
        }
        
        setAddCategoryVisible(false);
        setNewCategoryName('');
    };

    // --- MEMOIZED FILTER AND SORT SYSTEM ---
    const filteredInventory = useMemo(() => {
        let result = [...inventory];

        // 1. Filter by category
        if (selectedCategoryFilter !== 'All') {
            result = result.filter(item => (item.categoryName || 'Umum') === selectedCategoryFilter);
        }

        // 2. Filter by search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(item => item.name.toLowerCase().includes(q));
        }

        // 3. Sort products
        switch (sortMode) {
            case 'az':
                result.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'za':
                result.sort((a, b) => b.name.localeCompare(a.name));
                break;
            case 'price_asc':
                result.sort((a, b) => a.price - b.price);
                break;
            case 'price_desc':
                result.sort((a, b) => b.price - a.price);
                break;
            case 'stock_asc':
                result.sort((a, b) => a.stock - b.stock);
                break;
            default:
                break;
        }

        return result;
    }, [inventory, searchQuery, sortMode, selectedCategoryFilter]);

    // Unique category names for filtering chips
    const categoryFilterOptions = useMemo(() => {
        const uniqueCats = [...new Set(inventory.map(item => item.categoryName || 'Umum'))];
        return ['All', ...uniqueCats];
    }, [inventory]);

    const hasActiveFilters = sortMode !== 'az' || selectedCategoryFilter !== 'All';

    return (
        <div className="screen-container">
            {/* Header */}
            <div className="header" style={{ borderBottom: isSuperAdmin ? '1px solid #B8860B30' : '1px solid #3498db30' }}>
                <div className="header-left">
                    <button className="icon-btn" onClick={() => navigate('/dashboard')}><ChevronLeft size={24} color={isSuperAdmin ? '#8B6508' : '#2c3e50'} /></button>
                    <h1 className="header-title" style={{ color: isSuperAdmin ? '#8B6508' : '#2c3e50' }}>Inventory</h1>
                </div>
                <div className="header-right">
                    {isSuperAdmin && (
                        <button className="icon-btn danger-bg" onClick={handleClearInventory}>
                            <Trash2 size={20} color="#e74c3c" />
                        </button>
                    )}
                    <button 
                        className="icon-btn primary-bg" 
                        onClick={() => setAddVisible(true)}
                        style={{ background: isSuperAdmin ? '#B8860B' : '#3498db' }}
                    >
                        <Plus size={24} color="white" />
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="search-section">
                <div className="search-box">
                    <Search size={20} color="#95a5a6" />
                    <input 
                        type="text" 
                        placeholder="Cari produk..." 
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && <button onClick={() => setSearchQuery('')} className="clear-search"><X size={16} /></button>}
                </div>
                <button 
                    className={`filter-btn ${hasActiveFilters ? 'active-filter-glow' : ''}`} 
                    onClick={() => setFilterModalVisible(true)}
                    style={{ border: hasActiveFilters ? '2px solid #27ae60' : '1px solid #bdc3c7' }}
                >
                    <SlidersHorizontal size={22} color={hasActiveFilters ? '#27ae60' : '#2c3e50'} />
                </button>
            </div>

            {/* Compact Filter Status Pill */}
            {hasActiveFilters && (
                <div className="active-filters-summary-bar">
                    <span className="filters-summary-text">
                        Sort: {SORT_OPTIONS.find(o => o.key === sortMode)?.label}
                        {selectedCategoryFilter !== 'All' && ` • Kategori: ${selectedCategoryFilter}`}
                    </span>
                    <button 
                        className="reset-filters-btn"
                        onClick={() => { setSortMode('az'); setSelectedCategoryFilter('All'); }}
                    >
                        Reset
                    </button>
                </div>
            )}

            {/* Counter */}
            <p className="result-counter">Menampilkan {filteredInventory.length} dari {inventory.length} produk</p>

            {/* List */}
            <div className="list-container">
                {filteredInventory.length === 0 ? (
                    <div className="empty-state">
                        <Search size={48} color="#bdc3c7" />
                        <p>Tidak ada produk ditemukan</p>
                    </div>
                ) : (
                    filteredInventory.map(item => (
                        <div key={item.id} className={`item-card ${item.stock < 10 ? 'low-stock-card' : ''}`}>
                            <div className="item-left">
                                <div className="icon-box">
                                    {item.image_uri ? (
                                        <img 
                                            src={item.image_uri} 
                                            alt="" 
                                            className="product-icon" 
                                            onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'flex';
                                            }}
                                        />
                                    ) : null}
                                    <div className="product-icon-placeholder" style={{ display: item.image_uri ? 'none' : 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
                                        <Box size={24} color={isSuperAdmin ? '#B8860B' : '#3498db'} />
                                    </div>
                                    {item.stock < 10 && <div className="low-stock-badge"><AlertCircle size={12} color="white" /></div>}
                                </div>
                                <div className="item-info">
                                    <span className="item-name">{item.name}</span>
                                    <span className="item-cat">{item.categoryName}</span>
                                </div>
                            </div>
                            <div className="item-right">
                                <span className="item-price">Rp {item.price.toLocaleString('id-ID')}</span>
                                <div className="stock-row">
                                    <span className={`item-stock ${item.stock < 10 ? 'low-stock-text' : ''}`}>Stock: {item.stock}</span>
                                    <div className="actions-row">
                                        <button className="quick-add-btn" onClick={() => { setSelectedProduct(item); setRestockVisible(true); }}>
                                            <Plus size={16} color={isSuperAdmin ? '#B8860B' : '#3498db'} />
                                        </button>
                                        {isSuperAdmin && (
                                            <button className="quick-del-btn" onClick={() => handleDeleteProduct(item)}>
                                                <Trash2 size={16} color="#e74c3c" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* SORT & FILTER BOTTOM MODAL POPUP */}
            {isFilterModalVisible && (
                <div className="modal-overlay" onClick={() => setFilterModalVisible(false)}>
                    <div className="modal-content filter-bottom-modal animate-slide-up" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Filter & Urutkan</h3>
                            <button onClick={() => setFilterModalVisible(false)} className="close-btn"><X size={24} /></button>
                        </div>
                        
                        <div className="modal-body">
                            {/* Sort Options */}
                            <h4 className="filter-modal-title">Urutkan Berdasarkan</h4>
                            <div className="filter-chips-grid">
                                {SORT_OPTIONS.map(opt => (
                                    <button 
                                        key={opt.key}
                                        className={`filter-grid-chip ${sortMode === opt.key ? 'active-grid-chip' : ''}`}
                                        onClick={() => setSortMode(opt.key)}
                                    >
                                        {opt.label}
                                        {sortMode === opt.key && <Check size={12} />}
                                    </button>
                                ))}
                            </div>

                            <div className="receipt-divider" style={{ margin: '20px 0' }}></div>

                            {/* Category Filters */}
                            <h4 className="filter-modal-title">Filter Kategori</h4>
                            <div className="filter-chips-grid">
                                {categoryFilterOptions.map(cat => (
                                    <button 
                                        key={cat}
                                        className={`filter-grid-chip ${selectedCategoryFilter === cat ? 'active-grid-chip' : ''}`}
                                        onClick={() => setSelectedCategoryFilter(cat)}
                                    >
                                        {cat === 'All' ? 'Semua Kategori' : cat}
                                        {selectedCategoryFilter === cat && <Check size={12} />}
                                    </button>
                                ))}
                            </div>

                            <button 
                                className="primary-button full-width" 
                                style={{ marginTop: 30, background: isSuperAdmin ? '#B8860B' : '#3498db' }}
                                onClick={() => setFilterModalVisible(false)}
                            >
                                Terapkan Filter
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD PRODUCT MODAL */}
            {isAddVisible && (
                <div className="modal-overlay">
                    <div className="modal-content add-modal">
                        <div className="modal-header">
                            <h3>New Product</h3>
                            <button onClick={() => setAddVisible(false)} className="close-btn"><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <label>Barcode (Opsional)</label>
                                <div className="scan-row">
                                    <input type="text" placeholder="Scan/ketik barcode" value={newProduct.barcode} onChange={e => setNewProduct({...newProduct, barcode: e.target.value})} />
                                    <button 
                                        className="btn-scan-camera" 
                                        onClick={handleScanBarcode}
                                        style={{ background: isSuperAdmin ? '#B8860B' : '#3498db' }}
                                    >
                                        <ScanLine size={20} />
                                    </button>
                                </div>
                            </div>

                            <div className="image-ocr-box">
                                {newProduct.image_uri ? (
                                    <img src={newProduct.image_uri} className="picked-image" alt="" />
                                ) : (
                                    <button className="img-placeholder" onClick={handlePhotoOCR}>
                                        <CameraIcon size={32} color={isSuperAdmin ? '#B8860B' : '#3498db'} />
                                        <span>{isLoadingOCR ? "Menganalisa..." : "Foto Kemasan untuk Auto-Nama"}</span>
                                    </button>
                                )}
                            </div>

                            <div className="input-group">
                                <label>Nama Produk</label>
                                <input type="text" placeholder="Masukkan nama" value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} />
                                
                                {ocrWords.length > 0 && (
                                    <div className="ocr-chips-container">
                                        <span className="chips-label">Hasil OCR (klik x untuk hapus kata):</span>
                                        <div className="ocr-chips">
                                            {ocrWords.map((word, idx) => (
                                                <div key={idx} className="ocr-chip">
                                                    <span>{word}</span>
                                                    <button type="button" className="chip-remove-btn" onClick={() => handleRemoveOcrWord(idx)}>×</button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="input-group">
                                <label>Kategori</label>
                                <div className="category-select-row">
                                    <div className="custom-select-box" onClick={() => setIsCategoryPickerVisible(true)}>
                                        <span>{categories.find(c => c.id === newProduct.category_id)?.name || 'Pilih Kategori'}</span>
                                        <ChevronDown size={18} color="#7f8c8d" />
                                    </div>
                                    <button 
                                        type="button" 
                                        className="btn-add-category" 
                                        onClick={handleOpenAddCategory}
                                        style={{ background: isSuperAdmin ? '#B8860B' : '#3498db' }}
                                    >
                                        <Plus size={20} color="white" />
                                    </button>
                                </div>
                            </div>

                            <div className="price-stock-row">
                                <div className="input-group">
                                    <label>Harga (Rp)</label>
                                    <input type="number" placeholder="0" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} />
                                </div>
                                <div className="input-group">
                                    <label>Stok Awal</label>
                                    <input type="number" placeholder="0" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} />
                                </div>
                            </div>
                            
                            <button 
                                className="primary-button full-width" 
                                onClick={handleAddProduct}
                                style={{ background: isSuperAdmin ? '#B8860B' : '#3498db' }}
                            >
                                Simpan Produk
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RESTOCK MODAL */}
            {isRestockVisible && (
                <div className="modal-overlay">
                    <div className="modal-content restock-modal">
                        <h3>Quick Restock</h3>
                        <p>{selectedProduct?.name}</p>
                        <div className="input-group" style={{marginTop: 16}}>
                            <label>Jumlah Ditambah</label>
                            <input type="number" autoFocus placeholder="cth: 50" value={restockQty} onChange={e => setRestockQty(e.target.value)} />
                        </div>
                        <div className="modal-actions">
                            <button className="cancel-button" onClick={() => setRestockVisible(false)}>Batal</button>
                            <button 
                                className="primary-button" 
                                onClick={handleRestock}
                                style={{ background: isSuperAdmin ? '#B8860B' : '#3498db' }}
                            >
                                Update Stok
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ADD CATEGORY SUB-MODAL */}
            {isAddCategoryVisible && (
                <div className="modal-overlay sub-modal-overlay">
                    <div className="modal-content category-modal">
                        <div className="modal-header">
                            <h3>Tambah Kategori Baru</h3>
                            <button onClick={() => setAddCategoryVisible(false)} className="close-btn"><X size={24} /></button>
                        </div>
                        <div className="modal-body">
                            <div className="input-group">
                                <label>Nama Kategori</label>
                                <input 
                                    type="text" 
                                    placeholder="Masukkan nama kategori" 
                                    value={newCategoryName} 
                                    onChange={e => setNewCategoryName(e.target.value)} 
                                    autoFocus
                                />
                            </div>
                            <div className="modal-actions">
                                <button className="cancel-button" onClick={() => setAddCategoryVisible(false)}>Batal</button>
                                <button 
                                    className="primary-button" 
                                    onClick={handleSaveCategory}
                                    style={{ background: isSuperAdmin ? '#B8860B' : '#3498db' }}
                                >
                                    Simpan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CUSTOM CATEGORY PICKER MODAL */}
            {isCategoryPickerVisible && (
                <div className="modal-overlay sub-modal-overlay">
                    <div className="modal-content category-picker-modal">
                        <div className="modal-header">
                            <h3>Pilih Kategori</h3>
                            <button onClick={() => setIsCategoryPickerVisible(false)} className="close-btn"><X size={24} /></button>
                        </div>
                        <div className="modal-body category-picker-list">
                            {categories.map(c => {
                                const isSelected = c.id === newProduct.category_id;
                                return (
                                    <div 
                                        key={c.id} 
                                        className={`category-picker-item ${isSelected ? 'selected-picker-item' : ''}`}
                                        onClick={() => {
                                            setNewProduct(p => ({ ...p, category_id: c.id }));
                                            setIsCategoryPickerVisible(false);
                                        }}
                                    >
                                        <span>{c.name}</span>
                                        {isSelected && <div className="selected-dot" style={{ background: isSuperAdmin ? '#B8860B' : '#3498db' }} />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
