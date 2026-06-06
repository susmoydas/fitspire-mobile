import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import { colors, fontSize, borderRadius, spacing, buttonHeight } from '../theme/colors';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import { requestAllPermissions } from '../services/permissions';

type Props = NativeStackScreenProps<RootStackParamList, 'StepTrackingOnboarding'>;

const FEATURES: { icon: any; title: string; desc: string }[] = [
  {
    icon: 'directions-walk',
    title: 'Step counter',
    desc: 'Counts your steps throughout the day using your phone\'s motion sensors.',
  },
  {
    icon: 'local-fire-department',
    title: 'Calories estimate',
    desc: 'Estimates calories burned from your daily activity and body profile.',
  },
  {
    icon: 'straighten',
    title: 'Distance estimate',
    desc: 'Calculates walking distance from your step count and stride length.',
  },
  {
    icon: 'place',
    title: 'Optional location',
    desc: 'Used only when you start a walk, run, or ride — for better distance and map accuracy.',
  },
];

export default function StepTrackingOnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const setStepTrackingDecision = useStore((s) => s.setStepTrackingDecision);
  const setStepTrackingEnabled = useStore((s) => s.setStepTrackingEnabled);
  const setBackgroundNotificationEnabled = useStore(
    (s) => s.setBackgroundNotificationEnabled,
  );
  const healthConnectOptIn = useStore((s) => s.healthConnectOptIn);
  const [busy, setBusy] = useState(false);

  const goToMain = () => {
    if (Platform.OS === 'android' && healthConnectOptIn === 'pending') {
      navigation.replace('HealthConnectOnboarding');
      return;
    }
    navigation.replace('Main');
  };

  const handleAllow = async () => {
    setBusy(true);
    try {
      const result = await requestAllPermissions({ askLocation: false, askNotification: true });
      setStepTrackingEnabled(true);
      setStepTrackingDecision('allowed');
      if (result.notification !== 'granted') {
        setBackgroundNotificationEnabled(false);
      } else {
        setBackgroundNotificationEnabled(true);
      }
      goToMain();
    } catch (e) {
      Alert.alert('Could not request permissions', 'Please try again from Profile.');
      goToMain();
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = () => {
    setStepTrackingEnabled(false);
    setBackgroundNotificationEnabled(false);
    setStepTrackingDecision('declined');
    navigation.replace('Main');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="directions-walk" size={56} color={colors.primary} />
          </View>
          <Text style={styles.title}>Enable Step Tracking</Text>
          <Text style={styles.subtitle}>
            Allow the app to count your steps, calories, and distance in the background.
          </Text>
        </View>

        <View style={styles.featureList}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <MaterialIcons name={f.icon as any} size={22} color={colors.primary} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.noteBox}>
          <MaterialIcons name="lock-outline" size={16} color={colors.textMuted} />
          <Text style={styles.noteText}>
            Your data stays on your device. You can turn this off any time in Profile.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton
          title={busy ? 'Requesting…' : 'Allow Tracking'}
          onPress={handleAllow}
          disabled={busy}
        />
        <SecondaryButton
          title="Not Now"
          onPress={handleSkip}
          style={styles.skip}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xxl,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
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
    paddingHorizontal: spacing.sm,
  },
  featureList: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    gap: spacing.md,
    backgroundColor: colors.card,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: spacing.xxs,
  },
  featureTitle: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  featureDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },
  noteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  noteText: {
    flex: 1,
    color: colors.textMuted,
    fontSize: fontSize.xs,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  skip: {
    height: buttonHeight.md,
  },
});
