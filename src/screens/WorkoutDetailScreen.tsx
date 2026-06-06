import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Animated,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius, buttonHeight } from '../theme/colors';
import { useWorkoutPlans } from '../hooks/useWorkoutPlans';
import { useStore } from '../store/useStore';
import { getWorkoutPlanById, type WorkoutPlan, type WorkoutPlanExercise } from '../data/workoutPlans';
import ExerciseMediaCard from '../components/ExerciseMediaCard';
import LogoFallback from '../components/LogoFallback';
import { getWorkoutExerciseImageUrls } from '../utils/image';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type DetailRoute = RouteProp<RootStackParamList, 'WorkoutDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const MEDIA_SIDE = 16;
const MEDIA_WIDTH = SCREEN_WIDTH - MEDIA_SIDE * 2;
const MEDIA_HEIGHT = MEDIA_WIDTH;
const THUMB_SIZE = 56;
const MEDIA_RADIUS = 24;

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const INTENSITY_PCT: Record<string, number> = {
  Beginner: 0.4,
  Intermediate: 0.6,
  Advanced: 0.85,
};
const INTENSITY_LABEL: Record<string, string> = {
  Beginner: 'Low',
  Intermediate: 'Medium',
  Advanced: 'High',
};

function Skeleton() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: spacing.lg }}>
      <View style={{ width: MEDIA_WIDTH, height: MEDIA_HEIGHT, borderRadius: MEDIA_RADIUS, backgroundColor: colors.skeleton, marginBottom: spacing.md, alignSelf: 'center' }} />
      <View style={{ height: 80, borderRadius: borderRadius.lg, backgroundColor: colors.skeleton, marginBottom: spacing.md }} />
      <View style={{ height: 180, borderRadius: borderRadius.lg, backgroundColor: colors.skeleton, marginBottom: spacing.md }} />
      <View style={{ height: 120, borderRadius: borderRadius.lg, backgroundColor: colors.skeleton }} />
    </View>
  );
}

function splitInstructions(plan: WorkoutPlan) {
  const warmup = Math.max(2, Math.round(plan.duration * 0.1));
  const cooldown = Math.max(3, Math.round(plan.duration * 0.2));
  const main = Math.max(1, plan.duration - warmup - cooldown);
  return { warmup, main, cooldown };
}

function buildMuscleFocus(plan: WorkoutPlan): Array<{ name: string; pct: number }> {
  const counts: Record<string, number> = {};
  for (const ex of plan.exercises) {
    for (const m of ex.targetMuscles || []) {
      counts[m] = (counts[m] || 0) + 1;
    }
  }
  const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
  return Object.entries(counts)
    .map(([name, c]) => ({ name, pct: Math.round((c / total) * 100) }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3);
}

function buildExpandedContent(ex: WorkoutPlanExercise) {
  const fg = ex.formGuide;
  const split = (text: string | undefined | null, max: number): string[] => {
    if (!text) return [];
    return text
      .split(/[.\n]+/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, max);
  };
  const setup = split(fg?.setup, 4);
  const steps = split(fg?.movement, 6);
  const breathing = split(fg?.breathing, 2);
  const mistakes = split(fg?.mistakes, 3);
  const easier = split(fg?.easyOption, 2);
  const safety = split(fg?.safety, 2);
  return { setup, steps, breathing, mistakes, easier, safety };
}

export default function WorkoutDetailScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const route = useRoute<DetailRoute>();
  const { workoutId } = route.params;
  const { plans, loading } = useWorkoutPlans();
  const completedWorkoutLog = useStore((s) => s.completedWorkoutLog);

  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  const plan = useMemo<WorkoutPlan | null>(() => {
    if (!plans.length) return null;
    return getWorkoutPlanById(plans, workoutId) || null;
  }, [plans, workoutId]);

  const lastCompletion = useMemo(() => {
    if (!plan) return null;
    const matches = completedWorkoutLog.filter((cw) => cw.workoutId === plan.id);
    if (!matches.length) return null;
    matches.sort((a, b) => (b.completedAt || '').localeCompare(a.completedAt || ''));
    return matches[0];
  }, [completedWorkoutLog, plan]);

  const muscleFocus = useMemo(() => (plan ? buildMuscleFocus(plan) : []), [plan]);
  const flow = useMemo(() => (plan ? splitInstructions(plan) : null), [plan]);
  const intensityPct = plan ? (INTENSITY_PCT[plan.difficulty] ?? 0.6) : 0.6;
  const intensityLabel = plan ? (INTENSITY_LABEL[plan.difficulty] ?? 'Medium') : 'Medium';

  const uniqueEquipment = useMemo(() => {
    if (!plan) return [] as string[];
    return Array.from(new Set(plan.exercises.map((e) => e.equipment).filter(Boolean)));
  }, [plan]);

  const firstExercise = plan?.exercises?.[0] || null;

  const handleStart = useCallback(() => {
    if (!plan) return;
    nav.navigate('WorkoutTimer', { planJson: JSON.stringify(plan) });
  }, [plan, nav]);

  const toggleExpand = useCallback((idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIdx((current) => (current === idx ? null : idx));
  }, []);

  if (loading) return <Skeleton />;
  if (!plan || !firstExercise) {
    return (
      <View style={[styles.container, styles.centerBox]}>
        <MaterialIcons name="error-outline" size={56} color={colors.textMuted} />
        <Text style={styles.errorTitle}>Workout not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => nav.goBack()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const completionPct = lastCompletion
    ? Math.round((lastCompletion.exercisesCompleted / Math.max(1, lastCompletion.totalExercises)) * 100)
    : 0;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <TouchableOpacity onPress={() => nav.goBack()} style={styles.headerBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{plan.title}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 140 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO - 1:1 square, no text overlay, no crop */}
        <View style={styles.heroWrap}>
          <SquareMedia
            exercise={firstExercise}
            size={MEDIA_WIDTH}
            rounded={MEDIA_RADIUS}
          />
        </View>

        {/* Title + description BELOW the image */}
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>{plan.title}</Text>
          {plan.description ? (
            <Text style={styles.descText} numberOfLines={3}>{plan.description}</Text>
          ) : null}
          <View style={styles.metaRow}>
            <MetaText value={`${plan.duration} min`} />
            <MetaSep />
            <MetaText value={plan.difficulty} />
            <MetaSep />
            <MetaText value={`${plan.calories} kcal`} />
            <MetaSep />
            <MetaText value={`${plan.exerciseCount} exercises`} />
          </View>
        </View>

        {/* QUICK INFO ROW */}
        <View style={styles.quickRow}>
          <QuickChip value={`${plan.duration}`} label="min" />
          <QuickChip value={plan.difficulty} label="Level" />
          <QuickChip value={`${plan.calories}`} label="kcal" />
          <QuickChip value={`${plan.exerciseCount}`} label="exercises" />
        </View>

        {/* WORKOUT OVERVIEW CARD */}
        <Section title="Workout Overview">
          <View style={styles.overviewRow}>
            <View style={styles.overviewIconBubble}>
              <MaterialIcons name="bolt" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.row}>
                <Text style={styles.rowLabel}>Intensity</Text>
                <Text style={styles.rowValue}>{intensityLabel}</Text>
              </View>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${intensityPct * 100}%` }]} />
              </View>
            </View>
          </View>

          {muscleFocus.length > 0 && (
            <View style={styles.overviewBlock}>
              <View style={styles.overviewBlockHeader}>
                <View style={styles.overviewIconBubble}>
                  <MaterialIcons name="accessibility-new" size={16} color={colors.primary} />
                </View>
                <Text style={styles.overviewBlockTitle}>Muscle Focus</Text>
              </View>
              {muscleFocus.map((m) => (
                <View key={m.name} style={styles.muscleRow}>
                  <Text style={styles.muscleName}>{m.name}</Text>
                  <View style={styles.muscleBarTrack}>
                    <View style={[styles.muscleBarFill, { width: `${m.pct}%` }]} />
                  </View>
                  <Text style={styles.musclePct}>{m.pct}%</Text>
                </View>
              ))}
            </View>
          )}

          {flow && (
            <View style={styles.overviewBlock}>
              <View style={styles.overviewBlockHeader}>
                <View style={styles.overviewIconBubble}>
                  <MaterialIcons name="timeline" size={16} color={colors.primary} />
                </View>
                <Text style={styles.overviewBlockTitle}>Workout Flow</Text>
              </View>
              <View style={styles.flowRow}>
                <FlowNode icon="wb-sunny" label="Warm-up" mins={flow.warmup} active={false} />
                <FlowArrow />
                <FlowNode icon="local-fire-department" label="Main" mins={flow.main} active />
                <FlowArrow />
                <FlowNode icon="ac-unit" label="Cool-down" mins={flow.cooldown} active={false} />
              </View>
            </View>
          )}

          <View style={styles.overviewBlock}>
            <View style={styles.overviewBlockHeader}>
              <View style={styles.overviewIconBubble}>
                <MaterialIcons name="trending-up" size={16} color={colors.primary} />
              </View>
              <Text style={styles.overviewBlockTitle}>Your Progress</Text>
            </View>
            {lastCompletion ? (
              <>
                <Text style={styles.progressText}>
                  {completionPct}% · Exercise {lastCompletion.exercisesCompleted} of {lastCompletion.totalExercises}
                </Text>
                <View style={styles.barTrack}>
                  <View style={[styles.barFill, { width: `${completionPct}%` }]} />
                </View>
              </>
            ) : (
              <Text style={styles.progressText}>Not started</Text>
            )}
          </View>
        </Section>

        {/* BEFORE YOU START */}
        <Section title="Before You Start">
          {[
            'Wear comfortable clothes',
            'Keep water nearby',
            'Use a safe open space',
            'Start slowly',
            'Stop if you feel pain',
          ].map((tip) => (
            <View key={tip} style={styles.tipRow}>
              <MaterialIcons name="check" size={16} color={colors.primary} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}

          {uniqueEquipment.length > 0 && (
            <View style={styles.equipBlock}>
              <Text style={styles.subhead}>Equipment</Text>
              <View style={styles.equipRow}>
                {uniqueEquipment.map((e) => (
                  <View key={e} style={styles.equipChip}>
                    <MaterialIcons name="fitness-center" size={14} color={colors.textSecondary} />
                    <Text style={styles.equipText}>{e}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Section>

        {/* HOW IT WORKS */}
        <Section title="How this workout works">
          <View style={styles.howGrid}>
            <HowStep num={1} icon="fitness-center" label="Exercise" />
            <HowStep num={2} icon="repeat" label="Set" />
            <HowStep num={3} icon="self-improvement" label="Rest" />
            <HowStep num={4} icon="skip-next" label="Next Set" />
            <HowStep num={5} icon="arrow-forward" label="Next Exercise" />
            <HowStep num={6} icon="check-circle" label="Finish" />
          </View>
          <Text style={styles.howHint}>
            Follow one exercise at a time. Complete the set, rest, then continue.
          </Text>
        </Section>

        {/* EXERCISE LIST */}
        <Section title="Exercises">
          {plan.exercises.map((ex, idx) => {
            const isOpen = expandedIdx === idx;
            const content = isOpen ? buildExpandedContent(ex) : null;
            return (
              <View key={ex.exerciseId} style={styles.exCard}>
                <TouchableOpacity
                  style={styles.exRow}
                  activeOpacity={0.85}
                  onPress={() => toggleExpand(idx)}
                >
                  <View style={styles.exNum}>
                    <Text style={styles.exNumText}>{idx + 1}</Text>
                  </View>
                  <View style={styles.exThumb}>
                    <ExerciseMediaCard
                      exercise={ex}
                      mode="detail"
                      height={THUMB_SIZE}
                      rounded={borderRadius.sm}
                      contentFit="contain"
                    />
                  </View>
                  <View style={styles.exInfo}>
                    <Text style={styles.exName} numberOfLines={1}>{ex.name}</Text>
                    <Text style={styles.exMeta} numberOfLines={1}>
                      {ex.targetMuscles?.[0] || ex.category} · {ex.sets} × {ex.reps} · {ex.restSeconds}s rest
                    </Text>
                    <Text style={styles.exEquip} numberOfLines={1}>{ex.equipment}</Text>
                  </View>
                  <MaterialIcons
                    name={isOpen ? 'expand-less' : 'expand-more'}
                    size={22}
                    color={colors.textMuted}
                  />
                </TouchableOpacity>

                {isOpen && content && (
                  <View style={styles.expanded}>
                    <View style={styles.expandedGif}>
                      <SquareMedia
                        exercise={ex}
                        size={MEDIA_WIDTH}
                        rounded={MEDIA_RADIUS}
                      />
                    </View>

                    <ExerciseSection
                      icon="flag"
                      title="Setup"
                      color="#5AC8FA"
                      items={content.setup}
                    />
                    <ExerciseSection
                      icon="directions-run"
                      title="How to do"
                      color={colors.primary}
                      items={content.steps}
                      numbered
                    />
                    <ExerciseSection
                      icon="air"
                      title="Breathing"
                      color="#34C759"
                      items={content.breathing}
                    />
                    <ExerciseSection
                      icon="error-outline"
                      title="Common mistake"
                      color={colors.error}
                      items={content.mistakes}
                    />
                    <ExerciseSection
                      icon="trending-down"
                      title="Easier option"
                      color={colors.info}
                      items={content.easier}
                    />
                    <ExerciseSection
                      icon="health-and-safety"
                      title="Safety note"
                      color={colors.warning}
                      items={content.safety}
                    />
                  </View>
                )}
              </View>
            );
          })}
        </Section>
      </ScrollView>

      {/* Sticky Start */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + spacing.md }]}>
        <Text style={styles.bottomSummary}>
          {plan.exerciseCount} exercises · {plan.duration} min
        </Text>
        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <MaterialIcons name="play-arrow" size={22} color="#fff" />
          <Text style={styles.startBtnText}>Start Workout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function QuickChip({ value, label }: { value: string | number; label: string }) {
  return (
    <View style={styles.quickChip}>
      <Text style={styles.quickValue}>{value}</Text>
      <Text style={styles.quickLabel}>{label}</Text>
    </View>
  );
}

function SquareMedia({
  exercise,
  size,
  rounded = 0,
}: {
  exercise: WorkoutPlanExercise;
  size: number;
  rounded?: number;
}) {
  const urls = useMemo(
    () => getWorkoutExerciseImageUrls(exercise).filter(Boolean),
    [exercise],
  );
  const [urlIndex, setUrlIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  React.useEffect(() => {
    setUrlIndex(0);
    setAllFailed(false);
  }, [exercise.exerciseId, urls.join('|')]);

  const currentUrl = urls[urlIndex];

  const handleError = useCallback(() => {
    if (urlIndex < urls.length - 1) {
      setUrlIndex((i) => i + 1);
    } else {
      setAllFailed(true);
    }
  }, [urlIndex, urls.length]);

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: rounded,
        backgroundColor: '#FFFFFF',
        overflow: 'hidden',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {currentUrl && !allFailed ? (
        <Image
          source={{ uri: currentUrl }}
          style={styles.squareMediaImage}
          resizeMode="contain"
          onError={handleError}
        />
      ) : (
        <LogoFallback caption={exercise.name} backgroundColor="#FFFFFF" />
      )}
    </View>
  );
}

function MetaText({ value }: { value: string }) {
  return <Text style={styles.metaText}>{value}</Text>;
}

function MetaSep() {
  return <View style={styles.metaDot} />;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function FlowNode({
  icon,
  label,
  mins,
  active,
}: {
  icon: any;
  label: string;
  mins: number;
  active: boolean;
}) {
  return (
    <View style={[styles.flowNode, active && styles.flowNodeActive]}>
      <View style={[styles.flowIconBubble, active && styles.flowIconBubbleActive]}>
        <MaterialIcons
          name={icon}
          size={18}
          color={active ? '#fff' : colors.primary}
        />
      </View>
      <Text style={[styles.flowMins, active && styles.flowMinsActive]}>{mins}m</Text>
      <Text style={[styles.flowLabel, active && styles.flowLabelActive]}>{label}</Text>
    </View>
  );
}

function FlowArrow() {
  return <MaterialIcons name="chevron-right" size={18} color={colors.textMuted} />;
}

function HowStep({ num, icon, label }: { num: number; icon: any; label: string }) {
  return (
    <View style={styles.howStep}>
      <View style={styles.howStepCircle}>
        <MaterialIcons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.howStepNum}>Step {num}</Text>
      <Text style={styles.howStepLabel} numberOfLines={2}>{label}</Text>
    </View>
  );
}

function ExpandedBlock({
  title,
  items,
  numbered,
}: {
  title: string;
  items: string[];
  numbered: boolean;
}) {
  return (
    <View style={styles.expandedBlock}>
      <Text style={styles.subhead}>{title}</Text>
      {items.map((item, i) => (
        <View key={i} style={styles.expandedRow}>
          {numbered ? (
            <View style={styles.stepNum}>
              <Text style={styles.stepNumText}>{i + 1}</Text>
            </View>
          ) : (
            <View style={styles.bullet} />
          )}
          <Text style={styles.expandedItem}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function ExerciseSection({
  icon,
  title,
  color,
  items,
  numbered,
}: {
  icon: any;
  title: string;
  color: string;
  items: string[];
  numbered?: boolean;
}) {
  if (!items || items.length === 0) return null;
  return (
    <View style={styles.exSection}>
      <View style={styles.exSectionHeader}>
        <View style={[styles.exSectionIcon, { backgroundColor: color + '22' }]}>
          <MaterialIcons name={icon} size={15} color={color} />
        </View>
        <Text style={styles.exSectionTitle}>{title}</Text>
      </View>
      <View style={styles.exSectionBody}>
        {items.map((item, i) => (
          <View key={i} style={styles.exSectionRow}>
            {numbered ? (
              <View style={[styles.exSectionNumber, { borderColor: color }]}>
                <Text style={[styles.exSectionNumberText, { color }]}>{i + 1}</Text>
              </View>
            ) : (
              <View style={[styles.exSectionBullet, { backgroundColor: color }]} />
            )}
            <Text style={styles.exSectionItem}>{item}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  errorTitle: {
    color: colors.text,
    fontSize: fontSize.xl,
    fontWeight: '700',
    marginTop: spacing.md,
  },
  backBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.card,
    borderRadius: borderRadius.lg,
  },
  backBtnText: { color: colors.primary, fontSize: fontSize.md, fontWeight: '600' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
  },
  headerBtn: {
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
    flex: 1,
    textAlign: 'center',
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.xs },

  heroWrap: {
    width: MEDIA_WIDTH,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  titleSection: {
    paddingHorizontal: 0,
    marginBottom: spacing.md,
    gap: spacing.xs,
  },
  titleText: {
    color: colors.text,
    fontSize: fontSize.title,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  descText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  metaText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: colors.textMuted,
  },

  quickRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  quickChip: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
  },
  quickValue: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  quickLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  subhead: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  rowLabel: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  rowValue: { color: colors.text, fontSize: 16, fontWeight: '700' },

  barTrack: {
    height: 10,
    backgroundColor: colors.cardElevated,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: spacing.md,
  },
  barFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 5 },

  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  overviewIconBubble: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overviewBlock: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  overviewBlockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  overviewBlockTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },

  muscleBlock: { marginTop: spacing.xs },
  muscleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 8,
  },
  muscleName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '600',
    width: 80,
  },
  muscleBarTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.cardElevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  muscleBarFill: { height: '100%', backgroundColor: colors.primary, borderRadius: 4 },
  musclePct: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
    width: 40,
    textAlign: 'right',
  },

  flowBlock: { marginTop: spacing.xs },
  flowRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    gap: spacing.xs,
  },
  flowNode: {
    flex: 1,
    backgroundColor: colors.cardElevated,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  flowNodeActive: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  flowIconBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  flowIconBubbleActive: {
    backgroundColor: colors.primary,
  },
  flowMins: { color: colors.text, fontSize: fontSize.lg, fontWeight: '800' },
  flowMinsActive: { color: colors.primary },
  flowLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  flowLabelActive: { color: colors.primary, fontWeight: '800' },

  progressBlock: { marginTop: spacing.xs },
  progressText: { color: colors.text, fontSize: 15, fontWeight: '600' },

  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: 6,
  },
  tipText: { color: colors.textSecondary, fontSize: 15, flex: 1, lineHeight: 22 },

  equipBlock: { marginTop: spacing.sm },
  equipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  equipChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.cardElevated,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: borderRadius.full,
  },
  equipText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },

  howGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: spacing.md,
    columnGap: spacing.xs,
    marginBottom: spacing.md,
  },
  howStep: {
    width: '31%',
    alignItems: 'center',
    gap: 4,
  },
  howStepCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '18',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  howStepNum: {
    color: colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  howStepLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  howHint: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },

  exCard: {
    backgroundColor: colors.cardElevated,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xs,
    overflow: 'hidden',
  },
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  exNum: {
    width: 28,
    alignItems: 'center',
  },
  exNumText: {
    color: colors.primary,
    fontSize: fontSize.md,
    fontWeight: '800',
  },
  exThumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
  exInfo: { flex: 1, minWidth: 0 },
  exName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  exMeta: {
    color: colors.textSecondary,
    fontSize: fontSize.xs,
    fontWeight: '500',
    marginTop: 1,
  },
  exEquip: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },

  expanded: {
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  expandedGif: { marginVertical: spacing.sm },
  expandedBlock: { marginBottom: spacing.sm },
  expandedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
    marginBottom: 6,
  },
  expandedItem: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    flex: 1,
    lineHeight: 20,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.primary,
    marginTop: 7,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  breathBlock: { marginBottom: spacing.sm },
  breathText: {
    color: colors.textSecondary,
    fontSize: fontSize.sm,
    lineHeight: 20,
  },

  exSection: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  exSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  exSectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exSectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  exSectionBody: {
    gap: 8,
    marginTop: 2,
  },
  exSectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  exSectionNumber: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  exSectionNumberText: {
    fontSize: 12,
    fontWeight: '800',
  },
  exSectionBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 9,
  },
  exSectionItem: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    flex: 1,
  },

  squareMediaImage: {
    width: '100%',
    height: '100%',
  },

  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    backgroundColor: colors.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  bottomSummary: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  startBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.lg,
    height: buttonHeight.lg,
    gap: spacing.sm,
  },
  startBtnText: {
    color: '#fff',
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
});
