import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';
import { Gender, ExperienceLevel, TrainingPace } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

const genders: Gender[] = ['male', 'female', 'other'];
const experiences: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];
const paces: TrainingPace[] = ['slow', 'moderate', 'fast'];
const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type HeightUnit = 'cm' | 'ft_in';
type WeightUnit = 'kg' | 'lb';

export default function UserSetupScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);

  const safeProfile = profile || {};

  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<Gender | null>(safeProfile.gender || null);
  const [age, setAge] = useState(safeProfile.age?.toString() || '');

  // Height
  const [heightUnit, setHeightUnit] = useState<HeightUnit>('cm');
  const [heightCm, setHeightCm] = useState(safeProfile.height?.toString() || '');
  const [heightFeet, setHeightFeet] = useState('5');
  const [heightInch, setHeightInch] = useState('8');

  // Weight
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [weightKg, setWeightKg] = useState(safeProfile.weight?.toString() || '');
  const [weightLb, setWeightLb] = useState('154');

  const [experience, setExperience] = useState<ExperienceLevel | null>(safeProfile.experience || null);
  const [maxReps, setMaxReps] = useState(safeProfile.maxReps?.toString() || '10');
  const [trainingDays, setTrainingDays] = useState<number[]>(Array.isArray(safeProfile.trainingDays) ? safeProfile.trainingDays : []);
  const [sessionDuration, setSessionDuration] = useState(safeProfile.sessionDuration?.toString() || '45');
  const [pace, setPace] = useState<TrainingPace | null>(safeProfile.pace || null);
  const [goalWeight, setGoalWeight] = useState(safeProfile.goalWeight?.toString() || '');

  const toggleDay = (index: number) => {
    setTrainingDays((prev) =>
      prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]
    );
  };

  const getHeightCm = (): number => {
    if (heightUnit === 'cm') return parseInt(heightCm, 10) || 0;
    const ft = parseInt(heightFeet, 10) || 0;
    const inc = parseInt(heightInch, 10) || 0;
    return Math.round(ft * 30.48 + inc * 2.54);
  };

  const getWeightKg = (): number => {
    if (weightUnit === 'kg') return parseInt(weightKg, 10) || 0;
    return Math.round((parseInt(weightLb, 10) || 0) * 0.453592);
  };

  const handleFinish = () => {
    setProfile({
      gender: gender!,
      age: parseInt(age, 10),
      height: getHeightCm(),
      weight: getWeightKg(),
      goalWeight: parseInt(goalWeight, 10),
      experience: experience!,
      maxReps: parseInt(maxReps, 10),
      trainingDays,
      sessionDuration: parseInt(sessionDuration, 10),
      pace: pace!,
      onboardingCompleted: true,
    });
    navigation.replace('Main');
  };

  const renderGenderStep = () => (
    <View>
      <Text style={styles.stepTitle}>What's your gender?</Text>
      <View style={styles.optionsRow}>
        {genders.map((g) => (
          <TouchableOpacity
            key={g}
            style={[styles.optionCard, gender === g && styles.optionSelected]}
            onPress={() => setGender(g)}
          >
            <Text style={[styles.optionText, gender === g && styles.optionTextSelected]}>
              {g.charAt(0).toUpperCase() + g.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderBodyStep = () => (
    <View>
      <Text style={styles.stepTitle}>Your Body Stats</Text>

      {/* Age */}
      <Input label="Age" value={age} onChangeText={setAge} keyboardType="numeric" placeholder="e.g. 25" />

      {/* Height */}
      <Text style={styles.fieldLabel}>Height</Text>
      <View style={styles.segmentedRow}>
        <TouchableOpacity
          style={[styles.segmentPill, heightUnit === 'cm' && styles.segmentActive]}
          onPress={() => setHeightUnit('cm')}
        >
          <Text style={[styles.segmentText, heightUnit === 'cm' && styles.segmentTextActive]}>Centimeter</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentPill, heightUnit === 'ft_in' && styles.segmentActive]}
          onPress={() => setHeightUnit('ft_in')}
        >
          <Text style={[styles.segmentText, heightUnit === 'ft_in' && styles.segmentTextActive]}>Feet / Inch</Text>
        </TouchableOpacity>
      </View>
      {heightUnit === 'cm' ? (
        <Input
          label=""
          value={heightCm}
          onChangeText={setHeightCm}
          keyboardType="numeric"
          placeholder="e.g. 175"
          containerStyle={{ marginTop: spacing.sm }}
        />
      ) : (
        <View style={styles.dualInputRow}>
          <View style={styles.dualInputItem}>
            <Text style={styles.dualLabel}>Feet</Text>
            <Input
              label=""
              value={heightFeet}
              onChangeText={setHeightFeet}
              keyboardType="numeric"
              placeholder="5"
            />
          </View>
          <View style={styles.dualInputItem}>
            <Text style={styles.dualLabel}>Inch</Text>
            <Input
              label=""
              value={heightInch}
              onChangeText={setHeightInch}
              keyboardType="numeric"
              placeholder="8"
            />
          </View>
        </View>
      )}

      {/* Weight */}
      <Text style={[styles.fieldLabel, { marginTop: spacing.md }]}>Weight</Text>
      <View style={styles.segmentedRow}>
        <TouchableOpacity
          style={[styles.segmentPill, weightUnit === 'kg' && styles.segmentActive]}
          onPress={() => setWeightUnit('kg')}
        >
          <Text style={[styles.segmentText, weightUnit === 'kg' && styles.segmentTextActive]}>KG</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.segmentPill, weightUnit === 'lb' && styles.segmentActive]}
          onPress={() => setWeightUnit('lb')}
        >
          <Text style={[styles.segmentText, weightUnit === 'lb' && styles.segmentTextActive]}>Pound / lbs</Text>
        </TouchableOpacity>
      </View>
      {weightUnit === 'kg' ? (
        <Input
          label=""
          value={weightKg}
          onChangeText={setWeightKg}
          keyboardType="numeric"
          placeholder="e.g. 70"
          containerStyle={{ marginTop: spacing.sm }}
        />
      ) : (
        <Input
          label=""
          value={weightLb}
          onChangeText={setWeightLb}
          keyboardType="numeric"
          placeholder="e.g. 154"
          containerStyle={{ marginTop: spacing.sm }}
        />
      )}
    </View>
  );

  const renderExperienceStep = () => (
    <View>
      <Text style={styles.stepTitle}>Training Experience</Text>
      <Text style={styles.stepSubtitle}>How would you describe your fitness level?</Text>
      {experiences.map((e) => (
        <TouchableOpacity
          key={e}
          style={[styles.optionCard, styles.fullOption, experience === e && styles.optionSelected]}
          onPress={() => setExperience(e)}
        >
          <Text style={[styles.optionText, experience === e && styles.optionTextSelected]}>
            {e.charAt(0).toUpperCase() + e.slice(1)}
          </Text>
        </TouchableOpacity>
      ))}
      <Input
        label="Max Reps You Can Do"
        value={maxReps}
        onChangeText={setMaxReps}
        keyboardType="numeric"
        placeholder="e.g. 10"
      />
    </View>
  );

  const renderScheduleStep = () => (
    <View>
      <Text style={styles.stepTitle}>Training Schedule</Text>
      <Text style={styles.stepSubtitle}>Which days do you plan to train?</Text>
      <View style={styles.daysRow}>
        {daysOfWeek.map((day, i) => (
          <TouchableOpacity
            key={day}
            style={[styles.dayPill, trainingDays.includes(i) && styles.daySelected]}
            onPress={() => toggleDay(i)}
          >
            <Text style={[styles.dayText, trainingDays.includes(i) && styles.dayTextSelected]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <Input
        label="Session Duration (minutes)"
        value={sessionDuration}
        onChangeText={setSessionDuration}
        keyboardType="numeric"
        placeholder="e.g. 45"
      />
      <Text style={[styles.stepSubtitle, { marginTop: spacing.md }]}>Training Pace</Text>
      <View style={styles.optionsRow}>
        {paces.map((p) => (
          <TouchableOpacity
            key={p}
            style={[styles.optionCard, pace === p && styles.optionSelected]}
            onPress={() => setPace(p)}
          >
            <Text style={[styles.optionText, pace === p && styles.optionTextSelected]}>
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderGoalStep = () => (
    <View>
      <Text style={styles.stepTitle}>Your Goal</Text>
      <Input
        label="Goal Weight (kg)"
        value={goalWeight}
        onChangeText={setGoalWeight}
        keyboardType="numeric"
        placeholder="e.g. 65"
      />
      <Text style={styles.goalSummary}>
        Current: {getWeightKg()} kg → Goal: {goalWeight || '?'} kg
      </Text>
    </View>
  );

  const steps = [renderGenderStep, renderBodyStep, renderExperienceStep, renderScheduleStep, renderGoalStep];

  const canProceed = () => {
    switch (step) {
      case 0: return !!gender;
      case 1: return !!age && getHeightCm() > 0 && getWeightKg() > 0;
      case 2: return !!experience && !!maxReps;
      case 3: return trainingDays.length > 0 && !!sessionDuration && !!pace;
      case 4: return !!goalWeight;
      default: return false;
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.progressContainer, { paddingTop: insets.top + spacing.md }]}>
        {steps.map((_, i) => (
          <View key={i} style={[styles.progressDot, i <= step && styles.progressActive]} />
        ))}
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.stepCounter}>Step {step + 1} of {steps.length}</Text>
        {steps[step]()}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 && (
          <Button onPress={() => setStep(step - 1)} variant="ghost" style={{ marginRight: spacing.sm }}>Back</Button>
        )}
        <Button
          onPress={() => (step === steps.length - 1 ? handleFinish() : setStep(step + 1))}
          disabled={!canProceed()}
          style={{ flex: 1 }}
        >
          {step === steps.length - 1 ? 'Complete Setup' : 'Next'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: spacing.md,
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },
  progressActive: {
    width: 24,
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  scrollView: { flex: 1 },
  scrollContent: { padding: spacing.lg },
  stepCounter: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.lg },
  stepTitle: { color: colors.text, fontSize: fontSize.xxl, fontWeight: '700', marginBottom: spacing.md },
  stepSubtitle: { color: colors.textSecondary, fontSize: fontSize.sm, marginBottom: spacing.md },
  fieldLabel: { color: colors.text, fontSize: fontSize.md, fontWeight: '600', marginBottom: spacing.sm },
  optionsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  optionCard: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
  optionText: { color: colors.textSecondary, fontWeight: '600', fontSize: fontSize.md },
  optionTextSelected: { color: colors.primary },
  fullOption: { marginBottom: spacing.sm },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  dayPill: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  daySelected: { borderColor: colors.primary, backgroundColor: colors.primary + '20' },
  dayText: { color: colors.textSecondary, fontWeight: '600' },
  dayTextSelected: { color: colors.primary },
  goalSummary: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  segmentedRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  segmentPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
  },
  segmentActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '20',
  },
  segmentText: {
    color: colors.textSecondary,
    fontWeight: '600',
    fontSize: fontSize.sm,
  },
  segmentTextActive: {
    color: colors.primary,
  },
  dualInputRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.sm,
  },
  dualInputItem: {
    flex: 1,
  },
  dualLabel: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    marginBottom: spacing.xs,
  },
});
