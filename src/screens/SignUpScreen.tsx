import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/authContext';
import { User } from '../types';

export default function SignUpScreen() {
    const navigation = useNavigation();
    const { signUp, loading } = useAuth();

    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        if (!firstName || !lastName || !email || !password) {
            setError('Please fill all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setError('');

        try {
            const user: User = {
                first_name: firstName,
                last_name: lastName,
                email,
                name: `${firstName} ${lastName}`,
            };

            const response = await signUp(user, password);

            if (response.success) {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'Main' as never }],
                });
            } else {
                setError(response.message || 'Sign up failed');
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
                <ScrollView
                    className="flex-1"
                    contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
                    keyboardShouldPersistTaps="handled"
                >
                    <View className="px-6 py-8">
                        <View className="w-full max-w-md mx-auto">
                            <View className="items-center mb-8">
                                <Text className="text-4xl font-bold text-orange-600">LarderMind</Text>
                                <Text className="mt-2 text-base text-gray-600">Create your account with email</Text>
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

                                        <View className="flex-row gap-3 mb-4">
                                            <View className="flex-1">
                                                <Text className="text-sm font-medium text-gray-700 mb-1">First Name</Text>
                                                <TextInput
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                                                    placeholder="John"
                                                    placeholderTextColor="#9ca3af"
                                                    value={firstName}
                                                    onChangeText={setFirstName}
                                                    autoCapitalize="words"
                                                />
                                            </View>
                                            <View className="flex-1">
                                                <Text className="text-sm font-medium text-gray-700 mb-1">Last Name</Text>
                                                <TextInput
                                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                                                    placeholder="Doe"
                                                    placeholderTextColor="#9ca3af"
                                                    value={lastName}
                                                    onChangeText={setLastName}
                                                    autoCapitalize="words"
                                                />
                                            </View>
                                        </View>

                                        <View className="mb-4">
                                            <Text className="text-sm font-medium text-gray-700 mb-1">Email</Text>
                                            <TextInput
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                                                placeholder="you@example.com"
                                                placeholderTextColor="#9ca3af"
                                                value={email}
                                                onChangeText={setEmail}
                                                keyboardType="email-address"
                                                autoCapitalize="none"
                                                autoCorrect={false}
                                                autoComplete="email"
                                            />
                                        </View>

                                        <View className="mb-4">
                                            <Text className="text-sm font-medium text-gray-700 mb-1">Password</Text>
                                            <TextInput
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                                                placeholder="••••••••"
                                                placeholderTextColor="#9ca3af"
                                                value={password}
                                                onChangeText={setPassword}
                                                secureTextEntry
                                                autoComplete="new-password"
                                            />
                                        </View>

                                        <View className="mb-6">
                                            <Text className="text-sm font-medium text-gray-700 mb-1">Confirm Password</Text>
                                            <TextInput
                                                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50"
                                                placeholder="••••••••"
                                                placeholderTextColor="#9ca3af"
                                                value={confirmPassword}
                                                onChangeText={setConfirmPassword}
                                                secureTextEntry
                                                autoComplete="new-password"
                                            />
                                        </View>

                                        <TouchableOpacity
                                            onPress={handleSubmit}
                                            className="w-full py-4 rounded-lg bg-orange-500 mb-6"
                                            activeOpacity={0.8}
                                        >
                                            <Text className="text-white text-center font-semibold text-lg">
                                                Sign up
                                            </Text>
                                        </TouchableOpacity>

                                        <View className="items-center">
                                            <Text className="text-sm text-gray-600">
                                                Already have an account?{' '}
                                                <Text
                                                    onPress={() => navigation.goBack()}
                                                    className="text-orange-600 font-medium"
                                                >
                                                    Log in
                                                </Text>
                                            </Text>
                                        </View>
                                    </>
                                )}
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
