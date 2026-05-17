import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, appStyles } from '../theme';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import * as db from '../services/db';

export const RegisterScreen = ({ navigation, route }: any) => {
    const currentUser = route.params?.user;
    const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';

    // Role-based theme colors (Super Admin themed)
    const goldPrimary = '#B8860B';
    const goldLight = '#FFF8DC';
    const goldDark = '#8B4513';

    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Basic access check
    if (!isSuperAdmin) {
        Alert.alert("Access Denied", "Only Super Admins can register new users.");
        navigation.goBack();
        return null;
    }

    const handleRegister = async () => {
        if (!username.trim() || !password.trim() || !fullName.trim()) {
            Alert.alert("Error", "All fields are required.");
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match.");
            return;
        }

        setIsLoading(true);
        try {
            await db.registerUser({
                username: username.trim(),
                password: password,
                fullName: fullName.trim(),
                role: 'ADMIN' // Only Admins can be registered by Super Admin
            });

            Alert.alert(
                "Success",
                "Admin account created successfully! They can now log in.",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } catch (error: any) {
            console.error("Registration Error:", error);
            Alert.alert("Registration Failed", error.message || "An error occurred during registration.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <AppHeader
                title="Management Admin"
                onBack={() => navigation.goBack()}
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.heroSection}>
                        <View style={styles.iconCircle}>
                            <Ionicons name="person-add" size={40} color={goldPrimary} />
                        </View>
                        <Text style={styles.title}>Register New Admin</Text>
                        <Text style={styles.subtitle}>Enter details to create a new administrator account with restricted access.</Text>
                    </View>

                    <AppCard style={styles.registerCard}>
                        <View style={styles.formSection}>
                            <Text style={styles.formTitle}>Profile Information</Text>
                            <AppInput
                                label="Full Name"
                                placeholder="Enter full name"
                                value={fullName}
                                onChangeText={setFullName}
                                leftIcon="person-outline"
                            />
                        </View>

                        <View style={styles.formSection}>
                            <Text style={styles.formTitle}>Login Account</Text>
                            <AppInput
                                label="Username"
                                placeholder="Choose a username"
                                value={username}
                                onChangeText={setUsername}
                                autoCapitalize="none"
                                leftIcon="at-outline"
                            />
                            <AppInput
                                label="PIN/Password"
                                placeholder="Create a secure PIN"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                                leftIcon="lock-closed-outline"
                            />
                            <AppInput
                                label="Confirm PIN"
                                placeholder="Repeat PIN"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                secureTextEntry
                                leftIcon="shield-checkmark-outline"
                            />
                        </View>

                        <AppButton
                            title={isLoading ? "Creating Account..." : "Register Admin"}
                            onPress={handleRegister}
                            disabled={isLoading}
                            style={{ backgroundColor: goldDark, marginTop: spacing.m }}
                        />
                    </AppCard>

                    <View style={styles.noteSection}>
                        <Ionicons name="information-circle-outline" size={20} color={colors.textSubtle} />
                        <Text style={styles.noteText}>
                            The new admin will be given standard permissions and can only manage transactions and basic outlet tasks.
                        </Text>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        padding: spacing.l,
        paddingBottom: spacing.xl,
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: spacing.xl,
        marginTop: spacing.m,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFF8DC',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.m,
        ...appStyles.elevation,
    },
    title: {
        fontSize: typography.sizes.xxl,
        fontWeight: 'bold',
        color: colors.text,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: typography.sizes.m,
        color: colors.textSubtle,
        textAlign: 'center',
        marginTop: spacing.s,
        paddingHorizontal: spacing.l,
    },
    registerCard: {
        padding: spacing.l,
        backgroundColor: 'white',
        borderRadius: 24,
    },
    formSection: {
        marginBottom: spacing.xl,
    },
    formTitle: {
        fontSize: typography.sizes.m,
        fontWeight: 'bold',
        color: '#B8860B',
        marginBottom: spacing.m,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    noteSection: {
        flexDirection: 'row',
        padding: spacing.m,
        backgroundColor: 'rgba(0,0,0,0.03)',
        borderRadius: 16,
        marginTop: spacing.xl,
        alignItems: 'flex-start',
    },
    noteText: {
        flex: 1,
        fontSize: typography.sizes.s,
        color: colors.textSubtle,
        marginLeft: spacing.s,
        lineHeight: 18,
    },
});
