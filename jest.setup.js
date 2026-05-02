/**
 * Jest Global Setup
 */

// Increase timeout
jest.setTimeout(15000);

// Mock reanimated worklet
global.__reanimatedWorkletInit = jest.fn();

// Mock expo - needs to be first to prevent expo/winter issues
jest.mock('expo', () => ({}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock react-native-reanimated
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Mock react-native-auth0
jest.mock('react-native-auth0', () => ({
    Auth0Provider: jest.fn(({ children }) => children),
    useAuth0: jest.fn(() => ({
        authorize: jest.fn().mockResolvedValue(undefined),
        clearSession: jest.fn().mockResolvedValue(undefined),
        getCredentials: jest.fn().mockResolvedValue({ accessToken: 'test', idToken: 'test' }),
        user: null,
        error: null,
        isLoading: false,
    })),
}));

// Mock react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
    SafeAreaProvider: jest.fn(({ children }) => children),
    SafeAreaView: jest.fn(({ children }) => children),
    useSafeAreaInsets: jest.fn(() => ({ top: 0, right: 0, bottom: 0, left: 0 })),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
    useNavigation: jest.fn(() => ({ navigate: jest.fn(), goBack: jest.fn(), reset: jest.fn() })),
    useRoute: jest.fn(() => ({ params: {} })),
    useFocusEffect: jest.fn(),
    useIsFocused: jest.fn(() => true),
}));

// Mock lucide icons
jest.mock('lucide-react-native', () => new Proxy({}, { get: () => jest.fn(() => null) }));

// Mock expo modules
jest.mock('expo-status-bar', () => ({ StatusBar: jest.fn(() => null) }));
jest.mock('expo-image', () => ({ Image: jest.fn(() => null) }));
jest.mock('nativewind', () => ({ styled: (c) => c, useColorScheme: () => 'light' }));
