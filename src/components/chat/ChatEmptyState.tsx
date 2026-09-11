import React from 'react';
import { View, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/authContext';
import { usePantry } from '../../contexts/pantryContext';
import { greetingPeriodNow } from '../../utils/chatGreeting';

interface ChatEmptyStateProps {
  /** Override clock for tests */
  now?: Date;
}

export default function ChatEmptyState({ now }: ChatEmptyStateProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { pantryItems, shoppingList } = usePantry();

  const period = greetingPeriodNow(now);
  const greetingKey =
    period === 'morning'
      ? 'ai.greetingMorning'
      : period === 'afternoon'
        ? 'ai.greetingAfternoon'
        : 'ai.greetingEvening';

  const displayName = user?.first_name || user?.name || '';
  const periodGreeting = t(greetingKey);
  const headline = displayName
    ? t('home.welcomeBack', { name: displayName })
    : periodGreeting;

  const pantryCount = Array.isArray(pantryItems) ? pantryItems.length : 0;
  const buyCount = (Array.isArray(shoppingList) ? shoppingList : []).filter(
    (item) => !item.checked,
  ).length;

  return (
    <View className="flex-1 items-center justify-center px-8 py-6" testID="chat-empty-state">
      <Text className="font-display text-2xl font-semibold text-ink text-center mb-2">
        {headline}
      </Text>
      {displayName ? (
        <Text className="font-display text-lg text-ink text-center mb-3">{periodGreeting}</Text>
      ) : null}
      <Text className="text-muted text-center text-base mb-6">{t('ai.welcome')}</Text>
      <View className="items-center gap-1">
        <Text className="text-sm text-muted">{t('home.pantryCount', { count: pantryCount })}</Text>
        <Text className="text-sm text-muted">{t('home.buyCount', { count: buyCount })}</Text>
      </View>
    </View>
  );
}
