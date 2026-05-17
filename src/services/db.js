// Simulasi Local Database agar fitur tetap berjalan sempurna secara offline (menggunakan localStorage untuk versi Web/Hybrid)

export async function getProducts() {
    const data = localStorage.getItem('products');
    return data ? JSON.parse(data) : [];
}

export async function getCategories() {
    const data = localStorage.getItem('categories');
    return data ? JSON.parse(data) : [{id: 1, name: 'Umum'}, {id: 2, name: 'Makanan'}];
}

export async function addProduct(prod) {
    const prods = await getProducts();
    const cats = await getCategories();
    
    // Cari nama kategori
    const cat = cats.find(c => c.id === parseInt(prod.category_id));
    
    const newProd = {
        ...prod,
        id: Date.now(),
        categoryName: cat ? cat.name : 'Uncategorized',
    };
    prods.push(newProd);
    localStorage.setItem('products', JSON.stringify(prods));
}

export async function addCategory(name) {
    const cats = await getCategories();
    cats.push({ id: Date.now(), name });
    localStorage.setItem('categories', JSON.stringify(cats));
}

export async function updateStock(id, addQty) {
    const prods = await getProducts();
    const idx = prods.findIndex(p => p.id === id);
    if(idx > -1) {
        prods[idx].stock += parseInt(addQty);
        localStorage.setItem('products', JSON.stringify(prods));
    }
}

export async function deleteProduct(id) {
    const prods = await getProducts();
    localStorage.setItem('products', JSON.stringify(prods.filter(p => p.id !== id)));
}

export async function resetDatabase() {
    localStorage.removeItem('products');
    localStorage.removeItem('categories');
    localStorage.removeItem('sales');
}

// Fitur Penjualan Offline (POS & History)
export async function getSales() {
    const data = localStorage.getItem('sales');
    return data ? JSON.parse(data) : [];
}

export async function addSale(saleItems, totalAmount) {
    const sales = await getSales();
    const products = await getProducts();
    
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
        type: 'sale'
    };
    
    sales.unshift(newSale); // Tambahkan transaksi baru di urutan teratas
    localStorage.setItem('sales', JSON.stringify(sales));
    return newSale;
}

export async function getRecentActivity(limit = 5) {
    const sales = await getSales();
    return sales.slice(0, limit);
}

export async function getTodaySalesTotal() {
    const sales = await getSales();
    const today = new Date().toDateString();
    
    return sales
        .filter(s => new Date(s.date).toDateString() === today)
        .reduce((sum, s) => sum + s.total, 0);
}
