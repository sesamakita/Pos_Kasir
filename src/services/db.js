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
}
