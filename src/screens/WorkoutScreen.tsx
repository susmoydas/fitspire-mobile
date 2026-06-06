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
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';
import { useWorkoutPlans } from '../hooks/useWorkoutPlans';
import type { WorkoutPlan } from '../data/workoutPlans';
import ExerciseMediaCard from '../components/ExerciseMediaCard';
import LogoFallback from '../components/LogoFallback';
import AIFloatingButton from '../components/AIFloatingButton';
import AIFitnessAssistant from '../components/AIFitnessAssistant';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SIDE = 16;
const GAP = 12;
const CARD_W = (SCREEN_WIDTH - SIDE * 2 - GAP) / 2;

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: colors.success,
  Intermediate: colors.warning,
  Advanced: colors.error,
};

function WorkoutCard({
  plan,
  onPress,
}: {
  plan: WorkoutPlan;
  onPress: (p: WorkoutPlan) => void;
}) {
  const firstEx = plan.exercises?.[0];
  const levelColor = DIFFICULTY_COLORS[plan.difficulty] || colors.textMuted;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => onPress(plan)}>
      <View style={styles.cardImageWrap}>
        {firstEx ? (
          <ExerciseMediaCard
            exercise={firstEx}
            mode="preStart"
            aspectRatio={1}
            rounded={borderRadius.md}
          />
        ) : (
          <LogoFallback aspectRatio={1} rounded={borderRadius.md} />
        )}
        <View style={[styles.levelChip, { backgroundColor: levelColor + '22' }]}>
          <Text style={[styles.levelChipText, { color: levelColor }]} numberOfLines={1}>
            {plan.difficulty}
          </Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <Text style={styles.cardTitle} numberOfLines={1}>{plan.title}</Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {plan.duration} min · {plan.difficulty}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function SkeletonGrid() {
  return (
    <View style={styles.skeletonGrid}>
      {[1, 2, 3, 4].map((i) => (
        <View key={i} style={styles.skeletonCard}>
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
  const { plans, loading, error, isOffline } = useWorkoutPlans();
  const [showAIAssistant, setShowAIAssistant] = useState(false);

  const [search, setSearch] = useState('');
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(searchTimeout.current);
  }, [search]);

  const filteredPlans = useMemo(() => {
    if (!debouncedSearch.trim()) return plans;
    const q = debouncedSearch.toLowerCase();
    return plans.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.difficulty.toLowerCase().includes(q) ||
        p.targetMuscles.some((m) => m.toLowerCase().includes(q)),
    );
  }, [plans, debouncedSearch]);

  const handlePlanPress = useCallback(
    (plan: WorkoutPlan) => {
      nav.navigate('WorkoutDetail', { workoutId: plan.id, workoutTitle: plan.title });
    },
    [nav],
  );

  const renderItem = useCallback(
    ({ item }: { item: WorkoutPlan }) => <WorkoutCard plan={item} onPress={handlePlanPress} />,
    [handlePlanPress],
  );

  const listHeader = (
    <>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Workouts</Text>
      </View>
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search workouts"
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

  if (loading && plans.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {listHeader}
        <SkeletonGrid />
      </View>
    );
  }

  if (error && plans.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {listHeader}
        <View style={styles.centerBox}>
          <MaterialIcons name="cloud-off" size={52} color={colors.textMuted} />
          <Text style={styles.centerText}>{error}</Text>
        </View>
        <AIFloatingButton bottom={fabBottom} onPress={() => setShowAIAssistant(true)} />
        <AIFitnessAssistant visible={showAIAssistant} onClose={() => setShowAIAssistant(false)} />
      </View>
    );
  }

  if (!loading && filteredPlans.length === 0) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {listHeader}
        <View style={styles.centerBox}>
          <MaterialIcons name="search-off" size={52} color={colors.textMuted} />
          <Text style={styles.centerText}>No workouts found</Text>
          <Text style={styles.centerSub}>Try another search</Text>
        </View>
        <AIFloatingButton bottom={fabBottom} onPress={() => setShowAIAssistant(true)} />
        <AIFitnessAssistant visible={showAIAssistant} onClose={() => setShowAIAssistant(false)} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <FlatList
        data={filteredPlans}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.flatContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={listHeader}
        ListFooterComponent={<View style={{ height: 140 }} />}
        refreshing={loading}
      />
      {isOffline && plans.length > 0 && (
        <View style={styles.offlineBanner}>
          <MaterialIcons name="cloud-off" size={14} color={colors.textMuted} />
          <Text style={styles.offlineText}>Limited workouts — you are offline</Text>
        </View>
      )}
      <AIFloatingButton bottom={fabBottom} onPress={() => setShowAIAssistant(true)} />
      <AIFitnessAssistant visible={showAIAssistant} onClose={() => setShowAIAssistant(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  flatContent: { paddingBottom: 140 },

  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  headerTitle: {
    fontSize: fontSize.title,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },

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
    gap: GAP,
    paddingHorizontal: SIDE,
    marginBottom: GAP,
  },

  card: {
    width: CARD_W,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  cardImageWrap: {
    position: 'relative',
  },
  levelChip: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.xs,
    maxWidth: CARD_W - 12,
  },
  levelChipText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  cardBody: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: 2,
  },
  cardTitle: {
    fontSize: fontSize.md,
    fontWeight: '700',
    color: colors.text,
  },
  cardMeta: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GAP,
    paddingHorizontal: SIDE,
  },
  skeletonCard: {
    width: CARD_W,
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  skeletonImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.skeleton,
    borderRadius: borderRadius.md,
  },
  skeletonLineWide: {
    height: 14,
    backgroundColor: colors.skeleton,
    borderRadius: 6,
    width: '80%',
    marginHorizontal: spacing.xs,
  },
  skeletonLineShort: {
    height: 12,
    backgroundColor: colors.skeleton,
    borderRadius: 6,
    width: '50%',
    marginHorizontal: spacing.xs,
    marginBottom: spacing.xs,
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

  offlineBanner: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.lg,
    right: spacing.lg + 76,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  offlineText: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
});

