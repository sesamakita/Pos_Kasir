
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image, Platform, ActionSheetIOS } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, appStyles } from '../theme';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import * as db from '../services/db';

const COLOR_OPTIONS = [
    { label: 'Green', value: '#4CAF7D' },
    { label: 'Blue', value: '#2196F3' },
    { label: 'Purple', value: '#7C3AED' },
    { label: 'Orange', value: '#F97316' },
    { label: 'Red', value: '#EF4444' },
    { label: 'Teal', value: '#14B8A6' },
    { label: 'Dark', value: '#1E293B' },
    { label: 'Gold', value: '#B8860B' },
];

export const EditStoreScreen = ({ navigation, route }: any) => {
    const storeData = route.params?.storeSettings || {};

    const [storeName, setStoreName] = useState(storeData.store_name || 'V-POS Store');
    const [storeAddress, setStoreAddress] = useState(storeData.store_address || '');
    const [storePhone, setStorePhone] = useState(storeData.store_phone || '');
    const [storeLogo, setStoreLogo] = useState<string | null>(storeData.store_logo || null);
    const [splashColor, setSplashColor] = useState(storeData.splash_color || '#4CAF7D');
    const [isLoading, setIsLoading] = useState(false);

    const pickLogoFromGallery = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Izin Diperlukan", "Izinkan akses galeri untuk memilih logo.");
            return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setStoreLogo(result.assets[0].uri);
        }
    };

    const takeLogoFromCamera = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Izin Diperlukan", "Izinkan akses kamera untuk mengambil foto logo.");
            return;
        }
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setStoreLogo(result.assets[0].uri);
        }
    };

    const handleChangeLogo = () => {
        const options = ['Ambil Foto', 'Pilih dari Galeri', ...(storeLogo ? ['Hapus Logo'] : []), 'Batal'];
        const cancelIndex = options.length - 1;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                { options, cancelButtonIndex: cancelIndex, destructiveButtonIndex: storeLogo ? options.length - 2 : undefined },
                (idx) => {
                    if (idx === 0) takeLogoFromCamera();
                    else if (idx === 1) pickLogoFromGallery();
                    else if (idx === 2 && storeLogo) setStoreLogo(null);
                }
            );
        } else {
            Alert.alert("Ganti Logo Toko", "Pilih sumber gambar", [
                { text: "📷 Ambil Foto", onPress: takeLogoFromCamera },
                { text: "🖼️ Pilih dari Galeri", onPress: pickLogoFromGallery },
                ...(storeLogo ? [{ text: "🗑️ Hapus Logo", onPress: () => setStoreLogo(null), style: 'destructive' as const }] : []),
                { text: "Batal", style: 'cancel' as const },
            ]);
        }
    };

    const handleSave = async () => {
        if (!storeName.trim()) {
            Alert.alert("Error", "Nama toko tidak boleh kosong.");
            return;
        }
        setIsLoading(true);
        try {
            await db.updateStoreSettings({
                store_name: storeName.trim(),
                store_address: storeAddress.trim(),
                store_phone: storePhone.trim(),
                store_logo: storeLogo,
                splash_color: splashColor,
            });
            Alert.alert("Berhasil", "Pengaturan toko berhasil disimpan!", [
                { text: "OK", onPress: () => navigation.goBack() }
            ]);
        } catch (error) {
            console.error("Save Store Error:", error);
            Alert.alert("Error", "Gagal menyimpan pengaturan toko.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <AppHeader
                title="Edit Toko"
                onBack={() => navigation.goBack()}
                rightElement={
                    <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                        <Text style={[styles.saveBtnText, isLoading && { opacity: 0.5 }]}>
                            {isLoading ? '...' : 'Simpan'}
                        </Text>
                    </TouchableOpacity>
                }
            />

            <ScrollView contentContainerStyle={styles.scrollContent}>
                {/* Logo Section */}
                <View style={styles.logoSection}>
                    <View style={[styles.logoCircle, { backgroundColor: splashColor }]}>
                        {storeLogo ? (
                            <Image source={{ uri: storeLogo }} style={styles.logoImage} />
                        ) : (
                            <Ionicons name="storefront" size={48} color="white" />
                        )}
                    </View>
                    <TouchableOpacity onPress={handleChangeLogo}>
                        <Text style={styles.changeLogoText}>Ganti Logo Toko</Text>
                    </TouchableOpacity>
                    <Text style={styles.logoHint}>Logo ini akan tampil di Splash Screen</Text>
                </View>

                {/* Store Info */}
                <Text style={styles.sectionTitle}>Informasi Toko</Text>
                <AppCard style={styles.formCard}>
                    <AppInput
                        label="Nama Toko"
                        value={storeName}
                        onChangeText={setStoreName}
                        placeholder="Masukkan nama toko"
                    />
                    <AppInput
                        label="Alamat"
                        value={storeAddress}
                        onChangeText={setStoreAddress}
                        placeholder="Masukkan alamat toko"
                        multiline
                        style={{ height: 80, textAlignVertical: 'top', paddingTop: spacing.m }}
                    />
                    <AppInput
                        label="No. Telepon"
                        value={storePhone}
                        onChangeText={setStorePhone}
                        placeholder="Masukkan nomor telepon"
                        keyboardType="phone-pad"
                    />
                </AppCard>

                {/* Splash Color */}
                <Text style={styles.sectionTitle}>Warna Splash Screen</Text>
                <Text style={styles.sectionSubtitle}>Pilih warna latar belakang splash screen</Text>
                <AppCard style={styles.formCard}>
                    <View style={styles.colorGrid}>
                        {COLOR_OPTIONS.map(opt => (
                            <TouchableOpacity
                                key={opt.value}
                                style={[
                                    styles.colorOption,
                                    { backgroundColor: opt.value },
                                    splashColor === opt.value && styles.colorOptionActive,
                                ]}
                                onPress={() => setSplashColor(opt.value)}
                            >
                                {splashColor === opt.value && (
                                    <Ionicons name="checkmark" size={20} color="white" />
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                    {/* Preview */}
                    <View style={[styles.splashPreview, { backgroundColor: splashColor }]}>
                        {storeLogo ? (
                            <Image source={{ uri: storeLogo }} style={styles.previewLogo} />
                        ) : (
                            <Ionicons name="storefront" size={32} color="white" />
                        )}
                        <Text style={styles.previewName}>{storeName || 'V-POS Store'}</Text>
                    </View>
                </AppCard>

                <View style={{ height: 40 }} />
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    saveBtnText: {
        fontSize: typography.sizes.m,
        fontWeight: 'bold',
        color: colors.primary,
    },
    scrollContent: {
        padding: spacing.m,
    },
    logoSection: {
        alignItems: 'center',
        marginVertical: spacing.l,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...appStyles.elevation,
    },
    logoImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    changeLogoText: {
        marginTop: spacing.m,
        color: colors.primary,
        fontWeight: '700',
        fontSize: typography.sizes.s,
    },
    logoHint: {
        marginTop: 4,
        color: colors.textSubtle,
        fontSize: typography.sizes.xs,
        fontStyle: 'italic',
    },
    sectionTitle: {
        fontSize: typography.sizes.m,
        fontWeight: '700',
        color: colors.text,
        marginTop: spacing.m,
        marginBottom: spacing.s,
    },
    sectionSubtitle: {
        fontSize: typography.sizes.xs,
        color: colors.textSubtle,
        marginBottom: spacing.m,
    },
    formCard: {
        padding: spacing.l,
        marginBottom: spacing.m,
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.m,
        marginBottom: spacing.l,
    },
    colorOption: {
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: 'center',
        justifyContent: 'center',
        ...appStyles.elevation,
    },
    colorOptionActive: {
        borderWidth: 3,
        borderColor: 'white',
        elevation: 8,
        shadowOpacity: 0.4,
    },
    splashPreview: {
        height: 140,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        ...appStyles.elevation,
    },
    previewLogo: {
        width: 48,
        height: 48,
        borderRadius: 24,
        marginBottom: 8,
    },
    previewName: {
        color: 'white',
        fontSize: typography.sizes.m,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
});
