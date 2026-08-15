import React from 'react';
import { Text, type TextProps } from 'react-native';

type PageTitleProps = TextProps & {
  children: React.ReactNode;
};

export function PageTitle({ children, className = '', ...rest }: PageTitleProps) {
  return (
    <Text className={`font-display text-2xl font-semibold text-ink ${className}`} {...rest}>
      {children}
    </Text>
  );
}
