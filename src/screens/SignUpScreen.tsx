import React, { useState } from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChefHat } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../contexts/authContext';
import { User } from '../types';
import { PrimaryButton, TextField } from '../components/ui';
import { colors } from '../theme/tokens';

export default function SignUpScreen() {
  const navigation = useNavigation();
  const { signUp, submitting } = useAuth();

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

      if (!response.success) {
        setError(response.message || 'Sign up failed');
      }
    } catch {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-linen">
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
              <View className="items-center mb-10">
                <View className="w-12 h-12 rounded-lg bg-herb items-center justify-center mb-4">
                  <ChefHat size={24} color={colors.onHerb} />
                </View>
                <Text className="font-display text-4xl font-semibold text-ink">LarderMind</Text>
                <Text className="mt-2 text-base text-muted">Create your account with email</Text>
              </View>

              {error ? (
                <View className="bg-sage/60 border border-line px-4 py-3 rounded-lg mb-4">
                  <Text className="text-herb-deep text-sm text-center">{error}</Text>
                </View>
              ) : null}

              <View className="flex-row gap-3 mb-4">
                <TextField
                  label="First Name"
                  containerClassName="flex-1"
                  placeholder="John"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  editable={!submitting}
                />
                <TextField
                  label="Last Name"
                  containerClassName="flex-1"
                  placeholder="Doe"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  editable={!submitting}
                />
              </View>

              <TextField
                label="Email"
                containerClassName="mb-4"
                placeholder="you@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!submitting}
              />

              <TextField
                label="Password"
                containerClassName="mb-4"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="new-password"
                editable={!submitting}
              />

              <TextField
                label="Confirm Password"
                containerClassName="mb-6"
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoComplete="new-password"
                editable={!submitting}
              />

              <PrimaryButton
                label="Sign up"
                onPress={handleSubmit}
                loading={submitting}
                disabled={submitting}
                className="mb-6"
              />

              <View className="items-center">
                <Text className="text-sm text-muted">
                  Already have an account?{' '}
                  <Text onPress={() => navigation.goBack()} className="text-herb font-medium">
                    Log in
                  </Text>
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
