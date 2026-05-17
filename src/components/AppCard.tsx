
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { colors, appStyles, spacing } from '../theme';

interface AppCardProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

export const AppCard: React.FC<AppCardProps> = ({ children, style }) => {
    return (
        <View style={[styles.card, style]}>
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderRadius: appStyles.card.borderRadius,
        padding: spacing.m,
        ...appStyles.elevation,
    },
});
