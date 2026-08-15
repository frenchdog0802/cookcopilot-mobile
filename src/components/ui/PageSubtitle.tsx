import React from 'react';
import { Text, type TextProps } from 'react-native';

type PageSubtitleProps = TextProps & {
  children: React.ReactNode;
};

export function PageSubtitle({ children, className = '', ...rest }: PageSubtitleProps) {
  return (
    <Text className={`text-muted text-sm ${className}`} {...rest}>
      {children}
    </Text>
  );
}
