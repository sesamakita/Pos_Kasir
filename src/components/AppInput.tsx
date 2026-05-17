
import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, appStyles, spacing, typography } from '../theme';

interface AppInputProps extends TextInputProps {
    label?: string;
    error?: string;
    leftIcon?: keyof typeof Ionicons.glyphMap;
}

export const AppInput: React.FC<AppInputProps> = ({ label, error, style, leftIcon, ...props }) => {
    return (
        <View style={styles.wrapper}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.inputContainer}>
                {leftIcon && (
                    <Ionicons
                        name={leftIcon}
                        size={20}
                        color={colors.textSubtle}
                        style={styles.leftIcon}
                    />
                )}
                <TextInput
                    style={[
                        styles.input,
                        error ? { borderColor: colors.error } : null,
                        leftIcon ? { paddingLeft: 46 } : null,
                        style
                    ]}
                    placeholderTextColor="#9E9E9E"
                    {...props}
                />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        marginBottom: spacing.m,
    },
    label: {
        fontFamily: typography.fontFamily,
        fontWeight: '600',
        marginBottom: spacing.xs,
        marginLeft: spacing.xs,
        color: colors.text,
        fontSize: typography.sizes.s,
    },
    inputContainer: {
        position: 'relative',
        justifyContent: 'center',
    },
    leftIcon: {
        position: 'absolute',
        left: spacing.m,
        zIndex: 1,
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 16, // Matching more modern card style
        height: 56,
        paddingHorizontal: spacing.m,
        fontFamily: typography.fontFamily,
        fontSize: typography.sizes.m,
        color: colors.text,
    },
    errorText: {
        color: colors.error,
        fontSize: typography.sizes.xs,
        marginTop: spacing.xs,
        marginLeft: spacing.m,
        fontWeight: '500',
    }
});
