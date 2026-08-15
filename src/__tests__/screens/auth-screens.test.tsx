/**
 * Login / SignUp screen smoke tests after Auth0 removal
 */
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../screens/LoginScreen';
import SignUpScreen from '../../screens/SignUpScreen';

const mockLogin = jest.fn();
const mockSignUp = jest.fn();

jest.mock('../../contexts/authContext', () => ({
    useAuth: () => ({
        login: mockLogin,
        signUp: mockSignUp,
        loading: false,
        user: null,
        isAuthenticated: false,
        logout: jest.fn(),
    }),
}));

describe('LoginScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows email login UI without social SSO buttons', () => {
        const { getByText, getByPlaceholderText, queryByText } = render(<LoginScreen />);

        expect(getByText('LarderMind')).toBeTruthy();
        expect(getByText('Sign in with email')).toBeTruthy();
        expect(getByPlaceholderText('you@example.com')).toBeTruthy();
        expect(getByPlaceholderText('••••••••')).toBeTruthy();
        expect(getByText('Sign in')).toBeTruthy();
        expect(getByText('Sign up')).toBeTruthy();

        expect(queryByText('Continue with Google')).toBeNull();
        expect(queryByText('Continue with Apple')).toBeNull();
        expect(queryByText(/or sign in with email/i)).toBeNull();
    });

    it('calls login with email and password', async () => {
        mockLogin.mockResolvedValue({ success: true });
        const { getByPlaceholderText, getByText } = render(<LoginScreen />);

        fireEvent.changeText(getByPlaceholderText('you@example.com'), 'tester@example.com');
        fireEvent.changeText(getByPlaceholderText('••••••••'), 'secret123');
        fireEvent.press(getByText('Sign in'));

        await waitFor(() => {
            expect(mockLogin).toHaveBeenCalledWith('tester@example.com', 'secret123');
        });
    });

    it('shows validation error when fields are empty', async () => {
        const { getByText } = render(<LoginScreen />);
        fireEvent.press(getByText('Sign in'));
        expect(getByText('Please enter email and password')).toBeTruthy();
        expect(mockLogin).not.toHaveBeenCalled();
    });
});

describe('SignUpScreen', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('shows email signup UI without Google button', () => {
        const { getByText, getByPlaceholderText, queryByText } = render(<SignUpScreen />);

        expect(getByText('LarderMind')).toBeTruthy();
        expect(getByText('Create your account with email')).toBeTruthy();
        expect(getByPlaceholderText('John')).toBeTruthy();
        expect(getByPlaceholderText('Doe')).toBeTruthy();
        expect(getByPlaceholderText('you@example.com')).toBeTruthy();
        expect(getByText('Sign up')).toBeTruthy();
        expect(getByText('Log in')).toBeTruthy();

        expect(queryByText('Sign up with Google')).toBeNull();
        expect(queryByText(/^or$/)).toBeNull();
    });

    it('validates password confirmation', () => {
        const { getByText, getByPlaceholderText, getAllByPlaceholderText } = render(<SignUpScreen />);

        fireEvent.changeText(getByPlaceholderText('John'), 'Ada');
        fireEvent.changeText(getByPlaceholderText('Doe'), 'Lovelace');
        fireEvent.changeText(getByPlaceholderText('you@example.com'), 'ada@example.com');

        const passwordFields = getAllByPlaceholderText('••••••••');
        fireEvent.changeText(passwordFields[0], 'secret123');
        fireEvent.changeText(passwordFields[1], 'different');
        fireEvent.press(getByText('Sign up'));

        expect(getByText('Passwords do not match')).toBeTruthy();
        expect(mockSignUp).not.toHaveBeenCalled();
    });
});
