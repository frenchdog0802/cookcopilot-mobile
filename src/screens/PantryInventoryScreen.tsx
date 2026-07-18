import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    TextInput,
    ScrollView,
} from 'react-native';
import {
    PlusIcon,
    MinusIcon,
    TrashIcon,
    SearchIcon,
    PackageIcon,
} from 'lucide-react-native';
import { usePantry } from '../contexts/pantryContext';
import useSearchIngredients from '../hooks/useSearchIngredient';
import { PantryItem, IngredientEntry } from '../types';
import AppHeader from '../components/AppHeader';
import { UnitSelect, QuantityLabel, preferredUnitForIngredient } from '../components/UnitSelect';
import type { MeasurementSystem } from '../utils/units';

interface PantryInventoryProps {
    onBack?: () => void;
}

export default function PantryInventoryScreen({ onBack }: PantryInventoryProps = {}) {
    const {
        pantryItems: oriPantryItems,
        updatePantryItem,
        addPantryItem,
        removePantryItem,
        ingredients,
        fetchAllPantryItems,
        userSettings,
    } = usePantry();

    const measurementSystem = (userSettings.measurement_unit === 'imperial' ? 'imperial' : 'metric') as MeasurementSystem;
    const [pantryItems, setPantryItems] = useState(oriPantryItems);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        quantity: 1,
        unit: '',
    });
    const [showDropdown, setShowDropdown] = useState(false);

    useEffect(() => {
        fetchAllPantryItems();
    }, [fetchAllPantryItems]);

    useEffect(() => {
        setPantryItems(oriPantryItems);
    }, [oriPantryItems]);

    const { filteredIngredients, loading } = useSearchIngredients(
        newItem.name,
        ingredients
    );

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) {
            return pantryItems;
        }
        return pantryItems.filter(item =>
            item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [pantryItems, searchQuery]);

    const handleAddItem = () => {
        if (!newItem.name.trim()) return;

        const existing = pantryItems.find(
            i => i.name.toLowerCase() === newItem.name.toLowerCase()
        );

        if (existing) {
            updatePantryItem({ ...existing, quantity: newItem.quantity });
        } else {
            addPantryItem(newItem);
        }

        setNewItem({ name: '', quantity: 1, unit: '' });
        setIsAddingItem(false);
        setShowDropdown(false);
    };

    const handleUpdateQuantity = (item: PantryItem, delta: number) => {
        const next = item.quantity + delta;
        if (next >= 0) {
            updatePantryItem({ ...item, quantity: next });
        }
    };

    const renderItem = ({ item }: { item: PantryItem }) => (
        <View className="flex-row items-center p-3 bg-white rounded-xl mb-2 border border-gray-100">
            {/* Name */}
            <View className="flex-1 mr-3">
                <Text
                    className="font-semibold text-gray-800 capitalize"
                    numberOfLines={1}
                >
                    {item.name}
                </Text>
            </View>

            {/* Quantity Controls */}
            <View className="flex-row items-center mr-2">
                <TouchableOpacity
                    onPress={() => handleUpdateQuantity(item, -0.5)}
                    className="bg-gray-100 p-2 rounded-lg"
                >
                    <MinusIcon size={16} color="#374151" />
                </TouchableOpacity>

                <QuantityLabel
                    quantity={item.quantity}
                    unit={item.unit}
                    unitKind={item.unit_kind}
                    baseUnit={item.base_unit}
                    defaultDisplayUnit={item.default_display_unit}
                    measurementSystem={measurementSystem}
                    style={{ width: 72, textAlign: 'center', fontWeight: '700', fontSize: 14 }}
                />

                <TouchableOpacity
                    onPress={() => handleUpdateQuantity(item, 0.5)}
                    className="bg-red-500 p-2 rounded-lg"
                >
                    <PlusIcon size={16} color="white" />
                </TouchableOpacity>
            </View>

            {/* Delete Button */}
            <TouchableOpacity onPress={() => removePantryItem(item.id)} className="p-2">
                <TrashIcon size={18} color="#ef4444" />
            </TouchableOpacity>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50">
            <AppHeader title="Kitchen Inventory" showBackButton onBack={onBack} />

            <ScrollView className="flex-1 p-4">
                {/* Search */}
                <View className="flex-row items-center bg-white rounded-xl px-3 mb-4 border border-gray-200">
                    <SearchIcon size={18} color="#9ca3af" />
                    <TextInput
                        placeholder="Search ingredients..."
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="flex-1 p-3"
                    />
                </View>

                {/* Add Item */}
                {!isAddingItem ? (
                    <TouchableOpacity
                        onPress={() => setIsAddingItem(true)}
                        className="bg-white border border-gray-200 rounded-xl p-4 flex-row justify-center items-center mb-4"
                    >
                        <PlusIcon size={18} />
                        <Text className="ml-2 font-medium">Add New Item</Text>
                    </TouchableOpacity>
                ) : (
                    <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">
                        <TextInput
                            placeholder="Item name"
                            value={newItem.name}
                            onChangeText={text => {
                                setNewItem({ ...newItem, name: text });
                                setShowDropdown(true);
                            }}
                            className="border border-gray-200 rounded-lg p-2 mb-2"
                        />

                        {showDropdown && (
                            <View className="border border-gray-200 rounded-lg mb-2">
                                {loading ? (
                                    <Text className="p-3 text-center">Loading…</Text>
                                ) : (
                                    filteredIngredients.map(i => (
                                        <TouchableOpacity
                                            key={i.id}
                                            onPress={() => {
                                                setNewItem({
                                                    name: i.name,
                                                    quantity: 1,
                                                    unit: preferredUnitForIngredient(i, measurementSystem).unit,
                                                });
                                                setShowDropdown(false);
                                            }}
                                            className="p-3"
                                        >
                                            <Text>{i.name}</Text>
                                        </TouchableOpacity>
                                    ))
                                )}
                            </View>
                        )}

                        <View className="mb-3">
                            <UnitSelect
                                kind={preferredUnitForIngredient(
                                    ingredients.find(x => x.name.toLowerCase() === newItem.name.toLowerCase()) || {
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
                        <View className="flex-row gap-2">
                            <TouchableOpacity
                                onPress={() => setIsAddingItem(false)}
                                className="flex-1 bg-gray-100 p-3 rounded-lg"
                            >
                                <Text className="text-center">Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleAddItem}
                                className="flex-1 bg-red-500 p-3 rounded-lg"
                            >
                                <Text className="text-white text-center">Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* List */}
                {filteredItems.length === 0 ? (
                    <View className="bg-white rounded-xl p-6 items-center">
                        <PackageIcon size={32} color="#d1d5db" />
                        <Text className="text-gray-500 mt-2">
                            No items found
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredItems}
                        keyExtractor={item => String(item.id)}
                        renderItem={renderItem}
                        scrollEnabled={false}
                    />
                )}
            </ScrollView>
        </View>
    );
}
