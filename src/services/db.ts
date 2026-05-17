import * as SQLite from 'expo-sqlite';

let dbInstance: SQLite.SQLiteDatabase | null = null;
let initPromise: Promise<SQLite.SQLiteDatabase> | null = null;

// Helper: returns ISO-like string in LOCAL timezone (not UTC)
const toLocalISO = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

const todayLocal = () => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

/**
 * Robust initialization that ensures the database is fully ready 
 * before any operation can access it.
 */
export const initDB = async (): Promise<SQLite.SQLiteDatabase> => {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        try {
            console.log('[DB] Connecting to pos_kasir.db...');
            const db = await SQLite.openDatabaseAsync('pos_kasir.db');

            // 1. Core Config
            console.log('[DB] Applying PRAGMAs...');
            await db.execAsync('PRAGMA foreign_keys = ON;');
            await db.execAsync('PRAGMA journal_mode = WAL;');

            // 2. Schema Creation (one table per call to avoid native crashes)
            console.log('[DB] Checking/Creating Tables...');
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS categories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT UNIQUE NOT NULL
                );
            `);
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    price REAL NOT NULL,
                    stock INTEGER NOT NULL,
                    category_id INTEGER,
                    is_favorite INTEGER DEFAULT 0,
                    image_uri TEXT,
                    FOREIGN KEY (category_id) REFERENCES categories (id)
                );
            `);
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    full_name TEXT,
                    role TEXT,
                    email TEXT,
                    phone TEXT,
                    bio TEXT
                );
            `);
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    total REAL NOT NULL,
                    date TEXT NOT NULL,
                    payment_method TEXT NOT NULL,
                    amount_paid REAL DEFAULT 0,
                    change_amount REAL DEFAULT 0,
                    user_id INTEGER,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                );
            `);
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS transaction_items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transaction_id INTEGER NOT NULL,
                    product_id INTEGER NOT NULL,
                    qty INTEGER NOT NULL,
                    price_at_sale REAL NOT NULL,
                    FOREIGN KEY (transaction_id) REFERENCES transactions (id),
                    FOREIGN KEY (product_id) REFERENCES products (id)
                );
            `);
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS user_logs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER,
                    event TEXT NOT NULL,
                    timestamp TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users (id)
                );
            `);
            await db.execAsync(`
                CREATE TABLE IF NOT EXISTS store_settings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    store_name TEXT DEFAULT 'V-POS Store',
                    store_address TEXT DEFAULT '',
                    store_phone TEXT DEFAULT '',
                    store_logo TEXT,
                    splash_color TEXT DEFAULT '#4CAF7D'
                );
            `);

            // 3. Columns Migrations (Individual checks to avoid massive SQL failures)
            console.log('[DB] Running Migrations...');

            // Products Migrations
            const productsInfo = await db.getAllAsync<any>('PRAGMA table_info(products)');
            if (!productsInfo.some(col => col.name === 'is_favorite')) {
                await db.execAsync('ALTER TABLE products ADD COLUMN is_favorite INTEGER DEFAULT 0;');
            }
            if (!productsInfo.some(col => col.name === 'image_uri')) {
                await db.execAsync('ALTER TABLE products ADD COLUMN image_uri TEXT;');
            }

            // Transactions Migrations
            const transInfo = await db.getAllAsync<any>('PRAGMA table_info(transactions)');
            if (!transInfo.some(col => col.name === 'amount_paid')) {
                await db.execAsync('ALTER TABLE transactions ADD COLUMN amount_paid REAL DEFAULT 0;');
            }
            if (!transInfo.some(col => col.name === 'change_amount')) {
                await db.execAsync('ALTER TABLE transactions ADD COLUMN change_amount REAL DEFAULT 0;');
            }
            if (!transInfo.some(col => col.name === 'user_id')) {
                await db.execAsync('ALTER TABLE transactions ADD COLUMN user_id INTEGER;');
            }

            // Users Migrations
            const usersInfo = await db.getAllAsync<any>('PRAGMA table_info(users)');
            if (!usersInfo.some(col => col.name === 'email')) {
                await db.execAsync('ALTER TABLE users ADD COLUMN email TEXT;');
            }
            if (!usersInfo.some(col => col.name === 'phone')) {
                await db.execAsync('ALTER TABLE users ADD COLUMN phone TEXT;');
            }
            if (!usersInfo.some(col => col.name === 'bio')) {
                await db.execAsync('ALTER TABLE users ADD COLUMN bio TEXT;');
            }
            if (!usersInfo.some(col => col.name === 'profile_photo')) {
                await db.execAsync('ALTER TABLE users ADD COLUMN profile_photo TEXT;');
            }

            // Products Migrations (Barcode)
            const productsInfo2 = await db.getAllAsync<any>('PRAGMA table_info(products)');
            if (!productsInfo2.some(col => col.name === 'barcode')) {
                await db.execAsync('ALTER TABLE products ADD COLUMN barcode TEXT;');
            }

            // 4. Seeding Default Admin
            console.log('[DB] Checking Default Admin...');
            const admin = await db.getFirstAsync<any>("SELECT id FROM users WHERE username = 'admin' COLLATE NOCASE");

            if (!admin) {
                console.log('[DB] Seeding Admin...');
                await db.runAsync(
                    'INSERT INTO users (username, password, full_name, role, email, phone, bio) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    ['admin', 'admin123', 'Project Admin', 'SUPER_ADMIN', 'admin@vpos.com', '', 'System Super Administrator']
                );
            } else {
                console.log('[DB] Ensuring Admin has SUPER_ADMIN role...');
                await db.runAsync("UPDATE users SET role = 'SUPER_ADMIN' WHERE username = 'admin' COLLATE NOCASE");
            }

            console.log('[DB] Initialization Successful.');
            dbInstance = db;
            return db;
        } catch (error) {
            console.error('[DB] Critical failed during init:', error);
            initPromise = null;
            throw error;
        }
    })();

    return initPromise;
};

export const getDB = async (): Promise<SQLite.SQLiteDatabase> => {
    if (dbInstance) return dbInstance;
    return await initDB();
};

// --- DATA ACCESS METHODS ---

export const getCategories = async () => {
    const db = await getDB();
    return await db.getAllAsync<{ id: number, name: string }>('SELECT * FROM categories ORDER BY name ASC');
};

export const getProducts = async (categoryName: string = 'All') => {
    const db = await getDB();
    if (categoryName === 'All') {
        return await db.getAllAsync<any>('SELECT p.*, c.name as categoryName FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.name ASC');
    } else if (categoryName === '⭐ Favs') {
        return await db.getAllAsync<any>('SELECT p.*, c.name as categoryName FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.is_favorite = 1 ORDER BY p.name ASC');
    } else {
        return await db.getAllAsync<any>('SELECT p.*, c.name as categoryName FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE c.name = ? ORDER BY p.name ASC', [categoryName]);
    }
};

export const getProductByBarcode = async (barcode: string) => {
    const db = await getDB();
    return await db.getFirstAsync<any>('SELECT p.*, c.name as categoryName FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.barcode = ?', [barcode]);
};

export const processSale = async (items: any[], paymentInfo: { total: number, method: string, paid: number, change: number, userId: number }) => {
    const db = await getDB();
    await db.withTransactionAsync(async () => {
        const result = await db.runAsync(
            'INSERT INTO transactions (total, date, payment_method, amount_paid, change_amount, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [paymentInfo.total, toLocalISO(), paymentInfo.method, paymentInfo.paid, paymentInfo.change, paymentInfo.userId]
        );
        const transactionId = result.lastInsertRowId;
        for (const item of items) {
            await db.runAsync(
                'INSERT INTO transaction_items (transaction_id, product_id, qty, price_at_sale) VALUES (?, ?, ?, ?)',
                [transactionId, item.id, item.qty, item.price]
            );
            await db.runAsync('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, item.id]);
        }
    });
};

export const getTransactions = async (role?: string, userId?: number) => {
    const db = await getDB();
    if (role === 'ADMIN' && userId) {
        return await db.getAllAsync<any>(`
            SELECT t.*, u.full_name as waiter_name 
            FROM transactions t 
            LEFT JOIN users u ON t.user_id = u.id 
            WHERE t.user_id = ? 
            ORDER BY t.date DESC
        `, [userId]);
    }
    return await db.getAllAsync<any>(`
        SELECT t.*, u.full_name as waiter_name 
        FROM transactions t 
        LEFT JOIN users u ON t.user_id = u.id 
        ORDER BY t.date DESC
    `);
};

export const getTransactionItems = async (transactionId: number) => {
    const db = await getDB();
    return await db.getAllAsync<any>(`
        SELECT ti.*, p.name 
        FROM transaction_items ti 
        JOIN products p ON ti.product_id = p.id 
        WHERE ti.transaction_id = ?
    `, [transactionId]);
};

export const getReportsSummary = async () => {
    const db = await getDB();
    const totalSales = await db.getFirstAsync<{ total: number }>('SELECT SUM(total) as total FROM transactions');
    const totalOrders = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM transactions');
    const topProducts = await db.getAllAsync<any>(`
        SELECT p.name, SUM(ti.qty) as sales 
        FROM transaction_items ti 
        JOIN products p ON ti.product_id = p.id 
        GROUP BY p.id 
        ORDER BY sales DESC 
        LIMIT 5
    `);
    return {
        totalSales: totalSales?.total || 0,
        totalOrders: totalOrders?.count || 0,
        topProducts
    };
};

export const getRecentActivity = async (limit: number = 5, role?: string, userId?: number) => {
    const db = await getDB();
    if (role === 'ADMIN' && userId) {
        return await db.getAllAsync<any>(`
            SELECT id, total, date, payment_method, 'sale' as type 
            FROM transactions 
            WHERE user_id = ?
            ORDER BY date DESC 
            LIMIT ?
        `, [userId, limit]);
    }
    return await db.getAllAsync<any>(`
        SELECT id, total, date, payment_method, 'sale' as type 
        FROM transactions 
        ORDER BY date DESC 
        LIMIT ?
    `, [limit]);
};

export const clearTransactions = async () => {
    const db = await getDB();
    await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM transaction_items');
        await db.runAsync('DELETE FROM transactions');
    });
};

export const getTodaySales = async () => {
    const db = await getDB();
    const today = todayLocal();
    const result = await db.getFirstAsync<{ total: number }>(
        'SELECT SUM(total) as total FROM transactions WHERE date LIKE ?',
        [`${today}%`]
    );
    return result?.total || 0;
};

export const getSessionSales = async (userId: number) => {
    const db = await getDB();

    // 1. Get the last login timestamp for this user
    const lastLogin = await db.getFirstAsync<{ timestamp: string }>(
        "SELECT timestamp FROM user_logs WHERE user_id = ? AND event = 'LOGIN' ORDER BY timestamp DESC LIMIT 1",
        [userId]
    );

    if (!lastLogin) return 0;

    // 2. Sum transactions from that timestamp onwards
    const result = await db.getFirstAsync<{ total: number }>(
        'SELECT SUM(total) as total FROM transactions WHERE user_id = ? AND date >= ?',
        [userId, lastLogin.timestamp]
    );

    return result?.total || 0;
};

export const getGlobalTodaySales = async () => {
    return await getTodaySales();
};

export const getClosingReportData = async (dateFilter?: string) => {
    const db = await getDB();
    const targetDate = dateFilter || todayLocal();
    const todayPattern = `${targetDate}%`;

    // 1. Summary Metrics
    const summary = await db.getFirstAsync<any>(`
        SELECT 
            SUM(total) as total_sales,
            COUNT(*) as total_orders,
            SUM(CASE WHEN payment_method = 'Cash' THEN total ELSE 0 END) as cash_sales,
            SUM(CASE WHEN payment_method != 'Cash' THEN total ELSE 0 END) as non_cash_sales
        FROM transactions 
        WHERE date LIKE ?
    `, [todayPattern]);

    // 2. Top Products
    const topProducts = await db.getAllAsync<any>(`
        SELECT p.name, SUM(ti.qty) as qty, SUM(ti.qty * ti.price_at_sale) as total
        FROM transaction_items ti
        JOIN products p ON ti.product_id = p.id
        JOIN transactions t ON ti.transaction_id = t.id
        WHERE t.date LIKE ?
        GROUP BY p.id
        ORDER BY qty DESC
        LIMIT 5
    `, [todayPattern]);

    // 3. User Shift Summary
    const userSummary = await db.getAllAsync<any>(`
        SELECT u.full_name, SUM(t.total) as total
        FROM transactions t
        JOIN users u ON t.user_id = u.id
        WHERE t.date LIKE ?
        GROUP BY u.id
    `, [todayPattern]);

    // 4. Activity Logs (Security)
    const logs = await db.getAllAsync<any>(`
        SELECT u.full_name, l.event, l.timestamp
        FROM user_logs l
        JOIN users u ON l.user_id = u.id
        WHERE l.timestamp LIKE ?
        ORDER BY l.timestamp ASC
    `, [todayPattern]);

    // 5. Low Stock Alert
    const lowStock = await db.getAllAsync<any>(`
        SELECT name, stock FROM products WHERE stock < 10
    `);

    // 6. Detailed Transactions
    const transactions = await db.getAllAsync<any>(`
        SELECT t.*, u.full_name as waiter_name
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.date LIKE ?
        ORDER BY t.date DESC
    `, [todayPattern]);

    return {
        date: targetDate,
        summary: summary || { total_sales: 0, total_orders: 0, cash_sales: 0, non_cash_sales: 0 },
        topProducts,
        userSummary,
        logs,
        lowStock,
        transactions
    };
};

export const updateStock = async (productId: number, delta: number) => {
    const db = await getDB();
    await db.runAsync('UPDATE products SET stock = stock + ? WHERE id = ?', [delta, productId]);
};

export const addProduct = async (product: { name: string, price: number, stock: number, category_id: number, image_uri?: string | null, barcode?: string | null }) => {
    const db = await getDB();
    const safeName = (product.name || 'Unnamed Product').trim();
    const safePrice = isNaN(product.price) ? 0 : product.price;
    const safeStock = isNaN(product.stock) ? 0 : product.stock;
    try {
        await db.runAsync(
            'INSERT INTO products (name, price, stock, category_id, is_favorite, image_uri, barcode) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [safeName, safePrice, safeStock, product.category_id, 0, product.image_uri || null, product.barcode || null]
        );
    } catch (error) {
        console.error('SQL Error in addProduct:', error);
        throw error;
    }
};

export const addCategory = async (name: string) => {
    const db = await getDB();
    const safeName = (name || '').trim();
    if (!safeName) throw new Error("Category name cannot be empty.");
    try {
        await db.runAsync('INSERT INTO categories (name) VALUES (?)', [safeName]);
    } catch (error: any) {
        if (error.message?.includes('UNIQUE') || error.message?.includes('code 2067')) {
            throw new Error(`Category "${safeName}" already exists.`);
        }
        throw error;
    }
};

export const deleteProduct = async (id: number) => {
    const db = await getDB();
    await db.runAsync('DELETE FROM products WHERE id = ?', [id]);
};

export const clearProducts = async () => {
    const db = await getDB();
    await db.runAsync('DELETE FROM products');
};

export const resetDatabase = async () => {
    const db = await getDB();
    await db.withTransactionAsync(async () => {
        await db.runAsync('DELETE FROM transaction_items');
        await db.runAsync('DELETE FROM transactions');
        await db.runAsync('DELETE FROM products');
        await db.runAsync('DELETE FROM categories');
    });
};

// --- AUTHENTICATION METHODS ---

export const loginUser = async (username: string, password: string) => {
    const db = await getDB();
    return await db.getFirstAsync<any>(
        'SELECT * FROM users WHERE username = ? COLLATE NOCASE AND password = ?',
        [username.trim(), password]
    );
};

export const registerUser = async (user: { username: string, password: string, fullName: string, role: string, email?: string, phone?: string, bio?: string }) => {
    const db = await getDB();
    const cleanUsername = user.username.trim();
    const existing = await db.getFirstAsync<any>('SELECT id FROM users WHERE username = ? COLLATE NOCASE', [cleanUsername]);
    if (existing) throw new Error(`Username "${cleanUsername}" is already taken.`);
    await db.runAsync(
        'INSERT INTO users (username, password, full_name, role, email, phone, bio) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [cleanUsername, user.password, user.fullName, user.role, user.email || null, user.phone || null, user.bio || null]
    );
};

export const getUsers = async () => {
    const db = await getDB();
    return await db.getAllAsync<any>('SELECT id, username, password, full_name, role FROM users ORDER BY full_name ASC');
};

export const deleteUser = async (id: number) => {
    const db = await getDB();
    await db.runAsync('DELETE FROM users WHERE id = ?', [id]);
};

export const updateUser = async (id: number, data: { fullName: string, password?: string, email?: string, phone?: string, bio?: string, profile_photo?: string | null }) => {
    const db = await getDB();
    if (data.password) {
        await db.runAsync(
            'UPDATE users SET full_name = ?, password = ?, email = ?, phone = ?, bio = ?, profile_photo = ? WHERE id = ?',
            [data.fullName, data.password, data.email || null, data.phone || null, data.bio || null, data.profile_photo !== undefined ? data.profile_photo : null, id]
        );
    } else {
        await db.runAsync(
            'UPDATE users SET full_name = ?, email = ?, phone = ?, bio = ?, profile_photo = ? WHERE id = ?',
            [data.fullName, data.email || null, data.phone || null, data.bio || null, data.profile_photo !== undefined ? data.profile_photo : null, id]
        );
    }
};

export const getUserById = async (id: number) => {
    const db = await getDB();
    if (!id) return null;
    return await db.getFirstAsync<any>('SELECT * FROM users WHERE id = ?', [id]);
};

// --- AUDIT TRAIL METHODS ---

export const logUserActivity = async (userId: number, event: 'LOGIN' | 'LOGOUT') => {
    const db = await getDB();
    await db.runAsync(
        'INSERT INTO user_logs (user_id, event, timestamp) VALUES (?, ?, ?)',
        [userId, event, toLocalISO()]
    );
};

export const getUserLogs = async (dateFilter?: string) => {
    const db = await getDB();
    if (dateFilter) {
        return await db.getAllAsync<any>(`
            SELECT l.*, u.full_name, u.username 
            FROM user_logs l 
            JOIN users u ON l.user_id = u.id 
            WHERE l.timestamp LIKE ?
            ORDER BY l.timestamp DESC
        `, [`${dateFilter}%`]);
    }
    return await db.getAllAsync<any>(`
        SELECT l.*, u.full_name, u.username 
        FROM user_logs l 
        JOIN users u ON l.user_id = u.id 
        ORDER BY l.timestamp DESC 
        LIMIT 50
    `);
};

// --- STORE SETTINGS METHODS ---

export const getStoreSettings = async () => {
    const db = await getDB();
    let settings = await db.getFirstAsync<any>('SELECT * FROM store_settings WHERE id = 1');
    if (!settings) {
        await db.runAsync(
            "INSERT INTO store_settings (id, store_name, store_address, store_phone, store_logo, splash_color) VALUES (1, 'V-POS Store', '', '', NULL, '#4CAF7D')"
        );
        settings = await db.getFirstAsync<any>('SELECT * FROM store_settings WHERE id = 1');
    }
    return settings;
};

export const updateStoreSettings = async (data: {
    store_name?: string;
    store_address?: string;
    store_phone?: string;
    store_logo?: string | null;
    splash_color?: string;
}) => {
    const db = await getDB();
    // Ensure row exists
    await getStoreSettings();
    await db.runAsync(
        'UPDATE store_settings SET store_name = ?, store_address = ?, store_phone = ?, store_logo = ?, splash_color = ? WHERE id = 1',
        [
            data.store_name || 'V-POS Store',
            data.store_address || '',
            data.store_phone || '',
            data.store_logo !== undefined ? data.store_logo : null,
            data.splash_color || '#4CAF7D',
        ]
    );
};
