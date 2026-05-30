import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Dimensions,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/RootNavigator';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius, buttonHeight } from '../theme/colors';
import { fetchExercises } from '../services/exerciseDbApi';
import { getExerciseImageUrls } from '../utils/image';
import ExerciseHeroImage from '../components/ExerciseHeroImage';
import AIFitnessAssistant from '../components/AIFitnessAssistant';
import AIFloatingButton from '../components/AIFloatingButton';
import type { Exercise } from '../types';
import { useStore } from '../store/useStore';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_W = (SCREEN_WIDTH - spacing.lg * 2 - spacing.sm) / 2;

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: colors.warning,
  Intermediate: colors.warning,
  Advanced: colors.error,
};

const SETS_REPS_BY_DIFFICULTY: Record<string, { sets: number; reps: number; rest: number }> = {
  Beginner: { sets: 3, reps: 10, rest: 60 },
  Intermediate: { sets: 4, reps: 10, rest: 75 },
  Advanced: { sets: 4, reps: 8, rest: 90 },
};

function formatDifficulty(d: string): string {
  const map: Record<string, string> = {
    beginner: 'Beginner',
    intermediate: 'Intermediate',
    advanced: 'Advanced',
  };
  return map[d.toLowerCase()] || 'Intermediate';
}

function ExerciseCard({
  exercise,
  onPress,
  isSaved,
  onToggleSave,
}: {
  exercise: Exercise;
  onPress: (ex: Exercise) => void;
  isSaved: boolean;
  onToggleSave: (id: string) => void;
}) {
  const imgUrls = getExerciseImageUrls(exercise);
  const diff = formatDifficulty(exercise.difficulty);
  const sr = SETS_REPS_BY_DIFFICULTY[diff] || SETS_REPS_BY_DIFFICULTY.Intermediate;

  return (
    <TouchableOpacity style={styles.exCard} activeOpacity={0.85} onPress={() => onPress(exercise)}>
      <View style={styles.exCardImageWrap}>
        <ExerciseHeroImage
          urls={imgUrls}
          name={exercise.name}
          style={styles.exCardImageFull}
          contentFit="cover"
          showAnimationBadge={false}
        />
        <View style={[styles.exCardDiffBadge, { backgroundColor: DIFFICULTY_COLORS[diff] + '20' }]}>
          <Text style={[styles.exCardDiffText, { color: DIFFICULTY_COLORS[diff] }]}>{diff}</Text>
        </View>
        <TouchableOpacity
          style={styles.saveBtn}
          onPress={() => onToggleSave(exercise.id)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons
            name={isSaved ? 'bookmark' : 'bookmark-border'}
            size={18}
            color={isSaved ? colors.primary : '#fff'}
          />
        </TouchableOpacity>
      </View>
      <View style={styles.exCardBody}>
        <Text style={styles.exCardName} numberOfLines={1}>{exercise.name}</Text>
        <Text style={styles.exCardMeta} numberOfLines={1}>
          {exercise.bodyPart || exercise.category || ''}
        </Text>
        <View style={styles.exCardStatsRow}>
          <View style={styles.exCardPill}>
            <Text style={styles.exCardPillBold}>{sr.sets}</Text>
            <Text style={styles.exCardPillLabel}>×{sr.reps}</Text>
          </View>
          <View style={styles.exCardPill}>
            <MaterialIcons name="timer" size={12} color={colors.textMuted} />
            <Text style={styles.exCardPillLabel}> {sr.rest}s</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function SkeletonGrid() {
  return (
    <View style={styles.skeletonGrid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={{ width: CARD_W }}>
          <View style={styles.skeletonImage} />
          <View style={styles.skeletonLineWide} />
          <View style={styles.skeletonLineShort} />
        </View>
      ))}
    </View>
  );
}

export default function WorkoutScreen() {
  const insets = useSafeAreaInsets();
  const nav = useNavigation<Nav>();
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');

  const savedWorkoutIds = useStore((s) => s.savedWorkoutIds);
  const toggleSavedWorkout = useStore((s) => s.toggleSavedWorkout);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const loadExercises = useCallback(async () => {
    setLoading(true);
    setApiError(false);
    try {
      const result = await fetchExercises(0, 100);
      setAllExercises(result.exercises);
    } catch {
      setApiError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExercises();
  }, [loadExercises]);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const displayedExercises = useMemo(() => {
    let result = allExercises;

    if (activeTab === 'saved') {
      result = result.filter((ex) => savedWorkoutIds.includes(ex.id));
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (ex) =>
          ex.name?.toLowerCase().includes(q) ||
          ex.bodyPart?.toLowerCase().includes(q) ||
          ex.primaryTarget?.toLowerCase().includes(q) ||
          ex.targetMuscles?.some((m) => m.toLowerCase().includes(q)) ||
          ex.equipment?.toLowerCase().includes(q) ||
          ex.difficulty?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [allExercises, debouncedSearch, activeTab, savedWorkoutIds]);

  const handleExercisePress = useCallback(
    (exercise: Exercise) => {
      nav.navigate('ExerciseInstruction', {
        exerciseId: exercise.id,
        exerciseData: exercise,
      });
    },
    [nav],
  );

  const renderItem = useCallback(
    ({ item }: { item: Exercise }) => (
      <ExerciseCard
        exercise={item}
        onPress={handleExercisePress}
        isSaved={savedWorkoutIds.includes(item.id)}
        onToggleSave={toggleSavedWorkout}
      />
    ),
    [handleExercisePress, savedWorkoutIds, toggleSavedWorkout],
  );

  const listHeader = (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workouts</Text>
      </View>

      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'saved' && styles.tabActive]}
          onPress={() => setActiveTab('saved')}
        >
          <MaterialIcons
            name="bookmark"
            size={14}
            color={activeTab === 'saved' ? '#fff' : colors.textSecondary}
          />
          <Text style={[styles.tabText, activeTab === 'saved' && styles.tabTextActive]}>
            Saved ({savedWorkoutIds.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search exercises..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </>
  );

  const fabBottom = insets.bottom + 88;

  if (loading && allExercises.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {listHeader}
        <SkeletonGrid />
      </View>
    );
  }

  if (apiError && allExercises.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {listHeader}
        <View style={styles.centerBox}>
          <MaterialIcons name="cloud-off" size={52} color={colors.textMuted} />
          <Text style={styles.centerText}>Could not load exercises. Try again.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadExercises}>
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
        <AIFloatingButton bottom={fabBottom} onPress={() => setShowAIAssistant(true)} />
        <AIFitnessAssistant visible={showAIAssistant} onClose={() => setShowAIAssistant(false)} />
      </View>
    );
  }

  if (!loading && displayedExercises.length === 0) {
    const isSavedTab = activeTab === 'saved';
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {listHeader}
        <View style={styles.centerBox}>
          <MaterialIcons
            name={isSavedTab ? 'bookmark-border' : 'search-off'}
            size={52}
            color={colors.textMuted}
          />
          <Text style={styles.centerText}>
            {isSavedTab ? 'No saved exercises yet' : 'No exercises found'}
          </Text>
          <Text style={styles.centerSub}>
            {isSavedTab
              ? 'Bookmark exercises to see them here'
              : 'Try searching another exercise'}
          </Text>
        </View>
        <AIFloatingButton bottom={fabBottom} onPress={() => setShowAIAssistant(true)} />
        <AIFitnessAssistant visible={showAIAssistant} onClose={() => setShowAIAssistant(false)} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={displayedExercises}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.flatContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListFooterComponent={<View style={{ height: 120 }} />}
        refreshing={loading}
        onRefresh={loadExercises}
      />

      <AIFloatingButton bottom={fabBottom} onPress={() => setShowAIAssistant(true)} />
      <AIFitnessAssistant visible={showAIAssistant} onClose={() => setShowAIAssistant(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  tabRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: borderRadius.full,
    backgroundColor: colors.card,
  },
  tabActive: { backgroundColor: colors.primary },
  tabText: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  tabTextActive: { color: '#fff' },
  searchRow: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    paddingHorizontal: spacing.md,
    height: 50,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    height: '100%',
  },
  gridRow: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  flatContent: { paddingBottom: 150 },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  skeletonImage: {
    height: CARD_W * 0.75,
    backgroundColor: colors.skeleton,
    borderRadius: borderRadius.card,
    marginBottom: spacing.sm,
  },
  skeletonLineWide: {
    height: 18,
    width: CARD_W * 0.8,
    backgroundColor: colors.skeleton,
    borderRadius: 8,
    marginBottom: spacing.xs,
  },
  skeletonLineShort: {
    height: 14,
    width: CARD_W * 0.6,
    backgroundColor: colors.skeleton,
    borderRadius: 7,
  },
  exCard: {
    width: CARD_W,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  exCardImageWrap: {
    width: '100%',
    aspectRatio: 4 / 3,
    position: 'relative',
    backgroundColor: colors.skeleton,
  },
  exCardImageFull: {
    width: '100%',
    height: '100%',
    borderRadius: 0,
  },
  exCardDiffBadge: {
    position: 'absolute',
    top: spacing.sm,
    left: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.xs,
  },
  exCardDiffText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  saveBtn: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exCardBody: {
    padding: spacing.sm + 2,
    gap: spacing.xxs,
  },
  exCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    textTransform: 'capitalize',
  },
  exCardMeta: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
  exCardStatsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  exCardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardElevated,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  exCardPillBold: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  exCardPillLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: spacing.lg,
  },
  centerText: {
    fontSize: fontSize.lg,
    color: colors.textMuted,
    fontWeight: '600',
    marginTop: spacing.md,
    textAlign: 'center',
  },
  centerSub: {
    fontSize: fontSize.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    height: buttonHeight.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: '#fff',
  },
});
