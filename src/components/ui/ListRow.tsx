import React from 'react';
import { View, Text, TouchableOpacity, type GestureResponderEvent } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '../../theme/tokens';

type ListRowProps = {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  onPress: (event: GestureResponderEvent) => void;
  showChevron?: boolean;
};

export function ListRow({
  title,
  description,
  icon,
  onPress,
  showChevron = true,
}: ListRowProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      className="flex-row items-center justify-between py-4 border-b border-line"
    >
      <View className="flex-row items-center flex-1 pr-3">
        {icon ? <View className="mr-3">{icon}</View> : null}
        <View className="flex-1">
          <Text className="font-medium text-ink text-base">{title}</Text>
          {description ? (
            <Text className="text-sm text-muted mt-0.5">{description}</Text>
          ) : null}
        </View>
      </View>
      {showChevron ? <ChevronRight size={18} color={colors.muted} /> : null}
    </TouchableOpacity>
  );
}
