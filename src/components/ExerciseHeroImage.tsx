import React, { useState, useMemo, useCallback } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle, ImageStyle } from 'react-native';
import { Image, ImageContentFit } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, borderRadius } from '../theme/colors';

interface ExerciseHeroImageProps {
  urls: string[];
  name?: string;
  style?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
  contentFit?: ImageContentFit;
  aspectRatio?: number;
  showAnimationBadge?: boolean;
}

const ExerciseHeroImage = React.memo(function ExerciseHeroImage({
  urls,
  name = 'Exercise',
  style,
  imageStyle,
  contentFit = 'contain',
  aspectRatio,
  showAnimationBadge = true,
}: ExerciseHeroImageProps) {
  const uniqueUrls = useMemo(() => urls.filter(Boolean), [urls]);
  const [urlIndex, setUrlIndex] = useState(0);
  const [allFailed, setAllFailed] = useState(false);

  const currentUrl = uniqueUrls[urlIndex];
  const isGif = currentUrl?.toLowerCase().endsWith('.gif');

  const handleError = useCallback(() => {
    if (urlIndex < uniqueUrls.length - 1) {
      setUrlIndex((i) => i + 1);
    } else {
      setAllFailed(true);
    }
  }, [urlIndex, uniqueUrls.length]);

  // Reset when URLs change (e.g. next exercise in workout)
  React.useEffect(() => {
    setUrlIndex(0);
    setAllFailed(false);
  }, [uniqueUrls.join('|')]);

  return (
    <View style={[styles.wrap, aspectRatio ? { aspectRatio } : null, style]}>
      {currentUrl && !allFailed ? (
        <>
          <Image
            source={{ uri: currentUrl }}
            style={[styles.image, imageStyle]}
            contentFit={contentFit}
            cachePolicy="disk"
            transition={200}
            onError={handleError}
          />
          {showAnimationBadge && isGif && (
            <View style={styles.badge}>
              <MaterialIcons name="play-circle-outline" size={12} color="#fff" />
            </View>
          )}
        </>
      ) : (
        <View style={styles.placeholder}>
          <MaterialIcons name="fitness-center" size={48} color={colors.textMuted} />
        </View>
      )}
    </View>
  );
});

export default ExerciseHeroImage;

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    backgroundColor: colors.cardElevated,
    borderRadius: borderRadius.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cardElevated,
  },
  badge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    padding: 4,
  },
});
