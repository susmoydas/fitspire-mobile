import React, { useRef, useEffect } from 'react';
import { View, Animated } from 'react-native';

interface ProgressProps {
  value: number;
  style?: any;
  indicatorColor?: string;
  trackColor?: string;
}

export function Progress({ value, style, indicatorColor = '#6C5CFF', trackColor = '#2C2C2C' }: ProgressProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: Math.min(Math.max(value, 0), 1),
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [value, anim]);

  return (
    <View style={[{ height: 6, backgroundColor: trackColor, borderRadius: 3, overflow: 'hidden' }, style]}>
      <Animated.View
        style={[
          { height: '100%', backgroundColor: indicatorColor, borderRadius: 3 },
          {
            width: anim.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}
