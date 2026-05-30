import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, borderRadius, spacing } from '../theme/colors';
import { useStore } from '../store/useStore';
import type { Gender, ExperienceLevel, FitnessGoal, HeightUnit } from '../types';
import type { RootStackParamList } from '../navigation/RootNavigator';

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const GENDERS: { key: Gender; label: string; icon: string }[] = [
  { key: 'male', label: 'Male', icon: 'man' },
  { key: 'female', label: 'Female', icon: 'woman' },
  { key: 'other', label: 'Other', icon: 'person' },
];

const FITNESS_GOALS: { key: FitnessGoal; label: string; icon: string }[] = [
  { key: 'fat_loss', label: 'Fat Loss', icon: 'local-fire-department' },
  { key: 'muscle_gain', label: 'Muscle Gain', icon: 'fitness-center' },
  { key: 'general_fitness', label: 'General Fitness', icon: 'favorite' },
  { key: 'improve_stamina', label: 'Improve Stamina', icon: 'directions-run' },
  { key: 'stay_active', label: 'Stay Active', icon: 'self-improvement' },
  { key: 'improve_flexibility', label: 'Flexibility', icon: 'accessibility-new' },
];

const LEVELS: { key: ExperienceLevel; label: string }[] = [
  { key: 'beginner', label: 'Beginner' },
  { key: 'intermediate', label: 'Intermediate' },
  { key: 'advanced', label: 'Advanced' },
];

const WORKOUT_DURATIONS = [10, 20, 30, 45];

function cmToFeet(cm: number): { feet: number; inch: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inch = Math.round(totalInches % 12);
  return { feet, inch };
}

function feetInchToCm(feet: number, inch: number): number {
  return Math.round(feet * 30.48 + inch * 2.54);
}

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);

  const initialHeightCm = profile.height || 172;
  const initialFtIn = cmToFeet(initialHeightCm);

  const [age, setAge] = useState(profile.age || 25);
  const [gender, setGender] = useState<Gender>(profile.gender || 'male');
  const [heightUnit, setHeightUnit] = useState<HeightUnit>(profile.heightUnit || 'cm');
  const [heightCm, setHeightCm] = useState(initialHeightCm);
  const [heightFeet, setHeightFeet] = useState(initialFtIn.feet);
  const [heightInch, setHeightInch] = useState(initialFtIn.inch);
  const [weight, setWeight] = useState(profile.weight || 70);
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal>(profile.fitnessGoal || 'general_fitness');
  const [experience, setExperience] = useState<ExperienceLevel>(profile.experience || 'beginner');
  const [stepGoal, setStepGoal] = useState(profile.stepGoal || 10000);
  const [workoutDuration, setWorkoutDuration] = useState(profile.preferredWorkoutDuration || 30);

  const handleUnitToggle = useCallback((unit: HeightUnit) => {
    if (unit === heightUnit) return;
    setHeightUnit(unit);
    if (unit === 'ft_in') {
      const converted = cmToFeet(heightCm);
      setHeightFeet(converted.feet);
      setHeightInch(converted.inch);
    }
  }, [heightUnit, heightCm]);

  const getHeightCm = useCallback((): number => {
    if (heightUnit === 'cm') return heightCm;
    return feetInchToCm(heightFeet, heightInch);
  }, [heightUnit, heightCm, heightFeet, heightInch]);

  const handleSave = useCallback(() => {
    setProfile({
      age,
      gender,
      height: getHeightCm(),
      heightUnit,
      weight,
      fitnessGoal,
      experience,
      stepGoal,
      preferredWorkoutDuration: workoutDuration,
    });
    navigation.goBack();
  }, [age, gender, heightUnit, weight, fitnessGoal, experience, stepGoal, workoutDuration, getHeightCm, setProfile, navigation]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Gender */}
        <Text style={styles.sectionLabel}>Gender</Text>
        <View style={styles.genderRow}>
          {GENDERS.map((g) => (
            <TouchableOpacity
              key={g.key}
              style={[styles.genderCard, gender === g.key && styles.genderCardActive]}
              onPress={() => setGender(g.key)}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={g.icon as any}
                size={28}
                color={gender === g.key ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.genderLabel, gender === g.key && styles.genderLabelActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Age */}
        <Text style={styles.sectionLabel}>Age</Text>
        <View style={styles.pickerRow}>
          <TouchableOpacity onPress={() => setAge(Math.max(10, age - 1))} style={styles.pickerBtn}>
            <MaterialIcons name="remove" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.pickerValueWrap}>
            <Text style={styles.pickerValue}>{age}</Text>
            <Text style={styles.pickerUnit}>years</Text>
          </View>
          <TouchableOpacity onPress={() => setAge(Math.min(100, age + 1))} style={styles.pickerBtn}>
            <MaterialIcons name="add" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Height */}
        <Text style={styles.sectionLabel}>Height</Text>
        <View style={styles.unitToggle}>
          <TouchableOpacity
            style={[styles.unitPill, heightUnit === 'cm' && styles.unitPillActive]}
            onPress={() => handleUnitToggle('cm')}
          >
            <Text style={[styles.unitText, heightUnit === 'cm' && styles.unitTextActive]}>CM</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.unitPill, heightUnit === 'ft_in' && styles.unitPillActive]}
            onPress={() => handleUnitToggle('ft_in')}
          >
            <Text style={[styles.unitText, heightUnit === 'ft_in' && styles.unitTextActive]}>Feet / Inch</Text>
          </TouchableOpacity>
        </View>

        {heightUnit === 'cm' ? (
          <View style={styles.pickerRow}>
            <TouchableOpacity onPress={() => setHeightCm(Math.max(100, heightCm - 1))} style={styles.pickerBtn}>
              <MaterialIcons name="remove" size={24} color={colors.text} />
            </TouchableOpacity>
            <View style={styles.pickerValueWrap}>
              <Text style={styles.pickerValue}>{heightCm}</Text>
              <Text style={styles.pickerUnit}>cm</Text>
            </View>
            <TouchableOpacity onPress={() => setHeightCm(Math.min(250, heightCm + 1))} style={styles.pickerBtn}>
              <MaterialIcons name="add" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.dualPickerRow}>
            <View style={styles.dualPickerItem}>
              <Text style={styles.dualLabel}>Feet</Text>
              <View style={styles.pickerRowSmall}>
                <TouchableOpacity onPress={() => setHeightFeet(Math.max(3, heightFeet - 1))} style={styles.pickerBtnSmall}>
                  <MaterialIcons name="remove" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.pickerValueSmall}>{heightFeet}</Text>
                <TouchableOpacity onPress={() => setHeightFeet(Math.min(7, heightFeet + 1))} style={styles.pickerBtnSmall}>
                  <MaterialIcons name="add" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.dualPickerItem}>
              <Text style={styles.dualLabel}>Inch</Text>
              <View style={styles.pickerRowSmall}>
                <TouchableOpacity onPress={() => setHeightInch(Math.max(0, heightInch - 1))} style={styles.pickerBtnSmall}>
                  <MaterialIcons name="remove" size={20} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.pickerValueSmall}>{heightInch}</Text>
                <TouchableOpacity onPress={() => setHeightInch(Math.min(11, heightInch + 1))} style={styles.pickerBtnSmall}>
                  <MaterialIcons name="add" size={20} color={colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Weight */}
        <Text style={styles.sectionLabel}>Weight</Text>
        <View style={styles.pickerRow}>
          <TouchableOpacity onPress={() => setWeight(Math.max(30, weight - 1))} style={styles.pickerBtn}>
            <MaterialIcons name="remove" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.pickerValueWrap}>
            <Text style={styles.pickerValue}>{weight}</Text>
            <Text style={styles.pickerUnit}>kg</Text>
          </View>
          <TouchableOpacity onPress={() => setWeight(Math.min(300, weight + 1))} style={styles.pickerBtn}>
            <MaterialIcons name="add" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Fitness Goal */}
        <Text style={styles.sectionLabel}>Fitness Goal</Text>
        <View style={styles.goalsGrid}>
          {FITNESS_GOALS.map((g) => (
            <TouchableOpacity
              key={g.key}
              style={[styles.goalCard, fitnessGoal === g.key && styles.goalCardActive]}
              onPress={() => setFitnessGoal(g.key)}
              activeOpacity={0.8}
            >
              <MaterialIcons
                name={g.icon as any}
                size={24}
                color={fitnessGoal === g.key ? colors.primary : colors.textMuted}
              />
              <Text style={[styles.goalLabel, fitnessGoal === g.key && styles.goalLabelActive]}>
                {g.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fitness Level */}
        <Text style={styles.sectionLabel}>Fitness Level</Text>
        <View style={styles.levelRow}>
          {LEVELS.map((l) => (
            <TouchableOpacity
              key={l.key}
              style={[styles.levelCard, experience === l.key && styles.levelCardActive]}
              onPress={() => setExperience(l.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.levelText, experience === l.key && styles.levelTextActive]}>
                {l.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Daily Step Goal */}
        <Text style={styles.sectionLabel}>Daily Step Goal</Text>
        <View style={styles.pickerRow}>
          <TouchableOpacity onPress={() => setStepGoal(Math.max(1000, stepGoal - 1000))} style={styles.pickerBtn}>
            <MaterialIcons name="remove" size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.pickerValueWrap}>
            <Text style={styles.pickerValue}>{stepGoal.toLocaleString()}</Text>
            <Text style={styles.pickerUnit}>steps</Text>
          </View>
          <TouchableOpacity onPress={() => setStepGoal(Math.min(50000, stepGoal + 1000))} style={styles.pickerBtn}>
            <MaterialIcons name="add" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Preferred Workout Duration */}
        <Text style={styles.sectionLabel}>Preferred Workout Duration</Text>
        <View style={styles.durationRow}>
          {WORKOUT_DURATIONS.map((d) => (
            <TouchableOpacity
              key={d}
              style={[styles.durationPill, workoutDuration === d && styles.durationPillActive]}
              onPress={() => setWorkoutDuration(d)}
            >
              <Text style={[styles.durationText, workoutDuration === d && styles.durationTextActive]}>
                {d} min
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: spacing.xxl }} />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.85}>
          <Text style={styles.saveText}>Save Changes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  headerRight: {
    width: 40,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Gender
  genderRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  genderCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  genderCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '12',
  },
  genderLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  genderLabelActive: {
    color: colors.primary,
  },

  // Picker
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerValueWrap: {
    alignItems: 'center',
    minWidth: 100,
  },
  pickerValue: {
    color: colors.text,
    fontSize: fontSize.hero,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  pickerUnit: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '500',
  },

  // Height unit toggle
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  unitPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    alignItems: 'center',
  },
  unitPillActive: {
    backgroundColor: colors.primary,
  },
  unitText: {
    color: colors.textMuted,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  unitTextActive: {
    color: '#fff',
  },
  dualPickerRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dualPickerItem: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  dualLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  pickerRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  pickerBtnSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.cardElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pickerValueSmall: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
    minWidth: 40,
    textAlign: 'center',
  },

  // Goals
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  goalCard: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  goalCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '12',
  },
  goalLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    textAlign: 'center',
  },
  goalLabelActive: {
    color: colors.primary,
  },

  // Level
  levelRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  levelCard: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  levelCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '12',
  },
  levelText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  levelTextActive: {
    color: colors.primary,
  },

  // Duration pills
  durationRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  durationPill: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  durationPillActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '18',
  },
  durationText: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  durationTextActive: {
    color: colors.primary,
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.card,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
