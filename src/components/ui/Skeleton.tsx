import React from 'react';
import { View } from 'react-native';
import { colors } from '../../theme/tokens';

type SkeletonProps = {
  width?: number | `${number}%` | '100%';
  height?: number;
  className?: string;
  rounded?: boolean;
};

export function Skeleton({
  width = '100%',
  height = 16,
  className = '',
  rounded = true,
}: SkeletonProps) {
  return (
    <View
      className={className}
      style={{
        width,
        height,
        backgroundColor: colors.sage,
        borderRadius: rounded ? 8 : 0,
        opacity: 0.7,
      }}
    />
  );
}

export function SkeletonListRow({ lines = 2 }: { lines?: 1 | 2 }) {
  return (
    <View className="flex-row items-center p-3 bg-surface rounded-xl mb-2 border border-line">
      <Skeleton width={24} height={24} className="mr-3" />
      <View className="flex-1">
        <Skeleton height={14} width="70%" />
        {lines === 2 ? <Skeleton height={12} width="40%" className="mt-2" /> : null}
      </View>
      <Skeleton width={72} height={28} className="ml-2" />
    </View>
  );
}

export function SkeletonList({ count = 6 }: { count?: number }) {
  return (
    <View className="p-3">
      {Array.from({ length: count }, (_, index) => (
        <SkeletonListRow key={index} />
      ))}
    </View>
  );
}

export function SkeletonHero({ height = 280 }: { height?: number }) {
  return (
    <View className="w-full overflow-hidden" style={{ height }}>
      <Skeleton width="100%" height={height} rounded={false} />
    </View>
  );
}
