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
import { useAuth } from '../contexts/authContext';
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

    const { login, loading } = useAuth();

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
            } else {
                setError(success.message || 'Invalid email or password');
            }
        } catch {
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-gray-50">
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <View className="flex-1 justify-center px-6">
                    <View className="w-full max-w-md mx-auto">
                        <View className="items-center mb-8">
                            <Text className="text-4xl font-bold text-orange-600">LarderMind</Text>
                            <Text className="mt-2 text-base text-gray-600">Sign in with email</Text>
                        </View>

                        <View className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                            {loading ? (
                                <View className="py-10 items-center">
                                    <ActivityIndicator size="large" color="#f97316" />
                                </View>
                            ) : (
                                <>
                                    {error ? (
                                        <View className="bg-red-50 px-4 py-3 rounded-lg mb-4">
                                            <Text className="text-red-600 text-sm text-center">{error}</Text>
                                        </View>
                                    ) : null}

                                    <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                                    <TextInput
                                        className="w-full px-4 py-4 border border-gray-300 rounded-lg bg-gray-50 mb-4"
                                        placeholder="you@example.com"
                                        placeholderTextColor="#9ca3af"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        autoComplete="email"
                                    />

                                    <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
                                    <TextInput
                                        className="w-full px-4 py-4 border border-gray-300 rounded-lg bg-gray-50 mb-4"
                                        placeholder="••••••••"
                                        placeholderTextColor="#9ca3af"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry
                                        autoComplete="password"
                                    />

                                    <View className="flex-row justify-between items-center mb-6">
                                        <TouchableOpacity
                                            onPress={() => setRememberMe(!rememberMe)}
                                            className="flex-row items-center"
                                        >
                                            <View
                                                className={`w-5 h-5 border-2 rounded border-gray-400 mr-3 ${
                                                    rememberMe ? 'bg-orange-600 border-orange-600' : 'bg-white'
                                                }`}
                                            >
                                                {rememberMe && (
                                                    <Text className="text-white text-center text-xs font-bold">✓</Text>
                                                )}
                                            </View>
                                            <Text className="text-sm text-gray-700">Remember me</Text>
                                        </TouchableOpacity>
                                    </View>

                                    <TouchableOpacity
                                        onPress={handleSubmit}
                                        className="w-full py-4 rounded-lg bg-orange-600 mb-6 shadow-md"
                                        style={{ elevation: 3 }}
                                    >
                                        <Text className="text-white text-center font-semibold text-lg">
                                            Sign in
                                        </Text>
                                    </TouchableOpacity>

                                    <View className="items-center">
                                        <Text className="text-sm text-gray-600">
                                            Don't have an account?{' '}
                                            <Text
                                                onPress={() =>
                                                    onSignUp ? onSignUp() : navigation.navigate('SignUp' as never)
                                                }
                                                className="text-orange-600 font-medium"
                                            >
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
