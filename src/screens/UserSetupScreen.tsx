import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { useStore } from '../store/useStore';
import Input from '../components/Input';
import Button from '../components/Button';
import { colors, fontSize, spacing, borderRadius } from '../components/Theme';
import { Gender, ExperienceLevel, TrainingPace } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'UserSetup'>;

const genders: Gender[] = ['male', 'female', 'other'];
const experiences: ExperienceLevel[] = ['beginner', 'intermediate', 'advanced'];
const paces: TrainingPace[] = ['slow', 'moderate', 'fast'];
const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function UserSetupScreen({ navigation }: Props) {
  const profile = useStore((s) => s.profile);
  const setProfile = useStore((s) => s.setProfile);

  const [step, setStep] = useState(0);
  const [gender, setGender] = useState<Gender | null>(profile.gender || null);
  const [age, setAge] = useState(profile.age?.toString() || '');
  const [height, setHeight] = useState(profile.height?.toString() || '');
  const [weight, setWeight] = useState(profile.weight?.toString() || '');
  const [experience, setExperience] = useState<ExperienceLevel | null>(profile.experience || null);
  const [maxReps, setMaxReps] = useState(profile.maxReps?.toString() || '10');
  const [trainingDays, setTrainingDays] = useState<number[]>(profile.trainingDays || []);
  const [sessionDuration, setSessionDuration] = useState(profile.sessionDuration?.toString() || '45');
  const [pace, setPace] = useState<TrainingPace | null>(profile.pace || null);
  const [goalWeight, setGoalWeight] = useState(profile.goalWeight?.toString() || '');

  const toggleDay = (index: number) => {
    setTrainingDays((prev) =>
      prev.includes(index) ? prev.filter((d) => d !== index) : [...prev, index]
    );
  };

  const handleFinish = () => {
    setProfile({
      gender: gender!,
      age: parseInt(age, 10),
      height: parseInt(height, 10),
      weight: parseInt(weight, 10),
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
      <Input label="Age" value={age} onChangeText={setAge} keyboardType="numeric" placeholder="e.g. 25" />
      <Input label="Height (cm)" value={height} onChangeText={setHeight} keyboardType="numeric" placeholder="e.g. 175" />
      <Input label="Weight (kg)" value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="e.g. 70" />
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
        Current: {weight} kg → Goal: {goalWeight || '?'} kg
      </Text>
    </View>
  );

  const steps = [renderGenderStep, renderBodyStep, renderExperienceStep, renderScheduleStep, renderGoalStep];

  const canProceed = () => {
    switch (step) {
      case 0: return !!gender;
      case 1: return !!age && !!height && !!weight;
      case 2: return !!experience && !!maxReps;
      case 3: return trainingDays.length > 0 && !!sessionDuration && !!pace;
      case 4: return !!goalWeight;
      default: return false;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.progressContainer}>
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
          <Button title="Back" onPress={() => setStep(step - 1)} variant="ghost" style={{ marginRight: spacing.sm }} />
        )}
        <Button
          title={step === steps.length - 1 ? 'Complete Setup' : 'Next'}
          onPress={() => (step === steps.length - 1 ? handleFinish() : setStep(step + 1))}
          disabled={!canProceed()}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingTop: 60,
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
});
