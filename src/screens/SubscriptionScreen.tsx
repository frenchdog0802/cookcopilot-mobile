/**
 * SubscriptionScreen - Native IAP Subscription UI
 * 
 * Uses react-native-iap v14 hook-based API for App Store / Play Store purchases.
 */

import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    Platform,
} from 'react-native';
import AppHeader from '../components/AppHeader';
import { useSubscription, getSubscriptionPeriodLabel } from '../services/iapService';

export default function SubscriptionScreen() {
    const {
        products,
        loading,
        purchasing,
        restoring,
        isPro,
        fetchProducts,
        purchase,
        restore,
    } = useSubscription();

    // Fetch products on mount
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Already Pro - show status
    if (isPro) {
        return (
            <View className="flex-1 bg-gray-50">
                <AppHeader title="Subscription" showBackButton />
                <View className="flex-1 items-center justify-center p-6">
                    <Text className="text-4xl mb-4">✨</Text>
                    <Text className="text-2xl font-bold text-gray-800 mb-2">You're a Pro!</Text>
                    <Text className="text-gray-500 text-center">
                        Thank you for subscribing. Enjoy unlimited access to all features.
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <AppHeader title="Upgrade to Pro" showBackButton />

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text className="text-2xl font-bold text-center mb-2 text-gray-800">
                    Unlock Premium Features
                </Text>
                <Text className="text-gray-500 text-center mb-8">
                    Get unlimited AI recipes, advanced analytics, and more.
                </Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#f97316" />
                ) : (
                    <View className="gap-4">
                        {products.map((product) => (
                            <View
                                key={product.productId}
                                className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm"
                            >
                                <View className="flex-row justify-between items-center mb-4">
                                    <Text className="text-xl font-bold text-gray-800">
                                        {product.title}
                                    </Text>
                                    <View className="bg-orange-100 px-3 py-1 rounded-full">
                                        <Text className="text-orange-600 font-bold">
                                            {product.localizedPrice}
                                            /{getSubscriptionPeriodLabel(product.productId)}
                                        </Text>
                                    </View>
                                </View>

                                <View className="mb-6 gap-2">
                                    <FeatureRow text="Unlimited AI Chat" />
                                    <FeatureRow text="Advanced Meal Planning" />
                                    <FeatureRow text="Priority Support" />
                                    {product.productId.includes('yearly') && (
                                        <FeatureRow text="Save 20% vs Monthly" highlight />
                                    )}
                                </View>

                                <TouchableOpacity
                                    onPress={() => purchase(product.productId)}
                                    disabled={purchasing}
                                    className={`py-4 rounded-xl items-center ${purchasing ? 'bg-gray-300' : 'bg-orange-500'
                                        }`}
                                >
                                    {purchasing ? (
                                        <ActivityIndicator color="white" />
                                    ) : (
                                        <Text className="text-white font-bold text-lg">Subscribe Now</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ))}

                        {/* No products available */}
                        {products.length === 0 && !loading && (
                            <View className="items-center py-8">
                                <Text className="text-gray-500">No subscription options available.</Text>
                                <Text className="text-gray-400 text-sm mt-2">
                                    Please check back later or contact support.
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Restore Purchases Button */}
                <TouchableOpacity
                    onPress={restore}
                    disabled={restoring}
                    className="mt-6 py-3 items-center"
                >
                    {restoring ? (
                        <ActivityIndicator color="#f97316" />
                    ) : (
                        <Text className="text-orange-500 font-medium">Restore Purchases</Text>
                    )}
                </TouchableOpacity>

                {/* Legal Links */}
                <View className="mt-4 items-center gap-2">
                    <Text className="text-gray-400 text-xs text-center">
                        Payment will be charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account.
                    </Text>
                    <Text className="text-gray-400 text-xs text-center">
                        Subscription auto-renews unless cancelled 24 hours before the end of the current period.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

function FeatureRow({ text, highlight = false }: { text: string; highlight?: boolean }) {
    return (
        <View className="flex-row items-center gap-2">
            <Text className={highlight ? 'text-orange-500' : 'text-green-500'}>✓</Text>
            <Text className={highlight ? 'text-orange-600 font-medium' : 'text-gray-600'}>{text}</Text>
        </View>
    );
}
