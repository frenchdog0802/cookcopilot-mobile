import React from 'react';
import { View, Text, TextInput, type TextInputProps } from 'react-native';
import { colors } from '../../theme/tokens';

type TextFieldProps = TextInputProps & {
  label?: string;
  containerClassName?: string;
};

export function TextField({
  label,
  containerClassName = '',
  className = '',
  ...inputProps
}: TextFieldProps) {
  return (
    <View className={containerClassName}>
      {label ? (
        <Text className="text-sm font-medium text-ink mb-1">{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={colors.muted}
        className={`w-full px-4 py-3.5 border border-line rounded-lg bg-surface text-ink ${className}`}
        {...inputProps}
      />
    </View>
  );
}
