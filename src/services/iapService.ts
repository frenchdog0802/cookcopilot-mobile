/**
 * IAP Service - Native In-App Purchase Handler
 *
 * Expo Go uses mock products and syncs purchase state with the backend subscription API.
 */

import { useEffect, useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';
import { subscriptionApi } from '../api/subscription';

export const PRODUCT_IDS = {
    ios: ['com.lardermind.pro.monthly', 'com.lardermind.pro.yearly'],
    android: ['pantry_pro_monthly', 'pantry_pro_yearly'],
};

export function getProductIds(): string[] {
    return Platform.select({
        ios: PRODUCT_IDS.ios,
        android: PRODUCT_IDS.android,
        default: [],
    }) as string[];
}

export interface IAPProduct {
    productId: string;
    title: string;
    description: string;
    price: string;
    currency: string;
    localizedPrice: string;
}

export type PurchaseState = 'idle' | 'pending' | 'success' | 'error' | 'cancelled';

const MOCK_PRODUCTS: IAPProduct[] = [
    {
        productId: 'com.lardermind.pro.monthly',
        title: 'Pro Monthly',
        description: 'High-volume AI chat and social recipe imports',
        price: '4.99',
        currency: 'USD',
        localizedPrice: '$4.99',
    },
    {
        productId: 'com.lardermind.pro.yearly',
        title: 'Pro Yearly',
        description: 'Best value — save about 33% vs monthly',
        price: '39.99',
        currency: 'USD',
        localizedPrice: '$39.99',
    },
];

let isConnected = false;

export async function initializeIAP(): Promise<boolean> {
    isConnected = true;
    return true;
}

export async function disconnectIAP(): Promise<void> {
    isConnected = false;
}

export function getSubscriptionPeriodLabel(productId: string): string {
    if (productId.includes('monthly')) return 'month';
    if (productId.includes('yearly')) return 'year';
    return '';
}

export interface UseSubscriptionResult {
    products: IAPProduct[];
    loading: boolean;
    purchasing: boolean;
    restoring: boolean;
    isPro: boolean;
    isTrial: boolean;
    error: string | null;
    fetchProducts: () => Promise<void>;
    purchase: (productId: string) => Promise<boolean>;
    restore: () => Promise<boolean>;
    refreshStatus: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionResult {
    const [products, setProducts] = useState<IAPProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [isPro, setIsPro] = useState(false);
    const [isTrial, setIsTrial] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const applyStatus = useCallback((status: { isPro: boolean; isTrial: boolean }) => {
        setIsPro(status.isPro);
        setIsTrial(status.isTrial);
    }, []);

    const refreshStatus = useCallback(async () => {
        try {
            const status = await subscriptionApi.getStatus();
            applyStatus(status);
        } catch {
            // Keep last known state when offline/unauthenticated.
        }
    }, [applyStatus]);

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 300));
            setProducts(MOCK_PRODUCTS);
            await refreshStatus();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load subscription options');
        } finally {
            setLoading(false);
        }
    }, [refreshStatus]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const purchase = useCallback(async (productId: string): Promise<boolean> => {
        setPurchasing(true);
        setError(null);

        try {
            await new Promise(resolve => setTimeout(resolve, 800));

            if (__DEV__) {
                const result = await subscriptionApi.syncPurchase({
                    productId,
                    transactionId: `expo-stub-${Date.now()}`,
                    platform: Platform.OS,
                });
                applyStatus(result.status);
                Alert.alert('Pro activated', 'Your subscription has been synced to your account.');
                return true;
            }

            Alert.alert(
                'Development build required',
                'In-app purchases need a development or production build. Expo Go uses the stub sync flow in dev only.',
            );
            return false;
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Purchase failed');
            return false;
        } finally {
            setPurchasing(false);
        }
    }, [applyStatus]);

    const restore = useCallback(async (): Promise<boolean> => {
        setRestoring(true);
        setError(null);

        try {
            await refreshStatus();
            Alert.alert(
                isPro ? 'Subscription restored' : 'No active subscription',
                isPro
                    ? 'Your Pro access is active on this account.'
                    : 'No paid subscription was found. New accounts still get a 7-day Pro trial.',
            );
            return isPro;
        } finally {
            setRestoring(false);
        }
    }, [isPro, refreshStatus]);

    return {
        products,
        loading,
        purchasing,
        restoring,
        isPro,
        isTrial,
        error,
        fetchProducts,
        purchase,
        restore,
        refreshStatus,
    };
}

export default {
    initializeIAP,
    disconnectIAP,
    getProductIds,
    getSubscriptionPeriodLabel,
    PRODUCT_IDS,
    useSubscription,
};
