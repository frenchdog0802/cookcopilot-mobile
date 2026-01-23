import React from 'react';
import { View, Text, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

interface AppHeaderProps {
    title: string;
    showBackButton?: boolean;
    onBack?: () => void;
    rightElement?: React.ReactNode;
    onRightPress?: () => void;
    variant?: 'primary' | 'white';
}

export default function AppHeader({
    title,
    showBackButton = false,
    onBack,
    rightElement,
    onRightPress,
    variant = 'primary',
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

    // Color schemes
    const isPrimary = variant === 'primary';
    const bgColor = isPrimary ? 'bg-orange-500' : 'bg-white';
    const textColor = isPrimary ? 'text-white' : 'text-gray-800';
    const iconColor = isPrimary ? '#ffffff' : '#1f2937';

    return (
        <View
            className={`${bgColor}`}
            style={{
                paddingTop: Platform.OS === 'android'
                    ? (StatusBar.currentHeight || 0) + 12
                    : insets.top + 12,
            }}
        >
            <View className="flex-row items-center justify-between px-4 pb-4">
                {/* Left - Back Button */}
                {showBackButton ? (
                    <TouchableOpacity
                        onPress={handleBack}
                        className="w-10 h-10 items-center justify-center rounded-full"
                        activeOpacity={0.7}
                    >
                        <ArrowLeft size={24} color={iconColor} />
                    </TouchableOpacity>
                ) : (
                    <View className="w-10" />
                )}

                {/* Center - Title */}
                <Text
                    className={`text-xl font-bold ${textColor} flex-1 text-center`}
                    numberOfLines={1}
                >
                    {title}
                </Text>

                {/* Right - Action */}
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
