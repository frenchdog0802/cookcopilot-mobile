/**
 * API Auth Helper Tests
 *
 * Tests JWT storage in SecureStore with AsyncStorage migration.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { authHelper, isJwtExpired } from '../../api/auth-helper';

function resetSecureStoreMock() {
    const store = new Map<string, string>();
    (SecureStore.setItemAsync as jest.Mock).mockImplementation(async (key: string, value: string) => {
        store.set(key, value);
    });
    (SecureStore.getItemAsync as jest.Mock).mockImplementation(async (key: string) =>
        store.has(key) ? store.get(key)! : null,
    );
    (SecureStore.deleteItemAsync as jest.Mock).mockImplementation(async (key: string) => {
        store.delete(key);
    });
    return store;
}

beforeEach(async () => {
    await AsyncStorage.clear();
    resetSecureStoreMock();
});

describe('isJwtExpired', () => {
    const b64 = (obj: object) =>
        Buffer.from(JSON.stringify(obj))
            .toString('base64')
            .replace(/=+$/, '')
            .replace(/\+/g, '-')
            .replace(/\//g, '_');

    it('returns true when exp is in the past', () => {
        const token = `hdr.${b64({ exp: 1 })}.sig`;
        expect(isJwtExpired(token, 100)).toBe(true);
    });

    it('returns false when exp is in the future', () => {
        const token = `hdr.${b64({ exp: 9999999999 })}.sig`;
        expect(isJwtExpired(token, 100)).toBe(false);
    });
});

describe('authHelper', () => {
    describe('authenticate', () => {
        it('should store JWT token in SecureStore', async () => {
            await authHelper.authenticate('test-token');
            expect(SecureStore.setItemAsync).toHaveBeenCalledWith('jwt', 'test-token');
        });
    });

    describe('getJWT', () => {
        it('should return null when no token stored', async () => {
            const token = await authHelper.getJWT();
            expect(token).toBeNull();
        });

        it('should return SecureStore token', async () => {
            await SecureStore.setItemAsync('jwt', 'stored-token');
            const token = await authHelper.getJWT();
            expect(token).toBe('stored-token');
        });

        it('migrates legacy AsyncStorage jwt once', async () => {
            await AsyncStorage.setItem('jwt', JSON.stringify('legacy-token'));
            const token = await authHelper.getJWT();
            expect(token).toBe('legacy-token');
            expect(SecureStore.setItemAsync).toHaveBeenCalledWith('jwt', 'legacy-token');
            expect(await AsyncStorage.getItem('jwt')).toBeNull();
        });
    });

    describe('clearJWT', () => {
        it('should remove JWT from SecureStore and AsyncStorage', async () => {
            await SecureStore.setItemAsync('jwt', 'token-to-remove');
            await AsyncStorage.setItem('jwt', '"token-to-remove"');
            await authHelper.clearJWT();
            expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('jwt');
            expect(await AsyncStorage.getItem('jwt')).toBeNull();
            expect(await SecureStore.getItemAsync('jwt')).toBeNull();
        });
    });

    describe('isAuthenticated', () => {
        it('should return false when no token', async () => {
            expect(await authHelper.isAuthenticated()).toBe(false);
        });

        it('should return true when non-expired token exists', async () => {
            const payload = Buffer.from(
                JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 }),
            ).toString('base64url');
            await SecureStore.setItemAsync('jwt', `x.${payload}.y`);
            expect(await authHelper.isAuthenticated()).toBe(true);
        });
    });
});
