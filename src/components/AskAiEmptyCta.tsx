import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BotMessageSquare } from 'lucide-react-native';
import { colors } from '../theme/tokens';

interface AskAiEmptyCtaProps {
  hint: string;
  label: string;
  onPress: () => void;
}

/** Empty-state CTA that steers users toward the AI chat instead of manual CRUD. */
export default function AskAiEmptyCta({ hint, label, onPress }: AskAiEmptyCtaProps) {
  return (
    <View className="mt-4 items-center">
      <Text className="text-sm text-muted text-center mb-2">{hint}</Text>
      <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center bg-sage px-4 py-2.5 rounded-lg border border-line"
        accessibilityRole="button"
      >
        <BotMessageSquare size={16} color={colors.herb} />
        <Text className="ml-2 text-sm font-medium text-ink">{label}</Text>
      </TouchableOpacity>
    </View>
  );
}
