import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import { colors } from '../components/Theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

export default function SplashScreen({ navigation }: Props) {
  const onboardingCompleted = useStore((s) => s.profile.onboardingCompleted);

  useEffect(() => {
    const t = setTimeout(() => {
      if (onboardingCompleted) {
        navigation.replace('Main');
      } else {
        navigation.replace('Onboarding');
      }
    }, 900);
    return () => clearTimeout(t);
  }, [onboardingCompleted]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Fitspire</Text>
      <Text style={styles.subtitle}>Your fitness journey starts here</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background },
  title: { color: colors.text, fontSize: 36, fontWeight: '700' },
  subtitle: { color: colors.textSecondary, marginTop: 8 },
});
