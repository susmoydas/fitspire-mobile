import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, fontSize, spacing, borderRadius } from '../theme/colors';

const STEP_ICONS: (keyof typeof MaterialIcons.glyphMap)[] = [
  'looks-one',
  'looks-two',
  'looks-3',
  'looks-4',
  'looks-5',
  'looks-6',
];

interface InstructionStepsProps {
  instructions: string[];
  title?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  maxVisible?: number;
}

function cleanStepText(step: string): string {
  return step.replace(/^Step:\d+\s*/i, '').trim();
}

export default function InstructionSteps({
  instructions,
  title = 'How To',
  collapsible = false,
  defaultExpanded = true,
  maxVisible,
}: InstructionStepsProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (!instructions.length) return null;

  const visible = maxVisible && !expanded ? instructions.slice(0, maxVisible) : instructions;
  const hasMore = maxVisible != null && instructions.length > maxVisible && !expanded;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        activeOpacity={collapsible ? 0.7 : 1}
        onPress={() => collapsible && setExpanded((e) => !e)}
        disabled={!collapsible}
      >
        <MaterialIcons name="format-list-numbered" size={20} color={colors.primary} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.count}>{instructions.length} steps</Text>
        {collapsible && (
          <MaterialIcons
            name={expanded ? 'expand-less' : 'expand-more'}
            size={22}
            color={colors.textMuted}
          />
        )}
      </TouchableOpacity>

      {(!collapsible || expanded) && (
        <View style={styles.timeline}>
          {visible.map((step, i) => {
            const isLast = i === visible.length - 1 && !hasMore;
            const icon = STEP_ICONS[i] || 'fiber-manual-record';
            return (
              <View key={i} style={styles.stepRow}>
                <View style={styles.timelineCol}>
                  <View style={[styles.stepDot, i === 0 && styles.stepDotFirst]}>
                    <MaterialIcons name={icon} size={16} color="#fff" />
                  </View>
                  {!isLast && <View style={styles.timelineLine} />}
                </View>
                <View style={[styles.stepCard, isLast && styles.stepCardLast]}>
                  <Text style={styles.stepLabel}>Step {i + 1}</Text>
                  <Text style={styles.stepText}>{cleanStepText(step)}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {hasMore && (
        <TouchableOpacity style={styles.showMoreBtn} onPress={() => setExpanded(true)}>
          <Text style={styles.showMoreText}>Show all {instructions.length} steps</Text>
          <MaterialIcons name="expand-more" size={18} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: fontSize.lg,
    fontWeight: '700',
  },
  count: {
    color: colors.textMuted,
    fontSize: fontSize.xs,
    fontWeight: '600',
  },
  timeline: {
    padding: spacing.md,
    paddingTop: spacing.sm,
  },
  stepRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  timelineCol: {
    width: 32,
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotFirst: {
    backgroundColor: colors.primary,
  },
  timelineLine: {
    flex: 1,
    width: 2,
    backgroundColor: colors.border,
    marginVertical: 4,
    minHeight: 16,
  },
  stepCard: {
    flex: 1,
    backgroundColor: colors.cardElevated,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  stepCardLast: {
    marginBottom: 0,
  },
  stepLabel: {
    color: colors.primary,
    fontSize: fontSize.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  stepText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    lineHeight: 22,
    fontWeight: '500',
  },
  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  showMoreText: {
    color: colors.primary,
    fontSize: fontSize.sm,
    fontWeight: '600',
  },
});
