import './global.css';
import './src/i18n';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { useTranslation } from 'react-i18next';
import { buildTabBarStyle } from './src/navigation/tabBarStyle';
import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  SourceSans3_300Light,
  SourceSans3_400Regular,
  SourceSans3_500Medium,
  SourceSans3_600SemiBold,
  SourceSans3_700Bold,
} from '@expo-google-fonts/source-sans-3';
import {
  House as HouseIcon,
  Calendar as CalendarIcon,
  Package as PackageIcon,
  ShoppingCart as ShoppingCartIcon,
  Utensils as UtensilsIcon,
  Settings as SettingsIcon,
} from 'lucide-react-native';

import LoadingScreen from './src/screens/LoadingScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import HomeScreen from './src/screens/HomeScreen';
import CalendarScreen from './src/screens/CalendarScreen';
import PantryInventoryScreen from './src/screens/PantryInventoryScreen';
import ShoppingListScreen from './src/screens/ShoppingListScreen';
import RecipeManagerScreen from './src/screens/RecipeManagerScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import AICookingAssistantScreen from './src/screens/AICookingAssistantScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';

import { AuthProvider, useAuth } from './src/contexts/authContext';
import { PantryProvider } from './src/contexts/pantryContext';
import { colors } from './src/theme/tokens';
import { initI18n } from './src/i18n';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

function AuthCheck({ children }: { children: React.ReactNode }) {
  const { initializing } = useAuth();

  if (initializing) {
    return <LoadingScreen fullScreen />;
  }

  return <>{children}</>;
}

function RootNavigator() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="AICookingAssistant"
            component={AICookingAssistantScreen}
            options={{ title: t('ai.title') }}
          />
          <Stack.Screen
            name="Subscription"
            component={SubscriptionScreen}
            options={{ title: 'Subscription' }}
          />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthStack} />
      )}
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: colors.herb,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: buildTabBarStyle(insets.bottom, colors),
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: t('nav.home'),
          tabBarIcon: ({ color, size }) => <HouseIcon size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{
          tabBarLabel: t('nav.calendar'),
          tabBarIcon: ({ color, size }) => <CalendarIcon size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="PantryTab"
        component={PantryInventoryScreen}
        options={{
          tabBarLabel: t('nav.pantry'),
          tabBarIcon: ({ color, size }) => <PackageIcon size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ShoppingTab"
        component={ShoppingListScreen}
        options={{
          tabBarLabel: t('nav.shopping'),
          tabBarIcon: ({ color, size }) => <ShoppingCartIcon size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="RecipesTab"
        component={RecipeManagerScreen}
        options={{
          tabBarLabel: t('nav.recipes'),
          tabBarIcon: ({ color, size }) => <UtensilsIcon size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarButtonTestID: 'tab-settings',
          tabBarLabel: t('nav.settings'),
          tabBarIcon: ({ color, size }) => <SettingsIcon size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function App() {
  const [i18nReady, setI18nReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Fraunces_400Regular,
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    SourceSans3_300Light,
    SourceSans3_400Regular,
    SourceSans3_500Medium,
    SourceSans3_600SemiBold,
    SourceSans3_700Bold,
  });

  useEffect(() => {
    void initI18n().finally(() => setI18nReady(true));
  }, []);

  if ((!fontsLoaded && !fontError) || !i18nReady) {
    return (
      <SafeAreaProvider>
        <LoadingScreen fullScreen />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PantryProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <AuthCheck>
              <RootNavigator />
            </AuthCheck>
          </NavigationContainer>
        </PantryProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
