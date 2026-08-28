import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  type GestureResponderEvent,
} from 'react-native';
import { colors } from '../../theme/tokens';

type PrimaryButtonProps = {
  label: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  className?: string;
  testID?: string;
};

export function PrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
  icon,
  className = '',
  testID,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      className={`w-full flex-row items-center justify-center py-4 px-6 rounded-lg bg-herb ${className}`}
      style={{ opacity: isDisabled ? 0.7 : 1 }}
    >
      {loading ? (
        <ActivityIndicator color={colors.onHerb} />
      ) : (
        <>
          {icon}
          <Text className={`text-white text-center font-semibold text-lg ${icon ? 'ml-2' : ''}`}>
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}
