// Simulasi Local Database dengan Dukungan Role-Based Authentication & Session Offline
// Menggunakan localStorage untuk menjamin persistensi data offline pada Web & Capacitor APK

// Inisialisasi awal database lokal jika kosong
function initDefaultData() {
    if (!localStorage.getItem('categories')) {
        const defaultCats = [
            { id: 1, name: 'Umum' },
            { id: 2, name: 'Makanan' },
            { id: 3, name: 'Minuman' }
        ];
        localStorage.setItem('categories', JSON.stringify(defaultCats));
    }

    if (!localStorage.getItem('products')) {
        const defaultProds = [
            { id: 1, name: 'Kopi Susu Gula Aren', price: 18000, stock: 45, category_id: 3, categoryName: 'Minuman', is_favorite: 1, image_uri: null, barcode: '8991234567891' },
            { id: 2, name: 'Nasi Goreng Spesial', price: 25000, stock: 20, category_id: 2, categoryName: 'Makanan', is_favorite: 1, image_uri: null, barcode: '8991234567892' },
            { id: 3, name: 'Roti Bakar Cokelat', price: 15000, stock: 15, category_id: 2, categoryName: 'Makanan', is_favorite: 0, image_uri: null, barcode: '8991234567893' }
        ];
        localStorage.setItem('products', JSON.stringify(defaultProds));
    }

    if (!localStorage.getItem('users')) {
        const defaultUsers = [
            { id: 1, username: 'admin', password: 'admin123', full_name: 'Project Owner', role: 'SUPER_ADMIN', email: 'owner@kasir.com' },
            { id: 2, username: 'kasir', password: 'kasir123', full_name: 'Rina Kasir', role: 'ADMIN', email: 'rina@kasir.com' },
            { id: 3, username: 'budi', password: 'budi123', full_name: 'Budi Gudang', role: 'ADMIN', email: 'budi@kasir.com' }
        ];
        localStorage.setItem('users', JSON.stringify(defaultUsers));
    }

    if (!localStorage.getItem('store_settings')) {
        const defaultSettings = {
            store_name: 'Warung Sesama Kita',
            store_address: 'Jl. Sukarno-Hatta No. 45, Palu',
            store_phone: '08123456789',
            store_logo: null,
            splash_color: '#B8860B'
        };
        localStorage.setItem('store_settings', JSON.stringify(defaultSettings));
    }
}

// Jalankan inisialisasi default
initDefaultData();

// --- PENGELOLAAN PRODUK & KATEGORI ---

export async function getProducts() {
    const data = localStorage.getItem('products');
    return data ? JSON.parse(data) : [];
}

export async function getCategories() {
    const data = localStorage.getItem('categories');
    return data ? JSON.parse(data) : [];
}

export async function addProduct(prod) {
    const prods = await getProducts();
    const cats = await getCategories();
    
    const cat = cats.find(c => c.id === parseInt(prod.category_id));
    
    const newProd = {
        ...prod,
        id: Date.now(),
        price: parseFloat(prod.price) || 0,
        stock: parseInt(prod.stock) || 0,
        is_favorite: prod.is_favorite ? 1 : 0,
        categoryName: cat ? cat.name : 'Uncategorized',
    };
    prods.push(newProd);
    localStorage.setItem('products', JSON.stringify(prods));
    
    // Log activity
    addActivityLog("TAMBAH_PRODUK", `Menambahkan produk baru "${newProd.name}" ke inventaris`);
    return newProd;
}

export async function addCategory(name) {
    const cats = await getCategories();
    const cleanName = (name || '').trim();
    if (!cleanName) throw new Error("Nama kategori tidak boleh kosong.");
    
    const exists = cats.some(c => c.name.toLowerCase() === cleanName.toLowerCase());
    if (exists) throw new Error(`Kategori "${cleanName}" sudah terdaftar.`);

    const newCat = { id: Date.now(), name: cleanName };
    cats.push(newCat);
    localStorage.setItem('categories', JSON.stringify(cats));
    
    // Log activity
    addActivityLog("TAMBAH_KATEGORI", `Menambahkan kategori baru "${newCat.name}"`);
    return newCat;
}

export async function updateStock(id, addQty) {
    const prods = await getProducts();
    const idx = prods.findIndex(p => p.id === id);
    if(idx > -1) {
        prods[idx].stock += parseInt(addQty);
        localStorage.setItem('products', JSON.stringify(prods));
        
        // Log activity
        addActivityLog("RESTOCK_PRODUK", `Melakukan restock produk "${prods[idx].name}" sebanyak ${addQty} unit`);
    }
}

export async function deleteProduct(id) {
    const prods = await getProducts();
    const prod = prods.find(p => p.id === id);
    localStorage.setItem('products', JSON.stringify(prods.filter(p => p.id !== id)));
    
    if (prod) {
        // Log activity
        addActivityLog("HAPUS_PRODUK", `Menghapus produk "${prod.name}" dari inventaris`);
    }
}

export async function resetDatabase() {
    localStorage.removeItem('products');
    localStorage.removeItem('categories');
    localStorage.removeItem('sales');
    localStorage.removeItem('users');
    localStorage.removeItem('current_user');
    localStorage.removeItem('store_settings');
    localStorage.removeItem('user_activity_logs');
    initDefaultData();
    
    // Log activity
    addActivityLog("RESET_DATABASE", "Melakukan pembersihan total database aplikasi (Factory Reset)");
}

// --- FITUR TRANSAKSI PENJUALAN (POS & RIWAYAT) ---

export async function getSales() {
    const data = localStorage.getItem('sales');
    return data ? JSON.parse(data) : [];
}

export async function addSale(saleItems, totalAmount, customSignature = null) {
    const sales = await getSales();
    const products = await getProducts();
    const currentUser = getCurrentUser();
    
    // Kurangi stok produk secara realtime
    for (const item of saleItems) {
        const prodIdx = products.findIndex(p => p.id === item.id);
        if (prodIdx > -1) {
            products[prodIdx].stock = Math.max(0, products[prodIdx].stock - item.quantity);
        }
    }
    localStorage.setItem('products', JSON.stringify(products));

    const newSale = {
        id: `TRX-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString(),
        items: saleItems,
        total: totalAmount,
        type: 'sale',
        waiter_name: currentUser ? currentUser.full_name : 'System Admin',
        user_id: currentUser ? currentUser.id : 1,
        // Save cashier signature on receipt if they have one!
        signature: customSignature || (currentUser ? currentUser.signature : null)
    };
    
    sales.unshift(newSale); // Tambahkan transaksi baru di urutan teratas
    localStorage.setItem('sales', JSON.stringify(sales));
    
    // Log activity
    addActivityLog("TRANSAKSI_POS", `Membuat transaksi kasir baru ${newSale.id} total Rp ${totalAmount.toLocaleString()}`);
    return newSale;
}

export async function getRecentActivity(limit = 5, role = 'SUPER_ADMIN', userId = null) {
    const sales = await getSales();
    if (role === 'ADMIN' && userId) {
        return sales.filter(s => s.user_id === userId).slice(0, limit);
    }
    return sales.slice(0, limit);
}

export async function getTodaySalesTotal(role = 'SUPER_ADMIN', userId = null) {
    const sales = await getSales();
    const today = new Date().toDateString();
    
    return sales
        .filter(s => {
            const matchesDate = new Date(s.date).toDateString() === today;
            const matchesUser = role === 'SUPER_ADMIN' || s.user_id === userId;
            return matchesDate && matchesUser;
        })
        .reduce((sum, s) => sum + s.total, 0);
}

// --- MANAGEMENT PENGGUNA (ROLE AUTHENTICATION) ---

export function loginUser(username, password) {
    const cleanUsername = (username || '').trim().toLowerCase();
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    
    const user = users.find(u => u.username.toLowerCase() === cleanUsername && u.password === password);
    if (user) {
        setCurrentUser(user);
        // Log activity
        addActivityLog("LOGIN", `Berhasil masuk ke aplikasi sebagai ${user.full_name}`);
        return user;
    }
    return null;
}

export function registerUser(user) {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const cleanUsername = (user.username || '').trim();
    
    const exists = users.some(u => u.username.toLowerCase() === cleanUsername.toLowerCase());
    if (exists) throw new Error(`Username "${cleanUsername}" sudah digunakan.`);

    const newUser = {
        id: Date.now(),
        username: cleanUsername,
        password: user.password,
        full_name: user.fullName,
        role: user.role || 'ADMIN',
        email: user.email || `${cleanUsername}@kasir.com`
    };
    
    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
    
    // Log activity
    addActivityLog("DAFTAR_KARYAWAN", `Menambahkan karyawan baru "${newUser.full_name}" (${newUser.role})`);
    return newUser;
}

export function getUsers() {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
}

export function deleteUser(id) {
    const users = getUsers();
    const user = users.find(u => u.id === id);
    if (user && user.username === 'admin') {
        throw new Error("Akun default administrator tidak dapat dihapus!");
    }
    
    const filtered = users.filter(u => u.id !== id);
    localStorage.setItem('users', JSON.stringify(filtered));
    
    if (user) {
        // Log activity
        addActivityLog("HAPUS_KARYAWAN", `Menghapus akses karyawan "${user.full_name}"`);
    }
}

export function getCurrentUser() {
    const user = sessionStorage.getItem('current_user') || localStorage.getItem('current_user');
    return user ? JSON.parse(user) : null;
}

export function setCurrentUser(user, rememberMe = true) {
    const data = JSON.stringify(user);
    if (rememberMe) {
        localStorage.setItem('current_user', data);
    }
    sessionStorage.setItem('current_user', data);
}

export function logoutUser() {
    // Log activity before clearing session
    const currentUser = getCurrentUser();
    if (currentUser) {
        addActivityLog("LOGOUT", `Berhasil keluar dari sesi aplikasi (${currentUser.full_name})`);
    }
    sessionStorage.removeItem('current_user');
    localStorage.removeItem('current_user');
}

// --- MANAGEMENT PROFIL TOKO ---

export function getStoreSettings() {
    const settings = localStorage.getItem('store_settings');
    return settings ? JSON.parse(settings) : {
        store_name: 'Warung Sesama Kita',
        store_address: 'Jl. Sukarno-Hatta No. 45, Palu',
        store_phone: '08123456789',
        store_logo: null,
        splash_color: '#B8860B'
    };
}

export function updateStoreSettings(settings) {
    const current = getStoreSettings();
    const updated = {
        ...current,
        ...settings
    };
    localStorage.setItem('store_settings', JSON.stringify(updated));
    return updated;
}

// --- PENGELOLAAN USER & SECURITY LOGS TAMBAHAN ---

export function updateUser(id, data) {
    const users = getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error("Pengguna tidak ditemukan.");

    const updatedUser = {
        ...users[idx],
        full_name: data.fullName !== undefined ? data.fullName : users[idx].full_name,
        password: data.password !== undefined ? data.password : users[idx].password,
        email: data.email !== undefined ? data.email : users[idx].email,
        phone: data.phone !== undefined ? data.phone : users[idx].phone,
        bio: data.bio !== undefined ? data.bio : users[idx].bio,
        profile_photo: data.profile_photo !== undefined ? data.profile_photo : users[idx].profile_photo,
        signature: data.signature !== undefined ? data.signature : users[idx].signature
    };

    users[idx] = updatedUser;
    localStorage.setItem('users', JSON.stringify(users));

    // Update session jika yang sedang login adalah user ini
    const currentUser = getCurrentUser();
    if (currentUser && currentUser.id === id) {
        setCurrentUser(updatedUser);
    }

    // Tambah log aktivitas
    addActivityLog("EDIT_PROFIL", `Mengubah profil pribadi ${updatedUser.full_name}`);
    return updatedUser;
}

export async function voidSale(saleId) {
    const sales = await getSales();
    const products = await getProducts();
    
    const saleIdx = sales.findIndex(s => s.id === saleId);
    if (saleIdx === -1) throw new Error("Transaksi tidak ditemukan.");

    const saleToVoid = sales[saleIdx];
    
    // Kembalikan stok barang yang dibeli
    for (const item of saleToVoid.items) {
        const prodIdx = products.findIndex(p => p.id === item.id);
        if (prodIdx > -1) {
            products[prodIdx].stock += item.quantity;
        }
    }
    
    // Simpan perubahan produk
    localStorage.setItem('products', JSON.stringify(products));

    // Hapus transaksi dari daftar penjualan
    const updatedSales = sales.filter(s => s.id !== saleId);
    localStorage.setItem('sales', JSON.stringify(updatedSales));

    // Catat ke log aktivitas keamanan
    const currentUser = getCurrentUser();
    addActivityLog("VOID_TRANSAKSI", `Membatalkan Transaksi ${saleId} senilai Rp ${saleToVoid.total.toLocaleString()} oleh ${currentUser ? currentUser.full_name : 'System'}`);
}

// --- LOG AKTIVITAS KEAMANAN (AUDIT LOGS) ---

export function addActivityLog(action, details) {
    const logs = JSON.parse(localStorage.getItem('user_activity_logs') || '[]');
    const currentUser = getCurrentUser();
    
    const newLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        action: action, // LOGIN, LOGOUT, VOID_TRANSAKSI, EDIT_PROFIL, TAMBAH_PRODUK, DLL
        details: details,
        user_name: currentUser ? currentUser.full_name : 'System',
        user_role: currentUser ? currentUser.role : 'SYSTEM'
    };
    
    logs.unshift(newLog); // Log terbaru di atas
    localStorage.setItem('user_activity_logs', JSON.stringify(logs.slice(0, 100))); // Batasi maks 100 log
}

export function getActivityLogs() {
    const logs = localStorage.getItem('user_activity_logs');
    if (!logs) {
        // Seeder awal agar log tidak kosong melompong saat didemo
        const seedLogs = [
            { id: 1, timestamp: new Date(Date.now() - 3600000).toISOString(), action: 'LOGIN', details: 'Berhasil login ke aplikasi', user_name: 'Rina Kasir', user_role: 'ADMIN' },
            { id: 2, timestamp: new Date(Date.now() - 7200000).toISOString(), action: 'TAMBAH_PRODUK', details: 'Menambahkan produk baru "Kopi Susu Gula Aren"', user_name: 'Project Owner', user_role: 'SUPER_ADMIN' }
        ];
        localStorage.setItem('user_activity_logs', JSON.stringify(seedLogs));
        return seedLogs;
    }
    return JSON.parse(logs);
}

