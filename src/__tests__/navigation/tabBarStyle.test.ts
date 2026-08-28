import {
  TAB_BAR_BASE_HEIGHT,
  TAB_BAR_MIN_BOTTOM_PADDING,
  buildTabBarStyle,
} from '../../navigation/tabBarStyle';

describe('buildTabBarStyle', () => {
  it('preserves legacy 75px total height when insets.bottom is 0', () => {
    const style = buildTabBarStyle(0);

    expect(style.paddingBottom).toBe(TAB_BAR_MIN_BOTTOM_PADDING);
    expect(style.height).toBe(TAB_BAR_BASE_HEIGHT + TAB_BAR_MIN_BOTTOM_PADDING);
    expect(style.height).toBe(75);
  });

  it('adds gesture-nav inset into height and paddingBottom', () => {
    const gestureInset = 24;
    const style = buildTabBarStyle(gestureInset);

    expect(style.paddingBottom).toBe(gestureInset);
    expect(style.height).toBe(TAB_BAR_BASE_HEIGHT + gestureInset);
  });

  it('adds 3-button nav inset into height and paddingBottom', () => {
    const threeButtonInset = 48;
    const style = buildTabBarStyle(threeButtonInset);

    expect(style.paddingBottom).toBe(threeButtonInset);
    expect(style.height).toBe(TAB_BAR_BASE_HEIGHT + threeButtonInset);
  });

  it('does not use a hardcoded height that ignores insets (regression)', () => {
    const inset = 34;
    const style = buildTabBarStyle(inset);

    // Previous bug: height: 75, paddingBottom: 8 regardless of inset
    expect(style.height).not.toBe(75);
    expect(style.paddingBottom).not.toBe(8);
    expect(style.paddingBottom).toBe(inset);
  });
});
