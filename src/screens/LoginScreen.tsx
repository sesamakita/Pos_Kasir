
import React, { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, Alert, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { AppCard } from '../components/AppCard';
import * as db from '../services/db';

export const LoginScreen = ({ navigation }: any) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async () => {
        if (!username.trim() || !password.trim()) {
            Alert.alert("Error", "Please enter both username and password.");
            return;
        }

        setIsLoading(true);
        try {
            await db.initDB();
            const user = await db.loginUser(username, password);

            if (user) {
                await db.logUserActivity(user.id, 'LOGIN');
                navigation.replace('Dashboard', { user });
            } else {
                Alert.alert("Login Failed", "Invalid username or password.");
            }
        } catch (error: any) {
            console.error("Login Error:", error);
            Alert.alert("System Error", `An error occurred: ${error.message || 'Unknown error'}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <View style={styles.container}>
            {/* Background Decor - Simple Green Circles for "Depth" */}
            <View style={[styles.decorCircle, { top: -100, right: -50, backgroundColor: colors.primaryLight }]} />
            <View style={[styles.decorCircle, { bottom: -50, left: -50, backgroundColor: colors.secondary, width: 300, height: 300 }]} />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.formContainer}
            >
                <View style={styles.header}>
                    <View style={styles.logoCircle}>
                        <Text style={styles.logoText}>V</Text>
                    </View>
                    <Text style={styles.title}>Welcome back</Text>
                    <Text style={styles.subtitle}>Sign in to your account</Text>
                </View>

                <AppCard style={styles.loginCard}>
                    <AppInput
                        label="Username or Email"
                        placeholder="name@gmail.com"
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />
                    <AppInput
                        label="Password"
                        placeholder="Enter your password"
                        secureTextEntry
                        value={password}
                        onChangeText={setPassword}
                    />

                    <AppButton
                        title={isLoading ? "Signing in..." : "Sign in"}
                        onPress={handleLogin}
                        disabled={isLoading}
                        style={{ marginTop: spacing.m }}
                    />

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>No account yet? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                            <Text style={[styles.footerText, { color: colors.primary, fontWeight: 'bold' }]}>Sign up</Text>
                        </TouchableOpacity>
                    </View>
                </AppCard>
            </KeyboardAvoidingView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5', // Light background
    },
    decorCircle: {
        position: 'absolute',
        width: 200,
        height: 200,
        borderRadius: 999,
        opacity: 0.5,
    },
    formContainer: {
        flex: 1,
        justifyContent: 'center',
        padding: spacing.l,
    },
    header: {
        marginBottom: spacing.xxl,
        alignItems: 'center',
    },
    logoCircle: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.m,
    },
    logoText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    title: {
        fontFamily: typography.fontFamily,
        fontSize: typography.sizes.xxl,
        fontWeight: '700',
        color: colors.text,
    },
    subtitle: {
        fontFamily: typography.fontFamily,
        fontSize: typography.sizes.m,
        color: colors.textSubtle,
        marginTop: spacing.xs,
    },
    loginCard: {
        padding: spacing.l,
        backgroundColor: 'rgba(255,255,255,0.9)', // Glassmorphism-lite
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: spacing.xl,
    },
    footerText: {
        fontSize: typography.sizes.s,
        color: colors.textSubtle,
    }
});
