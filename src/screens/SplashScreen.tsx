
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, StatusBar, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as db from '../services/db';

export const SplashScreen = ({ navigation }: any) => {
    const bagScale = useRef(new Animated.Value(0)).current;
    const bagRotate = useRef(new Animated.Value(0)).current;
    const footerOpacity = useRef(new Animated.Value(0)).current;
    const dot1 = useRef(new Animated.Value(0.3)).current;
    const dot2 = useRef(new Animated.Value(0.3)).current;
    const dot3 = useRef(new Animated.Value(0.3)).current;
    const dot4 = useRef(new Animated.Value(0.3)).current;

    const [storeLogo, setStoreLogo] = useState<string | null>(null);
    const [storeName, setStoreName] = useState('V-POS');
    const [splashColor, setSplashColor] = useState('#4CAF7D');

    useEffect(() => {
        // Load store settings
        const loadStore = async () => {
            try {
                await db.initDB();
                const settings = await db.getStoreSettings();
                if (settings) {
                    if (settings.store_logo) setStoreLogo(settings.store_logo);
                    if (settings.store_name) setStoreName(settings.store_name);
                    if (settings.splash_color) setSplashColor(settings.splash_color);
                }
            } catch (e) {
                console.log('Splash: Could not load store settings', e);
            }
        };
        loadStore();

        // Bag entrance animation
        Animated.spring(bagScale, {
            toValue: 1,
            friction: 4,
            tension: 40,
            useNativeDriver: true,
        }).start();

        // Subtle floating rotation
        Animated.loop(
            Animated.sequence([
                Animated.timing(bagRotate, {
                    toValue: 1,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
                Animated.timing(bagRotate, {
                    toValue: 0,
                    duration: 2000,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Footer fade in
        Animated.timing(footerOpacity, {
            toValue: 1,
            duration: 800,
            delay: 600,
            useNativeDriver: true,
        }).start();

        // Loading dots animation
        const animateDot = (dot: Animated.Value, delay: number) => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(dot, {
                        toValue: 1,
                        duration: 400,
                        delay,
                        useNativeDriver: true,
                    }),
                    Animated.timing(dot, {
                        toValue: 0.3,
                        duration: 400,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        };
        animateDot(dot1, 0);
        animateDot(dot2, 200);
        animateDot(dot3, 400);
        animateDot(dot4, 600);

        // Navigate to Login after 4 seconds
        const timer = setTimeout(() => {
            navigation.replace('Login');
        }, 4000);

        return () => clearTimeout(timer);
    }, []);

    const rotate = bagRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['-3deg', '3deg'],
    });

    return (
        <View style={[styles.container, { backgroundColor: splashColor }]}>
            <StatusBar backgroundColor={splashColor} barStyle="dark-content" />

            {/* Center Logo / Icon */}
            <Animated.View
                style={[
                    styles.iconContainer,
                    {
                        transform: [
                            { scale: bagScale },
                            { rotate },
                        ],
                    },
                ]}
            >
                {storeLogo ? (
                    <View style={styles.customLogoContainer}>
                        <Image source={{ uri: storeLogo }} style={styles.customLogo} />
                    </View>
                ) : (
                    <View style={styles.shoppingBag}>
                        <View style={styles.bagBody}>
                            <Ionicons name="bag-handle" size={80} color="white" />
                        </View>
                        <View style={styles.bagItem1}>
                            <Ionicons name="cube" size={28} color="#FFD93D" />
                        </View>
                        <View style={styles.bagItem2}>
                            <Ionicons name="pricetag" size={22} color="#FF6B6B" />
                        </View>
                        <View style={styles.bagItem3}>
                            <Ionicons name="star" size={20} color="#C9B1FF" />
                        </View>
                    </View>
                )}
            </Animated.View>

            {/* Loading Dots */}
            <View style={styles.dotsContainer}>
                <Animated.View style={[styles.dot, styles.dotDark, { opacity: dot1 }]} />
                <Animated.View style={[styles.dot, styles.dotMedium, { opacity: dot2 }]} />
                <Animated.View style={[styles.dot, styles.dotLight, { opacity: dot3 }]} />
                <Animated.View style={[styles.dot, styles.dotLight, { opacity: dot4 }]} />
            </View>

            {/* Footer */}
            <Animated.View style={[styles.footer, { opacity: footerOpacity }]}>
                <Text style={styles.footerText}>Developed by</Text>
                <View style={styles.footerLogo}>
                    <Ionicons name="cart" size={36} color="#1A1A1A" />
                </View>
                <Text style={styles.footerBrand}>{storeName}</Text>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#4CAF7D',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 60,
    },
    customLogoContainer: {
        width: 140,
        height: 140,
        borderRadius: 70,
        overflow: 'hidden',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        backgroundColor: 'white',
    },
    customLogo: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    shoppingBag: {
        width: 160,
        height: 160,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    bagBody: {
        width: 120,
        height: 120,
        borderRadius: 28,
        backgroundColor: '#E87A32',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
    },
    bagItem1: {
        position: 'absolute',
        top: 8,
        right: 16,
    },
    bagItem2: {
        position: 'absolute',
        top: 18,
        left: 18,
    },
    bagItem3: {
        position: 'absolute',
        top: 2,
        left: 50,
    },
    dotsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        position: 'absolute',
        bottom: 280,
    },
    dot: {
        width: 10,
        height: 10,
        borderRadius: 5,
    },
    dotDark: {
        backgroundColor: '#1A1A1A',
    },
    dotMedium: {
        backgroundColor: '#5A3E28',
    },
    dotLight: {
        backgroundColor: '#8B6F5C',
    },
    footer: {
        position: 'absolute',
        bottom: 60,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 14,
        color: '#1A1A1A',
        fontWeight: '500',
        marginBottom: 8,
    },
    footerLogo: {
        marginBottom: 4,
    },
    footerBrand: {
        fontSize: 16,
        fontWeight: '900',
        color: '#1A1A1A',
        letterSpacing: 2,
    },
});
