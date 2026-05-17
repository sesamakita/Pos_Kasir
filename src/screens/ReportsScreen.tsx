import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, typography, appStyles } from '../theme';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import * as db from '../services/db';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { generateClosingReportHTML } from '../services/reportGenerator';
import { Ionicons } from '@expo/vector-icons';

// --- Date Filter Helpers ---
type DateFilterKey = 'today' | 'yesterday' | '7days';
const DATE_FILTERS: { key: DateFilterKey; label: string }[] = [
    { key: 'today', label: 'Hari Ini' },
    { key: 'yesterday', label: 'Kemarin' },
    { key: '7days', label: '7 Hari' },
];

const getDateString = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getDateFilterValue = (key: DateFilterKey): string | undefined => {
    switch (key) {
        case 'today': return getDateString(0);
        case 'yesterday': return getDateString(1);
        case '7days': return undefined; // no single-day filter, handled specially
    }
};

const getDateRangeForFilter = (key: DateFilterKey): string[] => {
    switch (key) {
        case 'today': return [getDateString(0)];
        case 'yesterday': return [getDateString(1)];
        case '7days': return Array.from({ length: 7 }, (_, i) => getDateString(i));
    }
};

const getFilterLabel = (key: DateFilterKey): string => {
    switch (key) {
        case 'today': return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        case 'yesterday': {
            const d = new Date(); d.setDate(d.getDate() - 1);
            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
        }
        case '7days': return '7 Hari Terakhir';
    }
};

export const ReportsScreen = ({ navigation, route }: any) => {
    const [summary, setSummary] = useState<any>({
        totalSales: 0,
        totalOrders: 0,
        topProducts: []
    });
    const [logs, setLogs] = useState<any[]>([]);
    const [isExporting, setIsExporting] = useState(false);
    const [activeFilter, setActiveFilter] = useState<DateFilterKey>('today');
    const userRole = route.params?.user?.role || 'ADMIN';
    const isSuperAdmin = userRole === 'SUPER_ADMIN';

    useEffect(() => {
        const load = async () => {
            const data = await db.getReportsSummary();
            setSummary(data);
        };
        load();
    }, []);

    // Reload logs when filter changes
    useEffect(() => {
        if (!isSuperAdmin) return;
        const loadLogs = async () => {
            if (activeFilter === '7days') {
                // Fetch logs for each of the last 7 days and merge
                const dates = getDateRangeForFilter('7days');
                const allLogs: any[] = [];
                for (const date of dates) {
                    const dayLogs = await db.getUserLogs(date);
                    allLogs.push(...dayLogs);
                }
                // Sort descending by timestamp
                allLogs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
                setLogs(allLogs);
            } else {
                const dateStr = getDateFilterValue(activeFilter);
                const logData = await db.getUserLogs(dateStr);
                setLogs(logData);
            }
        };
        loadLogs();
    }, [activeFilter]);

    const handleExportPDF = async () => {
        setIsExporting(true);
        try {
            // Use active filter date for PDF export
            const dateStr = getDateFilterValue(activeFilter) || getDateString(0);
            const reportData = await db.getClosingReportData(dateStr);

            // Fetch store settings for the report header
            const storeSettings = await db.getStoreSettings();

            const html = generateClosingReportHTML({ ...reportData, storeSettings });

            const { uri } = await Print.printToFileAsync({ html });

            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    mimeType: 'application/pdf',
                    dialogTitle: `Laporan Penutupan - ${getFilterLabel(activeFilter)}`,
                    UTI: 'com.adobe.pdf'
                });
            } else {
                Alert.alert("Error", "Sharing is not available on this device.");
            }
        } catch (error: any) {
            console.error("PDF Export failed:", error);
            Alert.alert("Export Failed", `Error: ${error.message}`);
        } finally {
            setIsExporting(false);
        }
    };
    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <AppHeader
                title="Sales Reports"
                onBack={() => navigation.goBack()}
            />

            <ScrollView contentContainerStyle={{ padding: spacing.m }}>
                <View style={styles.statsRow}>
                    <StatCard
                        label="Total Sales"
                        value={`Rp ${(summary.totalSales / 1000).toFixed(0)}k`}
                        color={colors.primary}
                    />
                    <StatCard
                        label="Orders"
                        value={summary.totalOrders.toString()}
                        color={colors.primaryLight}
                    />
                </View>

                <Text style={styles.sectionTitle}>Top Selling</Text>
                <AppCard>
                    {summary.topProducts.map((product: any, index: number) => {
                        const topSales = summary.topProducts[0]?.sales || 1;
                        const percent = (product.sales / topSales) * 100;
                        return (
                            <TopItem
                                key={index}
                                name={product.name}
                                sales={product.sales}
                                percent={percent}
                            />
                        );
                    })}
                    {summary.topProducts.length === 0 && (
                        <Text style={{ textAlign: 'center', color: colors.textSubtle }}>No sales data yet</Text>
                    )}
                </AppCard>

                <Text style={styles.sectionTitle}>Quick Status</Text>
                <AppCard>
                    <ActivityItem label="Mode" value="Offline-Local" />
                    <ActivityItem label="Sync" value="Enabled" />
                </AppCard>

                {isSuperAdmin && (
                    <>
                        <Text style={styles.sectionTitle}>User Activity Logs</Text>
                        <View style={styles.filterRow}>
                            {DATE_FILTERS.map((filter) => (
                                <TouchableOpacity
                                    key={filter.key}
                                    style={[styles.filterChip, activeFilter === filter.key && styles.filterChipActive]}
                                    onPress={() => setActiveFilter(filter.key)}
                                >
                                    <Text style={[styles.filterChipText, activeFilter === filter.key && styles.filterChipTextActive]}>
                                        {filter.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <Text style={styles.filterSubtitle}>
                            {getFilterLabel(activeFilter)} — {logs.length} log
                        </Text>
                        <AppCard style={{ padding: 0 }}>
                            {logs.map((log: any, index: number) => (
                                <View key={index} style={styles.logItem}>
                                    <View style={[styles.eventBadge, { backgroundColor: log.event === 'LOGIN' ? '#E8F5E9' : '#FFEBEE' }]}>
                                        <Text style={[styles.eventText, { color: log.event === 'LOGIN' ? '#2E7D32' : '#C62828' }]}>
                                            {log.event}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.logUser}>{log.full_name}</Text>
                                        <Text style={styles.logTime}>{new Date(log.timestamp).toLocaleString('id-ID')}</Text>
                                    </View>
                                </View>
                            ))}
                            {logs.length === 0 && (
                                <View style={{ padding: spacing.m, alignItems: 'center' }}>
                                    <Text style={{ color: colors.textSubtle }}>No logs available</Text>
                                </View>
                            )}
                        </AppCard>
                    </>
                )}

                {isSuperAdmin && (
                    <TouchableOpacity
                        style={[styles.exportBtn, isExporting && styles.exportBtnDisabled]}
                        onPress={handleExportPDF}
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <>
                                <Ionicons name="document-text-outline" size={20} color="white" />
                                <Text style={styles.exportBtnText}>Export PDF — {getFilterLabel(activeFilter)}</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const StatCard = ({ label, value, color }: any) => (
    <View style={[styles.statCard, { backgroundColor: color }]}>
        <Text style={styles.statLabel}>{label}</Text>
        <Text style={styles.statValue}>{value}</Text>
    </View>
);

const TopItem = ({ name, sales, percent }: any) => (
    <View style={styles.topItem}>
        <View style={styles.topHeader}>
            <Text style={styles.topName}>{name}</Text>
            <Text style={styles.topSales}>{sales} sold</Text>
        </View>
        <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${percent}%` }]} />
        </View>
    </View>
);

const ActivityItem = ({ label, value }: any) => (
    <View style={styles.activityItem}>
        <Text style={styles.activityLabel}>{label}</Text>
        <Text style={styles.activityValue}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    statsRow: {
        flexDirection: 'row',
        gap: spacing.m,
        marginBottom: spacing.l,
    },
    statCard: {
        flex: 1,
        padding: spacing.m,
        borderRadius: 24,
        height: 110,
        justifyContent: 'center',
        ...appStyles.elevation,
    },
    statLabel: {
        color: 'rgba(255,255,255,0.85)',
        fontSize: typography.sizes.xs,
        fontWeight: 'bold',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    statValue: {
        color: 'white',
        fontSize: typography.sizes.xl,
        fontWeight: '900',
        marginTop: 4,
    },
    sectionTitle: {
        fontSize: typography.sizes.m,
        fontWeight: '700',
        marginBottom: spacing.m,
        marginTop: spacing.s,
        color: colors.text,
    },
    topItem: {
        marginBottom: spacing.m,
    },
    topHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 8,
    },
    topName: {
        fontWeight: '600',
        fontSize: typography.sizes.m,
        color: colors.text,
    },
    topSales: {
        fontSize: typography.sizes.xs,
        color: colors.textSubtle,
        fontWeight: '600',
    },
    progressBar: {
        height: 8,
        backgroundColor: colors.secondary,
        borderRadius: 4,
    },
    progressFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 4,
    },
    activityItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    activityLabel: {
        color: colors.textSubtle,
        fontSize: typography.sizes.s,
    },
    activityValue: {
        fontWeight: '700',
        fontSize: typography.sizes.s,
        color: colors.text,
    },
    logItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: spacing.m,
    },
    eventBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        minWidth: 60,
        alignItems: 'center',
    },
    eventText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    logUser: {
        fontWeight: '600',
        color: colors.text,
        fontSize: 14,
    },
    logTime: {
        fontSize: 11,
        color: colors.textSubtle,
        marginTop: 2,
    },
    filterRow: {
        flexDirection: 'row',
        gap: spacing.s,
        marginBottom: spacing.s,
    },
    filterChip: {
        paddingHorizontal: 14,
        paddingVertical: 7,
        borderRadius: 20,
        backgroundColor: colors.secondary,
        borderWidth: 1,
        borderColor: colors.border,
    },
    filterChipActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    filterChipText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSubtle,
    },
    filterChipTextActive: {
        color: 'white',
    },
    filterSubtitle: {
        fontSize: 11,
        color: colors.textSubtle,
        marginBottom: spacing.s,
        fontStyle: 'italic',
    },
    exportBtn: {
        backgroundColor: colors.primary,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.m,
        borderRadius: 16,
        marginTop: spacing.xl,
        marginBottom: spacing.l,
        gap: spacing.s,
        ...appStyles.elevation,
    },
    exportBtnDisabled: {
        backgroundColor: colors.textSubtle,
        opacity: 0.7,
    },
    exportBtnText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 15,
    }
});
