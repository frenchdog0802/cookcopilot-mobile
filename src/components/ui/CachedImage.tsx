import React from 'react';
import { View, type StyleProp, type ImageStyle } from 'react-native';
import { Image, type ImageContentFit } from 'expo-image';
import { colors } from '../../theme/tokens';

export type CachedImageProps = {
  uri?: string | null;
  style?: StyleProp<ImageStyle>;
  className?: string;
  contentFit?: ImageContentFit;
  recyclingKey?: string;
  accessibilityLabel?: string;
  placeholderColor?: string;
};

export function CachedImage({
  uri,
  style,
  className,
  contentFit = 'cover',
  recyclingKey,
  accessibilityLabel,
  placeholderColor = colors.linen,
}: CachedImageProps) {
  if (!uri) {
    return (
      <View
        className={className}
        style={[{ backgroundColor: placeholderColor }, style as object]}
        accessibilityLabel={accessibilityLabel}
      />
    );
  }

  return (
    <Image
      source={{ uri }}
      style={[{ backgroundColor: placeholderColor }, style]}
      className={className}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      recyclingKey={recyclingKey ?? uri}
      accessibilityLabel={accessibilityLabel}
      transition={200}
    />
  );
}
