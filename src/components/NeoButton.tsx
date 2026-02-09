
import React from 'react';
import { Text, Pressable, StyleSheet, ViewStyle, TextStyle, Animated } from 'react-native';
import { colors, neoStyles, typography, spacing } from '../theme';

interface NeoButtonProps {
    title: string;
    onPress: () => void;
    variant?: 'primary' | 'secondary' | 'accent' | 'outline';
    style?: ViewStyle;
    textStyle?: TextStyle;
    disabled?: boolean;
}

export const NeoButton: React.FC<NeoButtonProps> = ({
    title,
    onPress,
    variant = 'primary',
    style,
    textStyle,
    disabled
}) => {
    const [isPressed, setIsPressed] = React.useState(false);
    const animatedValue = React.useRef(new Animated.Value(0)).current;

    const handlePressIn = () => {
        if (disabled) return;
        setIsPressed(true);
        Animated.spring(animatedValue, {
            toValue: 1,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const handlePressOut = () => {
        if (disabled) return;
        setIsPressed(false);
        Animated.spring(animatedValue, {
            toValue: 0,
            useNativeDriver: true,
            speed: 50,
            bounciness: 4,
        }).start();
    };

    const getBackgroundColor = () => {
        if (disabled) return colors.background; // Gray out
        switch (variant) {
            case 'primary': return colors.primary;
            case 'secondary': return colors.secondary;
            case 'accent': return colors.accent;
            case 'outline': return 'transparent';
            default: return colors.primary;
        }
    };

    const getTextColor = () => {
        if (disabled) return '#999';
        if (variant === 'outline') return colors.text;
        return colors.text; // Neo-Brutalism often uses black text on bright colors
    };

    const translateY = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, neoStyles.shadow.shadowOffset.height], // Move down by shadow height
    });

    const translateX = animatedValue.interpolate({
        inputRange: [0, 1],
        outputRange: [0, neoStyles.shadow.shadowOffset.width], // Move right by shadow width
    });

    // Dynamic shadow opacity to "hide" shadow when pressed
    const shadowOpacity = animatedValue.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 0.5, 0],
    });

    return (
        <Pressable
            onPress={onPress}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            disabled={disabled}
            style={({ pressed }) => [
                styles.container,
                style,
                // When pressed, we physically move the button to cover the shadow space
                // But since we are animating transform, we can just use Animated.View
            ]}
        >
            {/* Shadow Layer - Static or animated? 
          For Neo-Brutalism hard shadow, we can use a View behind.
      */}
            <Animated.View style={[
                styles.shadowLayer,
                {
                    opacity: shadowOpacity, // Fade out shadow when pressed (or we can keep it and just move the button on top)
                    // Actually, standard neo-brutalism: button moves TO the shadow position.
                }
            ]} />

            <Animated.View style={[
                styles.face,
                {
                    backgroundColor: getBackgroundColor(),
                    transform: [{ translateX }, { translateY }],
                }
            ]}>
                <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
                    {title}
                </Text>
            </Animated.View>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 50,
        width: '100%',
        marginBottom: neoStyles.shadow.shadowOffset.height + spacing.xs,
        marginRight: neoStyles.shadow.shadowOffset.width + spacing.xs,
    },
    shadowLayer: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: colors.border, // Shadow color is black
        borderRadius: 999, // Pill shape
        top: neoStyles.shadow.shadowOffset.height,
        left: neoStyles.shadow.shadowOffset.width,
        zIndex: 0,
        borderWidth: 2, // Optional: border on shadow too? Usually just solid block.
        borderColor: colors.border,
    },
    face: {
        ...StyleSheet.absoluteFillObject,
        borderRadius: 999,
        borderWidth: neoStyles.border.borderWidth,
        borderColor: neoStyles.border.borderColor,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    text: {
        fontFamily: typography.fontFamily,
        fontWeight: 'bold',
        fontSize: typography.sizes.m,
    }
});
