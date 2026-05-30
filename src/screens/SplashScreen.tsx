import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import { colors, fontSize, spacing } from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const onboardingCompleted = useStore((s) => s.profile?.onboardingCompleted);

  useEffect(() => {
    const t = setTimeout(() => {
      if (onboardingCompleted) {
        navigation.replace('Main');
      } else {
        navigation.replace('Welcome');
      }
    }, 900);
    return () => clearTimeout(t);
  }, [onboardingCompleted]);

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
