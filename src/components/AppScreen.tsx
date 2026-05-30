import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../theme/colors';

interface AppScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  horizontalPadding?: boolean;
  bottomPadding?: number;
  style?: ViewStyle;
}

export default function AppScreen({
  children,
  scroll = false,
  horizontalPadding = true,
  bottomPadding = spacing.xxl * 2,
  style,
}: AppScreenProps) {
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: insets.top,
  };

  const contentStyle: ViewStyle = {
    ...(horizontalPadding ? { paddingHorizontal: spacing.lg } : {}),
    paddingBottom: bottomPadding,
  };

  if (scroll) {
    return (
      <View style={[containerStyle, style]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={contentStyle}
        >
          {children}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[containerStyle, horizontalPadding && { paddingHorizontal: spacing.lg }, style]}>
      {children}
    </View>
  );
}
