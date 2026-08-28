import type { ViewStyle } from 'react-native';

import { colors as themeColors } from '../theme/tokens';

/** Content area above bottom padding (legacy height 75 − legacy paddingBottom 8). */
export const TAB_BAR_BASE_HEIGHT = 67;

/** Minimum bottom padding when system inset is 0 (matches previous visual spacing). */
export const TAB_BAR_MIN_BOTTOM_PADDING = 8;

type TabBarColors = Pick<typeof themeColors, 'linen' | 'line'>;

/**
 * Builds bottom-tab styles that clear Android gesture / 3-button system nav.
 * Must include insets.bottom in both height and paddingBottom — a fixed height
 * overrides React Navigation's default inset-aware height calculation.
 */
export function buildTabBarStyle(
  insetsBottom: number,
  palette: TabBarColors = themeColors,
): ViewStyle {
  const paddingBottom = Math.max(insetsBottom, TAB_BAR_MIN_BOTTOM_PADDING);

  return {
    backgroundColor: palette.linen,
    borderTopWidth: 1,
    borderTopColor: palette.line,
    paddingTop: 8,
    paddingBottom,
    height: TAB_BAR_BASE_HEIGHT + paddingBottom,
  };
}
