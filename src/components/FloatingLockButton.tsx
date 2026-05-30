import React, { useRef, useCallback } from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../theme/colors';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_SIZE = 56;
const EDGE_MARGIN = 16;

interface FloatingLockButtonProps {
  locked: boolean;
  onToggle: () => void;
}

export default function FloatingLockButton({ locked, onToggle }: FloatingLockButtonProps) {
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_WIDTH - BUTTON_SIZE - EDGE_MARGIN, y: SCREEN_HEIGHT * 0.3 })).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, gesture) => {
        const x = Math.min(
          Math.max(gesture.moveX - BUTTON_SIZE / 2, EDGE_MARGIN),
          SCREEN_WIDTH - BUTTON_SIZE - EDGE_MARGIN
        );
        const y = Math.min(
          Math.max(gesture.moveY - BUTTON_SIZE / 2, EDGE_MARGIN + 60),
          SCREEN_HEIGHT * 0.65
        );
        Animated.spring(pan, {
          toValue: { x, y },
          useNativeDriver: false,
          friction: 7,
        }).start();
      },
    })
  ).current;

  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.88, useNativeDriver: true }).start();
    longPressTimer.current = setTimeout(() => {
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        onToggle();
        rotateAnim.setValue(0);
      });
    }, 500);
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    rotateAnim.setValue(0);
  };

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scaleAnim },
            { rotate: rotation },
          ],
        },
        locked && styles.containerLocked,
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableOpacity
        style={[styles.button, locked && styles.buttonLocked]}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
      >
        <MaterialIcons
          name={locked ? 'lock' : 'lock-open'}
          size={22}
          color={locked ? colors.text : colors.text}
        />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  containerLocked: {
    backgroundColor: colors.primary,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonLocked: {},
});
