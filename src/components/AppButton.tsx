
import React from 'react';
import { Text, Pressable, StyleSheet, ViewStyle, TextStyle, Animated, StyleProp } from 'react-native';
import { colors, appStyles, typography, spacing } from '../theme';

interface AppButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    style?: StyleProp<ViewStyle>;
    textStyle?: StyleProp<TextStyle>;
    disabled?: boolean;
}

export const AppButton: React.FC<AppButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    style,
    textStyle,
    disabled
}) => {
    const animatedScale = React.useRef(new Animated.Value(1)).current;
    const animatedOpacity = React.useRef(new Animated.Value(1)).current;

    const handlePressIn = () => {
        if (disabled) return;
        Animated.parallel([
            Animated.spring(animatedScale, {
                toValue: 0.98,
                useNativeDriver: true,
            }),
            Animated.timing(animatedOpacity, {
                toValue: 0.8,
                duration: 100,
                useNativeDriver: true,
            })
        ]).start();
    };

    const handlePressOut = () => {
        if (disabled) return;
        Animated.parallel([
            Animated.spring(animatedScale, {
                toValue: 1,
                useNativeDriver: true,
            }),
            Animated.timing(animatedOpacity, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            })
        ]).start();
    };

    const getStyles = () => {
        const baseStyle: ViewStyle = {
            backgroundColor: colors.primary,
            borderRadius: appStyles.pill.borderRadius,
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            paddingHorizontal: spacing.l,
        };

        const baseTextStyle: TextStyle = {
            color: colors.textOnPrimary,
            fontWeight: 'bold',
            fontSize: typography.sizes.m,
        };

        if (disabled) {
            baseStyle.backgroundColor = '#E0E0E0';
            baseTextStyle.color = '#9E9E9E';
            return { container: baseStyle, text: baseTextStyle };
        }

        switch (variant) {
            case 'secondary':
                baseStyle.backgroundColor = colors.secondary;
                baseTextStyle.color = colors.primary;
                break;
            case 'outline':
                baseStyle.backgroundColor = 'transparent';
                baseStyle.borderWidth = 1.5;
                baseStyle.borderColor = colors.primary;
                baseTextStyle.color = colors.primary;
                break;
            case 'ghost':
                baseStyle.backgroundColor = 'transparent';
                baseTextStyle.color = colors.textSubtle;
                break;
        }

        return { container: baseStyle, text: baseTextStyle };
    };

    const stylesObj = getStyles();
    const flattenedStyle = StyleSheet.flatten(style);

    return (
        <Animated.View style={{ transform: [{ scale: animatedScale }], opacity: animatedOpacity, width: flattenedStyle?.width || '100%' }}>
            <Pressable
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={disabled}
                style={[stylesObj.container, style]}
            >
                <Text style={[stylesObj.text, textStyle]}>
                    {title}
                </Text>
            </Pressable>
        </Animated.View>
    );
};
