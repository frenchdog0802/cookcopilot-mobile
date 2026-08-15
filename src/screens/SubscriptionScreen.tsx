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
import { colors } from '../theme/tokens';

export default function SubscriptionScreen() {
    const {
        products,
        loading,
        purchasing,
        restoring,
        isPro,
        isTrial,
        fetchProducts,
        purchase,
        restore,
    } = useSubscription();

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    if (isPro) {
        return (
            <View className="flex-1 bg-linen">
                <AppHeader title="Subscription" showBackButton />
                <View className="flex-1 items-center justify-center p-6">
                    <Text className="text-4xl mb-4">✨</Text>
                    <Text className="text-2xl font-bold text-ink mb-2">
                        {isTrial ? "You're on Pro trial" : "You're a Pro member"}
                    </Text>
                    <Text className="text-muted text-center">
                        {isTrial
                            ? 'Enjoy full Pro limits during your 7-day trial, including high-volume AI and social imports.'
                            : 'Thank you for subscribing. Enjoy high-volume AI chat and social recipe imports.'}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-linen">
            <AppHeader title="Upgrade to Pro" showBackButton />

            <ScrollView contentContainerStyle={{ padding: 16 }}>
                <Text className="text-2xl font-bold text-center mb-2 text-ink">
                    Unlock Pro
                </Text>
                <Text className="text-muted text-center mb-8">
                    High-volume AI assistant plus YouTube and Instagram recipe imports.
                </Text>

                {loading ? (
                    <ActivityIndicator size="large" color={colors.herb} />
                ) : (
                    <View className="gap-4">
                        {products.map((product) => (
                            <View
                                key={product.productId}
                                className="bg-surface p-6 rounded-2xl border border-line"
                            >
                                <View className="flex-row justify-between items-center mb-4">
                                    <Text className="text-xl font-bold text-ink">
                                        {product.title}
                                    </Text>
                                    <View className="bg-sage px-3 py-1 rounded-full">
                                        <Text className="text-herb-deep font-bold">
                                            {product.localizedPrice}
                                            /{getSubscriptionPeriodLabel(product.productId)}
                                        </Text>
                                    </View>
                                </View>

                                <View className="mb-6 gap-2">
                                    <FeatureRow text="200 AI messages per day" />
                                    <FeatureRow text="50 URL / YouTube / Instagram imports per month" />
                                    <FeatureRow text="Unlimited recipes and image uploads" />
                                    {product.productId.includes('yearly') && (
                                        <FeatureRow text="Save ~33% vs monthly" highlight />
                                    )}
                                </View>

                                <TouchableOpacity
                                    onPress={() => purchase(product.productId)}
                                    disabled={purchasing}
                                    className={`py-4 rounded-xl items-center ${purchasing ? 'bg-sage' : 'bg-herb'
                                        }`}
                                >
                                    {purchasing ? (
                                        <ActivityIndicator color={colors.onHerb} />
                                    ) : (
                                        <Text className="text-white font-bold text-lg">Subscribe Now</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ))}

                        {products.length === 0 && !loading && (
                            <View className="items-center py-8">
                                <Text className="text-muted">No subscription options available.</Text>
                                <Text className="text-muted text-sm mt-2">
                                    Please check back later or contact support.
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                <TouchableOpacity
                    onPress={restore}
                    disabled={restoring}
                    className="mt-6 py-3 items-center"
                >
                    {restoring ? (
                        <ActivityIndicator color={colors.herb} />
                    ) : (
                        <Text className="text-herb font-medium">Restore Purchases</Text>
                    )}
                </TouchableOpacity>

                <View className="mt-4 items-center gap-2">
                    <Text className="text-muted text-xs text-center">
                        Payment will be charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account.
                    </Text>
                    <Text className="text-muted text-xs text-center">
                        New accounts include a 7-day Pro trial. Subscription auto-renews unless cancelled 24 hours before the end of the current period.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}

function FeatureRow({ text, highlight = false }: { text: string; highlight?: boolean }) {
    return (
        <View className="flex-row items-center gap-2">
            <Text className={highlight ? 'text-herb' : 'text-herb'}>✓</Text>
            <Text className={highlight ? 'text-herb-deep font-medium' : 'text-muted'}>{text}</Text>
        </View>
    );
}
