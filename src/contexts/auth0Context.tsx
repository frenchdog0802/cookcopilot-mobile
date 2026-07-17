/**
 * Auth0 Context Provider
 *
 * This module wraps the react-native-auth0 SDK and provides a clean interface
 * for authentication throughout the app. It handles:
 * - Auth0 Universal Login flow
 * - Secure token storage (via SDK's native keychain/keystore)
 * - User session management
 * - Logout with browser session clearing
 */

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { Auth0Provider as RNAuth0Provider, useAuth0 as useRNAuth0 } from 'react-native-auth0';
import { auth0Config, auth0Scopes } from '../config/auth0-config';

// Types for Auth0 user profile
export interface Auth0User {
    sub: string;           // Auth0 user ID (e.g., 'auth0|123...')
    email?: string;
    emailVerified?: boolean;
    name?: string;
    nickname?: string;
    picture?: string;
    updatedAt?: string;
}

// Social connection types supported by Auth0
export type SocialConnection = 'google-oauth2' | 'apple';

/**
 * Check if the error is a user-cancelled error that should be suppressed
 */
export function isUserCancelledError(error: any): boolean {
    const errorCode = error?.code || error?.message || String(error) || '';
    return (
        errorCode.includes('user_cancelled') ||
        errorCode.includes('a0.session.user_cancelled') ||
        errorCode.includes('CANCELED') ||
        errorCode.includes('cancelled')
    );
}

// Context interface for consuming components
interface Auth0ContextType {
    // Authentication state
    isAuthenticated: boolean;
    isLoading: boolean;
    user: Auth0User | null;
    error: Error | null;

    // Tokens (null when not authenticated)
    accessToken: string | null;
    idToken: string | null;

    // Auth methods
    loginWithAuth0: () => Promise<void>;
    loginWithGoogle: () => Promise<void>;
    loginWithApple: () => Promise<void>;
    logout: () => Promise<void>;
    getAccessToken: () => Promise<string | null>;
    getIdToken: () => Promise<string | null>;
}

const Auth0Context = createContext<Auth0ContextType | undefined>(undefined);

/**
 * Inner provider that uses the Auth0 hook (must be inside RNAuth0Provider)
 */
function Auth0ContextProvider({ children }: { children: React.ReactNode }) {
    const {
        user,
        error,
        isLoading,
        authorize,
        clearSession,
        getCredentials,
    } = useRNAuth0();

    // Login using Auth0 Universal Login (opens browser)
    const loginWithAuth0 = useCallback(async () => {
        try {
            await authorize({
                scope: auth0Scopes,
                // Enable offline_access for refresh tokens
                additionalParameters: {
                    prompt: 'login', // Force login screen even if session exists
                },
            });
        } catch (err) {
            console.error('Auth0 login error:', err);
            throw err;
        }
    }, [authorize]);

    /**
     * Login with a specific social connection
     * Uses connection parameter to bypass Auth0 hosted login page
     */
    const loginWithConnection = useCallback(async (connection: SocialConnection) => {
        console.log(`[Auth0] loginWithConnection called with connection: ${connection}`);
        console.log(`[Auth0] Current state - isLoading: ${isLoading}, user: ${user ? 'exists' : 'null'}`);

        try {
            console.log(`[Auth0] Calling authorize() with scope: ${auth0Scopes}, connection: ${connection}`);
            console.log(`[Auth0] About to open browser for ${connection} login...`);

            const result = await authorize({
                scope: auth0Scopes,
                connection, // Direct to specific identity provider
            });

            console.log(`[Auth0] authorize() returned successfully`);
            console.log(`[Auth0] Result:`, JSON.stringify(result, null, 2));
            return result;
        } catch (err: any) {
            console.error(`[Auth0] ${connection} login error:`, err);
            console.error(`[Auth0] Error name:`, err?.name);
            console.error(`[Auth0] Error message:`, err?.message);
            console.error(`[Auth0] Error code:`, err?.code);
            console.error(`[Auth0] Full error object:`, JSON.stringify(err, Object.getOwnPropertyNames(err), 2));
            throw err;
        }
    }, [authorize, isLoading, user]);

    // Login with Google - bypasses Auth0 hosted login
    const loginWithGoogle = useCallback(async () => {
        console.log('[Auth0] loginWithGoogle called');
        await loginWithConnection('google-oauth2');
        console.log('[Auth0] loginWithGoogle completed');
    }, [loginWithConnection]);

    // Login with Apple - bypasses Auth0 hosted login
    const loginWithApple = useCallback(async () => {
        console.log('[Auth0] loginWithApple called');
        await loginWithConnection('apple');
        console.log('[Auth0] loginWithApple completed');
    }, [loginWithConnection]);

    // Logout and clear browser session
    const logout = useCallback(async () => {
        try {
            await clearSession({
                federated: true, // Also logout from identity provider (Google, etc.)
            });
        } catch (err) {
            console.error('Auth0 logout error:', err);
            throw err;
        }
    }, [clearSession]);

    // Get current access token (automatically refreshes if expired)
    const getAccessToken = useCallback(async (): Promise<string | null> => {
        try {
            const credentials = await getCredentials();
            return credentials?.accessToken ?? null;
        } catch (err) {
            console.error('Failed to get access token:', err);
            return null;
        }
    }, [getCredentials]);

    // Get current ID token (used for backend verification)
    const getIdToken = useCallback(async (): Promise<string | null> => {
        try {
            const credentials = await getCredentials();
            console.log('[Auth0] getIdToken - credentials:', credentials ? 'exists' : 'null');
            console.log('[Auth0] idToken:', credentials?.idToken ? 'exists' : 'null');
            return credentials?.idToken ?? null;
        } catch (err) {
            console.error('Failed to get ID token:', err);
            return null;
        }
    }, [getCredentials]);

    // Memoize context value to prevent unnecessary re-renders
    const value = useMemo<Auth0ContextType>(() => ({
        isAuthenticated: !!user,
        isLoading,
        user: user as Auth0User | null,
        error: error ?? null,
        accessToken: null, // Tokens are managed by SDK, use getAccessToken() for fresh token
        idToken: null,
        loginWithAuth0,
        loginWithGoogle,
        loginWithApple,
        logout,
        getAccessToken,
        getIdToken,
    }), [user, isLoading, error, loginWithAuth0, loginWithGoogle, loginWithApple, logout, getAccessToken, getIdToken]);

    return (
        <Auth0Context.Provider value={value}>
            {children}
        </Auth0Context.Provider>
    );
}

/**
 * Main Auth0 Provider - wraps the entire app
 * Uses the Auth0 configuration from auth0-config.ts
 */
export function Auth0Provider({ children }: { children: React.ReactNode }) {
    return (
        <RNAuth0Provider
            domain={auth0Config.domain}
            clientId={auth0Config.clientId}
        >
            <Auth0ContextProvider>
                {children}
            </Auth0ContextProvider>
        </RNAuth0Provider>
    );
}

/**
 * Hook to access Auth0 authentication in components
 *
 * @example
 * ```tsx
 * function LoginButton() {
 *   const { loginWithAuth0, isLoading } = useAuth0();
 *   return (
 *     <Button
 *       title="Login with Auth0"
 *       onPress={loginWithAuth0}
 *       disabled={isLoading}
 *     />
 *   );
 * }
 * ```
 */
export function useAuth0Context() {
    const context = useContext(Auth0Context);
    if (context === undefined) {
        throw new Error('useAuth0Context must be used within an Auth0Provider');
    }
    return context;
}
