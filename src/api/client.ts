/**
 * API Client for React Native
 * Uses fetch with AsyncStorage for JWT token management
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiResponse } from '../types';

/**
 * Configure your API base URL.
 * For Android APK testing, set EXPO_PUBLIC_API_BASE_URL to a public HTTPS backend.
 * See .env.example — do not leave localhost for real devices.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/';
console.log('[api] BASE_URL =', BASE_URL);

async function request<T>(path: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    let token = '';
    try {
        const stored = await AsyncStorage.getItem('jwt');
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
    if (!headers.has('Accept')) {
        // Without this, RN/Android may send Accept: text/html and Spring returns
        // Whitelabel HTML error pages that break res.json().
        headers.set('Accept', 'application/json');
    }
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const url = `${BASE_URL}${path.replace(/^\//, '')}`;
    console.log(`[api] ${options.method ?? 'GET'} ${url}`);

    try {
        const res = await fetch(url, {
            ...options,
            headers,
        });

        const raw = await res.text();
        let responseBody: ApiResponse<T>;
        try {
            responseBody = raw ? (JSON.parse(raw) as ApiResponse<T>) : { success: false, message: `Empty response (${res.status})` };
        } catch {
            console.error(`API ${options.method ?? 'GET'} ${path} non-JSON (${res.status}):`, raw.slice(0, 200));
            return {
                success: false,
                message: `Unexpected response (${res.status})`,
                statusCode: res.status,
            };
        }
        if (responseBody.statusCode == null) {
            responseBody.statusCode = res.status;
        }
        console.log(`[api] ${options.method ?? 'GET'} ${path} ->`, responseBody?.success, responseBody?.message);
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
