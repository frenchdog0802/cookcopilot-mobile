/**
 * Authentication API functions for React Native
 */
import { api } from './client';
import { ApiResponse, User } from '../types';

interface AuthData {
    user: User;
    token: string;
}

export const auth = {
    signin: (email: string, password: string): Promise<ApiResponse<AuthData>> => {
        return api.post<AuthData>('/auth/signin', { email, password });
    },

    signup: (user: User, password: string): Promise<ApiResponse<AuthData>> => {
        return api.post<AuthData>('/auth/signup', { ...user, password });
    },

    googleAuthLogin: (token: string): Promise<ApiResponse<AuthData>> => {
        return api.post<AuthData>('/auth/google', { token });
    },
};
