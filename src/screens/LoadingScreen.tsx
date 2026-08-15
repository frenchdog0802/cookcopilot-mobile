import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/tokens';

export default function LoadingScreen({ fullScreen = true }: { fullScreen?: boolean }) {
  const containerClass = fullScreen
    ? 'flex-1 justify-center items-center bg-linen'
    : 'p-4';

  return (
    <SafeAreaView className={containerClass}>
      <ActivityIndicator size="large" color={colors.herb} />
      <Text className="mt-4 text-muted font-sans">Loading...</Text>
    </SafeAreaView>
  );
}
