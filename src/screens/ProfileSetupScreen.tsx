import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontSize, borderRadius, spacing } from '../theme/colors';
import type { Gender, ExperienceLevel, FitnessGoal, HeightUnit } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

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

const LEVELS: { key: ExperienceLevel; label: string; desc: string }[] = [
  { key: 'beginner', label: 'Beginner', desc: 'New to fitness' },
  { key: 'intermediate', label: 'Intermediate', desc: 'Some experience' },
  { key: 'advanced', label: 'Advanced', desc: 'Experienced athlete' },
];

const WORKOUT_DURATIONS = [10, 20, 30, 45];
const STEP_GOALS = [5000, 8000, 10000, 12000, 15000];

export default function ProfileSetupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const setProfile = useStore((s) => s.setProfile);

  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<Gender | null>(null);
  const [age, setAge] = useState(25);
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [heightCm, setHeightCm] = useState(172);
  const [heightFeet, setHeightFeet] = useState(5);
  const [heightInch, setHeightInch] = useState(8);
  const [weight, setWeight] = useState(70);
  const [fitnessGoal, setFitnessGoal] = useState<FitnessGoal | null>(null);
  const [level, setLevel] = useState<ExperienceLevel | null>(null);
  const [stepGoal, setStepGoal] = useState(10000);
  const [workoutDuration, setWorkoutDuration] = useState(30);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const steps = [
    <Animated.View key="s0" style={[stepContent, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <Text style={styles.questionText}>Let's get to know you</Text>
      <Text style={styles.fieldLabel}>Age</Text>
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

      <Text style={[styles.fieldLabel, { marginTop: spacing.xl }]}>Gender</Text>
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
    </Animated.View>,

    <Animated.View key="s1" style={[stepContent, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <Text style={styles.questionText}>Your body stats</Text>

      <Text style={styles.fieldLabel}>Height</Text>
      <View style={styles.unitToggle}>
        <TouchableOpacity
          style={[styles.unitPill, heightUnit === 'cm' && styles.unitPillActive]}
          onPress={() => setHeightUnit('cm')}
        >
          <Text style={[styles.unitText, heightUnit === 'cm' && styles.unitTextActive]}>CM</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.unitPill, heightUnit === 'ft_in' && styles.unitPillActive]}
          onPress={() => setHeightUnit('ft_in')}
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

      <Text style={[styles.fieldLabel, { marginTop: spacing.xl }]}>Weight</Text>
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
    </Animated.View>,

    <Animated.View key="s2" style={[stepContent, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <Text style={styles.questionText}>What's your fitness goal?</Text>
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
    </Animated.View>,

    <Animated.View key="s3" style={[stepContent, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
      <Text style={styles.questionText}>Your fitness level</Text>
      {LEVELS.map((l) => (
        <TouchableOpacity
          key={l.key}
          style={[styles.levelCard, level === l.key && styles.levelCardActive]}
          onPress={() => setLevel(l.key)}
          activeOpacity={0.8}
        >
          <View style={styles.levelLeft}>
            <View style={[styles.levelDot, level === l.key && styles.levelDotActive]}>
              {level === l.key && <View style={styles.levelDotInner} />}
            </View>
            <View>
              <Text style={[styles.levelLabel, level === l.key && styles.levelLabelActive]}>{l.label}</Text>
              <Text style={styles.levelDesc}>{l.desc}</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      <Text style={[styles.fieldLabel, { marginTop: spacing.xl }]}>Preferred workout duration</Text>
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

      <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Daily step goal</Text>
      <View style={styles.stepRow}>
        <TouchableOpacity onPress={() => setStepGoal(Math.max(1000, stepGoal - 1000))} style={styles.pickerBtn}>
          <MaterialIcons name="remove" size={20} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.stepValue}>{stepGoal.toLocaleString()}</Text>
        <TouchableOpacity onPress={() => setStepGoal(Math.min(50000, stepGoal + 1000))} style={styles.pickerBtn}>
          <MaterialIcons name="add" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>
    </Animated.View>,
  ];

  const totalSteps = steps.length;

  const animateTransition = (dir: 'forward' | 'back') => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: dir === 'forward' ? -30 : 30,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      slideAnim.setValue(dir === 'forward' ? 30 : -30);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 80,
          friction: 12,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const goNext = () => {
    if (step < steps.length - 1) {
      animateTransition('forward');
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const goBack = () => {
    if (step > 0) {
      animateTransition('back');
      setStep(step - 1);
    }
  };

  const handleSkip = () => navigation.replace('Main');

  const getHeightCm = (): number => {
    if (heightUnit === 'cm') return heightCm;
    return Math.round(heightFeet * 30.48 + heightInch * 2.54);
  };

  const handleFinish = () => {
    setProfile({
      gender: gender || 'other',
      age,
      height: getHeightCm(),
      heightUnit,
      weight,
      fitnessGoal: fitnessGoal || 'general_fitness',
      experience: level || 'beginner',
      stepGoal,
      workoutDaysPerWeek: 5,
      preferredWorkoutDuration: workoutDuration,
      onboardingCompleted: true,
    });
    navigation.replace('Main');
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return gender !== null && age > 0;
      case 1: return getHeightCm() > 0 && weight > 0;
      case 2: return fitnessGoal !== null;
      case 3: return level !== null;
      default: return true;
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipTopText}>Skip</Text>
        </TouchableOpacity>
        <Text style={styles.stepCount}>{step + 1} / {totalSteps}</Text>
        <View style={{ width: 50 }} />
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${((step + 1) / totalSteps) * 100}%` }]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {steps[step]}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.footerRow}>
          {step > 0 && (
            <TouchableOpacity onPress={goBack} style={styles.backBtn}>
              <MaterialIcons name="arrow-back" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={canProceed() ? goNext : undefined}
            style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={canProceed() ? [colors.primaryGradientStart, colors.primaryGradientEnd] : ['#333', '#333']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextGradient}
            >
              <Text style={styles.nextText}>
                {step === totalSteps - 1 ? 'Complete' : 'Continue'}
              </Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const stepContent: any = { gap: spacing.md };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  skipTopText: {
    color: colors.textMuted,
    fontSize: fontSize.md,
    fontWeight: '600',
  },
  stepCount: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
  progressBar: {
    marginHorizontal: spacing.lg,
    height: 4,
    backgroundColor: colors.card,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  questionText: {
    color: colors.text,
    fontSize: fontSize.xxl,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  fieldLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Age / Weight Picker
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

  // Height
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: borderRadius.full,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
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
  levelCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  levelCardActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '12',
  },
  levelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  levelDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelDotActive: {
    borderColor: colors.primary,
  },
  levelDotInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  levelLabel: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
  },
  levelLabelActive: {
    color: colors.primary,
  },
  levelDesc: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginTop: 2,
  },

  // Duration
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

  // Step goal
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepValue: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '800',
    minWidth: 100,
    textAlign: 'center',
  },

  // Footer
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  footerRow: {
    flexDirection: 'row',
    gap: spacing.md,
    alignItems: 'center',
  },
  backBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  nextBtn: {
    flex: 1,
    height: 52,
  },
  nextBtnDisabled: {
    opacity: 0.4,
  },
  nextGradient: {
    flex: 1,
    borderRadius: borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  nextText: {
    color: '#fff',
    fontSize: fontSize.md,
    fontWeight: '700',
  },
});
