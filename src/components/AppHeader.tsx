import React from 'react';
import { View, Text, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/tokens';

interface AppHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  onRightPress?: () => void;
  /** @deprecated Prefer quiet linen chrome; kept for call-site compatibility */
  variant?: 'quiet' | 'surface' | 'primary' | 'white';
}

export default function AppHeader({
  title,
  showBackButton = false,
  onBack,
  rightElement,
  onRightPress,
  variant = 'quiet',
}: AppHeaderProps) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigation.goBack();
    }
  };

  const bgClass = variant === 'surface' ? 'bg-surface' : 'bg-linen';

  return (
    <View
      className={bgClass}
      style={{
        paddingTop:
          Platform.OS === 'android' ? (StatusBar.currentHeight || 0) + 12 : insets.top + 12,
      }}
    >
      <View className="flex-row items-center justify-between px-4 pb-3 border-b border-line">
        {showBackButton ? (
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 items-center justify-center rounded-full"
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color={colors.ink} />
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}

        <Text
          className="font-display text-xl font-semibold text-ink flex-1 text-center"
          numberOfLines={1}
        >
          {title}
        </Text>

        {rightElement ? (
          <TouchableOpacity
            onPress={onRightPress}
            className="w-10 h-10 items-center justify-center rounded-full"
            activeOpacity={0.7}
          >
            {rightElement}
          </TouchableOpacity>
        ) : (
          <View className="w-10" />
        )}
      </View>
    </View>
  );
}
