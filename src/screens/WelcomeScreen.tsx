import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, borderRadius, spacing, buttonHeight } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const handleSetup = () => navigation.replace('ProfileSetup');
  const handleSkip = () => navigation.replace('Main');

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.hero}>
        <MaterialIcons name="fitness-center" size={64} color={colors.primary} />
        <Text style={styles.title}>Welcome to Fitspire</Text>
        <Text style={styles.subtitle}>
          Your daily smart workout companion.{'\n'}Let's set up your profile to personalize your fitness journey.
        </Text>
      </View>

      <View style={styles.features}>
        {[
          { icon: 'directions-run', label: 'Daily Workouts' },
          { icon: 'footsteps', label: 'Step Tracking' },
          { icon: 'bar-chart', label: 'Track Progress' },
        ].map((f) => (
          <View key={f.label} style={styles.featureRow}>
            <MaterialIcons name={f.icon as any} size={24} color={colors.primary} />
            <Text style={styles.featureText}>{f.label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <TouchableOpacity style={styles.startBtn} onPress={handleSetup} activeOpacity={0.85}>
          <Text style={styles.startText}>Set Up Profile</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
          <Text style={styles.skipText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: spacing.lg,
  },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  features: {
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureText: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  footer: {
    gap: spacing.md,
  },
  startBtn: {
    height: buttonHeight.lg,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  skipText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
});
