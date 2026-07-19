import "./global.css"
import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import {
  House as HouseIcon,
  Calendar as CalendarIcon,
  Package as PackageIcon,
  ShoppingCart as ShoppingCartIcon,
  Utensils as UtensilsIcon,
  Settings as SettingsIcon,
} from 'lucide-react-native';

// Screens
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

// Contexts
import { AuthProvider, useAuth } from './src/contexts/authContext';
import { PantryProvider } from './src/contexts/pantryContext';
import { Auth0Provider } from './src/contexts/auth0Context';

// TODO: [EXPO GO STUB] Uncomment for production builds with native IAP
// import iapService from './src/services/iapService';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Move these INSIDE the AuthProvider
function AuthCheck({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen fullScreen />;
  }

  return <>{children}</>;
}

function RootNavigator() {
  const { isAuthenticated } = useAuth();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <>
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="AICookingAssistant"
            component={AICookingAssistantScreen}
            options={{ title: 'AI Assistant' }}
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
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#f97316',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingTop: 8,
          paddingBottom: 8,
          height: 75,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => <HouseIcon size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="CalendarTab"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color, size }) => <CalendarIcon size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="PantryTab"
        component={PantryInventoryScreen}
        options={{
          tabBarLabel: 'Pantry',
          tabBarIcon: ({ color, size }) => <PackageIcon size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ShoppingTab"
        component={ShoppingListScreen}
        options={{
          tabBarLabel: 'Shopping',
          tabBarIcon: ({ color, size }) => <ShoppingCartIcon size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="RecipesTab"
        component={RecipeManagerScreen}
        options={{
          tabBarLabel: 'Recipes',
          tabBarIcon: ({ color, size }) => <UtensilsIcon size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => <SettingsIcon size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Main App - Wrapped with Auth0 and IAP Context for subscription support
function App() {
  return (
    <SafeAreaProvider>
      <Auth0Provider>
        <AuthProvider>
          <PantryProvider>
            <NavigationContainer>
              <StatusBar style="auto" />
              <AuthCheck>
                <RootNavigator />
              </AuthCheck>
            </NavigationContainer>
          </PantryProvider>
        </AuthProvider>
      </Auth0Provider>
    </SafeAreaProvider>
  );
}

// Export App directly (no wrapper needed for react-native-iap v14)
export default App;