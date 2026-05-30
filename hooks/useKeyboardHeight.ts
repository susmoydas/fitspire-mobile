import { useState, useEffect, useRef } from 'react';
import {
  Keyboard,
  Platform,
  Dimensions,
  KeyboardEvent,
  EmitterSubscription,
} from 'react-native';

interface UseKeyboardHeightReturn {
  keyboardHeight: number;
  isKeyboardVisible: boolean;
  keyboardAnimationDuration: number;
}

export const useKeyboardHeight = (): UseKeyboardHeightReturn => {
  const [keyboardHeight, setKeyboardHeight] = useState<number>(0);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState<boolean>(false);
  const [keyboardAnimationDuration, setKeyboardAnimationDuration] =
    useState<number>(0);

  const previousHeightRef = useRef<number>(0);

  useEffect(() => {
    let showSubscription: EmitterSubscription;
    let hideSubscription: EmitterSubscription;

    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const handleKeyboardShow = (event: KeyboardEvent) => {
      const { height } = event.endCoordinates;
      const duration = event.duration;

      if (height && height > 0) {
        setKeyboardHeight(height);
        setIsKeyboardVisible(true);
        setKeyboardAnimationDuration(duration || 250);
        previousHeightRef.current = height;
      }
    };

    const handleKeyboardHide = (event: KeyboardEvent) => {
      setKeyboardHeight(0);
      setIsKeyboardVisible(false);

      const duration = event.duration || (Platform.OS === 'ios' ? 250 : 200);
      setKeyboardAnimationDuration(duration);
    };

    showSubscription = Keyboard.addListener(showEvent, handleKeyboardShow);
    hideSubscription = Keyboard.addListener(hideEvent, handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  useEffect(() => {
    let dimensionSubscription: EmitterSubscription;

    const handleDimensionChange = () => {
      if (isKeyboardVisible && previousHeightRef.current > 0) {
        const screenHeight = Dimensions.get('window').height;
        const screenWidth = Dimensions.get('window').width;

        if (screenWidth > screenHeight && Platform.OS === 'ios') {
          const estimatedLandscapeHeight = Math.min(
            previousHeightRef.current,
            screenHeight * 0.4
          );
          setKeyboardHeight(estimatedLandscapeHeight);
        }
      }
    };

    dimensionSubscription = Dimensions.addEventListener(
      'change',
      handleDimensionChange
    );

    return () => {
      dimensionSubscription?.remove();
    };
  }, [isKeyboardVisible]);

  return {
    keyboardHeight,
    isKeyboardVisible,
    keyboardAnimationDuration,
  };
};
