
import React from 'react';
import { TextInput, View, Text, StyleSheet, TextInputProps } from 'react-native';
import { colors, neoStyles, spacing, typography } from '../theme';

interface NeoInputProps extends TextInputProps {
    label?: string;
    error?: string;
}

export const NeoInput: React.FC<NeoInputProps> = ({ label, error, style, ...props }) => {
    return (
        <View style={styles.wrapper}>
            {label && <Text style={styles.label}>{label}</Text>}
            <View style={styles.inputContainer}>
                <View style={styles.shadow} />
                <TextInput
                    style={[styles.input, style]}
                    placeholderTextColor="#999"
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
        fontWeight: 'bold',
        marginBottom: spacing.xs,
        color: colors.text,
    },
    inputContainer: {
        height: 50,
    },
    shadow: {
        position: 'absolute',
        top: 4,
        left: 4,
        width: '100%',
        height: '100%',
        backgroundColor: colors.border,
        borderRadius: neoStyles.pill.borderRadius, // Pill shaped inputs often look good
        // Or stick to card radius? User asked for pill-shaped.
        // Let's make input slightly less rounded than button if it's a text area, but for single line pill is good.
        // Actually, inputs are usually less rounded in some brutalist designs, but user asked for "Pill-Shaped".
    },
    input: {
        backgroundColor: colors.surface,
        borderWidth: 2,
        borderColor: colors.border,
        borderRadius: neoStyles.pill.borderRadius,
        height: '100%',
        paddingHorizontal: spacing.m,
        fontFamily: typography.fontFamily,
        fontSize: typography.sizes.m,
        color: colors.text,
    },
    errorText: {
        color: colors.error,
        fontSize: typography.sizes.xs,
        marginTop: spacing.xs,
        fontWeight: 'bold',
    }
});
