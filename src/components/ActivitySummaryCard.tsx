import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Text } from '@/components/ui/text';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { MaterialIcons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CARD_MARGIN = 16;
const CARD_WIDTH = SCREEN_WIDTH - CARD_MARGIN * 2;
const CARD_HEIGHT = SCREEN_HEIGHT * 0.5;
const CARD_PAD = 20;
const CONTENT_W = CARD_WIDTH - CARD_PAD * 2;
const CONTENT_H = CARD_HEIGHT - CARD_PAD * 2;
const RING_H = CONTENT_H * 0.65;
const STATS_H = CONTENT_H * 0.35;

const SCALE = Math.min(SCREEN_WIDTH / 430, 1);

const R1 = 130 * SCALE;
const R2 = 88 * SCALE;
const R3 = 46 * SCALE;
const SW = 30 * SCALE;

const CX = CONTENT_W / 2;
const CY = RING_H * 0.6;

const ICON_SIZE = 18;

const V_FS = Math.min(30, 30 * SCALE);
const U_FS = Math.min(14, 14 * SCALE);
const L_FS = Math.min(13, 13 * SCALE);

const START_DEG = 225;
const END_DEG = 495;
const ICON_ANGLE = 232;

const RING_CONFIGS = [
  {
    key: 'move',
    r: R1,
    endAngle: 355,
    trackColor: 'rgba(255,45,85,0.12)',
    gradId: 'moveGrad',
    gradStops: ['#FF2D55', '#FF6B8A'] as [string, string],
    iconName: 'directions-run' as const,
  },
  {
    key: 'exercise',
    r: R2,
    endAngle: 330,
    trackColor: 'rgba(0,200,83,0.12)',
    gradId: 'exerciseGrad',
    gradStops: ['#00C853', '#69F0AE'] as [string, string],
    iconName: 'fitness-center' as const,
  },
  {
    key: 'stand',
    r: R3,
    endAngle: 305,
    trackColor: 'rgba(255,176,32,0.12)',
    gradId: 'standGrad',
    gradStops: ['#FFB020', '#FFD54F'] as [string, string],
    iconName: 'accessibility-new' as const,
  },
];

const STAT_COLUMNS: { color: string; label: string; value: number; unit: string }[] = [
  { color: '#FF2D55', label: 'Move', value: 220, unit: '/2110 kcal' },
  { color: '#00C853', label: 'Exercise', value: 40, unit: '/12 min' },
  { color: '#FFB020', label: 'Stand', value: 15, unit: '/12 h' },
];

function polarToCartesian(
  cx: number, cy: number, r: number, angleDeg: number,
): { x: number; y: number } {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function arcPath(
  cx: number, cy: number, r: number, ang1: number, ang2: number,
): string {
  const s = polarToCartesian(cx, cy, r, ang1);
  const e = polarToCartesian(cx, cy, r, ang2);
  const large = ang2 - ang1 > 180 ? 1 : 0;
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
}

export default function ActivitySummaryCard() {
  const gradients = RING_CONFIGS.map((c) => (
    <LinearGradient key={c.gradId} id={c.gradId} x1="0%" y1="0%" x2="100%" y2="100%">
      <Stop offset="0%" stopColor={c.gradStops[0]} />
      <Stop offset="100%" stopColor={c.gradStops[1]} />
    </LinearGradient>
  ));

  const iconPositions = RING_CONFIGS.map((c) => {
    const pos = polarToCartesian(CX, CY, c.r, ICON_ANGLE);
    return { left: pos.x - ICON_SIZE / 2, top: pos.y - ICON_SIZE / 2 };
  });

  return (
    <View style={styles.card}>
      <View style={styles.ringArea}>
        <Svg width={CONTENT_W} height={RING_H} viewBox={`0 0 ${CONTENT_W} ${RING_H}`}>
          <Defs>{gradients}</Defs>
          {RING_CONFIGS.map((c) => (
            <Path
              key={`track-${c.key}`}
              d={arcPath(CX, CY, c.r, START_DEG, END_DEG)}
              stroke={c.trackColor}
              strokeWidth={SW}
              fill="none"
              strokeLinecap="round"
            />
          ))}
          {RING_CONFIGS.map((c) => (
            <Path
              key={`progress-${c.key}`}
              d={arcPath(CX, CY, c.r, START_DEG, c.endAngle)}
              stroke={`url(#${c.gradId})`}
              strokeWidth={SW}
              fill="none"
              strokeLinecap="round"
            />
          ))}
        </Svg>
        {RING_CONFIGS.map((c, i) => (
          <View
            key={`icon-${c.key}`}
            style={[
              styles.iconBox,
              { left: iconPositions[i].left, top: iconPositions[i].top },
            ]}
          >
            <MaterialIcons
              name={c.iconName}
              size={ICON_SIZE}
              color="#FFFFFF"
            />
          </View>
        ))}
      </View>

      <View style={styles.statsRow}>
        {STAT_COLUMNS.map((col, i) => (
          <View
            key={col.label}
            style={[
              styles.statCol,
              i < STAT_COLUMNS.length - 1 && styles.statColBorder,
            ]}
          >
            <View style={styles.statHeader}>
              <View style={[styles.statDot, { backgroundColor: col.color }]} />
              <Text style={styles.statLabel}>{col.label}</Text>
            </View>
            <Text style={styles.statValue}>{col.value}</Text>
            <Text style={styles.statUnit}>{col.unit}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: CARD_PAD,
    alignSelf: 'center',
    overflow: 'hidden',
  },
  ringArea: {
    width: CONTENT_W,
    height: RING_H,
    position: 'relative',
  },
  iconBox: {
    position: 'absolute',
    width: ICON_SIZE,
    height: ICON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  statsRow: {
    height: STATS_H,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  statColBorder: {
    borderRightWidth: 1,
    borderRightColor: 'rgba(255,255,255,0.06)',
  },
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 1,
  },
  statDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statLabel: {
    color: '#FFFFFF',
    fontSize: L_FS,
    fontWeight: '400',
    opacity: 0.65,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: V_FS,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
    lineHeight: V_FS * 1.15,
  },
  statUnit: {
    color: '#FFFFFF',
    fontSize: U_FS,
    fontWeight: '400',
    opacity: 0.45,
  },
});
