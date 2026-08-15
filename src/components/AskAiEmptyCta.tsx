import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { BotMessageSquare } from 'lucide-react-native';

interface AskAiEmptyCtaProps {
  hint: string;
  label: string;
  onPress: () => void;
}

/** Empty-state CTA that steers users toward the AI chat instead of manual CRUD. */
export default function AskAiEmptyCta({ hint, label, onPress }: AskAiEmptyCtaProps) {
  return (
    <View className="mt-4 items-center">
      <Text className="text-sm text-gray-500 text-center mb-2">{hint}</Text>
      <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center bg-orange-50 px-4 py-2.5 rounded-lg border border-orange-100"
        accessibilityRole="button"
      >
        <BotMessageSquare size={16} color="#ea580c" />
        <Text className="ml-2 text-sm font-medium text-gray-800">{label}</Text>
      </TouchableOpacity>
    </View>
  );
}
