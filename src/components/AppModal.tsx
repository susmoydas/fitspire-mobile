import React from 'react';
import { View, Modal, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from '@/components/ui/text';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';

interface AppModalAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
}

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message?: string;
  actions: AppModalAction[];
  icon?: string;
  iconColor?: string;
}

export default function AppModal({ visible, onClose, title, message, actions, icon, iconColor }: AppModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.mask}>
        <View style={styles.card}>
          {icon && (
            <Text style={[styles.icon, { color: iconColor || colors.warning }]}>
              {icon}
            </Text>
          )}
          <Text style={styles.title}>{title}</Text>
          {message && <Text style={styles.message}>{message}</Text>}
          {actions.map((action, i) => {
            const bgColor = action.variant === 'primary' ? colors.primary
              : action.variant === 'destructive' ? colors.error
              : colors.cardElevated;
            const txtColor = action.variant === 'primary' || action.variant === 'destructive' ? '#fff' : colors.text;
            return (
              <TouchableOpacity
                key={i}
                style={[styles.actionBtn, { backgroundColor: bgColor }]}
                onPress={action.onPress}
                activeOpacity={0.85}
              >
                <Text style={[styles.actionText, { color: txtColor }]}>{action.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mask: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 28,
    padding: spacing.lg,
    width: '100%',
    maxWidth: 320,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  message: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  actionBtn: {
    width: '100%',
    height: 52,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actionText: {
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
