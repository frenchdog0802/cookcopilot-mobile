/**
 * Jest Global Setup
 */

jest.setTimeout(15000);

global.__reanimatedWorkletInit = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

jest.mock('react-native-safe-area-context', () => ({
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

jest.mock('@react-navigation/native', () => ({
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn(), reset: jest.fn() }),
    useRoute: () => ({ params: {} }),
    useFocusEffect: jest.fn(),
    useIsFocused: () => true,
}));

jest.mock('lucide-react-native', () => new Proxy({}, { get: () => () => null }));

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-image', () => ({ Image: () => null }));
jest.mock('nativewind', () => ({ styled: (c) => c, useColorScheme: () => 'light' }));

jest.mock('expo-font', () => ({
    useFonts: () => [true, null],
    loadAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('@expo-google-fonts/fraunces', () => ({
    useFonts: () => [true, null],
    Fraunces_400Regular: 'Fraunces_400Regular',
    Fraunces_500Medium: 'Fraunces_500Medium',
    Fraunces_600SemiBold: 'Fraunces_600SemiBold',
    Fraunces_700Bold: 'Fraunces_700Bold',
}));

jest.mock('@expo-google-fonts/source-sans-3', () => ({
    useFonts: () => [true, null],
    SourceSans3_300Light: 'SourceSans3_300Light',
    SourceSans3_400Regular: 'SourceSans3_400Regular',
    SourceSans3_500Medium: 'SourceSans3_500Medium',
    SourceSans3_600SemiBold: 'SourceSans3_600SemiBold',
    SourceSans3_700Bold: 'SourceSans3_700Bold',
}));
