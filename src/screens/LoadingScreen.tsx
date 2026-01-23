
import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoadingScreen({ fullScreen = true }) {
    const containerClass = fullScreen ? 'flex-1 justify-center items-center bg-gray-50' : 'p-4';

    return (
        <SafeAreaView className={containerClass}>
            <ActivityIndicator size="large" color="#f97316" />
            <Text className="mt-4 text-gray-600">Loading...</Text>
        </SafeAreaView>
    );
}