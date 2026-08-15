import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { usePantry } from '../contexts/pantryContext';
import { PlusIcon, MinusIcon, CheckIcon, SearchIcon, TrashIcon, XIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import AskAiEmptyCta from '../components/AskAiEmptyCta';
import { UnitSelect, QuantityLabel, preferredUnitForIngredient } from '../components/UnitSelect';
import type { MeasurementSystem } from '../utils/units';
import { colors } from '../theme/tokens';

interface ShoppingListItem {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    checked: boolean;
    unit_kind?: string;
    base_unit?: string;
    default_display_unit?: string;
}

export default function ShoppingListScreen() {
    const navigation = useNavigation();
    const {
        shoppingList: oriShoppingList,
        fetchAllShoppingListItems,
        fetchAllPantryItems,
        updateShoppingListItem,
        addShoppingListItem,
        ingredients,
        userSettings,
    } = usePantry();

    const measurementSystem = (userSettings.measurement_unit === 'imperial' ? 'imperial' : 'metric') as MeasurementSystem;
    const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
    const [showMessage, setShowMessage] = useState(false);
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [isCompletingAll, setIsCompletingAll] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        quantity: '1',
        unit: '',
    });

    useEffect(() => {
        fetchAllShoppingListItems();
    }, []);

    useEffect(() => {
        if (oriShoppingList) {
            setShoppingList(oriShoppingList as any);
        }
    }, [oriShoppingList]);

    // Filter shopping list items
    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) {
            return shoppingList;
        }
        return shoppingList.filter(item => {
            return item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [shoppingList, searchQuery]);

    const handleUpdateQuantity = async (item: ShoppingListItem, delta: number) => {
        const next = item.quantity + delta;
        if (next >= 0) {
            await updateShoppingListItem({ ...item, quantity: next });
        }
    };

    const handleTogglePurchased = async (id: string) => {
        const item = shoppingList.find(i => i.id === id);
        if (item) {
            await updateShoppingListItem({ ...item, checked: !item.checked });
            setMessage('Item updated!');
            setShowMessage(true);
            setTimeout(() => setShowMessage(false), 2000);
        }
    };

    const uncheckedCount = useMemo(
        () => shoppingList.filter(item => !item.checked).length,
        [shoppingList]
    );

    const handleCompleteAll = async () => {
        const unchecked = shoppingList.filter(item => !item.checked);
        if (unchecked.length === 0 || isCompletingAll) return;

        setIsCompletingAll(true);
        try {
            await Promise.all(
                unchecked.map(item => updateShoppingListItem({ ...item, checked: true }))
            );
            setShoppingList(prevList =>
                prevList.map(listItem =>
                    listItem.checked ? listItem : { ...listItem, checked: true }
                )
            );
            await fetchAllPantryItems();
            setMessage(`All ${unchecked.length} item${unchecked.length === 1 ? '' : 's'} purchased!`);
            setShowMessage(true);
            setTimeout(() => setShowMessage(false), 2000);
        } finally {
            setIsCompletingAll(false);
        }
    };

    const handleAddItem = async () => {
        if (!newItem.name.trim()) return;

        await addShoppingListItem({
            name: newItem.name,
            quantity: parseFloat(newItem.quantity) || 1,
            unit: newItem.unit,
            checked: false,
        });

        setNewItem({ name: '', quantity: '1', unit: '' });
        setIsAddingItem(false);
        setMessage('Item added to shopping list!');
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 2000);
    };

    const renderItem = ({ item }: { item: ShoppingListItem }) => (
        <View className={`flex-row items-center p-3 bg-surface rounded-xl mb-2 border border-line ${item.checked ? 'opacity-70' : ''}`}>
            {/* Checkbox */}
            <TouchableOpacity onPress={() => handleTogglePurchased(item.id)} className="mr-3">
                <View
                    className={`w-6 h-6 rounded border-2 items-center justify-center ${item.checked ? 'bg-herb border-herb' : 'border-line'}`}
                >
                    {item.checked && <CheckIcon size={14} color={colors.onHerb} />}
                </View>
            </TouchableOpacity>

            {/* Name & quantity */}
            <View className="flex-1 mr-3">
                <Text
                    className={`font-medium capitalize ${item.checked ? 'line-through text-muted' : 'text-ink'}`}
                    numberOfLines={1}
                >
                    {item.name}
                </Text>
                <QuantityLabel
                    quantity={item.quantity}
                    unit={item.unit}
                    unitKind={item.unit_kind}
                    baseUnit={item.base_unit}
                    defaultDisplayUnit={item.default_display_unit}
                    measurementSystem={measurementSystem}
                    style={{ fontSize: 12, color: item.checked ? colors.line : colors.muted }}
                />
            </View>

            {/* Quantity Controls */}
            <View className="flex-row items-center mr-2">
                <TouchableOpacity
                    onPress={() => handleUpdateQuantity(item, -0.5)}
                    className="bg-linen p-2 rounded-lg border border-line"
                >
                    <MinusIcon size={16} color={colors.ink} />
                </TouchableOpacity>

                <Text className="text-lg font-bold w-12 text-center">{item.quantity}</Text>

                <TouchableOpacity
                    onPress={() => handleUpdateQuantity(item, 0.5)}
                    className="bg-herb p-2 rounded-lg"
                >
                    <PlusIcon size={16} color={colors.onHerb} />
                </TouchableOpacity>
            </View>

            {/* Delete Button */}
            <TouchableOpacity className="p-2">
                <TrashIcon size={18} color={colors.danger} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View className="flex-1 bg-linen">
            <AppHeader title="Shopping List" showBackButton />

            <View className="flex-1 p-4">
                {/* Success Message */}
                {showMessage && (
                    <View className="mb-4 p-3 bg-sage border border-line rounded-xl">
                        <Text className="text-herb-deep text-sm font-medium">{message}</Text>
                    </View>
                )}

                {/* Search Bar */}
                <View className="relative mb-4">
                    <View className="absolute left-3 top-3 z-10">
                        <SearchIcon size={18} color={colors.muted} />
                    </View>
                    <TextInput
                        placeholder="Search shopping items..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl border border-line text-ink"
                    />
                </View>

                {/* Add New Item Button / Form */}
                {!isAddingItem ? (
                    <TouchableOpacity
                        onPress={() => setIsAddingItem(true)}
                        className="flex-row items-center justify-center bg-surface border border-line py-3 px-4 rounded-xl mb-4"
                    >
                        <PlusIcon size={18} color={colors.ink} />
                        <Text className="text-ink font-medium ml-2">Add New Shopping Item</Text>
                    </TouchableOpacity>
                ) : (
                    <View className="bg-surface p-4 rounded-xl border border-line mb-4">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="font-medium text-ink">Add Item to Shopping List</Text>
                            <TouchableOpacity onPress={() => setIsAddingItem(false)}>
                                <XIcon size={20} color={colors.muted} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            placeholder="Item name"
                            value={newItem.name}
                            onChangeText={(text) => setNewItem({ ...newItem, name: text })}
                            className="w-full p-3 border border-line rounded-lg mb-3 bg-linen text-ink"
                        />

                        <View className="flex-row gap-2 mb-3">
                            <TextInput
                                placeholder="Qty"
                                value={newItem.quantity}
                                onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
                                keyboardType="numeric"
                                className="flex-1 p-3 border border-line rounded-lg bg-linen text-ink"
                            />
                            <View className="flex-[2]">
                                <UnitSelect
                                    kind={preferredUnitForIngredient(
                                        ingredients.find(i => i.name.toLowerCase() === newItem.name.toLowerCase()) || {
                                            default_unit: newItem.unit,
                                        },
                                        measurementSystem,
                                    ).kind}
                                    value={newItem.unit}
                                    onChange={unit => setNewItem({ ...newItem, unit })}
                                    measurementSystem={measurementSystem}
                                    preferSystemUnits
                                />
                            </View>
                        </View>

                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                onPress={() => {
                                    setNewItem({ name: '', quantity: '1', unit: '' });
                                    setIsAddingItem(false);
                                }}
                                className="flex-1 bg-linen border border-line py-3 rounded-lg"
                            >
                                <Text className="text-ink text-center font-medium">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAddItem}
                                className="flex-1 bg-herb py-3 rounded-lg"
                            >
                                <Text className="text-white text-center font-medium">Add Item</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Shopping List */}
                <View className="bg-surface rounded-xl overflow-hidden flex-1 border border-line">
                    <View className="p-4 border-b border-line bg-linen flex-row items-center justify-between">
                        <Text className="font-semibold text-ink">Items to Buy</Text>
                        <TouchableOpacity
                            onPress={handleCompleteAll}
                            disabled={uncheckedCount === 0 || isCompletingAll}
                            className={`flex-row items-center px-3 py-1.5 rounded-lg ${
                                uncheckedCount === 0 || isCompletingAll ? 'bg-sage' : 'bg-herb'
                            }`}
                        >
                            <CheckIcon
                                size={14}
                                color={uncheckedCount === 0 || isCompletingAll ? colors.muted : colors.onHerb}
                            />
                            <Text
                                className={`ml-1.5 text-sm font-medium ${
                                    uncheckedCount === 0 || isCompletingAll ? 'text-muted' : 'text-white'
                                }`}
                            >
                                {isCompletingAll ? 'Completing…' : 'Complete all'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {filteredItems.length === 0 ? (
                        <View className="p-6 items-center">
                            <Text className="text-muted">No items in your shopping list</Text>
                            {searchQuery ? (
                                <Text className="text-muted text-sm mt-1">Try a different search term</Text>
                            ) : (
                                <AskAiEmptyCta
                                    hint="Skip the forms — just tell the AI what you need."
                                    label="Ask AI to build a list"
                                    onPress={() =>
                                        navigation.navigate(
                                            'AICookingAssistant' as never,
                                            { initialPrompt: 'Add milk, eggs, and bread to my shopping list' } as never,
                                        )
                                    }
                                />
                            )}
                        </View>
                    ) : (
                        <FlatList
                            data={filteredItems}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={{ padding: 12 }}
                        />
                    )}
                </View>
            </View>
        </View>
    );
}