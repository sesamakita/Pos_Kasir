import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, typography, appStyles } from '../theme';

interface AppHeaderProps {
    title: string;
    onBack?: () => void;
    rightElement?: React.ReactNode;
}

export const AppHeader = ({ title, onBack, rightElement }: AppHeaderProps) => {
    return (
        <View style={styles.container}>
            <View style={styles.leftContainer}>
                {onBack && (
                    <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7}>
                        <Ionicons name="chevron-back" size={24} color={colors.text} />
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.titleContainer}>
                <Text style={styles.title} numberOfLines={1}>{title}</Text>
            </View>

            <View style={styles.rightContainer}>
                {rightElement || <View style={{ width: 44 }} />}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.m,
        paddingVertical: spacing.s,
        height: 64,
        backgroundColor: colors.background,
    },
    leftContainer: {
        minWidth: 44,
        alignItems: 'flex-start',
        justifyContent: 'center',
    },
    titleContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rightContainer: {
        minWidth: 44,
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    backBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        ...appStyles.elevation,
        shadowOpacity: 0.08,
    },
    title: {
        fontSize: typography.sizes.l,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
    }
});
