import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { colors, spacing, typography, appStyles } from '../theme';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import * as db from '../services/db';

export const UsersScreen = ({ navigation, route }: any) => {
    const currentUser = route.params?.user;
    const [users, setUsers] = useState<any[]>([]);

    useFocusEffect(
        useCallback(() => {
            loadUsers();
        }, [])
    );

    const loadUsers = async () => {
        try {
            const data = await db.getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Error loading users:', error);
            Alert.alert("Error", "Failed to load users list.");
        }
    };

    const handleDelete = (user: any) => {
        if (user.username === 'admin') {
            Alert.alert("Protected", "Default admin account cannot be deleted.");
            return;
        }

        Alert.alert(
            "Delete User",
            `Are you sure you want to delete ${user.full_name}?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        await db.deleteUser(user.id);
                        loadUsers();
                    }
                }
            ]
        );
    };

    const getInitials = (name: string) => {
        return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <AppHeader
                title="Management Users"
                onBack={() => navigation.goBack()}
                rightElement={
                    <TouchableOpacity
                        style={[styles.headerCircleBtn, { backgroundColor: colors.primary }]}
                        onPress={() => navigation.navigate('Register', { user: currentUser })}
                    >
                        <Ionicons name="add" size={24} color="white" />
                    </TouchableOpacity>
                }
            />

            <FlatList
                data={users}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={{ padding: spacing.m, paddingBottom: 40 }}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <AppCard style={styles.userCard}>
                        <View style={styles.userLeft}>
                            <View style={[styles.avatarCircle, { backgroundColor: item.role === 'SUPER_ADMIN' ? '#B8860B15' : colors.primary + '15' }]}>
                                <Text style={[styles.avatarText, { color: item.role === 'SUPER_ADMIN' ? '#B8860B' : colors.primary }]}>
                                    {getInitials(item.full_name || item.username)}
                                </Text>
                            </View>
                            <View style={styles.userInfo}>
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                    <Text style={styles.userName}>{item.full_name}</Text>
                                    <View style={[styles.roleBadge, { backgroundColor: item.role === 'SUPER_ADMIN' ? '#B8860B20' : '#2196F320' }]}>
                                        <Text style={[styles.roleBadgeText, { color: item.role === 'SUPER_ADMIN' ? '#B8860B' : '#2196F3' }]}>
                                            {item.role === 'SUPER_ADMIN' ? 'SUPER' : 'ADMIN'}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.userSub}>@{item.username} • PIN: {item.password}</Text>
                            </View>
                        </View>
                        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
                            <Ionicons name="trash-outline" size={20} color={colors.error} />
                        </TouchableOpacity>
                    </AppCard>
                )}
            />
        </SafeAreaView>
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
        alignItems: 'center',
        justifyContent: 'center',
    },
    userCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: spacing.m,
        marginBottom: spacing.m,
    },
    userLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: spacing.m,
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontWeight: 'bold',
        fontSize: 16,
    },
    userInfo: {
        flex: 1,
    },
    userName: {
        fontWeight: 'bold',
        fontSize: typography.sizes.m,
        color: colors.text,
    },
    userSub: {
        fontSize: typography.sizes.xs,
        color: colors.textSubtle,
        marginTop: 2,
    },
    roleBadge: {
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4,
    },
    roleBadgeText: {
        fontSize: 10,
        fontWeight: 'bold',
    },
    deleteBtn: {
        padding: spacing.s,
        backgroundColor: colors.error + '10',
        borderRadius: 10,
    }
});
