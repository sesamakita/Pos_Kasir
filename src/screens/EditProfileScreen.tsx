
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, Image, ActionSheetIOS } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, typography, appStyles } from '../theme';
import { AppButton } from '../components/AppButton';
import { AppInput } from '../components/AppInput';
import { AppCard } from '../components/AppCard';
import { AppHeader } from '../components/AppHeader';
import * as db from '../services/db';

export const EditProfileScreen = ({ navigation, route }: any) => {
    const user = route.params?.user || { id: 1, full_name: 'John Doe', role: 'ADMIN', username: 'admin', password: '123' };
    const isSuperAdmin = user.role === 'SUPER_ADMIN';

    const [name, setName] = useState(user.full_name || '');
    const [email, setEmail] = useState(user.email || `${user.username || 'admin'}@vpos.com`);
    const [phone, setPhone] = useState(user.phone || '');
    const [bio, setBio] = useState(user.bio || `${isSuperAdmin ? 'Super Admin' : 'Admin'} at V-Pos Central`);
    const [pin, setPin] = useState(user.password || '');
    const [profilePhoto, setProfilePhoto] = useState<string | null>(user.profile_photo || null);
    const [isLoading, setIsLoading] = useState(false);

    const pickImageFromGallery = async () => {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Izin Diperlukan", "Izinkan akses galeri untuk memilih foto profil.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            setProfilePhoto(result.assets[0].uri);
        }
    };

    const takePhotoFromCamera = async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
            Alert.alert("Izin Diperlukan", "Izinkan akses kamera untuk mengambil foto profil.");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets[0]) {
            setProfilePhoto(result.assets[0].uri);
        }
    };

    const handleChangePhoto = () => {
        const options = ['Ambil Foto', 'Pilih dari Galeri', ...(profilePhoto ? ['Hapus Foto'] : []), 'Batal'];
        const cancelIndex = options.length - 1;
        const destructiveIndex = profilePhoto ? options.length - 2 : undefined;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options,
                    cancelButtonIndex: cancelIndex,
                    destructiveButtonIndex: destructiveIndex,
                },
                (btnIdx) => {
                    if (btnIdx === 0) takePhotoFromCamera();
                    else if (btnIdx === 1) pickImageFromGallery();
                    else if (btnIdx === 2 && profilePhoto) setProfilePhoto(null);
                }
            );
        } else {
            // Android: use Alert as action sheet
            Alert.alert(
                "Ganti Foto Profil",
                "Pilih sumber foto",
                [
                    { text: "📷 Ambil Foto", onPress: takePhotoFromCamera },
                    { text: "🖼️ Pilih dari Galeri", onPress: pickImageFromGallery },
                    ...(profilePhoto ? [{ text: "🗑️ Hapus Foto", onPress: () => setProfilePhoto(null), style: 'destructive' as const }] : []),
                    { text: "Batal", style: 'cancel' as const },
                ]
            );
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Name cannot be empty.");
            return;
        }

        setIsLoading(true);
        try {
            await db.updateUser(user.id, {
                fullName: name.trim(),
                password: pin,
                email: email.trim(),
                phone: phone.trim(),
                bio: bio.trim(),
                profile_photo: profilePhoto,
            });

            // Success feedback
            Alert.alert(
                "Profile Updated",
                "Your changes have been saved successfully. Please log in again if you changed your PIN.",
                [{ text: "OK", onPress: () => navigation.goBack() }]
            );
        } catch (error) {
            console.error("Save Profile Error:", error);
            Alert.alert("Error", "Failed to save profile changes.");
        } finally {
            setIsLoading(false);
        }
    };

    const initials = (name || '??').split(' ').filter(Boolean).map((n: string) => n[0]).join('').toUpperCase().substring(0, 2);

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <AppHeader
                title="Edit Profile"
                onBack={() => navigation.goBack()}
                rightElement={
                    <TouchableOpacity onPress={handleSave} disabled={isLoading}>
                        <Text style={[styles.saveBtnText, isLoading && { opacity: 0.5 }]}>
                            {isLoading ? '...' : 'Save'}
                        </Text>
                    </TouchableOpacity>
                }
            />

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Avatar Selection */}
                    <View style={styles.avatarSection}>
                        <View style={[styles.avatarLarge, isSuperAdmin && { backgroundColor: '#B8860B' }]}>
                            {profilePhoto ? (
                                <Image source={{ uri: profilePhoto }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarInitial}>{initials}</Text>
                            )}
                        </View>
                        <TouchableOpacity onPress={handleChangePhoto}>
                            <Text style={styles.changePhotoText}>Ganti Foto Profil</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Basic Information */}
                    <Text style={styles.sectionTitle}>Basic Information</Text>
                    <AppCard style={styles.formCard}>
                        <AppInput
                            label="Full Name"
                            value={name}
                            onChangeText={setName}
                            placeholder="Enter your name"
                        />
                        <AppInput
                            label="Email Address"
                            value={email}
                            onChangeText={setEmail}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <AppInput
                            label="Phone Number"
                            value={phone}
                            onChangeText={setPhone}
                            keyboardType="phone-pad"
                        />
                        <AppInput
                            label="Position / Bio"
                            value={bio}
                            onChangeText={setBio}
                            multiline
                            style={{ height: 80, textAlignVertical: 'top', paddingTop: spacing.m }}
                        />
                    </AppCard>

                    {/* Digital Signature Pad */}
                    <Text style={styles.sectionTitle}>Digital Signature</Text>
                    <Text style={styles.sectionSubtitle}>Draw your signature for receipts and reports</Text>
                    <AppCard style={styles.signatureCard}>
                        <View style={styles.signaturePad}>
                            {/* Mock Signature Line */}
                            <View style={styles.signatureLine} />
                            <Text style={styles.signaturePlaceholder}>Draw here</Text>
                        </View>
                        <View style={styles.signatureActions}>
                            <TouchableOpacity style={styles.signatureActionBtn}>
                                <Text style={styles.signatureActionText}>Clear</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.signatureActionBtn, { backgroundColor: colors.secondary }]}>
                                <Text style={[styles.signatureActionText, { color: colors.primaryDark }]}>Capture</Text>
                            </TouchableOpacity>
                        </View>
                    </AppCard>

                    {/* Security PIN Section */}
                    <Text style={styles.sectionTitle}>Security PIN</Text>
                    <AppCard style={styles.formCard}>
                        <AppInput
                            label="Login PIN"
                            value={pin}
                            onChangeText={setPin}
                            secureTextEntry
                            keyboardType="numeric"
                            maxLength={6}
                        />
                        <Text style={styles.pinHint}>Use a 6-digit PIN for quick login to the application.</Text>
                    </AppCard>

                    <View style={{ height: 40 }} />
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
    header: {
        display: 'none',
    },
    title: {
        fontSize: typography.sizes.l,
        fontWeight: '700',
    },
    saveBtnText: {
        fontSize: typography.sizes.m,
        fontWeight: 'bold',
        color: colors.primary,
    },
    scrollContent: {
        padding: spacing.m,
    },
    avatarSection: {
        alignItems: 'center',
        marginVertical: spacing.l,
    },
    avatarLarge: {
        width: 110,
        height: 110,
        borderRadius: 55,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        ...appStyles.elevation,
    },
    avatarImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    avatarInitial: {
        color: 'white',
        fontSize: 36,
        fontWeight: 'bold',
    },
    cameraCircle: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        ...appStyles.elevation,
        borderWidth: 2,
        borderColor: colors.background,
    },
    changePhotoText: {
        marginTop: spacing.m,
        color: colors.primary,
        fontWeight: '700',
        fontSize: typography.sizes.s,
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
    signatureCard: {
        padding: spacing.m,
        marginBottom: spacing.m,
    },
    signaturePad: {
        height: 160,
        backgroundColor: '#F9F9F9',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#EFEFEF',
        borderStyle: 'dashed',
        alignItems: 'center',
        justifyContent: 'center',
    },
    signatureLine: {
        width: '80%',
        height: 1,
        backgroundColor: '#DDD',
        position: 'absolute',
        bottom: 40,
    },
    signaturePlaceholder: {
        color: '#BBB',
        fontSize: typography.sizes.s,
        fontStyle: 'italic',
    },
    signatureActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.s,
        marginTop: spacing.m,
    },
    signatureActionBtn: {
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        borderRadius: 8,
    },
    signatureActionText: {
        fontSize: typography.sizes.xs,
        fontWeight: '600',
        color: colors.textSubtle,
    },
    pinHint: {
        fontSize: typography.sizes.xs,
        color: colors.textSubtle,
        marginTop: -spacing.s,
        fontStyle: 'italic',
    }
});
