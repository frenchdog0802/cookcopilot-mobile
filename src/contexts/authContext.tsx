import React, { useEffect, useState, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../api/api-auth';
import { authHelper } from '../api/auth-helper';
import { User } from '../types';

export interface AuthResponse {
    success: boolean;
    message?: string;
}

interface AuthContextType {
    user: User | null;
    /** True only while restoring session on app launch */
    initializing: boolean;
    /** True while login/signup request is in flight */
    submitting: boolean;
    /** @deprecated use initializing — kept so AuthCheck migration is obvious */
    loading: boolean;
    signUp: (user: User, password: string) => Promise<AuthResponse>;
    login: (email: string, password: string) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [initializing, setInitializing] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const storedUser = await AsyncStorage.getItem('user');
                const jwtToken = await authHelper.getJWT();

                if (storedUser && jwtToken) {
                    const parsedUser = JSON.parse(storedUser) as User;
                    if (parsedUser && parsedUser.name && parsedUser.id) {
                        setUser(parsedUser);
                    } else {
                        console.warn('Incomplete user data, clearing...');
                        await AsyncStorage.removeItem('user');
                    }
                }
            } catch (error) {
                console.error('Auth check error:', error);
                await AsyncStorage.removeItem('user');
            } finally {
                setInitializing(false);
            }
        };

        checkAuth();
    }, []);

    const signUp = async (userData: User, password: string): Promise<AuthResponse> => {
        setSubmitting(true);
        const authResponse: AuthResponse = { success: false };

        try {
            console.log('[auth] signup start', userData.email);
            const response = await auth.signup(userData, password);
            console.log('[auth] signup response', response?.success, response?.message);

            if (response && response.success && response.data) {
                const createdUser = response.data.user;
                setUser(createdUser);
                await AsyncStorage.setItem('user', JSON.stringify(createdUser));
                await authHelper.authenticate(response.data.token);
                authResponse.success = true;
            } else {
                authResponse.success = false;
                authResponse.message = response.message || 'Sign up failed';
            }
        } catch (error) {
            console.error('Error during sign up:', error);
            authResponse.message = 'An error occurred during sign up';
        } finally {
            setSubmitting(false);
        }

        return authResponse;
    };

    const login = async (email: string, password: string): Promise<AuthResponse> => {
        setSubmitting(true);
        const authResponse: AuthResponse = { success: false };

        try {
            console.log('[auth] login start', email);
            const response = await auth.signin(email, password);
            console.log('[auth] login response', response?.success, response?.message);

            if (response && response.data && response.success) {
                await authHelper.authenticate(response.data.token);
                setUser(response.data.user);
                await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
                authResponse.success = true;
            } else {
                authResponse.success = false;
                authResponse.message = response.message || 'Login failed';
            }
        } catch (error) {
            console.error('Error logging in:', error);
            authResponse.message = 'An error occurred during login';
        } finally {
            setSubmitting(false);
        }

        return authResponse;
    };

    const logout = async (): Promise<void> => {
        setUser(null);
        await authHelper.clearJWT();
        await AsyncStorage.removeItem('user');
    };

    const value = {
        user,
        initializing,
        submitting,
        loading: initializing,
        login,
        logout,
        isAuthenticated: !!user,
        signUp,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
