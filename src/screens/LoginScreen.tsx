import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../contexts/authContext';
import { useAuth0Context, isUserCancelledError } from '../contexts/auth0Context';
import { useNavigation } from '@react-navigation/native';

interface LoginProps {
    onLoginSuccess?: () => void;
    onSignUp?: () => void;
}

export default function LoginScreen({ onLoginSuccess, onSignUp }: LoginProps = {}) {
    const navigation = useNavigation();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [error, setError] = useState('');

    const { login, loading, auth0Login } = useAuth();
    const {
        loginWithGoogle,
        loginWithApple,
        isLoading: auth0Loading,
        getAccessToken,
        getIdToken,
    } = useAuth0Context();

    // Combined loading state
    const isLoading = loading || auth0Loading;

    const handleSubmit = async () => {
        if (!email || !password) {
            setError('Please enter email and password');
            return;
        }
        setError('');
        try {
            const success = await login(email, password);
            if (success.success) {
                onLoginSuccess?.();
                // Navigation handled by auth state change in App.tsx
            } else {
                setError(success.message || 'Invalid email or password');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
        }
    };

    /**
     * Handle SSO login with a specific provider
     * Silently suppresses user-cancelled errors
     */
    const handleSSOLogin = async (
        loginFn: () => Promise<void>,
        providerName: string
    ) => {
        try {
            setError('');
            console.log('Starting SSO login with', providerName);
            await loginFn();
            console.log('SSO login with', providerName, 'completed');

            // After successful login, get tokens and sync with backend
            const idToken = await getIdToken();
            const accessToken = await getAccessToken();
            console.log('ID token:', idToken ? `${idToken.substring(0, 20)}...` : 'null');
            console.log('Access token:', accessToken ? `${accessToken.substring(0, 20)}...` : 'null');

            if (idToken) {
                console.log('Syncing with server using ID token');
                const result = await auth0Login(idToken, accessToken || '');
                console.log('Sync result:', result);
                if (!result.success) {
                    setError(result.message || 'Failed to sync with server');
                } else {
                    console.log('Sync successful');
                    onLoginSuccess?.();
                }
            } else {
                console.error('No ID token available');
                setError('Failed to get authentication token');
            }
        } catch (err: any) {
            // Silently suppress user-cancelled errors
            if (isUserCancelledError(err)) {
                // User closed the popup, stay on login screen quietly
                return;
            }
            // Show error only for actual failures
            console.error(`${providerName} login error:`, err);
            setError(`${providerName} login failed. Please try again.`);
        }
    };

    const handleGoogleLogin = () => handleSSOLogin(loginWithGoogle, 'Google');
    const handleAppleLogin = () => handleSSOLogin(loginWithApple, 'Apple');

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="flex-1 justify-center px-6">
                    <View className="w-full max-w-md mx-auto">
                        {/* Header */}
                        <View className="items-center mb-8">
                            <Text className="text-4xl font-bold text-orange-600">ManageEat</Text>
                            <Text className="mt-2 text-base text-gray-600">Sign in to your account</Text>
                        </View>

                        {/* Main Card */}
                        <View className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                            {isLoading ? (
                                <View className="py-10 items-center">
                                    <ActivityIndicator size="large" color="#f97316" />
                                </View>
                            ) : (
                                <>
                                    {/* Error Message */}
                                    {error ? (
                                        <View className="bg-red-50 px-4 py-3 rounded-lg mb-4">
                                            <Text className="text-red-600 text-sm text-center">{error}</Text>
                                        </View>
                                    ) : null}


                                    {/* Divider */}
                                    <View className="relative my-4">
                                        <View className="absolute inset-0 flex-row items-center">
                                            <View className="flex-1 h-px bg-gray-300" />
                                        </View>
                                        <View className="relative flex-row justify-center">
                                            <Text className="bg-white px-4 text-sm text-gray-500">or sign in with email</Text>
                                        </View>
                                    </View>

                                    {/* Email Input */}
                                    <TextInput
                                        className="w-full px-4 py-4 border border-gray-300 rounded-lg bg-gray-50 mb-4"
                                        placeholder="you@example.com"
                                        placeholderTextColor="#9ca3af"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />

                                    {/* Password Input */}
                                    <TextInput
                                        className="w-full px-4 py-4 border border-gray-300 rounded-lg bg-gray-50 mb-4"
                                        placeholder="••••••••"
                                        placeholderTextColor="#9ca3af"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                    />

                                    {/* Remember me + Forgot password */}
                                    <View className="flex-row justify-between items-center mb-6">
                                        <TouchableOpacity
                                            onPress={() => setRememberMe(!rememberMe)}
                                            className="flex-row items-center"
                                        >
                                            <View
                                                className={`w-5 h-5 border-2 rounded border-gray-400 mr-3 ${rememberMe ? 'bg-orange-600 border-orange-600' : 'bg-white'
                                                    }`}
                                            >
                                                {rememberMe && (
                                                    <Text className="text-white text-center text-xs font-bold">✓</Text>
                                                )}
                                            </View>
                                            <Text className="text-sm text-gray-700">Remember me</Text>
                                        </TouchableOpacity>

                                        <TouchableOpacity>
                                            <Text className="text-sm text-orange-600">Forgot password?</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Sign In Button */}
                                    <TouchableOpacity
                                        onPress={handleSubmit}
                                        className="w-full py-4 rounded-lg bg-orange-600 mb-6 shadow-md"
                                        style={{ elevation: 3 }}
                                    >
                                        <Text className="text-white text-center font-semibold text-lg">
                                            Sign in with Email
                                        </Text>
                                    </TouchableOpacity>
                                    {/* Social Login Buttons */}
                                    <View className="mb-6">
                                        {/* Google Button */}
                                        <TouchableOpacity
                                            onPress={handleGoogleLogin}
                                            className="w-full flex-row items-center justify-center py-4 rounded-xl bg-white border-2 border-gray-200 mb-3 shadow-sm"
                                            style={{ elevation: 2 }}
                                        >
                                            <View className="w-6 h-6 mr-3 items-center justify-center">
                                                <Ionicons name="logo-google" size={22} color="#EA4335" />
                                            </View>
                                            <Text className="text-gray-700 font-semibold text-base">
                                                Continue with Google
                                            </Text>
                                        </TouchableOpacity>

                                        {/* Apple Button */}
                                        <TouchableOpacity
                                            onPress={handleAppleLogin}
                                            className="w-full flex-row items-center justify-center py-4 rounded-xl bg-black shadow-sm"
                                            style={{ elevation: 2 }}
                                        >
                                            <View className="w-6 h-6 mr-3 items-center justify-center">
                                                <Ionicons name="logo-apple" size={24} color="#FFFFFF" />
                                            </View>
                                            <Text className="text-white font-semibold text-base">
                                                Continue with Apple
                                            </Text>
                                        </TouchableOpacity>
                                    </View>

                                    {/* Sign Up Link */}
                                    <View className="items-center">
                                        <Text className="text-sm text-gray-600">
                                            Don't have an account?{' '}
                                            <Text onPress={() => onSignUp ? onSignUp() : navigation.navigate('SignUp' as never)} className="text-orange-600 font-medium">
                                                Sign up
                                            </Text>
                                        </Text>
                                    </View>
                                </>
                            )}
                        </View>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}