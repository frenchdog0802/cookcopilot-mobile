/**
 * API Auth Helper Tests
 *
 * Tests JWT storage, retrieval, and clearing using mocked AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authHelper } from '../../api/auth-helper';

// Clear mocks between tests
beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
});

describe('authHelper', () => {
    // ==========================================================================
    // authenticate() Tests
    // ==========================================================================
    describe('authenticate', () => {
        it('should store JWT token in AsyncStorage', async () => {
            await authHelper.authenticate('test-token');
            expect(AsyncStorage.setItem).toHaveBeenCalledWith('jwt', '"test-token"');
        });
    });

    // ==========================================================================
    // getJWT() Tests
    // ==========================================================================
    describe('getJWT', () => {
        it('should return null when no token stored', async () => {
            const token = await authHelper.getJWT();
            expect(token).toBeNull();
        });

        it('should return stored token', async () => {
            await AsyncStorage.setItem('jwt', '"stored-token"');
            const token = await authHelper.getJWT();
            expect(token).toBe('stored-token');
        });
    });

    // ==========================================================================
    // clearJWT() Tests
    // ==========================================================================
    describe('clearJWT', () => {
        it('should remove JWT from storage', async () => {
            await AsyncStorage.setItem('jwt', '"token-to-remove"');
            await authHelper.clearJWT();
            expect(AsyncStorage.removeItem).toHaveBeenCalledWith('jwt');
        });
    });

    // ==========================================================================
    // isAuthenticated() Tests
    // ==========================================================================
    describe('isAuthenticated', () => {
        it('should return false when no token', async () => {
            const result = await authHelper.isAuthenticated();
            expect(result).toBe(false);
        });

        it('should return true when token exists', async () => {
            await AsyncStorage.setItem('jwt', '"valid-token"');
            const result = await authHelper.isAuthenticated();
            expect(result).toBe(true);
        });
    });
});
