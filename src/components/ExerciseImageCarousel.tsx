import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { colors, spacing, borderRadius } from '../theme/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CAROUSEL_HEIGHT = 380;
const SIDE_PADDING = spacing.lg;
const IMAGE_WIDTH = SCREEN_WIDTH - SIDE_PADDING * 2;

interface CarouselItem {
  uri: string;
  label?: string;
}

interface ExerciseImageCarouselProps {
  images: CarouselItem[];
  fallbackName?: string;
}

export default function ExerciseImageCarousel({
  images,
  fallbackName,
}: ExerciseImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [failedMap, setFailedMap] = useState<Record<number, boolean>>({});
  const flatListRef = useRef<FlatList>(null);
  const fallbackText = fallbackName || 'Exercise';

  const items = images.length > 0
    ? images
    : [{ uri: '', label: undefined }];

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / IMAGE_WIDTH);
    setActiveIndex(idx);
  };

  const handleImageError = (index: number) => {
    setFailedMap((prev) => ({ ...prev, [index]: true }));
  };

  const renderItem = ({ item, index }: { item: CarouselItem; index: number }) => {
    const hasFailed = failedMap[index];

    return (
      <View style={[styles.slide, { width: IMAGE_WIDTH }]}>
        <View style={styles.imageWrap}>
          {item.uri && !hasFailed ? (
            <Image
              source={{ uri: item.uri }}
              style={styles.image}
              contentFit="contain"
              onError={() => handleImageError(index)}
            />
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>{fallbackText}</Text>
            </View>
          )}
          {item.label && (
            <View style={styles.labelBadge}>
              <Text style={styles.labelText}>{item.label}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={items}
        keyExtractor={(_, i) => String(i)}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        bounces={false}
      />
      {items.length > 1 && (
        <View style={styles.dotsRow}>
          {items.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.bigCard,
    overflow: 'hidden',
    backgroundColor: colors.bgSecondary,
    marginBottom: spacing.lg,
  },
  slide: {
    height: CAROUSEL_HEIGHT,
    justifyContent: 'center',
  },
  imageWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: borderRadius.bigCard,
    overflow: 'hidden',
    backgroundColor: '#0A0A0A',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.cardElevated,
  },
  placeholderText: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  labelBadge: {
    position: 'absolute',
    bottom: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  labelText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.cardElevated,
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
