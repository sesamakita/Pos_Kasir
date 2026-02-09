
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, neoStyles, spacing } from '../theme';

interface NeoCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
    variant?: 'white' | 'colored';
}

export const NeoCard: React.FC<NeoCardProps> = ({ children, style, variant = 'white' }) => {
    return (
        <View style={[styles.container, style]}>
            {/* Shadow background */}
            <View style={styles.shadow} />
            {/* Content foreground */}
            <View style={[
                styles.card,
                variant === 'colored' ? { backgroundColor: colors.accent } : { backgroundColor: colors.surface }
            ]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        marginBottom: spacing.m,
        marginRight: neoStyles.shadow.shadowOffset.width,
    },
    shadow: {
        position: 'absolute',
        top: neoStyles.shadow.shadowOffset.height,
        left: neoStyles.shadow.shadowOffset.width,
        width: '100%',
        height: '100%',
        backgroundColor: colors.border,
        borderRadius: neoStyles.card.borderRadius,
        zIndex: 0,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: neoStyles.card.borderRadius,
        borderWidth: neoStyles.border.borderWidth,
        borderColor: neoStyles.border.borderColor,
        padding: spacing.m,
        zIndex: 1,
    },
});
