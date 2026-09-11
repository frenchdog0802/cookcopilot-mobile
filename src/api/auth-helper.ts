/**
 * Authentication helper utilities for React Native
 * JWT is stored in expo-secure-store (with one-time AsyncStorage migration).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const JWT_KEY = 'jwt';

async function migrateJwtFromAsyncStorage(): Promise<string | null> {
    try {
        const legacy = await AsyncStorage.getItem(JWT_KEY);
        if (!legacy) return null;
        const token = JSON.parse(legacy) as string;
        if (typeof token === 'string' && token.length > 0) {
            await SecureStore.setItemAsync(JWT_KEY, token);
        }
        await AsyncStorage.removeItem(JWT_KEY);
        return typeof token === 'string' ? token : null;
    } catch {
        try {
            await AsyncStorage.removeItem(JWT_KEY);
        } catch {
            // ignore
        }
        return null;
    }
}

export function isJwtExpired(token: string, nowSeconds: number = Math.floor(Date.now() / 1000)): boolean {
    try {
        const parts = token.split('.');
        if (parts.length < 2) return true;
        const payloadJson = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const padded = payloadJson + '='.repeat((4 - (payloadJson.length % 4)) % 4);
        // atob is available in RN / Hermes for base64
        const json = typeof atob === 'function'
            ? atob(padded)
            : Buffer.from(padded, 'base64').toString('utf8');
        const payload = JSON.parse(json) as { exp?: number };
        if (typeof payload.exp !== 'number') return false;
        return payload.exp <= nowSeconds;
    } catch {
        return true;
    }
}

export const authHelper = {
    authenticate: async (jwt: string): Promise<void> => {
        try {
            await SecureStore.setItemAsync(JWT_KEY, jwt);
            await AsyncStorage.removeItem(JWT_KEY);
        } catch (error) {
            console.error('Failed to store JWT:', error);
        }
    },

    getJWT: async (): Promise<string | null> => {
        try {
            const secure = await SecureStore.getItemAsync(JWT_KEY);
            if (secure) return secure;
            return await migrateJwtFromAsyncStorage();
        } catch (error) {
            console.error('Failed to get JWT:', error);
            return null;
        }
    },

    clearJWT: async (): Promise<void> => {
        try {
            await SecureStore.deleteItemAsync(JWT_KEY);
        } catch {
            // ignore missing key
        }
        try {
            await AsyncStorage.removeItem(JWT_KEY);
        } catch (error) {
            console.error('Failed to clear JWT:', error);
        }
    },

    isAuthenticated: async (): Promise<boolean> => {
        const token = await authHelper.getJWT();
        return !!token && !isJwtExpired(token);
    },
};
