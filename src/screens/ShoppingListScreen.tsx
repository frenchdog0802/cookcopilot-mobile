import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { usePantry } from '../contexts/pantryContext';
import { PlusIcon, MinusIcon, CheckIcon, SearchIcon, TrashIcon, XIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import { UnitSelect, QuantityLabel, preferredUnitForIngredient } from '../components/UnitSelect';
import type { MeasurementSystem } from '../utils/units';

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
        <View className={`flex-row items-center p-3 bg-white rounded-xl mb-2 ${item.checked ? 'bg-gray-50' : ''}`}>
            {/* Checkbox */}
            <TouchableOpacity onPress={() => handleTogglePurchased(item.id)} className="mr-3">
                <View
                    className={`w-6 h-6 rounded border-2 items-center justify-center ${item.checked ? 'bg-green-500 border-green-500' : 'border-gray-300'}`}
                >
                    {item.checked && <CheckIcon size={14} color="white" />}
                </View>
            </TouchableOpacity>

            {/* Name & quantity */}
            <View className="flex-1 mr-3">
                <Text
                    className={`font-medium capitalize ${item.checked ? 'line-through text-gray-400' : 'text-gray-800'}`}
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
                    style={{ fontSize: 12, color: item.checked ? '#d1d5db' : '#6b7280' }}
                />
            </View>

            {/* Quantity Controls */}
            <View className="flex-row items-center mr-2">
                <TouchableOpacity
                    onPress={() => handleUpdateQuantity(item, -0.5)}
                    className="bg-gray-100 p-2 rounded-lg"
                >
                    <MinusIcon size={16} color="#374151" />
                </TouchableOpacity>

                <Text className="text-lg font-bold w-12 text-center">{item.quantity}</Text>

                <TouchableOpacity
                    onPress={() => handleUpdateQuantity(item, 0.5)}
                    className="bg-red-500 p-2 rounded-lg"
                >
                    <PlusIcon size={16} color="white" />
                </TouchableOpacity>
            </View>

            {/* Delete Button */}
            <TouchableOpacity className="p-2">
                <TrashIcon size={18} color="#ef4444" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <AppHeader title="Shopping List" showBackButton />

            <View className="flex-1 p-4">
                {/* Success Message */}
                {showMessage && (
                    <View className="mb-4 p-3 bg-green-50 border border-green-200 rounded-xl">
                        <Text className="text-green-800 text-sm font-medium">{message}</Text>
                    </View>
                )}

                {/* Search Bar */}
                <View className="relative mb-4">
                    <View className="absolute left-3 top-3 z-10">
                        <SearchIcon size={18} color="#9ca3af" />
                    </View>
                    <TextInput
                        placeholder="Search shopping items..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200"
                    />
                </View>

                {/* Add New Item Button / Form */}
                {!isAddingItem ? (
                    <TouchableOpacity
                        onPress={() => setIsAddingItem(true)}
                        className="flex-row items-center justify-center bg-white border border-gray-200 py-3 px-4 rounded-xl mb-4"
                    >
                        <PlusIcon size={18} color="#374151" />
                        <Text className="text-gray-700 font-medium ml-2">Add New Shopping Item</Text>
                    </TouchableOpacity>
                ) : (
                    <View className="bg-white p-4 rounded-xl border border-gray-200 mb-4">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="font-medium text-gray-700">Add Item to Shopping List</Text>
                            <TouchableOpacity onPress={() => setIsAddingItem(false)}>
                                <XIcon size={20} color="#6b7280" />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            placeholder="Item name"
                            value={newItem.name}
                            onChangeText={(text) => setNewItem({ ...newItem, name: text })}
                            className="w-full p-3 border border-gray-200 rounded-lg mb-3 bg-white"
                        />

                        <View className="flex-row gap-2 mb-3">
                            <TextInput
                                placeholder="Qty"
                                value={newItem.quantity}
                                onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
                                keyboardType="numeric"
                                className="flex-1 p-3 border border-gray-200 rounded-lg bg-white"
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
                                className="flex-1 bg-gray-100 py-3 rounded-lg"
                            >
                                <Text className="text-gray-700 text-center font-medium">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={handleAddItem}
                                className="flex-1 bg-blue-600 py-3 rounded-lg"
                            >
                                <Text className="text-white text-center font-medium">Add Item</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* Shopping List */}
                <View className="bg-white rounded-xl overflow-hidden flex-1">
                    <View className="p-4 border-b border-gray-100 bg-gray-50 flex-row items-center justify-between">
                        <Text className="font-semibold text-gray-800">Items to Buy</Text>
                        <TouchableOpacity
                            onPress={handleCompleteAll}
                            disabled={uncheckedCount === 0 || isCompletingAll}
                            className={`flex-row items-center px-3 py-1.5 rounded-lg ${
                                uncheckedCount === 0 || isCompletingAll ? 'bg-gray-200' : 'bg-green-600'
                            }`}
                        >
                            <CheckIcon
                                size={14}
                                color={uncheckedCount === 0 || isCompletingAll ? '#9ca3af' : 'white'}
                            />
                            <Text
                                className={`ml-1.5 text-sm font-medium ${
                                    uncheckedCount === 0 || isCompletingAll ? 'text-gray-400' : 'text-white'
                                }`}
                            >
                                {isCompletingAll ? 'Completing…' : 'Complete all'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {filteredItems.length === 0 ? (
                        <View className="p-6 items-center">
                            <Text className="text-gray-500">No items in your shopping list</Text>
                            {searchQuery && (
                                <Text className="text-gray-400 text-sm mt-1">Try a different search term</Text>
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