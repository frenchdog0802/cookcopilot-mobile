/**
 * API Client for React Native
 * Uses fetch with AsyncStorage for JWT token management
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse } from '../types';

# Configure your API base URL (Railway backend URL in production)
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/';

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    // Get stored JWT token
    let token = '';
    try {
        const stored = await AsyncStorage.getItem('jwt');
        console.log(stored);
        if (stored) {
            token = JSON.parse(stored);
        }
    } catch {
        // Token parsing failed, continue without token
    }

    const headers = new Headers(options.headers);
    if (options.body !== undefined && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    try {
        const res = await fetch(`${BASE_URL}${path}`, {
            headers,
            ...options,
        });

        const responseBody: ApiResponse<T> = await res.json();
        return responseBody;
    } catch (error) {
        console.error(`API ${options.method ?? 'GET'} ${path} failed:`, error);
        return {
            success: false,
            message: 'Network error occurred',
        };
    }
}

export default request;

export const api = {
    get: <T>(path: string) => request<T>(path),
    post: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: 'POST', body: JSON.stringify(body ?? {}) }),
    put: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: 'PUT', body: JSON.stringify(body ?? {}) }),
    patch: <T>(path: string, body?: unknown) =>
        request<T>(path, { method: 'PATCH', body: JSON.stringify(body ?? {}) }),
    delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
