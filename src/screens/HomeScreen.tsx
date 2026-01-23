import React, { useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    ActivityIndicator,
    ImageBackground,
} from 'react-native';
import {
    ChefHat as ChefHatIcon,
    Package,
    ShoppingCart,
    Utensils,
    Settings,
    ClipboardList,
} from 'lucide-react-native';
import { usePantry } from '../contexts/pantryContext';
import { useAuth } from '../contexts/authContext';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';

interface HomeProps {
    onCookWithWhatIHave?: () => void;
    onViewCalendar?: () => void;
    onPantryInventory?: () => void;
    onShoppingList?: () => void;
    onRecipeManager?: () => void;
    onSettings?: () => void;
    onLogin?: () => void;
}

export default function HomeScreen({
    onCookWithWhatIHave,
    onViewCalendar,
    onPantryInventory,
    onShoppingList,
    onRecipeManager,
    onSettings,
    onLogin,
}: HomeProps = {}) {
    const navigation = useNavigation();
    const { shoppingList, pantryItems, fetchAllPantryItems, fetchAllShoppingListItems } = usePantry();
    const { user, loading: authLoading } = useAuth();

    // Navigation handlers with fallbacks
    const handleCookWithWhatIHave = onCookWithWhatIHave || (() => navigation.navigate('AICookingAssistant' as never));
    const handleViewCalendar = onViewCalendar || (() => navigation.navigate('CalendarTab' as never));
    const handlePantryInventory = onPantryInventory || (() => navigation.navigate('PantryTab' as never));
    const handleShoppingList = onShoppingList || (() => navigation.navigate('ShoppingTab' as never));
    const handleRecipeManager = onRecipeManager || (() => navigation.navigate('RecipesTab' as never));
    const handleSettings = onSettings || (() => navigation.navigate('SettingsTab' as never));

    useEffect(() => {
        fetchAllPantryItems();
        fetchAllShoppingListItems();
    }, []);

    const itemsToBuy = shoppingList.filter((item) => !item.checked).length;

    if (authLoading) {
        return (
            <View className="flex-1 bg-white justify-center items-center">
                <ActivityIndicator size="large" color="#dc2626" />
                <Text className="mt-4 text-gray-600 text-lg">Loading your kitchen...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white">
            <AppHeader
                title="ManageEat"
                showBackButton={false}
                rightElement={<Settings size={24} color="white" />}
                onRightPress={handleSettings}
            />
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Main Content */}
                <View className="px-5">
                    {/* Welcome */}
                    <Text className="text-2xl font-semibold text-gray-800 mt-6 mb-8 text-center">
                        Welcome, {user?.name || 'Chef'}!
                    </Text>

                    {/* Kitchen Stats */}
                    <View className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 mb-8">
                        <Text className="text-lg font-medium text-gray-700 mb-5">My Kitchen Stats</Text>
                        <View className="flex-row gap-5">
                            <TouchableOpacity
                                onPress={handlePantryInventory}
                                className="flex-1 bg-pink-50 rounded-2xl p-5 border border-pink-100 active:bg-pink-100"
                                activeOpacity={0.8}
                            >
                                <View className="flex-row items-center justify-center mb-2">
                                    <Text className="text-4xl font-bold text-red-600 mr-3">{pantryItems.length}</Text>
                                    <Package size={28} color="#dc2626" />
                                </View>
                                <Text className="text-center text-gray-700 font-medium">Items in Pantry</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleShoppingList}
                                className="flex-1 bg-blue-50 rounded-2xl p-5 border border-blue-100 active:bg-blue-100"
                                activeOpacity={0.8}
                            >
                                <View className="flex-row items-center justify-center mb-2">
                                    <Text className="text-4xl font-bold text-blue-600 mr-3">{itemsToBuy}</Text>
                                    {itemsToBuy > 0 && <ShoppingCart size={28} color="#2563eb" />}
                                </View>
                                <Text className="text-center text-gray-700 font-medium">Items to Buy</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Quick Actions Grid */}
                    <View className="mb-8">
                        <View className="flex-row flex-wrap -mx-2">
                            <View className="w-1/2 px-2 mb-4">
                                <TouchableOpacity
                                    onPress={handleViewCalendar}
                                    className="bg-red-50 rounded-2xl p-6 border border-red-100 items-center active:bg-red-100"
                                    activeOpacity={0.8}
                                >
                                    <ClipboardList size={40} color="#dc2626" className="mb-3" />
                                    <Text className="text-gray-800 font-semibold text-center">Plan Your Meals</Text>
                                    <Text className="text-xs text-gray-500 mt-1 text-center">
                                        Schedule dishes on your calendar
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            <View className="w-1/2 px-2 mb-4">
                                <TouchableOpacity
                                    onPress={handleRecipeManager}
                                    className="bg-green-50 rounded-2xl p-6 border border-green-100 items-center active:bg-green-100"
                                    activeOpacity={0.8}
                                >
                                    <Utensils size={40} color="#16a34a" className="mb-3" />
                                    <Text className="text-gray-800 font-semibold text-center">Recipes</Text>
                                    <Text className="text-xs text-gray-500 mt-1 text-center">
                                        Manage your recipes
                                    </Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>

                    {/* Hero Featured Section */}
                    <ImageBackground
                        source={{
                            uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
                        }}
                        className="h-80 rounded-3xl overflow-hidden shadow-2xl relative"
                        resizeMode="cover"
                    >
                        {/* Dark overlay gradient */}
                        <View className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

                        {/* Call to Action Button */}
                        <View className="absolute bottom-8 left-0 right-0 items-center px-6">
                            <TouchableOpacity
                                onPress={handleCookWithWhatIHave}
                                className="flex-row items-center bg-white rounded-2xl px-8 py-5 shadow-2xl active:bg-gray-100"
                                activeOpacity={0.8}
                            >
                                <ChefHatIcon size={28} color="#dc2626" />
                                <Text className="ml-3 text-xl font-bold text-red-600">
                                    Cook with what I have
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </ImageBackground>

                    {/* Extra bottom padding */}
                    <View className="h-10" />
                </View>
            </ScrollView>
        </View>
    );
}