import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';
import { MaterialIcons } from '@expo/vector-icons';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface BottomSheetAction {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
  icon?: keyof typeof MaterialIcons.glyphMap;
  loading?: boolean;
}

interface BottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  actions?: BottomSheetAction[];
  snapPoints?: number;
}

export default function BottomSheetModal({
  visible,
  onClose,
  title,
  subtitle,
  children,
  actions,
  snapPoints,
}: BottomSheetModalProps) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const actionBg = (variant?: string) => {
    switch (variant) {
      case 'primary': return colors.primary;
      case 'destructive': return colors.error;
      default: return colors.cardElevated;
    }
  };

  const actionTextColor = (variant?: string) => {
    switch (variant) {
      case 'primary': return '#fff';
      case 'destructive': return '#fff';
      default: return colors.text;
    }
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Animated.View style={[styles.overlayBg, { opacity: overlayOpacity }]} />
      </Pressable>
      <Animated.View
        style={[
          styles.sheet,
          {
            paddingBottom: insets.bottom + spacing.md,
            maxHeight: snapPoints || SCREEN_HEIGHT * 0.75,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <Pressable style={styles.handleArea} onPress={handleClose}>
          <View style={styles.handle} />
        </Pressable>

        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        </View>

        {children && <View style={styles.content}>{children}</View>}

        {actions && actions.length > 0 && (
          <View style={styles.actions}>
            {actions.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={[
                  styles.actionBtn,
                  { backgroundColor: actionBg(action.variant) },
                ]}
                onPress={action.onPress}
                activeOpacity={0.85}
                disabled={action.loading}
              >
                {action.icon && (
                  <MaterialIcons name={action.icon} size={20} color={actionTextColor(action.variant)} />
                )}
                <Text style={[styles.actionText, { color: actionTextColor(action.variant) }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  overlayBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.card,
    borderTopLeftRadius: borderRadius.sheet,
    borderTopRightRadius: borderRadius.sheet,
    zIndex: 200,
    paddingHorizontal: spacing.lg,
  },
  handleArea: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.cardElevated,
  },
  header: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  title: {
    fontSize: fontSize.xl,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  content: {
    paddingVertical: spacing.md,
  },
  actions: {
    gap: spacing.sm,
    paddingTop: spacing.md,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  actionText: {
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
