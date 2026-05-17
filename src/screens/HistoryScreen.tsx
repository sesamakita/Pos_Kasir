import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, appStyles } from '../theme';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import * as db from '../services/db';

export const HistoryScreen = ({ navigation, route }: any) => {
    const user = route.params?.user || { id: 1, role: 'ADMIN' };
    const [history, setHistory] = useState<any[]>([]);
    const [selectedSale, setSelectedSale] = useState<any>(null);
    const [saleItems, setSaleItems] = useState<any[]>([]);
    const [modalVisible, setModalVisible] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        const data = await db.getTransactions(user.role, user.id);
        setHistory(data);
    };

    const handleShowDetail = async (sale: any) => {
        const items = await db.getTransactionItems(sale.id);
        setSelectedSale(sale);
        setSaleItems(items);
        setModalVisible(true);
    };

    const formatDate = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <AppHeader
                title="Transaction History"
                onBack={() => navigation.goBack()}
            />

            <FlatList
                data={history}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ padding: spacing.m }}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={{ fontSize: 40, marginBottom: spacing.m }}>📜</Text>
                        <Text style={styles.emptyText}>No transactions yet</Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => handleShowDetail(item)} activeOpacity={0.7}>
                        <AppCard style={styles.historyCard}>
                            <View>
                                <Text style={styles.dateText}>{formatDate(item.date)}</Text>
                                <View style={styles.methodBadge}>
                                    <Text style={styles.methodText}>{item.payment_method}</Text>
                                </View>
                            </View>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Text style={styles.totalText}>Rp {item.total.toLocaleString()}</Text>
                                <Text style={styles.waiterText}>{item.waiter_name || 'System'}</Text>
                            </View>
                        </AppCard>
                    </TouchableOpacity>
                )}
            />

            {/* Transaction Detail Modal */}
            <Modal
                transparent
                visible={modalVisible}
                animationType="slide"
                onRequestClose={() => setModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Transaction Detail</Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Text style={styles.closeIcon}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        {selectedSale && (
                            <ScrollView style={styles.detailScroll} showsVerticalScrollIndicator={false}>
                                <View style={styles.headerInfo}>
                                    <Text style={styles.infoLabel}>Date</Text>
                                    <Text style={styles.infoValue}>{formatDate(selectedSale.date)}</Text>
                                </View>

                                <View style={styles.divider} />

                                <Text style={styles.sectionLabel}>Items Purchased</Text>
                                {saleItems.map((item, idx) => (
                                    <View key={idx} style={styles.detailItem}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.itemName}>{item.name}</Text>
                                            <Text style={styles.itemSubText}>{item.qty} x Rp {item.price_at_sale.toLocaleString()}</Text>
                                        </View>
                                        <Text style={styles.itemTotal}>Rp {(item.qty * item.price_at_sale).toLocaleString()}</Text>
                                    </View>
                                ))}

                                <View style={[styles.divider, { marginTop: spacing.m }]} />

                                <View style={styles.summaryRow}>
                                    <Text style={styles.summaryLabel}>Total Order</Text>
                                    <Text style={styles.summaryTotal}>Rp {selectedSale.total.toLocaleString()}</Text>
                                </View>

                                <View style={styles.paymentSection}>
                                    <View style={styles.paymentRow}>
                                        <Text style={styles.paymentLabel}>Method</Text>
                                        <Text style={styles.paymentValue}>{selectedSale.payment_method}</Text>
                                    </View>
                                    <View style={styles.paymentRow}>
                                        <Text style={styles.paymentLabel}>Paid</Text>
                                        <Text style={styles.paymentValue}>Rp {selectedSale.amount_paid.toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.paymentRow}>
                                        <Text style={styles.paymentLabel}>Change</Text>
                                        <Text style={styles.paymentValue}>Rp {selectedSale.change_amount.toLocaleString()}</Text>
                                    </View>
                                    <View style={styles.paymentRow}>
                                        <Text style={styles.paymentLabel}>Sold By</Text>
                                        <Text style={styles.paymentValue}>{selectedSale.waiter_name || 'System'}</Text>
                                    </View>
                                </View>
                            </ScrollView>
                        )}

                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    historyCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.m,
        padding: spacing.m,
        ...appStyles.elevation,
    },
    dateText: {
        fontWeight: '700',
        fontSize: typography.sizes.m,
        color: colors.text,
    },
    methodBadge: {
        backgroundColor: colors.secondary,
        paddingHorizontal: spacing.s,
        paddingVertical: 2,
        borderRadius: 12,
        marginTop: 4,
        alignSelf: 'flex-start',
    },
    methodText: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.primaryDark,
        textTransform: 'uppercase',
    },
    totalText: {
        fontWeight: '800',
        fontSize: typography.sizes.m,
        color: colors.primaryDark,
    },
    waiterText: {
        fontSize: 11,
        color: colors.primary,
        fontWeight: 'bold',
        marginTop: 2,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        color: colors.textSubtle,
        fontSize: typography.sizes.m,
        fontWeight: '500',
    },
    // Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: 'white',
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        padding: spacing.l,
        maxHeight: '85%',
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
        color: colors.text,
    },
    closeIcon: {
        fontSize: 20,
        color: colors.textSubtle,
    },
    detailScroll: {
        marginBottom: spacing.l,
    },
    headerInfo: {
        marginBottom: spacing.m,
    },
    infoLabel: {
        fontSize: 12,
        color: colors.textSubtle,
        marginBottom: 2,
    },
    infoValue: {
        fontSize: typography.sizes.m,
        fontWeight: '600',
        color: colors.text,
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        color: colors.text,
        marginBottom: spacing.m,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.m,
    },
    detailItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.s,
    },
    itemName: {
        fontSize: typography.sizes.m,
        fontWeight: '500',
        color: colors.text,
    },
    itemSubText: {
        fontSize: 12,
        color: colors.textSubtle,
        marginTop: 2,
    },
    itemTotal: {
        fontSize: typography.sizes.m,
        fontWeight: '700',
        color: colors.text,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.s,
    },
    summaryLabel: {
        fontSize: typography.sizes.l,
        fontWeight: 'bold',
        color: colors.text,
    },
    summaryTotal: {
        fontSize: typography.sizes.l,
        fontWeight: '900',
        color: colors.primaryDark,
    },
    paymentSection: {
        marginTop: spacing.l,
        backgroundColor: '#F8FAFC',
        padding: spacing.m,
        borderRadius: 16,
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xs,
    },
    paymentLabel: {
        fontSize: 13,
        color: colors.textSubtle,
    },
    paymentValue: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.text,
    },
    closeButton: {
        backgroundColor: colors.primary,
        padding: spacing.m,
        borderRadius: 16,
        alignItems: 'center',
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: typography.sizes.m,
    }
});
