import React from 'react';
import { ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors } from '../theme/tokens';

export default function LoadingScreen({ fullScreen = true }: { fullScreen?: boolean }) {
  const { t } = useTranslation();
  const containerClass = fullScreen
    ? 'flex-1 justify-center items-center bg-linen'
    : 'p-4';

  return (
    <SafeAreaView className={containerClass}>
      <ActivityIndicator size="large" color={colors.herb} />
      <Text className="mt-4 text-muted font-sans">{t('common.loading', { defaultValue: 'Loading...' })}</Text>
    </SafeAreaView>
  );
}
