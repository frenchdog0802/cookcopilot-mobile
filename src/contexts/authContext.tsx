import React, { useEffect, useState, createContext, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../api/api-auth';
import { authHelper } from '../api/auth-helper';
import { ApiResponse, User } from '../types';

export interface AuthResponse {
    success: boolean;
    message?: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    signUp: (user: User, password: string) => Promise<AuthResponse>;
    login: (email: string, password: string) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    isAuthenticated: boolean;
    googleLogin?: (token: string) => Promise<AuthResponse>;
    auth0Login: (idToken: string, accessToken: string) => Promise<AuthResponse>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Check if user is already logged in on mount
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
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    const signUp = async (userData: User, password: string): Promise<AuthResponse> => {
        setLoading(true);
        const authResponse: AuthResponse = { success: false };

        try {
            const response = await auth.signup(userData, password);

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
            setLoading(false);
        }

        return authResponse;
    };

    const login = async (email: string, password: string): Promise<AuthResponse> => {
        setLoading(true);
        const authResponse: AuthResponse = { success: false };

        try {
            const response = await auth.signin(email, password);

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
            setLoading(false);
        }

        return authResponse;
    };

    const logout = async (): Promise<void> => {
        setUser(null);
        await authHelper.clearJWT();
        await AsyncStorage.removeItem('user');
    };

    const googleLogin = async (token: string): Promise<AuthResponse> => {
        setLoading(true);
        const authResponse: AuthResponse = { success: false };

        try {
            const response = await auth.googleAuthLogin(token);

            if (response && response.data && response.success) {
                await authHelper.authenticate(response.data.token);
                setUser(response.data.user);
                await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
                authResponse.success = true;
            } else {
                authResponse.message = response.message || 'Google login failed';
            }
        } catch (error) {
            console.error('Error during Google login:', error);
            authResponse.message = 'An error occurred during Google login';
        } finally {
            setLoading(false);
        }

        return authResponse;
    };

    /**
     * Login with Auth0 tokens - syncs Auth0 user with backend
     * Called after successful Auth0 Universal Login
     */
    const auth0Login = async (idToken: string, accessToken: string): Promise<AuthResponse> => {
        setLoading(true);
        const authResponse: AuthResponse = { success: false };

        try {
            const response = await auth.auth0Login(idToken, accessToken);

            if (response && response.data && response.success) {
                await authHelper.authenticate(response.data.token);
                setUser(response.data.user);
                await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
                authResponse.success = true;
            } else {
                authResponse.message = response.message || 'Auth0 login failed';
            }
        } catch (error) {
            console.error('Error during Auth0 login:', error);
            authResponse.message = 'An error occurred during Auth0 login';
        } finally {
            setLoading(false);
        }

        return authResponse;
    };

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user,
        googleLogin,
        signUp,
        auth0Login,
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