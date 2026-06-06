import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { MaterialIcons } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import { colors, fontSize, borderRadius, spacing, buttonHeight } from '../theme/colors';
import PrimaryButton from '../components/PrimaryButton';
import SecondaryButton from '../components/SecondaryButton';
import {
  initHealthConnect,
  requestHealthConnectPermissions,
  openHealthConnectInstall,
} from '../services/healthConnectSteps';

type Props = NativeStackScreenProps<RootStackParamList, 'HealthConnectOnboarding'>;

export default function HealthConnectOnboardingScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const setHealthConnectOptIn = useStore((s) => s.setHealthConnectOptIn);
  const [busy, setBusy] = useState(false);

  const handleAllow = async () => {
    setBusy(true);
    try {
      const status = await initHealthConnect();
      if (status.notInstalled) {
        setHealthConnectOptIn('dismissed');
        Alert.alert(
          'Health Connect not installed',
          'Install the Health Connect app from the Play Store to enable automatic step tracking.',
          [
            { text: 'Open Play Store', onPress: () => openHealthConnectInstall() },
            {
              text: 'Continue',
              onPress: () => navigation.replace('Main'),
            },
          ]
        );
        return;
      }
      if (!status.sdkAvailable) {
        setHealthConnectOptIn('dismissed');
        Alert.alert(
          'Update required',
          'Please update the Health Connect app to enable automatic step tracking.',
          [
            { text: 'Open Play Store', onPress: () => openHealthConnectInstall() },
            {
              text: 'Continue',
              onPress: () => navigation.replace('Main'),
            },
          ]
        );
        return;
      }
      const granted = await requestHealthConnectPermissions();
      if (granted) {
        setHealthConnectOptIn('granted');
        navigation.replace('Main');
      } else {
        setHealthConnectOptIn('denied');
        navigation.replace('Main');
      }
    } catch {
      setHealthConnectOptIn('denied');
      navigation.replace('Main');
    } finally {
      setBusy(false);
    }
  };

  const handleSkip = () => {
    setHealthConnectOptIn('dismissed');
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
            <MaterialIcons name="monitor-heart" size={56} color={colors.primary} />
          </View>
          <Text style={styles.title}>Track every step, automatically</Text>
          <Text style={styles.subtitle}>
            For the most accurate step count — even when the app is closed — connect Health Connect. We use the same system Google Fit and Samsung Health use, so your steps stay in sync with the rest of your phone.
          </Text>
        </View>

        <View style={styles.featureList}>
          {[
            {
              icon: 'access-time',
              title: '24/7 background counting',
              desc: 'Steps keep adding up from midnight to midnight, with or without the app open.',
            },
            {
              icon: 'history',
              title: 'Accurate history',
              desc: "Yesterday's steps are saved automatically the next time you open Fitspire.",
            },
            {
              icon: 'lock-outline',
              title: 'Your data stays private',
              desc: 'We only read step count and distance. We never write to your health data.',
            },
          ].map((f) => (
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
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton
          title={busy ? 'Requesting…' : 'Allow Health Connect'}
          onPress={handleAllow}
          disabled={busy}
        />
        <SecondaryButton
          title="Not now"
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
