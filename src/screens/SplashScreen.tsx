import React, { useEffect } from 'react';
import { View, StyleSheet, Image, Platform } from 'react-native';
import { Text } from '@/components/ui/text';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import { colors, fontSize, spacing } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const onboardingCompleted = useStore((s) => s.profile?.onboardingCompleted);
  const healthConnectOptIn = useStore((s) => s.healthConnectOptIn);
  const stepTrackingDecision = useStore((s) => s.stepTrackingDecision);

  useEffect(() => {
    const t = setTimeout(() => {
      if (!onboardingCompleted) {
        navigation.replace('Welcome');
        return;
      }
      if (stepTrackingDecision === 'pending') {
        navigation.replace('StepTrackingOnboarding');
        return;
      }
      if (
        Platform.OS === 'android' &&
        stepTrackingDecision === 'allowed' &&
        healthConnectOptIn === 'pending'
      ) {
        navigation.replace('HealthConnectOnboarding');
        return;
      }
      navigation.replace('Main');
    }, 900);
    return () => clearTimeout(t);
  }, [onboardingCompleted, healthConnectOptIn, stepTrackingDecision]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../../assets/logo.png')}
        style={styles.logo}
      />
      <Text style={styles.title}>Fitspire</Text>
      <Text style={styles.subtitle}>Your daily smart workout companion</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: spacing.lg,
  },
  title: {
    color: colors.primary,
    fontSize: fontSize.hero,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: spacing.md,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: spacing.sm,
  },
});
