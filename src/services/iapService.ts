/**
 * IAP Service - Native In-App Purchase Handler
 * 
 * ============================================================================
 * TODO: [EXPO GO STUB] - This file has been stubbed for Expo Go compatibility.
 * When switching to a development build or production, uncomment the 
 * react-native-iap imports and restore the real implementation below.
 * ============================================================================
 */

import { useEffect, useState, useCallback } from 'react';
import { Platform, Alert } from 'react-native';

// TODO: [EXPO GO STUB] Uncomment these imports for real IAP functionality
// import {
//     useIAP,
//     initConnection,
//     endConnection,
//     fetchProducts as fetchProductsRaw,
//     type Product,
//     type Purchase,
// } from 'react-native-iap';

// ============================================================================
// PRODUCT IDS - Must match App Store Connect / Play Console
// ============================================================================
export const PRODUCT_IDS = {
    ios: ['com.pantry.pro.monthly', 'com.pantry.pro.yearly'],
    android: ['pantry_pro_monthly', 'pantry_pro_yearly'],
};

export function getProductIds(): string[] {
    return Platform.select({
        ios: PRODUCT_IDS.ios,
        android: PRODUCT_IDS.android,
        default: [],
    }) as string[];
}

// ============================================================================
// TYPES
// ============================================================================
export interface IAPProduct {
    productId: string;
    title: string;
    description: string;
    price: string;
    currency: string;
    localizedPrice: string;
}

export type PurchaseState = 'idle' | 'pending' | 'success' | 'error' | 'cancelled';

// ============================================================================
// MOCK DATA FOR EXPO GO
// ============================================================================
const MOCK_PRODUCTS: IAPProduct[] = [
    {
        productId: 'com.pantry.pro.monthly',
        title: 'Pro Monthly',
        description: 'Unlock all premium features with monthly billing',
        price: '4.99',
        currency: 'USD',
        localizedPrice: '$4.99',
    },
    {
        productId: 'com.pantry.pro.yearly',
        title: 'Pro Yearly',
        description: 'Unlock all premium features with yearly billing (save 20%)',
        price: '39.99',
        currency: 'USD',
        localizedPrice: '$39.99',
    },
];

// ============================================================================
// CONNECTION HELPERS (STUBBED FOR EXPO GO)
// ============================================================================
let isConnected = false;

// TODO: [EXPO GO STUB] Replace with real initConnection() call
export async function initializeIAP(): Promise<boolean> {
    console.log('[IAP STUB] initializeIAP called - returning mock success');
    isConnected = true;
    return true;
}

// TODO: [EXPO GO STUB] Replace with real endConnection() call
export async function disconnectIAP(): Promise<void> {
    console.log('[IAP STUB] disconnectIAP called');
    isConnected = false;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get subscription period label from product ID
 */
export function getSubscriptionPeriodLabel(productId: string): string {
    if (productId.includes('monthly')) return 'month';
    if (productId.includes('yearly')) return 'year';
    return '';
}

// ============================================================================
// CUSTOM HOOK FOR SUBSCRIPTIONS (STUBBED FOR EXPO GO)
// ============================================================================

export interface UseSubscriptionResult {
    products: IAPProduct[];
    loading: boolean;
    purchasing: boolean;
    restoring: boolean;
    isPro: boolean;
    error: string | null;
    fetchProducts: () => Promise<void>;
    purchase: (productId: string) => Promise<boolean>;
    restore: () => Promise<boolean>;
}

/**
 * TODO: [EXPO GO STUB] This is a mock implementation for Expo Go.
 * Replace with the real useSubscription hook that uses useIAP from react-native-iap.
 * 
 * Mock behavior:
 * - Returns fake product data
 * - Logs stub messages on purchase/restore
 * - Always returns isPro: false
 */
export function useSubscription(): UseSubscriptionResult {
    const [products, setProducts] = useState<IAPProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [purchasing, setPurchasing] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const [isPro, setIsPro] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // TODO: [EXPO GO STUB] Replace with real product fetch from App Store / Play Store
    const fetchProducts = useCallback(async () => {
        console.log('[IAP STUB] fetchProducts called - returning mock products');
        setLoading(true);
        setError(null);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        setProducts(MOCK_PRODUCTS);
        setLoading(false);
    }, []);

    // Auto-fetch products on mount
    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // TODO: [EXPO GO STUB] Replace with real purchase flow using requestPurchase()
    const purchase = useCallback(async (productId: string): Promise<boolean> => {
        console.log(`[IAP STUB] purchase called for: ${productId} - simulating purchase flow`);
        setPurchasing(true);
        setError(null);
        
        // Simulate purchase delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        Alert.alert(
            'Expo Go Stub',
            'In-app purchases are not available in Expo Go. Use a development build to test real purchases.',
            [{ text: 'OK' }]
        );
        
        setPurchasing(false);
        return false;
    }, []);

    // TODO: [EXPO GO STUB] Replace with real restore flow using restorePurchases()
    const restore = useCallback(async (): Promise<boolean> => {
        console.log('[IAP STUB] restore called - simulating restore flow');
        setRestoring(true);
        setError(null);
        
        // Simulate restore delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        Alert.alert(
            'Expo Go Stub',
            'Purchase restoration is not available in Expo Go. Use a development build to test real restore.',
            [{ text: 'OK' }]
        );
        
        setRestoring(false);
        return false;
    }, []);

    return {
        products,
        loading,
        purchasing,
        restoring,
        isPro,
        error,
        fetchProducts,
        purchase,
        restore,
    };
}

// ============================================================================
// EXPORTS
// ============================================================================
export default {
    initializeIAP,
    disconnectIAP,
    getProductIds,
    getSubscriptionPeriodLabel,
    PRODUCT_IDS,
    useSubscription,
};
