/**
 * Authentication helper utilities for React Native
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export const authHelper = {
    authenticate: async (jwt: string): Promise<void> => {
        try {
            await AsyncStorage.setItem('jwt', JSON.stringify(jwt));
        } catch (error) {
            console.error('Failed to store JWT:', error);
        }
    },

    getJWT: async (): Promise<string | null> => {
        try {
            const token = await AsyncStorage.getItem('jwt');
            return token ? JSON.parse(token) : null;
        } catch (error) {
            console.error('Failed to get JWT:', error);
            return null;
        }
    },

    clearJWT: async (): Promise<void> => {
        try {
            await AsyncStorage.removeItem('jwt');
        } catch (error) {
            console.error('Failed to clear JWT:', error);
        }
    },

    isAuthenticated: async (): Promise<boolean> => {
        const token = await authHelper.getJWT();
        return !!token;
    },
};
