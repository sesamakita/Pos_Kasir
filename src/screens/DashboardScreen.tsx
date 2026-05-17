import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, appStyles } from '../theme';
import { AppCard } from '../components/AppCard';
import * as db from '../services/db';

const GridItem = ({ title, subtitle, icon, onPress }: any) => (
    <TouchableOpacity style={styles.gridItem} onPress={onPress}>
        <View style={styles.iconContainer}>
            <Ionicons name={icon} size={24} color={colors.primaryDark} />
        </View>
        <Text style={styles.gridTitle}>{title}</Text>
        <Text style={styles.gridSubtitle}>{subtitle}</Text>
    </TouchableOpacity>
);

const ActivityItem = ({ title, time, price, detail, type, roleColors }: any) => (
    <View style={styles.activityItem}>
        <View style={[styles.activityIconCircle, { backgroundColor: roleColors?.primaryLight || colors.secondary }]}>
            <Ionicons
                name={type === 'sale' ? 'receipt-outline' : 'cube-outline'}
                size={18}
                color={roleColors?.primary || colors.primary}
            />
        </View>
        <View style={styles.activityInfo}>
            <Text style={styles.activityTitle}>{title}</Text>
            <Text style={styles.activityTime}>{time}</Text>
        </View>
        <Text style={[styles.activityValue, { color: roleColors?.primaryDark || colors.primaryDark }]}>
            {price || detail}
        </Text>
    </View>
);

const getTimeAgo = (isoString: string) => {
    const now: any = new Date();
    const past: any = new Date(isoString);
    const diff = Math.floor((now - past) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return past.toLocaleDateString();
};

export const DashboardScreen = ({ navigation, route }: any) => {
    const initialUser = route.params?.user || { id: 1, full_name: 'Admin', role: 'ADMIN' };
    const [userData, setUserData] = useState(initialUser);
    const isSuperAdmin = userData.role === 'SUPER_ADMIN';

    const [activities, setActivities] = useState<any[]>([]);
    const [todaySales, setTodaySales] = useState(0);

    // Role-based theme colors
    const roleColors = {
        primary: isSuperAdmin ? '#B8860B' : colors.primary, // Dark Goldenrod for Super Admin
        primaryLight: isSuperAdmin ? '#FFF8DC' : colors.primaryLight,
        primaryDark: isSuperAdmin ? '#8B4513' : colors.primaryDark,
    };

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            // Load latest user info to sync profile changes
            const updatedUser = await db.getUserById(userData.id);
            if (updatedUser) {
                setUserData(updatedUser);
            }

            const activityData = await db.getRecentActivity(5, userData.role, userData.id);

            let salesData = 0;
            if (isSuperAdmin) {
                salesData = await db.getGlobalTodaySales();
            } else {
                salesData = await db.getSessionSales(userData.id);
            }

            setActivities(activityData);
            setTodaySales(salesData);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        }
    };

    const handleLogout = async () => {
        await db.logUserActivity(userData.id, 'LOGOUT');
        navigation.replace('Login');
    };

    const formatDate = () => {
        return new Date().toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const getInitials = (name: string) => {
        if (!name) return '??';
        return name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <View style={styles.container}>
            <View style={styles.staticContent}>
                <View style={styles.topSection}>
                    <View>
                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                            <Text style={styles.greeting}>Hello, {(userData.full_name || 'Admin').split(' ')[0]}</Text>
                            <View style={[
                                styles.roleBadge,
                                { backgroundColor: isSuperAdmin ? '#B8860B33' : '#2196F333' }
                            ]}>
                                <Text style={[
                                    styles.roleBadgeText,
                                    { color: isSuperAdmin ? '#B8860B' : '#2196F3' }
                                ]}>
                                    {isSuperAdmin ? '👑 Super' : '👤 Admin'}
                                </Text>
                            </View>
                        </View>
                        <Text style={styles.date}>{formatDate()}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View style={[styles.profileCircle, { backgroundColor: roleColors.primaryLight, overflow: 'hidden' }]}>
                            {userData.profile_photo ? (
                                <Image source={{ uri: userData.profile_photo }} style={{ width: '100%', height: '100%', borderRadius: 24 }} />
                            ) : (
                                <Text style={[styles.profileText, { color: roleColors.primaryDark }]}>
                                    {getInitials(userData.full_name)}
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity
                            style={styles.logoutBtn}
                            onPress={handleLogout}
                        >
                            <Ionicons name="log-out-outline" size={22} color={colors.error} />
                        </TouchableOpacity>
                    </View>
                </View>

                <AppCard style={{ ...styles.mainActionCard, backgroundColor: roleColors.primary }}>
                    <View style={styles.mainActionContent}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.mainActionTitle}>Rp {todaySales.toLocaleString()}</Text>
                            <Text style={styles.mainActionSubtitle}>{isSuperAdmin ? "Global Sales (Today)" : "Your Session Sales (Active Shift)"}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.actionButton}
                            onPress={() => navigation.navigate('POS', { user: userData })}
                        >
                            <Text style={[styles.actionButtonText, { color: roleColors.primary }]}>Open POS</Text>
                            <Ionicons name="arrow-forward" size={16} color={roleColors.primary} style={{ marginLeft: 4 }} />
                        </TouchableOpacity>
                    </View>
                </AppCard>
            </View>

            <ScrollView
                style={styles.scrollableArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <Text style={styles.sectionTitle}>Management</Text>

                <View style={styles.grid}>
                    <GridItem
                        title="Inventory"
                        subtitle={isSuperAdmin ? "Control all stock" : "Check stock"}
                        icon="cube-outline"
                        onPress={() => navigation.navigate('Inventory', { user: userData })}
                    />
                    <GridItem
                        title="Reports"
                        subtitle={isSuperAdmin ? "Full analytics" : "Daily sales"}
                        icon="bar-chart-outline"
                        onPress={() => navigation.navigate('Reports', { user: userData })}
                    />
                    <GridItem
                        title="History"
                        subtitle="Past sales"
                        icon="calendar-outline"
                        onPress={() => navigation.navigate('History', { user: userData })}
                    />
                    {isSuperAdmin && (
                        <GridItem
                            title="Users"
                            subtitle="Manage team"
                            icon="people-outline"
                            onPress={() => navigation.navigate('Users', { user: userData })}
                        />
                    )}
                    <GridItem
                        title="Settings"
                        subtitle="App config"
                        icon="settings-outline"
                        onPress={() => navigation.navigate('Settings', { user: userData })}
                    />
                </View>

                <Text style={styles.sectionTitle}>Recent Activity</Text>
                <AppCard style={styles.activityCard}>
                    {activities.map((act, index) => (
                        <ActivityItem
                            key={index}
                            title={`Sale #${act.id}`}
                            time={getTimeAgo(act.date)}
                            price={`Rp ${act.total.toLocaleString()}`}
                            type={act.type}
                            roleColors={roleColors}
                        />
                    ))}
                    {activities.length === 0 && (
                        <View style={{ padding: spacing.m, alignItems: 'center' }}>
                            <Text style={{ color: colors.textSubtle }}>No recent activity</Text>
                        </View>
                    )}
                </AppCard>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    staticContent: {
        padding: spacing.m,
        paddingTop: 60,
    },
    scrollableArea: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: spacing.m,
        paddingBottom: spacing.xl,
    },
    topSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: spacing.l,
    },
    greeting: {
        fontSize: typography.sizes.xl,
        fontWeight: '700',
        color: colors.text,
    },
    date: {
        fontSize: typography.sizes.s,
        color: colors.textSubtle,
    },
    profileCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileText: {
        fontWeight: 'bold',
        color: colors.primaryDark,
    },
    logoutBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.error + '15',
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: spacing.s,
    },
    roleBadge: {
        marginLeft: spacing.s,
        paddingHorizontal: spacing.s,
        paddingVertical: 2,
        borderRadius: 8,
    },
    roleBadgeText: {
        fontSize: typography.sizes.xs,
        fontWeight: 'bold',
        textTransform: 'uppercase',
    },
    mainActionCard: {
        backgroundColor: colors.primary,
        marginBottom: spacing.l,
        padding: spacing.l,
    },
    mainActionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    mainActionTitle: {
        fontSize: typography.sizes.xl,
        fontWeight: 'bold',
        color: 'white',
    },
    mainActionSubtitle: {
        fontSize: typography.sizes.s,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 4,
    },
    actionButton: {
        backgroundColor: 'white',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        borderRadius: 999,
        flexDirection: 'row',
        alignItems: 'center',
    },
    actionButtonText: {
        color: colors.primary,
        fontWeight: 'bold',
    },
    sectionTitle: {
        fontSize: typography.sizes.l,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.m,
        marginTop: spacing.s,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: spacing.l,
    },
    gridItem: {
        width: '48%',
        backgroundColor: 'white',
        borderRadius: 20,
        padding: spacing.m,
        marginBottom: spacing.m,
        ...appStyles.elevation,
    },
    iconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.s,
    },
    gridTitle: {
        fontWeight: 'bold',
        fontSize: typography.sizes.m,
        color: colors.text,
    },
    gridSubtitle: {
        fontSize: typography.sizes.xs,
        color: colors.textSubtle,
        marginTop: 2,
    },
    activityCard: {
        padding: 0,
        overflow: 'hidden',
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    activityIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: spacing.m,
    },
    activityInfo: {
        flex: 1,
    },
    activityTitle: {
        fontWeight: '600',
        color: colors.text,
    },
    activityTime: {
        fontSize: typography.sizes.xs,
        color: colors.textSubtle,
    },
    activityValue: {
        fontWeight: 'bold',
        color: colors.primaryDark,
    }
});
