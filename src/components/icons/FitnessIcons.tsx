import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
}

export function GoogleFitIcon({ size = 28, color = '#4285F4' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="11" fill={color} opacity="0.15" />
      <Path
        d="M7 13.5l2.5-3 2 2.5 2.5-4 3 4.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <Circle cx="7" cy="13.5" r="1.2" fill={color} />
      <Circle cx="16.5" cy="13.5" r="1.2" fill={color} />
    </Svg>
  );
}

export function AppleHealthIcon({ size = 28, color = '#FF2D55' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="2" y="4" width="20" height="16" rx="4" fill={color} opacity="0.15" />
      <Path
        d="M12 18c-3-2.5-6-5.2-6-8a4 4 0 017-2.5A4 4 0 0118 10c0 2.8-3 5.5-6 8z"
        fill={color}
      />
    </Svg>
  );
}

export function HealthConnectIcon({ size = 28, color = '#1A73E8' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5l8 4v5c0 4.5-3.5 8.7-8 10-4.5-1.3-8-5.5-8-10v-5l8-4z"
        fill={color}
        opacity="0.15"
        stroke={color}
        strokeWidth="1.2"
      />
      <Path
        d="M9.5 12.5l1.5 1.5 3.5-3.5"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </Svg>
  );
}

export function FitbitIcon({ size = 28, color = '#00B0B9' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <G fill={color}>
        <Circle cx="12" cy="4" r="2" />
        <Circle cx="12" cy="9.5" r="2" />
        <Circle cx="12" cy="15" r="2" />
        <Circle cx="12" cy="20.5" r="2" />
        <Circle cx="5.5" cy="7" r="1.5" />
        <Circle cx="5.5" cy="12.5" r="1.5" />
        <Circle cx="5.5" cy="18" r="1.5" />
        <Circle cx="18.5" cy="7" r="1.5" />
        <Circle cx="18.5" cy="12.5" r="1.5" />
        <Circle cx="18.5" cy="18" r="1.5" />
      </G>
    </Svg>
  );
}

export function SamsungHealthIcon({ size = 28, color = '#4A90D9' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="12" r="11" fill={color} opacity="0.15" />
      <Path
        d="M12 7c-1.5 0-3 1-3 3s1.5 3 3 3 3-1 3-3-1.5-3-3-3z"
        stroke={color}
        strokeWidth="1.4"
        fill="none"
      />
      <Path
        d="M8 18c0-2 1.8-4 4-4s4 2 4 4"
        stroke={color}
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M18 14l-2 2 2 2"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
      />
      <Path
        d="M6 14l2 2-2 2"
        stroke={color}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        opacity="0.5"
      />
    </Svg>
  );
}

export const FITNESS_ICONS: Record<string, React.ComponentType<IconProps>> = {
  google_fit: GoogleFitIcon,
  apple_health: AppleHealthIcon,
  health_connect: HealthConnectIcon,
  fitbit: FitbitIcon,
  samsung_health: SamsungHealthIcon,
};
