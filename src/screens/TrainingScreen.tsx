import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';
import { TrainingMode } from '../types';
import { RootStackParamList } from '../navigation/RootNavigator';

const MODES: { key: TrainingMode; icon: string; title: string; desc: string; met: number }[] = [
  { key: 'walking', icon: 'directions-walk', title: 'Walking', desc: 'Moderate pace, outdoor walk', met: 3.5 },
  { key: 'running', icon: 'directions-run', title: 'Running', desc: 'Jogging or running at your pace', met: 8.0 },
  { key: 'riding', icon: 'directions-bike', title: 'Riding', desc: 'Cycling outdoors', met: 6.0 },
];

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TrainingScreen() {
  const navigation = useNavigation<Nav>();
  const [selectedMode, setSelectedMode] = useState<TrainingMode>('walking');

  const handleStart = () => {
    navigation.navigate('ActiveTraining', { mode: selectedMode });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Workout</Text>
      <Text style={styles.subtitle}>Select a mode and start tracking your activity</Text>

      {MODES.map((m) => {
        const isSelected = selectedMode === m.key;
        return (
          <TouchableOpacity
            key={m.key}
            onPress={() => setSelectedMode(m.key)}
            activeOpacity={0.8}
          >
            <Card
              style={{
                ...styles.modeCard,
                ...(isSelected ? styles.selectedCard : {}),
              }}
            >
              <View style={styles.modeRow}>
                <MaterialIcons name={m.icon as any} size={48} color={colors.primary} />
                <View style={styles.modeInfo}>
                  <Text style={styles.modeTitle}>{m.title}</Text>
                  <Text style={styles.modeDesc}>{m.desc}</Text>
                </View>
                <View style={styles.radioOuter}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        );
      })}

      <Button
        onPress={handleStart}
        size="lg"
        style={[styles.startButton, { width: '100%' }]}
      >
        Start Workout
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl * 2,
  },
  title: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginBottom: spacing.lg,
  },
  modeCard: {
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  selectedCard: {
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modeIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  modeInfo: {
    flex: 1,
  },
  modeTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '600',
  },
  modeDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    marginTop: 2,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  startButton: {
    marginTop: spacing.lg,
  },
});
