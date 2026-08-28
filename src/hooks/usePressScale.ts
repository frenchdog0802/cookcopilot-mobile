import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const PRESS_SCALE = 0.98;
const DURATION_MS = 100;

/**
 * UI-thread press scale for list rows (Reanimated worklets).
 */
export function usePressScale(scaleTo: number = PRESS_SCALE) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = useCallback(() => {
    scale.value = withTiming(scaleTo, {
      duration: DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
  }, [scale, scaleTo]);

  const onPressOut = useCallback(() => {
    scale.value = withTiming(1, {
      duration: DURATION_MS,
      easing: Easing.out(Easing.quad),
    });
  }, [scale]);

  return { animatedStyle, onPressIn, onPressOut };
}
