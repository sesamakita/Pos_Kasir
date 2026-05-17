import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform, Image, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { CameraView, useCameraPermissions } from 'expo-camera'; // Updated import
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, appStyles } from '../theme';
import { AppButton } from '../components/AppButton';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import * as db from '../services/db';

type SortMode = 'az' | 'za' | 'price_asc' | 'price_desc' | 'stock_asc';

const SORT_OPTIONS: { key: SortMode; label: string; icon: string }[] = [
    { key: 'az', label: 'A-Z', icon: 'text-outline' },
    { key: 'za', label: 'Z-A', icon: 'text-outline' },
    { key: 'price_asc', label: 'Harga ↑', icon: 'trending-up-outline' },
    { key: 'price_desc', label: 'Harga ↓', icon: 'trending-down-outline' },
    { key: 'stock_asc', label: 'Stok ↓', icon: 'alert-circle-outline' },
];

export const InventoryScreen = ({ navigation, route }: any) => {
    const userData = route.params?.user || { id: 1, role: 'ADMIN' };
    const isSuperAdmin = userData.role === 'SUPER_ADMIN';

    const [inventory, setInventory] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);

    // Search & Filter State
    const [searchQuery, setSearchQuery] = useState('');
    const [sortMode, setSortMode] = useState<SortMode>('az');
    const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All');

    // Restock Modal State
    const [isRestockVisible, setRestockVisible] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [restockQty, setRestockQty] = useState('');

    // Add Product Modal State
    const [isAddVisible, setAddVisible] = useState(false);
    const [newProduct, setNewProduct] = useState({
        name: '',
        price: '',
        stock: '',
        category_id: 0,
        image_uri: null as string | null,
        barcode: '' // Added barcode field
    });

    // Scanner State
    const [isScannerVisible, setScannerVisible] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();

    // New Category State
    const [isAddingCategory, setIsAddingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const [prodData, catData] = await Promise.all([
            db.getProducts(),
            db.getCategories()
        ]);
        setInventory(prodData);
        setCategories(catData);
        if (catData.length > 0 && newProduct.category_id === 0) {
            setNewProduct((prev: any) => ({ ...prev, category_id: catData[0].id }));
        }
    };

    const handleRestock = async () => {
        const qty = parseInt(restockQty);
        if (isNaN(qty) || qty <= 0) {
            Alert.alert("Invalid Quantity", "Please enter a valid number.");
            return;
        }

        try {
            await db.updateStock(selectedProduct.id, qty);
            setRestockVisible(false);
            setRestockQty('');
            loadData();
            Alert.alert("Success", `Stock updated!`);
        } catch (error: any) {
            Alert.alert("Error", `Failed to update stock: ${error.message}`);
        }
    };

    const pickImage = async () => {
        Alert.alert(
            "Product Image",
            "Choose a source for your product image",
            [
                {
                    text: "📷 Take Photo",
                    onPress: async () => {
                        const { status } = await ImagePicker.requestCameraPermissionsAsync();
                        if (status !== 'granted') {
                            Alert.alert("Permission Denied", "Camera access is required to take photos.");
                            return;
                        }

                        const result = await ImagePicker.launchCameraAsync({
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.7,
                        });

                        if (!result.canceled) {
                            setNewProduct(prev => ({ ...prev, image_uri: result.assets[0].uri }));
                        }
                    }
                },
                {
                    text: "🖼️ Choose from Gallery",
                    onPress: async () => {
                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.7,
                        });

                        if (!result.canceled) {
                            setNewProduct(prev => ({ ...prev, image_uri: result.assets[0].uri }));
                        }
                    }
                },
                { text: "Cancel", style: "cancel" }
            ]
        );
    };

    const handleClearInventory = () => {
        Alert.alert(
            "Clear Database",
            "Are you sure you want to delete ALL data (Products, Categories, and Transactions)? This cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Reset Everything",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await db.resetDatabase();
                            loadData();
                            Alert.alert("Success", "Database has been reset to empty.");
                        } catch (error: any) {
                            Alert.alert("Reset Failed", `Error: ${error.message}`);
                        }
                    }
                }
            ]
        );
    };

    const handleAddProduct = async () => {
        const { name, price, stock, category_id } = newProduct;

        // 1. Parsing & Strict Validation
        const parsedPrice = parseFloat(price);
        const parsedStock = parseInt(stock);

        if (!name || name.trim().length === 0) {
            Alert.alert("Input Error", "Please enter a product name.");
            return;
        }

        if (isNaN(parsedPrice) || parsedPrice <= 0) {
            Alert.alert("Input Error", "Please enter a valid price (must be greater than 0).");
            return;
        }

        if (isNaN(parsedStock) || parsedStock < 0) {
            Alert.alert("Input Error", "Please enter a valid stock number (cannot be negative).");
            return;
        }

        if (!category_id || category_id === 0) {
            Alert.alert("Input Error", "Please select a category.");
            return;
        }

        // 2. Duplicate Check
        const isDuplicate = inventory.some(item =>
            item.name.toLowerCase() === name.trim().toLowerCase()
        );
        if (isDuplicate) {
            Alert.alert("Duplicate Product", `A product with the name "${name.trim()}" already exists.`);
            return;
        }

        try {
            await db.addProduct({
                name: name.trim(),
                price: parsedPrice,
                stock: parsedStock,
                category_id: category_id,
                image_uri: newProduct.image_uri,
                barcode: newProduct.barcode // Save barcode
            });
            setAddVisible(false);
            setNewProduct({ name: '', price: '', stock: '', category_id: categories[0]?.id || 0, image_uri: null, barcode: '' });
            loadData();
            Alert.alert("Success", "Product added successfully!");
        } catch (error: any) {
            console.error("Add product failed:", error);
            Alert.alert("Database Error", `Unable to save product: ${error.message}`);
        }
    };

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            Alert.alert("Input Error", "Please enter a category name.");
            return;
        }

        try {
            await db.addCategory(newCategoryName.trim());
            const updatedCategories = await db.getCategories();
            setCategories(updatedCategories);

            // Auto-select the newly created category
            const newCat = updatedCategories.find(c => c.name.toLowerCase() === newCategoryName.trim().toLowerCase());
            if (newCat) {
                setNewProduct(prev => ({ ...prev, category_id: newCat.id }));
            }

            setNewCategoryName('');
            setIsAddingCategory(false);
            Alert.alert("Success", "Category added!");
        } catch (error: any) {
            console.error("Add category error:", error);
            Alert.alert("Error", `Failed to add category: ${error.message || 'Unknown error'}`);
        }
    };

    const handleBarcodeScanned = ({ data }: { data: string }) => {
        setNewProduct(prev => ({ ...prev, barcode: data }));
        setScannerVisible(false);
        Alert.alert("Scanned!", `Barcode: ${data}`);
    };

    const handleDeleteProduct = async (product: any) => {
        Alert.alert(
            "Delete Product",
            `Are you sure you want to delete "${product.name}"? This action cannot be undone.`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await db.deleteProduct(product.id);
                            loadData(); // Refresh list
                            Alert.alert("Deleted", "Product removed successfully.");
                        } catch (error: any) {
                            console.error("Delete error:", error);
                            if (error.message?.includes("FOREIGN KEY")) {
                                Alert.alert("Cannot Delete", "This product has sales records. Please reset the database to clear it completely.");
                            } else {
                                Alert.alert("Error", `Failed to delete: ${error.message}`);
                            }
                        }
                    }
                }
            ]
        );
    };

    const openRestock = (product: any) => {
        setSelectedProduct(product);
        setRestockVisible(true);
    };

    // Computed: filter + sort inventory
    const filteredInventory = useMemo(() => {
        let result = [...inventory];

        // 1. Filter by category
        if (selectedCategoryFilter !== 'All') {
            result = result.filter(item =>
                (item.categoryName || 'No Category') === selectedCategoryFilter
            );
        }

        // 2. Filter by search query
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.name.toLowerCase().includes(q)
            );
        }

        // 3. Sort
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
        }

        return result;
    }, [inventory, searchQuery, sortMode, selectedCategoryFilter]);

    // Unique category names for filter chips
    const categoryFilterOptions = useMemo(() => {
        const uniqueCats = [...new Set(inventory.map(item => item.categoryName || 'No Category'))];
        return ['All', ...uniqueCats];
    }, [inventory]);

    // Filter popup state
    const [isFilterVisible, setFilterVisible] = useState(false);
    const hasActiveFilters = sortMode !== 'az' || selectedCategoryFilter !== 'All';

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <AppHeader
                title="Inventory"
                onBack={() => navigation.goBack()}
                rightElement={
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.s }}>
                        {isSuperAdmin && (
                            <TouchableOpacity
                                style={styles.headerCircleBtn}
                                onPress={handleClearInventory}
                            >
                                <Ionicons name="trash-outline" size={20} color={colors.error} />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.headerCircleBtn, { backgroundColor: colors.primary }]}
                            onPress={() => setAddVisible(true)}
                        >
                            <Ionicons name="add" size={24} color="white" />
                        </TouchableOpacity>
                    </View>
                }
            />

            {/* Search Bar + Filter Icon */}
            <View style={styles.searchSection}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color={colors.textSubtle} />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Cari produk..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={colors.textSubtle}
                        returnKeyType="search"
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); Keyboard.dismiss(); }}>
                            <Ionicons name="close-circle" size={20} color={colors.textSubtle} />
                        </TouchableOpacity>
                    )}
                </View>
                <TouchableOpacity
                    style={[styles.filterIconBtn, hasActiveFilters && styles.filterIconBtnActive]}
                    onPress={() => setFilterVisible(true)}
                >
                    <Ionicons
                        name="options-outline"
                        size={22}
                        color={hasActiveFilters ? 'white' : colors.primaryDark}
                    />
                    {hasActiveFilters && <View style={styles.filterBadgeDot} />}
                </TouchableOpacity>
            </View>

            {/* Active Filter Summary (compact) */}
            {hasActiveFilters && (
                <View style={styles.activeFilterBar}>
                    <Text style={styles.activeFilterText}>
                        {sortMode !== 'az' && `Urut: ${SORT_OPTIONS.find(o => o.key === sortMode)?.label}`}
                        {sortMode !== 'az' && selectedCategoryFilter !== 'All' && '  •  '}
                        {selectedCategoryFilter !== 'All' && `Kategori: ${selectedCategoryFilter}`}
                    </Text>
                    <TouchableOpacity onPress={() => { setSortMode('az'); setSelectedCategoryFilter('All'); }}>
                        <Text style={styles.clearFilterText}>Reset</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Result Counter */}
            <View style={styles.resultCounter}>
                <Text style={styles.resultCounterText}>
                    Menampilkan {filteredInventory.length} dari {inventory.length} produk
                </Text>
            </View>

            <FlatList
                data={filteredInventory}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ padding: spacing.m, paddingTop: 0 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                    <View style={styles.emptyList}>
                        <Ionicons name="search-outline" size={48} color={colors.textSubtle} />
                        <Text style={styles.emptyListText}>Tidak ada produk ditemukan</Text>
                        <Text style={styles.emptyListSub}>Coba ubah filter atau kata kunci pencarian</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <AppCard style={StyleSheet.flatten([
                        styles.itemCard,
                        item.stock < 10 ? styles.lowStockCard : null
                    ])}>
                        <View style={styles.itemLeft}>
                            <View style={styles.iconBox}>
                                {item.image_uri ? (
                                    <Image source={{ uri: item.image_uri }} style={styles.productIcon} />
                                ) : (
                                    <Ionicons name="cube-outline" size={24} color={colors.primary} />
                                )}
                                {item.stock < 10 && (
                                    <View style={styles.lowStockBadge}>
                                        <Ionicons name="alert-circle" size={10} color="white" />
                                    </View>
                                )}
                            </View>
                            <View>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemCat}>{item.categoryName || 'No Category'}</Text>
                            </View>
                        </View>
                        <View style={styles.itemRight}>
                            <Text style={styles.itemPrice}>Rp {item.price.toLocaleString()}</Text>
                            <View style={styles.stockRow}>
                                <Text style={[styles.itemStock, item.stock < 10 && { color: colors.error, fontWeight: 'bold' }]}>
                                    Stock: {item.stock}
                                </Text>
                                <View style={{ flexDirection: 'row', gap: spacing.s }}>
                                    <TouchableOpacity
                                        style={styles.quickAddBtn}
                                        onPress={() => openRestock(item)}
                                    >
                                        <Ionicons name="add" size={18} color={colors.primary} />
                                    </TouchableOpacity>
                                    {isSuperAdmin && (
                                        <TouchableOpacity
                                            style={[styles.quickAddBtn, { backgroundColor: colors.error + '15' }]}
                                            onPress={() => handleDeleteProduct(item)}
                                        >
                                            <Ionicons name="trash-outline" size={16} color={colors.error} />
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        </View>
                    </AppCard>
                )}
            />

            {/* Quick Restock Modal */}
            <Modal visible={isRestockVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Quick Restock</Text>
                        <Text style={styles.modalSub}>{selectedProduct?.name}</Text>

                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Quantity to Add</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                placeholder="e.g. 50"
                                value={restockQty}
                                onChangeText={setRestockQty}
                                autoFocus
                            />
                        </View>

                        <View style={styles.modalActions}>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.cancelBtn]}
                                onPress={() => setRestockVisible(false)}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, styles.saveBtn]}
                                onPress={handleRestock}
                            >
                                <Text style={styles.saveBtnText}>Update Stock</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Add Product Modal */}
            <Modal visible={isAddVisible} transparent animationType="slide">
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={styles.modalOverlay}
                >
                    <View style={[styles.modalContent, { maxHeight: '90%' }]}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>New Product</Text>
                            <TouchableOpacity onPress={() => setAddVisible(false)}>
                                <Text style={{ fontSize: 20, color: colors.textSubtle }}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                            <TouchableOpacity style={styles.imagePickerBtn} onPress={pickImage}>
                                {newProduct.image_uri ? (
                                    <Image source={{ uri: newProduct.image_uri }} style={styles.pickedImage} />
                                ) : (
                                    <View style={styles.imagePlaceholder}>
                                        <Ionicons name="camera-outline" size={40} color={colors.primary} />
                                        <Text style={styles.imagePlaceholderText}>Add Product Image</Text>
                                    </View>
                                )}
                            </TouchableOpacity>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Product Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter product name"
                                    value={newProduct.name}
                                    onChangeText={(txt) => setNewProduct(p => ({ ...p, name: txt }))}
                                />

                            </View>

                            <View style={styles.inputContainer}>
                                <Text style={styles.inputLabel}>Barcode (Optional)</Text>
                                <View style={{ flexDirection: 'row', gap: 8 }}>
                                    <TextInput
                                        style={[styles.input, { flex: 1 }]}
                                        placeholder="Scan or type barcode"
                                        value={newProduct.barcode}
                                        onChangeText={(txt) => setNewProduct(p => ({ ...p, barcode: txt }))}
                                    />
                                    <TouchableOpacity
                                        style={styles.scanBtn}
                                        onPress={async () => {
                                            if (!permission?.granted) {
                                                const { granted } = await requestPermission();
                                                if (!granted) {
                                                    Alert.alert("Permission", "Camera permission is required to scan barcodes.");
                                                    return;
                                                }
                                            }
                                            setScannerVisible(true);
                                        }}
                                    >
                                        <Ionicons name="scan-outline" size={20} color="white" />
                                    </TouchableOpacity>
                                </View>
                            </View>

                            <View style={[styles.inputContainer, { backgroundColor: colors.secondary + '20', padding: spacing.s, borderRadius: 16 }]}>
                                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.s }}>
                                    <Text style={[styles.inputLabel, { marginBottom: 0 }]}>Category</Text>
                                    <TouchableOpacity onPress={() => setIsAddingCategory(!isAddingCategory)}>
                                        <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 13 }}>
                                            {isAddingCategory ? '✕ Cancel' : '+ Add New Category'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>

                                {isAddingCategory ? (
                                    <View style={styles.addCategoryRow}>
                                        <TextInput
                                            style={[styles.input, { flex: 1, height: 44, backgroundColor: 'white' }]}
                                            placeholder="Enter New Category Name"
                                            value={newCategoryName}
                                            onChangeText={setNewCategoryName}
                                            autoFocus
                                        />
                                        <TouchableOpacity
                                            style={styles.addCategoryBtn}
                                            onPress={handleAddCategory}
                                        >
                                            <Text style={{ color: 'white', fontWeight: 'bold' }}>Save</Text>
                                        </TouchableOpacity>
                                    </View>
                                ) : (
                                    <View style={styles.categoryPicker}>
                                        {categories.length === 0 ? (
                                            <Text style={{ fontStyle: 'italic', color: colors.textSubtle, fontSize: 12, padding: 10 }}>
                                                No categories yet. Click "+ Add New" above.
                                            </Text>
                                        ) : (
                                            categories.map(cat => (
                                                <TouchableOpacity
                                                    key={cat.id}
                                                    style={[
                                                        styles.pickerItem,
                                                        newProduct.category_id === cat.id && styles.pickerItemActive
                                                    ]}
                                                    onPress={() => setNewProduct(p => ({ ...p, category_id: cat.id }))}
                                                >
                                                    <Text style={[
                                                        styles.pickerText,
                                                        newProduct.category_id === cat.id && { color: 'white' }
                                                    ]}>{cat.name}</Text>
                                                </TouchableOpacity>
                                            ))
                                        )}
                                    </View>
                                )}
                            </View>

                            <View style={styles.row}>
                                <View style={[styles.inputContainer, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Price</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        value={newProduct.price}
                                        onChangeText={(txt) => setNewProduct(p => ({ ...p, price: txt }))}
                                    />
                                </View>
                                <View style={{ width: spacing.m }} />
                                <View style={[styles.inputContainer, { flex: 1 }]}>
                                    <Text style={styles.inputLabel}>Initial Stock</Text>
                                    <TextInput
                                        style={styles.input}
                                        keyboardType="numeric"
                                        placeholder="0"
                                        value={newProduct.stock}
                                        onChangeText={(txt) => setNewProduct(p => ({ ...p, stock: txt }))}
                                    />
                                </View>
                            </View>

                            <AppButton
                                title="Save Product"
                                onPress={handleAddProduct}
                                style={{ marginTop: spacing.m }}
                            />
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>

            {/* Filter Popup Modal */}
            <Modal visible={isFilterVisible} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.filterModalOverlay}
                    activeOpacity={1}
                    onPress={() => setFilterVisible(false)}
                >
                    <View style={styles.filterModalContent}>
                        <View style={styles.filterModalDragBar} />
                        <View style={styles.filterModalHeader}>
                            <Text style={styles.filterModalTitle}>Filter & Urutkan</Text>
                            <TouchableOpacity onPress={() => setFilterVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {/* Sort Section */}
                        <Text style={styles.filterSectionLabel}>Urutkan</Text>
                        <View style={styles.filterChipsWrap}>
                            {SORT_OPTIONS.map(opt => (
                                <TouchableOpacity
                                    key={opt.key}
                                    style={[
                                        styles.sortChip,
                                        sortMode === opt.key && styles.sortChipActive
                                    ]}
                                    onPress={() => setSortMode(opt.key)}
                                >
                                    <Ionicons
                                        name={opt.icon as any}
                                        size={14}
                                        color={sortMode === opt.key ? 'white' : colors.textSubtle}
                                    />
                                    <Text style={[
                                        styles.sortChipText,
                                        sortMode === opt.key && styles.sortChipTextActive
                                    ]}>
                                        {opt.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Category Section */}
                        <Text style={styles.filterSectionLabel}>Kategori</Text>
                        <View style={styles.filterChipsWrap}>
                            {categoryFilterOptions.map(cat => (
                                <TouchableOpacity
                                    key={cat}
                                    style={[
                                        styles.catFilterChip,
                                        selectedCategoryFilter === cat && styles.catFilterChipActive
                                    ]}
                                    onPress={() => setSelectedCategoryFilter(cat)}
                                >
                                    <Text style={[
                                        styles.catFilterChipText,
                                        selectedCategoryFilter === cat && styles.catFilterChipTextActive
                                    ]}>
                                        {cat}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Actions */}
                        <View style={styles.filterActions}>
                            <TouchableOpacity
                                style={styles.filterResetBtn}
                                onPress={() => { setSortMode('az'); setSelectedCategoryFilter('All'); }}
                            >
                                <Text style={styles.filterResetText}>Reset Semua</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.filterApplyBtn}
                                onPress={() => setFilterVisible(false)}
                            >
                                <Text style={styles.filterApplyText}>Terapkan</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Scanner Modal */}
            <Modal visible={isScannerVisible} animationType="slide">
                <View style={styles.scannerContainer}>
                    <CameraView
                        style={StyleSheet.absoluteFillObject}
                        facing="back"
                        onBarcodeScanned={handleBarcodeScanned}
                    />
                    <View style={styles.scannerOverlay}>
                        <View style={styles.scannerHeader}>
                            <Text style={styles.scannerTitle}>Scan Barcode</Text>
                            <TouchableOpacity onPress={() => setScannerVisible(false)} style={styles.closeScannerBtn}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.scannerFrame} />
                        <Text style={styles.scannerHint}>Place barcode inside the frame</Text>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    headerCircleBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.error + '15',
        alignItems: 'center',
        justifyContent: 'center',
    },
    itemCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
    },
    lowStockCard: {
        borderLeftWidth: 4,
        borderLeftColor: colors.error,
    },
    itemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
    },
    iconBox: {
        width: 56,
        height: 56,
        borderRadius: 12,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    lowStockBadge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: colors.error,
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    lowStockText: {
        color: 'white',
        fontSize: 8,
        fontWeight: 'bold',
    },
    itemName: {
        fontWeight: 'bold',
        fontSize: typography.sizes.m,
    },
    itemCat: {
        fontSize: typography.sizes.xs,
        color: colors.textSubtle,
    },
    itemRight: {
        alignItems: 'flex-end',
    },
    itemPrice: {
        fontWeight: 'bold',
        color: colors.primaryDark,
        fontSize: typography.sizes.s,
    },
    stockRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
        marginTop: 4,
    },
    itemStock: {
        fontSize: typography.sizes.s,
        color: colors.textSubtle,
    },
    quickAddBtn: {
        backgroundColor: colors.secondary,
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    quickAddText: {
        color: colors.primaryDark,
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.xl,
    },
    modalContent: {
        width: '100%',
        backgroundColor: 'white',
        borderRadius: 24,
        padding: spacing.l,
        ...appStyles.elevation,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    modalTitle: {
        fontSize: typography.sizes.l,
        fontWeight: 'bold',
    },
    modalSub: {
        textAlign: 'center',
        color: colors.textSubtle,
        marginBottom: spacing.l,
    },
    inputContainer: {
        marginBottom: spacing.m,
    },
    inputLabel: {
        fontSize: typography.sizes.s,
        fontWeight: '600',
        marginBottom: spacing.s,
        color: colors.text,
    },
    input: {
        height: 52,
        backgroundColor: colors.background,
        borderRadius: 16,
        paddingHorizontal: spacing.m,
        fontSize: typography.sizes.m,
    },
    categoryPicker: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.s,
    },
    pickerItem: {
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        borderRadius: 12,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    pickerItemActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    pickerText: {
        fontSize: typography.sizes.xs,
        fontWeight: '600',
        color: colors.textSubtle,
    },
    row: {
        flexDirection: 'row',
    },
    modalActions: {
        flexDirection: 'row',
        gap: spacing.m,
    },
    modalBtn: {
        flex: 1,
        height: 52,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelBtn: {
        backgroundColor: '#F0F0F0',
    },
    saveBtn: {
        backgroundColor: colors.primary,
    },
    cancelBtnText: {
        color: colors.textSubtle,
        fontWeight: '600',
    },
    saveBtnText: {
        color: 'white',
        fontWeight: 'bold',
    },
    addCategoryRow: {
        flexDirection: 'row',
        gap: spacing.s,
        alignItems: 'center',
    },
    addCategoryBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: spacing.m,
        height: 44,
        borderRadius: 12,
        justifyContent: 'center',
    },
    productIcon: {
        width: '100%',
        height: '100%',
        borderRadius: 12,
    },
    imagePickerBtn: {
        width: '100%',
        height: 180,
        backgroundColor: colors.background,
        borderRadius: 20,
        marginBottom: spacing.l,
        overflow: 'hidden',
        borderWidth: 1,
        borderStyle: 'dashed',
        borderColor: colors.textSubtle,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scanBtn: {
        width: 52,
        height: 52, // Matches input height
        backgroundColor: colors.primary,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerContainer: {
        flex: 1,
        backgroundColor: 'black',
    },
    scannerOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scannerHeader: {
        position: 'absolute',
        top: 50,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    scannerTitle: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    closeScannerBtn: {
        padding: 8,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 20,
    },
    scannerFrame: {
        width: 250,
        height: 250,
        borderWidth: 2,
        borderColor: colors.primary,
        backgroundColor: 'transparent',
    },
    scannerHint: {
        color: 'white',
        marginTop: 20,
        fontSize: 14,
    },
    pickedImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    imagePlaceholderText: {
        marginTop: spacing.s,
        color: colors.textSubtle,
        fontWeight: '600',
    },
    // Search & Filter Styles
    searchSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.m,
        paddingTop: spacing.s,
        paddingBottom: spacing.s,
        gap: spacing.s,
    },
    searchContainer: {
        flex: 1,
        height: 48,
        backgroundColor: 'white',
        borderRadius: 14,
        paddingHorizontal: spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
        ...appStyles.elevation,
    },
    searchInput: {
        flex: 1,
        fontSize: typography.sizes.m,
        color: colors.text,
        height: '100%',
        paddingVertical: 0,
    },
    filterIconBtn: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        ...appStyles.elevation,
        position: 'relative',
    },
    filterIconBtnActive: {
        backgroundColor: colors.primary,
    },
    filterBadgeDot: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.error,
    },
    activeFilterBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginHorizontal: spacing.m,
        paddingHorizontal: spacing.m,
        paddingVertical: 6,
        backgroundColor: colors.secondary,
        borderRadius: 10,
        marginBottom: spacing.xs,
    },
    activeFilterText: {
        fontSize: 12,
        color: colors.primaryDark,
        fontWeight: '600',
    },
    clearFilterText: {
        fontSize: 12,
        color: colors.error,
        fontWeight: 'bold',
    },
    // Sort & Category Chips (used inside modal)
    sortChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: spacing.m,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    sortChipActive: {
        backgroundColor: colors.primaryDark,
        borderColor: colors.primaryDark,
    },
    sortChipText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textSubtle,
    },
    sortChipTextActive: {
        color: 'white',
    },
    catFilterChip: {
        paddingHorizontal: spacing.m,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    catFilterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    catFilterChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSubtle,
    },
    catFilterChipTextActive: {
        color: 'white',
    },
    // Filter Modal
    filterModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    filterModalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 28,
        borderTopRightRadius: 28,
        padding: spacing.l,
        paddingBottom: 40,
    },
    filterModalDragBar: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.m,
    },
    filterModalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    filterModalTitle: {
        fontSize: typography.sizes.l,
        fontWeight: 'bold',
        color: colors.text,
    },
    filterSectionLabel: {
        fontSize: typography.sizes.s,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.s,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    filterChipsWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.s,
        marginBottom: spacing.l,
    },
    filterActions: {
        flexDirection: 'row',
        gap: spacing.m,
        marginTop: spacing.s,
    },
    filterResetBtn: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterResetText: {
        color: colors.textSubtle,
        fontWeight: '700',
    },
    filterApplyBtn: {
        flex: 1,
        height: 48,
        borderRadius: 14,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    filterApplyText: {
        color: 'white',
        fontWeight: 'bold',
    },
    resultCounter: {
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.xs,
    },
    resultCounterText: {
        fontSize: 12,
        color: colors.textSubtle,
        fontStyle: 'italic',
    },
    emptyList: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.xl * 2,
    },
    emptyListText: {
        fontSize: typography.sizes.m,
        fontWeight: '600',
        color: colors.text,
        marginTop: spacing.m,
    },
    emptyListSub: {
        fontSize: typography.sizes.s,
        color: colors.textSubtle,
        marginTop: spacing.xs,
    },
});
