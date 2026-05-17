import React, { useState, useRef, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, Animated, Alert, ScrollView, Image, Keyboard } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera'; // Added import
import { colors, spacing, typography, appStyles } from '../theme';
import { AppButton } from '../components/AppButton';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import * as db from '../services/db';
import { printReceipt } from '../services/PrinterService'; // Added import

type SortMode = 'az' | 'za' | 'price_asc' | 'price_desc';

const SORT_OPTIONS: { key: SortMode; label: string; icon: string }[] = [
    { key: 'az', label: 'A-Z', icon: 'text-outline' },
    { key: 'za', label: 'Z-A', icon: 'text-outline' },
    { key: 'price_asc', label: 'Harga ↑', icon: 'trending-up-outline' },
    { key: 'price_desc', label: 'Harga ↓', icon: 'trending-down-outline' },
];

const DENOMINATIONS = [10000, 20000, 50000, 100000];

export const POSScreen = ({ navigation, route }: any) => {
    const userData = route.params?.user || { id: 1, role: 'ADMIN' };
    const [categories, setCategories] = useState<any[]>([]);
    const [allProducts, setAllProducts] = useState<any[]>([]);
    const [cart, setCart] = useState<any[]>([]);
    const [isCheckoutVisible, setCheckoutVisible] = useState(false);
    const [amountPaid, setAmountPaid] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [drafts, setDrafts] = useState<any[]>([]);
    const [storeSettings, setStoreSettings] = useState<any>(null); // Added state

    // Filter & Sort State
    const [sortMode, setSortMode] = useState<SortMode>('az');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isFilterVisible, setFilterVisible] = useState(false);

    // Scanner State
    const [isScannerVisible, setScannerVisible] = useState(false);
    const [permission, requestPermission] = useCameraPermissions();

    const searchInputRef = useRef<TextInput>(null);

    // Initialize DB and Fetch Data on Focus
    useFocusEffect(
        useCallback(() => {
            const init = async () => {
                await db.initDB();
                const cats = await db.getCategories();
                setCategories([{ id: 0, name: 'All' }, ...cats]);
                const data = await db.getProducts('All');
                setAllProducts(data);

                // Fetch Store Settings
                try {
                    const settings = await db.getStoreSettings();
                    setStoreSettings(settings);
                } catch (e) {
                    console.log("Failed to load store settings", e);
                }
            };
            init();
        }, [])
    );

    const reloadProducts = async () => {
        const data = await db.getProducts('All');
        setAllProducts(data);
    };

    // Computed: filtered + sorted products
    const filteredProducts = useMemo(() => {
        let result = [...allProducts];

        // Filter by category
        if (selectedCategory !== 'All') {
            result = result.filter(item =>
                (item.categoryName || 'No Category') === selectedCategory
            );
        }

        // Filter by search
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(item =>
                item.name.toLowerCase().includes(q)
            );
        }

        // Sort
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
        }

        return result;
    }, [allProducts, searchQuery, sortMode, selectedCategory]);

    const categoryFilterOptions = useMemo(() => {
        const uniqueCats = [...new Set(allProducts.map(item => item.categoryName || 'No Category'))];
        return ['All', ...uniqueCats];
    }, [allProducts]);

    const hasActiveFilters = sortMode !== 'az' || selectedCategory !== 'All';

    const addToCart = (product: any) => {
        setCart(prev => {
            const existing = prev.find(p => p.id === product.id);
            if (existing) {
                return prev.map(p => p.id === product.id ? { ...p, qty: p.qty + 1 } : p);
            }
            return [...prev, { ...product, qty: 1 }];
        });
    };

    const updateQty = (id: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(0, item.qty + delta);
                return { ...item, qty: newQty };
            }
            return item;
        }).filter(item => item.qty > 0));
    };

    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    };

    const handleSmartDenom = (amount: number) => {
        setAmountPaid(amount.toString());
    };

    const handleExactChange = () => {
        setAmountPaid(calculateTotal().toString());
    };

    const parkOrder = () => {
        if (cart.length === 0) return;
        setDrafts(prev => [...prev, { id: Date.now().toString(), items: cart, total: calculateTotal() }]);
        setCart([]);
        Alert.alert("Draft Saved", "Order has been parked.");
    };

    // Barcode Handler (Camera)
    const handleBarcodeScanned = ({ data }: { data: string }) => {
        const product = allProducts.find(p => p.barcode === data);
        if (product) {
            addToCart(product);
            setScannerVisible(false);
            Alert.alert("Added!", `${product.name} added to cart.`);
        } else {
            setScannerVisible(false);
            Alert.alert("Not Found", `No product found with barcode: ${data}`);
        }
    };

    // Barcode Handler (Physical Scanner / Search Enter)
    const handleSearchSubmit = () => {
        if (!searchQuery.trim()) return;

        // Try exact match with barcode first
        const productByBarcode = allProducts.find(p => p.barcode === searchQuery.trim());
        if (productByBarcode) {
            addToCart(productByBarcode);
            setSearchQuery(''); // Clear after successful scan
            return;
        }

        // If not barcode, keep search result active (standard behavior)
    };

    const renderProduct = ({ item }: any) => (
        <TouchableOpacity
            onPress={() => addToCart(item)}
            style={styles.productCard}
        >
            <View style={styles.productImageContainer}>
                {item.image_uri ? (
                    <Image source={{ uri: item.image_uri }} style={styles.productImage} />
                ) : (
                    <Ionicons
                        name={item.categoryName === 'Drinks' ? 'wine-outline' : item.categoryName === 'Foods' ? 'fast-food-outline' : 'cube-outline'}
                        size={32}
                        color={colors.primary}
                    />
                )}
            </View>
            <View style={styles.productInfo}>
                <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.productPrice}>Rp {item.price.toLocaleString()}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <AppHeader
                title="Point of Sale"
                onBack={() => navigation.goBack()}
                rightElement={
                    <TouchableOpacity onPress={parkOrder} style={styles.parkBtn}>
                        <Ionicons name="archive-outline" size={24} color={colors.text} />
                    </TouchableOpacity>
                }
            />

            {/* Search Bar + Filter Icon */}
            <View style={styles.headerSearch}>
                <View style={styles.searchContainer}>
                    <Ionicons name="search-outline" size={20} color={colors.textSubtle} />
                    <TextInput
                        ref={searchInputRef}
                        style={styles.searchInput}
                        placeholder="Cari produk..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        placeholderTextColor={colors.textSubtle}
                        returnKeyType="search"
                        onSubmitEditing={handleSearchSubmit} // Listen for scanner 'Enter'
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => { setSearchQuery(''); Keyboard.dismiss(); }}>
                            <Ionicons name="close-circle" size={18} color={colors.textSubtle} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Scan Button */}
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
                    <Ionicons name="scan-outline" size={22} color="white" />
                </TouchableOpacity>

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

            {/* Active Filter Summary */}
            {hasActiveFilters && (
                <View style={styles.activeFilterBar}>
                    <Text style={styles.activeFilterText}>
                        {sortMode !== 'az' && `Urut: ${SORT_OPTIONS.find(o => o.key === sortMode)?.label}`}
                        {sortMode !== 'az' && selectedCategory !== 'All' && '  •  '}
                        {selectedCategory !== 'All' && `Kategori: ${selectedCategory}`}
                    </Text>
                    <TouchableOpacity onPress={() => { setSortMode('az'); setSelectedCategory('All'); }}>
                        <Text style={styles.clearFilterText}>Reset</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Product List */}
            <FlatList
                data={filteredProducts}
                numColumns={2}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ padding: spacing.m, paddingBottom: 220 }}
                columnWrapperStyle={{ justifyContent: 'space-between' }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                    <View style={styles.emptyList}>
                        <Ionicons name="search-outline" size={48} color={colors.textSubtle} />
                        <Text style={styles.emptyListText}>Tidak ada produk ditemukan</Text>
                        <Text style={styles.emptyListSub}>Coba ubah filter atau kata kunci</Text>
                    </View>
                }
                renderItem={renderProduct}
            />

            {/* Enhanced Cart Sheet */}
            <View style={styles.cartSheet}>
                <View style={styles.dragIndicator} />

                {/* Cart Item Preview (Scrollable) */}
                <ScrollView style={styles.cartItemsPreview} showsVerticalScrollIndicator={false}>
                    {cart.map(item => (
                        <View key={item.id} style={styles.cartItemRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.cartItemName}>{item.name}</Text>
                                <Text style={styles.cartItemPrice}>Rp {item.price.toLocaleString()}</Text>
                            </View>
                            <View style={styles.qtyControls}>
                                <TouchableOpacity onPress={() => updateQty(item.id, -1)} style={styles.qtyBtn}>
                                    <Text style={styles.qtyBtnText}>-</Text>
                                </TouchableOpacity>
                                <Text style={styles.qtyValue}>{item.qty}</Text>
                                <TouchableOpacity onPress={() => updateQty(item.id, 1)} style={styles.qtyBtn}>
                                    <Text style={styles.qtyBtnText}>+</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    ))}
                    {cart.length === 0 && (
                        <Text style={styles.emptyCartText}>Cart is currently empty</Text>
                    )}
                </ScrollView>

                <View style={styles.cartFooter}>
                    <View>
                        <Text style={styles.cartTitle}>Total Order</Text>
                        <Text style={styles.cartTotal}>Rp {calculateTotal().toLocaleString()}</Text>
                    </View>
                    <AppButton
                        title="Checkout"
                        onPress={() => setCheckoutVisible(true)}
                        disabled={cart.length === 0}
                        style={{ width: 140, height: 56 }}
                    />
                </View>
            </View>

            {/* Smart Checkout Modal */}
            <Modal visible={isCheckoutVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Payment</Text>
                            <TouchableOpacity onPress={() => setCheckoutVisible(false)}>
                                <Text style={styles.closeBtn}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.paymentSummary}>
                            <Text style={styles.paymentTotalLabel}>Total Amount</Text>
                            <Text style={styles.paymentTotalValue}>Rp {calculateTotal().toLocaleString()}</Text>
                        </View>

                        <Text style={styles.denomLabel}>Smart Denominations</Text>
                        <View style={styles.denomGrid}>
                            {DENOMINATIONS.map(d => (
                                <TouchableOpacity
                                    key={d}
                                    style={styles.denomBtn}
                                    onPress={() => handleSmartDenom(d)}
                                >
                                    <Text style={styles.denomText}>{(d / 1000)}k</Text>
                                </TouchableOpacity>
                            ))}
                            <TouchableOpacity style={[styles.denomBtn, styles.exactBtn]} onPress={handleExactChange}>
                                <Text style={[styles.denomText, { color: 'white' }]}>Uang Pas</Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.inputPaidContainer}>
                            <Text style={styles.inputPaidLabel}>Received Amount</Text>
                            <TextInput
                                style={styles.paidInput}
                                keyboardType="numeric"
                                value={amountPaid}
                                onChangeText={setAmountPaid}
                                placeholder="0"
                            />
                        </View>

                        {Number(amountPaid) >= calculateTotal() && (
                            <View style={styles.changeContainer}>
                                <Text style={styles.changeLabel}>Change (Kembalian)</Text>
                                <Text style={styles.changeValue}>
                                    Rp {(Number(amountPaid) - calculateTotal()).toLocaleString()}
                                </Text>
                            </View>
                        )}

                        <AppButton
                            title="Finish Transaction"
                            disabled={Number(amountPaid) < calculateTotal()}
                            onPress={async () => {
                                const total = calculateTotal();
                                const paid = parseFloat(amountPaid) || total;
                                if (paid < total) {
                                    Alert.alert("Error", "Insufficient payment amount.");
                                    return;
                                }

                                const change = paid - total;

                                try {
                                    await db.processSale(cart, {
                                        total,
                                        method: 'Cash',
                                        paid,
                                        change,
                                        userId: userData.id
                                    });

                                    // Auto-Print Receipt
                                    await printReceipt({
                                        storeName: storeSettings?.store_name || "Toko Deni Apps",
                                        storeAddress: storeSettings?.store_address || "Alamat Toko Belum Diatur",
                                        storePhone: storeSettings?.store_phone,
                                        items: cart.map(i => ({ name: i.name, qty: i.qty, price: i.price })),
                                        total,
                                        paid,
                                        change,
                                        date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString(),
                                        orderId: Date.now().toString(),
                                    });

                                    setCheckoutVisible(false);
                                    setCart([]);
                                    setAmountPaid('');
                                    Alert.alert("Success", `Transaction Complete!\nChange: Rp ${change.toLocaleString()}`);
                                    reloadProducts();
                                } catch (error) {
                                    console.error("Sale failed:", error);
                                    Alert.alert("Error", "Failed to process transaction.");
                                }
                            }}
                            style={{ marginTop: spacing.l }}
                        />
                    </View>
                </View>
            </Modal>

            {/* Filter Popup Modal */}
            <Modal visible={isFilterVisible} transparent animationType="slide">
                <TouchableOpacity
                    style={styles.filterModalOverlay}
                    activeOpacity={1}
                    onPress={() => setFilterVisible(false)}
                >
                    <View style={styles.filterModalContent}>
                        <View style={styles.filterDragBar} />
                        <View style={styles.filterHeader}>
                            <Text style={styles.filterTitle}>Filter & Urutkan</Text>
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
                                        styles.catChip,
                                        selectedCategory === cat && styles.catChipActive
                                    ]}
                                    onPress={() => setSelectedCategory(cat)}
                                >
                                    <Text style={[
                                        styles.catChipText,
                                        selectedCategory === cat && styles.catChipTextActive
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
                                onPress={() => { setSortMode('az'); setSelectedCategory('All'); }}
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
                            <Text style={styles.scannerTitle}>Scan Product</Text>
                            <TouchableOpacity onPress={() => setScannerVisible(false)} style={styles.closeScannerBtn}>
                                <Ionicons name="close" size={24} color="white" />
                            </TouchableOpacity>
                        </View>
                        <View style={styles.scannerFrame} />
                        <Text style={styles.scannerHint}>Point camera at product barcode</Text>
                    </View>
                </View>
            </Modal>
        </SafeAreaView >
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    headerSearch: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: spacing.m,
        paddingBottom: spacing.s,
        gap: spacing.s,
    },
    searchContainer: {
        flex: 1,
        height: 52,
        backgroundColor: 'white',
        borderRadius: 16,
        ...appStyles.elevation,
        paddingHorizontal: spacing.m,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.s,
    },
    searchInput: {
        flex: 1,
        fontSize: typography.sizes.m,
        fontFamily: typography.fontFamily,
        color: colors.text,
        height: '100%',
        paddingVertical: 0,
    },
    filterIconBtn: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        ...appStyles.elevation,
        position: 'relative',
    },
    scanBtn: {
        width: 52,
        height: 52,
        borderRadius: 16,
        backgroundColor: colors.primary, // Distinct color
        alignItems: 'center',
        justifyContent: 'center',
        ...appStyles.elevation,
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
    parkBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        ...appStyles.elevation,
    },
    productCard: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 24,
        marginBottom: spacing.m,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.03)',
        ...appStyles.elevation,
    },
    productImageContainer: {
        width: '100%',
        height: 120,
        backgroundColor: '#F0F4F8',
        alignItems: 'center',
        justifyContent: 'center',
    },
    productImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    productInfo: {
        padding: spacing.m,
    },
    productName: {
        fontWeight: 'bold',
        fontSize: typography.sizes.m,
        color: colors.text,
        marginBottom: 2,
    },
    productPrice: {
        fontSize: typography.sizes.m,
        color: colors.primary,
        fontWeight: '800',
    },
    cartSheet: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'white',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: spacing.l,
        paddingTop: spacing.m,
        maxHeight: 400,
        ...appStyles.elevation,
        shadowOpacity: 0.1,
    },
    dragIndicator: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.m,
    },
    cartItemsPreview: {
        marginBottom: spacing.m,
    },
    cartItemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
    },
    cartItemName: {
        fontWeight: '700',
        color: colors.text,
        fontSize: 15,
    },
    cartItemPrice: {
        fontSize: 13,
        color: colors.textSubtle,
        marginTop: 2,
    },
    qtyControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
    },
    qtyBtn: {
        width: 32,
        height: 32,
        borderRadius: 10,
        backgroundColor: '#F1F5F9',
        alignItems: 'center',
        justifyContent: 'center',
    },
    qtyBtnText: {
        fontWeight: 'bold',
        color: colors.primaryDark,
        fontSize: 18,
    },
    qtyValue: {
        fontWeight: '800',
        minWidth: 24,
        textAlign: 'center',
        fontSize: 16,
    },
    emptyCartText: {
        textAlign: 'center',
        color: colors.textSubtle,
        marginVertical: spacing.xl,
        fontStyle: 'italic',
        fontSize: 15,
    },
    cartFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
        paddingTop: spacing.m,
    },
    cartTitle: {
        fontSize: 12,
        color: colors.textSubtle,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    cartTotal: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.text,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        padding: spacing.l,
        paddingBottom: 40,
        ...appStyles.elevation,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.text,
    },
    closeBtn: {
        fontSize: 24,
        color: colors.textSubtle,
    },
    paymentSummary: {
        backgroundColor: '#F8FAFC',
        padding: spacing.xl,
        borderRadius: 24,
        alignItems: 'center',
        marginBottom: spacing.l,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    paymentTotalLabel: {
        fontSize: 14,
        color: colors.textSubtle,
        fontWeight: '600',
        textTransform: 'uppercase',
    },
    paymentTotalValue: {
        fontSize: 32,
        fontWeight: '900',
        color: colors.primaryDark,
        marginTop: 4,
    },
    denomLabel: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: spacing.m,
        color: colors.text,
    },
    denomGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.s,
        marginBottom: spacing.xl,
    },
    denomBtn: {
        flex: 1,
        minWidth: '22%',
        height: 50,
        backgroundColor: '#F1F5F9',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    exactBtn: {
        flex: 2,
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    denomText: {
        fontWeight: '800',
        color: colors.primaryDark,
        fontSize: 15,
    },
    inputPaidContainer: {
        marginBottom: spacing.xl,
    },
    inputPaidLabel: {
        fontSize: 14,
        fontWeight: '800',
        marginBottom: spacing.s,
        color: colors.text,
    },
    paidInput: {
        height: 64,
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        paddingHorizontal: spacing.l,
        fontSize: 24,
        fontWeight: 'bold',
        color: colors.primaryDark,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        textAlign: 'center',
    },
    changeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    changeLabel: {
        fontSize: 15,
        color: colors.textSubtle,
        fontWeight: '500',
    },
    changeValue: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.primary,
    },
    // Filter Modal Styles
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
    filterDragBar: {
        width: 40,
        height: 4,
        backgroundColor: '#E2E8F0',
        borderRadius: 2,
        alignSelf: 'center',
        marginBottom: spacing.m,
    },
    filterHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    filterTitle: {
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
    catChip: {
        paddingHorizontal: spacing.m,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: '#F1F5F9',
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    catChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    catChipText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSubtle,
    },
    catChipTextActive: {
        color: 'white',
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
    // Scanner Styles
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
});
