import React, { useState, useEffect, useCallback } from 'react';
import * as db from '../services/db';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, appStyles } from '../theme';
import { AppCard } from '../components/AppCard';
import { AppButton } from '../components/AppButton';
import { AppHeader } from '../components/AppHeader';

export const SettingsScreen = ({ navigation, route }: any) => {
    const initialUser = route.params?.user || { id: 1, full_name: 'Admin', role: 'ADMIN' };
    const [user, setUser] = useState(initialUser);
    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    const [autoPrint, setAutoPrint] = useState(true);
    const [soundScan, setSoundScan] = useState(true);
    const [usersList, setUsersList] = useState<any[]>([]);
    const [storeSettings, setStoreSettings] = useState<any>(null);

    useFocusEffect(
        useCallback(() => {
            loadData();
        }, [])
    );

    const loadData = async () => {
        try {
            // Load current user profile
            const updatedUser = await db.getUserById(user.id);
            if (updatedUser) {
                setUser(updatedUser);
            }

            // Load store settings
            const store = await db.getStoreSettings();
            setStoreSettings(store);

            // Load all users for super admin
            if (isSuperAdmin) {
                const dbInstance = await db.getDB();
                const allUsers = await dbInstance.getAllAsync('SELECT id, username, password, full_name, role FROM users');
                setUsersList(allUsers);
            }
        } catch (error) {
            console.error('Error loading settings data:', error);
        }
    };

    const getInitials = (name: string) => {
        if (!name) return '??';
        return name.split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <AppHeader
                title="Settings & Profile"
                onBack={() => navigation.goBack()}
            />

            <ScrollView contentContainerStyle={{ padding: spacing.m, paddingBottom: 40 }}>
                {/* Profile Header Section */}
                <View style={[styles.profileHeader, isSuperAdmin && { borderColor: '#B8860B', borderWidth: 1 }]}>
                    <View style={[styles.avatarContainer, { backgroundColor: isSuperAdmin ? '#B8860B' : colors.primary }]}>
                        {user.profile_photo ? (
                            <Image source={{ uri: user.profile_photo }} style={{ width: '100%', height: '100%', borderRadius: 32 }} />
                        ) : (
                            <Text style={styles.avatarText}>{getInitials(user.full_name)}</Text>
                        )}
                        <View style={[styles.onlineStatus, { backgroundColor: isSuperAdmin ? '#B8860B' : colors.primary }]} />
                    </View>
                    <View style={styles.profileInfo}>
                        <Text style={styles.profileName}>{user.full_name}</Text>
                        <Text style={styles.profileRole}>
                            {isSuperAdmin ? '👑 Super Admin' : '👤 Admin'} • <Text style={{ color: isSuperAdmin ? '#B8860B' : colors.primary }}>Online</Text>
                        </Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.editBtn, isSuperAdmin && { backgroundColor: '#FFF8DC' }]}
                        onPress={() => navigation.navigate('EditProfile', { user })}
                    >
                        <Text style={[styles.editBtnText, isSuperAdmin && { color: '#8B4513' }]}>Edit</Text>
                    </TouchableOpacity>
                </View>

                {/* Session & Outlet Info */}
                <Text style={styles.sectionTitle}>Outlet Info</Text>
                <AppCard style={styles.infoCard}>
                    <InfoRow label="Outlet" value={storeSettings?.store_name || 'V-POS Store'} />
                    <InfoRow label="Alamat" value={storeSettings?.store_address || '-'} />
                    <InfoRow label="Telepon" value={storeSettings?.store_phone || '-'} />
                    <InfoRow label="Current User" value={user.username} />
                    <InfoRow label="Access Level" value={isSuperAdmin ? "Full Access" : "Standard Admin"} />
                </AppCard>

                {/* Connections Section */}
                <Text style={styles.sectionTitle}>Hardware & Connections</Text>
                <AppCard style={styles.card}>
                    <ConnectionItem name="Thermal Printer" status="Connected" icon="print-outline" />
                    <ConnectionItem name="Bluetooth Scanner" status="Searching..." icon="scan-outline" />
                    <AppButton
                        title="Scan for Devices"
                        variant="secondary"
                        onPress={() => { }}
                        style={{ marginTop: spacing.m, height: 48 }}
                    />
                </AppCard>

                {/* Account Security Section */}
                <Text style={styles.sectionTitle}>Account & Security</Text>
                <AppCard style={styles.card}>
                    <MenuLink label="Change Login PIN" icon="lock-closed-outline" />
                    {isSuperAdmin && (
                        <>
                            <MenuLink
                                label="Edit Toko"
                                icon="storefront-outline"
                                onPress={async () => {
                                    const storeSettings = await db.getStoreSettings();
                                    navigation.navigate('EditStore', { storeSettings });
                                }}
                            />
                            <MenuLink
                                label="User Management"
                                icon="people-outline"
                                onPress={() => navigation.navigate('Users', { user })}
                            />
                            <MenuLink
                                label="Reset Database"
                                icon="refresh-outline"
                                color={colors.error}
                                onPress={() => { }}
                            />
                        </>
                    )}
                    <MenuLink label="Two-Factor Authentication" icon="shield-checkmark-outline" badge="Off" />
                </AppCard>

                {/* App Preferences */}
                <Text style={styles.sectionTitle}>App Preferences</Text>
                <AppCard style={styles.card}>
                    <ToggleItem
                        label="Auto-print Receipt"
                        value={autoPrint}
                        onValueChange={setAutoPrint}
                    />
                    <ToggleItem
                        label="Sound on Scan"
                        value={soundScan}
                        onValueChange={setSoundScan}
                    />
                </AppCard>


                <AppButton
                    title="Logout"
                    variant="outline"
                    onPress={async () => {
                        await db.logUserActivity(user.id, 'LOGOUT');
                        navigation.replace('Login');
                    }}
                    style={{ marginTop: spacing.xl, borderColor: colors.error }}
                    textStyle={{ color: colors.error }}
                />

                <Text style={styles.versionText}>Version 1.0.1 (Build 20260211)</Text>
            </ScrollView>
        </SafeAreaView>
    );
};

const InfoRow = ({ label, value }: any) => (
    <View style={styles.infoRow}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
    </View>
);

const ConnectionItem = ({ name, status, icon }: any) => (
    <View style={styles.connItem}>
        <View style={styles.connLeft}>
            <View style={styles.iconCircle}>
                <Ionicons name={icon} size={20} color={colors.primaryDark} />
            </View>
            <Text style={styles.connName}>{name}</Text>
        </View>
        <Text style={[styles.connStatus, status === 'Connected' && { color: colors.primaryDark }]}>
            {status}
        </Text>
    </View>
);

const MenuLink = ({ label, icon, badge, onPress, color }: any) => (
    <TouchableOpacity style={styles.menuLink} onPress={onPress}>
        <View style={styles.menuLinkLeft}>
            <Ionicons name={icon} size={20} color={color || colors.text} style={{ marginRight: spacing.s }} />
            <Text style={[styles.menuLinkLabel, color && { color }]}>{label}</Text>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {badge && <Text style={styles.menuBadge}>{badge}</Text>}
            <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
        </View>
    </TouchableOpacity>
);

const ToggleItem = ({ label, value, onValueChange }: any) => (
    <View style={styles.toggleItem}>
        <Text style={styles.toggleLabel}>{label}</Text>
        <Switch
            value={value}
            onValueChange={onValueChange}
            trackColor={{ false: '#767577', true: colors.primaryLight }}
            thumbColor={value ? colors.primary : '#f4f3f4'}
        />
    </View>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        display: 'none',
    },
    title: {
        fontSize: typography.sizes.l,
        fontWeight: '700',
    },
    profileHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: spacing.l,
        borderRadius: 24,
        marginBottom: spacing.l,
        ...appStyles.elevation,
    },
    avatarContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontWeight: 'bold',
        color: 'white',
        fontSize: 22,
    },
    onlineStatus: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: colors.primary,
        borderWidth: 2,
        borderColor: 'white',
    },
    iconCircle: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileInfo: {
        flex: 1,
        marginLeft: spacing.m,
    },
    profileName: {
        fontSize: typography.sizes.l,
        fontWeight: 'bold',
        color: colors.text,
    },
    profileRole: {
        fontSize: typography.sizes.s,
        color: colors.textSubtle,
        marginTop: 2,
    },
    editBtn: {
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        backgroundColor: colors.secondary,
        borderRadius: 12,
    },
    editBtnText: {
        color: colors.primaryDark,
        fontSize: typography.sizes.s,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: typography.sizes.m,
        fontWeight: '700',
        marginBottom: spacing.m,
        marginTop: spacing.s,
        color: colors.text,
    },
    infoCard: {
        padding: spacing.m,
        marginBottom: spacing.l,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    infoLabel: {
        color: colors.textSubtle,
        fontSize: typography.sizes.s,
    },
    infoValue: {
        fontWeight: '600',
        color: colors.text,
        fontSize: typography.sizes.s,
    },
    card: {
        padding: spacing.m,
        marginBottom: spacing.l,
    },
    connItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.s,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    connLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.m,
    },
    connName: {
        fontWeight: '600',
    },
    connStatus: {
        fontSize: typography.sizes.xs,
        color: colors.textSubtle,
    },
    menuLink: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.m,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuLinkLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    menuLinkLabel: {
        fontWeight: '500',
        fontSize: typography.sizes.m,
    },
    menuBadge: {
        fontSize: typography.sizes.xs,
        backgroundColor: '#F0F0F0',
        paddingHorizontal: spacing.s,
        paddingVertical: 2,
        borderRadius: 8,
        marginRight: spacing.s,
        color: colors.textSubtle,
    },
    toggleItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: spacing.s,
    },
    toggleLabel: {
        fontWeight: '500',
    },
    versionText: {
        textAlign: 'center',
        color: colors.textSubtle,
        fontSize: 12,
        marginTop: spacing.m,
    },
    roleLabel: {
        paddingHorizontal: spacing.s,
        paddingVertical: 4,
        borderRadius: 6,
    },
    roleLabelText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
});
