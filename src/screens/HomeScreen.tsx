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
  Calendar as CalendarIcon,
} from 'lucide-react-native';
import { usePantry } from '../contexts/pantryContext';
import { useAuth } from '../contexts/authContext';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ListRow, PrimaryButton } from '../components/ui';
import { colors } from '../theme/tokens';

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
}: HomeProps = {}) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { shoppingList, pantryItems, fetchAllPantryItems, fetchAllShoppingListItems } = usePantry();
  const { user, loading: authLoading } = useAuth();

  const handleCookWithWhatIHave =
    onCookWithWhatIHave ||
    (() =>
      navigation.navigate(
        'AICookingAssistant' as never,
        { initialPrompt: 'What can I cook with what I have?' } as never,
      ));
  const handleViewCalendar = onViewCalendar || (() => navigation.navigate('CalendarTab' as never));
  const handlePantryInventory =
    onPantryInventory || (() => navigation.navigate('PantryTab' as never));
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
      <View className="flex-1 bg-linen justify-center items-center">
        <ActivityIndicator size="large" color={colors.herb} />
        <Text className="mt-4 text-muted text-lg">Loading your kitchen...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-linen">
      <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
        <View style={{ paddingTop: insets.top }} className="relative min-h-[520px]">
          <ImageBackground
            source={{
              uri: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1600&q=80',
            }}
            className="absolute inset-0"
            resizeMode="cover"
          />
          <View className="absolute inset-0 bg-linen/40" />
          <View className="absolute bottom-0 left-0 right-0 h-48 bg-linen/90" />

          <View className="flex-row justify-end px-5 pt-2">
            <TouchableOpacity
              onPress={handleSettings}
              className="p-2 rounded-lg"
              accessibilityLabel="Settings"
            >
              <Settings size={22} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <View className="flex-1 justify-end px-6 pb-8 pt-24">
            <Text className="font-display text-4xl font-semibold text-ink tracking-tight">
              LarderMind
            </Text>
            <Text className="mt-3 text-lg text-ink/80">
              Plan dinner from what's already in your kitchen
            </Text>
            {user ? (
              <Text className="mt-1 text-sm text-muted">
                Welcome back, {user.name || 'Chef'}
              </Text>
            ) : null}

            <View className="mt-8">
              <PrimaryButton
                label="Cook with what I have"
                onPress={handleCookWithWhatIHave}
                icon={<ChefHatIcon size={22} color={colors.onHerb} />}
              />
            </View>
          </View>
        </View>

        <View className="px-6 pt-8 pb-12">
          <View className="flex-row flex-wrap gap-x-6 gap-y-1 mb-6">
            <Text className="text-sm text-muted">{pantryItems.length} items in pantry</Text>
            <Text className="text-sm text-line">|</Text>
            <Text className="text-sm text-muted">{itemsToBuy} items to buy</Text>
          </View>

          <ListRow
            title="Plan Your Meals"
            description="Schedule dishes on your calendar"
            icon={<CalendarIcon size={20} color={colors.herb} />}
            onPress={handleViewCalendar}
          />
          <ListRow
            title="Pantry"
            description={`${pantryItems.length} items in stock`}
            icon={<Package size={20} color={colors.herb} />}
            onPress={handlePantryInventory}
          />
          <ListRow
            title="Shopping List"
            description={`${itemsToBuy} items to buy`}
            icon={<ShoppingCart size={20} color={colors.herb} />}
            onPress={handleShoppingList}
          />
          <ListRow
            title="Recipes"
            description="Manage your recipes"
            icon={<Utensils size={20} color={colors.herb} />}
            onPress={handleRecipeManager}
          />
        </View>
      </ScrollView>
    </View>
  );
}
