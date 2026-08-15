/**
 * Subscription API
 */

import request from './client';

export interface UsageSummary {
    aiMessagesUsed: number;
    aiMessagesLimit: number;
    recipeImportsUsed: number;
    recipeImportsLimit: number;
    recipeCount: number;
    recipeLimit: number;
    imageUploadsUsed: number;
    imageUploadsLimit: number;
}

export interface SubscriptionStatus {
    isPro: boolean;
    isTrial: boolean;
    trialEndsAt?: number;
    expiresAt?: number;
    productId?: string;
    planName?: string;
    usage: UsageSummary;
}

export interface ReceiptValidationRequest {
    platform: 'ios' | 'android';
    receipt: string;
    productId: string;
}

export interface ReceiptValidationResponse {
    valid: boolean;
    expiresAt?: number;
    productId?: string;
}

function unwrap<T>(response: { success: boolean; message?: string; data?: T }): T {
    if (!response.success || response.data === undefined) {
        throw new Error(response.message ?? 'Subscription request failed');
    }
    return response.data;
}

export const subscriptionApi = {
    validateReceipt: (data: ReceiptValidationRequest) =>
        request<ReceiptValidationResponse>('subscription/validate-receipt', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    getStatus: async (): Promise<SubscriptionStatus> => {
        const response = await request<SubscriptionStatus>('subscription/status');
        return unwrap(response);
    },

    syncPurchase: async (data: { productId: string; transactionId: string; platform: string }) => {
        const response = await request<{ success: boolean; status: SubscriptionStatus }>(
            'subscription/sync',
            {
                method: 'POST',
                body: JSON.stringify(data),
            },
        );
        const payload = unwrap(response);
        return payload;
    },
};
