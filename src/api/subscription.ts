/**
 * Subscription API
 * 
 * NOTE: For native IAP, we no longer use backend for payment processing.
 * This file is kept for potential future receipt validation.
 */

import request from './client';
import { ApiResponse } from '../types';

// Types for future backend receipt validation
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

export interface SubscriptionStatus {
    isPro: boolean;
    expiresAt?: number;
    productId?: string;
}

export const subscriptionApi = {
    /**
     * Validate a receipt with the backend (future enhancement)
     * For MVP, validation is done locally in the app.
     */
    validateReceipt: (data: ReceiptValidationRequest) =>
        request<ReceiptValidationResponse>('subscription/validate-receipt', {
            method: 'POST',
            body: JSON.stringify(data),
        }),

    /**
     * Get user's subscription status from backend
     */
    getStatus: () => request<SubscriptionStatus>('subscription/status'),

    /**
     * Sync purchase with backend (for tracking)
     */
    syncPurchase: (data: { productId: string; transactionId: string; platform: string }) =>
        request<{ success: boolean }>('subscription/sync', {
            method: 'POST',
            body: JSON.stringify(data),
        }),
};
