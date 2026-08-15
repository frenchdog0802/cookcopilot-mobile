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
import AskAiEmptyCta from '../components/AskAiEmptyCta';
import { UnitSelect, QuantityLabel, preferredUnitForIngredient } from '../components/UnitSelect';
import type { MeasurementSystem } from '../utils/units';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/tokens';

interface PantryInventoryProps {
    onBack?: () => void;
}

export default function PantryInventoryScreen({ onBack }: PantryInventoryProps = {}) {
    const navigation = useNavigation();
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
        <View className="flex-row items-center p-3 bg-surface rounded-xl mb-2 border border-line">
            {/* Name */}
            <View className="flex-1 mr-3">
                <Text
                    className="font-semibold text-ink capitalize"
                    numberOfLines={1}
                >
                    {item.name}
                </Text>
            </View>

            {/* Quantity Controls */}
            <View className="flex-row items-center mr-2">
                <TouchableOpacity
                    onPress={() => handleUpdateQuantity(item, -0.5)}
                    className="bg-linen p-2 rounded-lg border border-line"
                >
                    <MinusIcon size={16} color={colors.ink} />
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
                    className="bg-herb p-2 rounded-lg"
                >
                    <PlusIcon size={16} color={colors.onHerb} />
                </TouchableOpacity>
            </View>

            {/* Delete Button */}
            <TouchableOpacity onPress={() => removePantryItem(item.id)} className="p-2">
                <TrashIcon size={18} color={colors.danger} />
            </TouchableOpacity>
        </View>
    );

    return (
        <View className="flex-1 bg-linen">
            <AppHeader title="Kitchen Inventory" showBackButton onBack={onBack} />

            <ScrollView className="flex-1 p-4">
                {/* Search */}
                <View className="flex-row items-center bg-surface rounded-xl px-3 mb-4 border border-line">
                    <SearchIcon size={18} color={colors.muted} />
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
                        className="bg-surface border border-line rounded-xl p-4 flex-row justify-center items-center mb-4"
                    >
                        <PlusIcon size={18} color={colors.ink} />
                        <Text className="ml-2 font-medium text-ink">Add New Item</Text>
                    </TouchableOpacity>
                ) : (
                    <View className="bg-surface rounded-xl p-4 mb-4 border border-line">
                        <TextInput
                            placeholder="Item name"
                            value={newItem.name}
                            onChangeText={text => {
                                setNewItem({ ...newItem, name: text });
                                setShowDropdown(true);
                            }}
                            className="border border-line rounded-lg p-2 mb-2 bg-linen text-ink"
                        />

                        {showDropdown && (
                            <View className="border border-line rounded-lg mb-2 bg-linen">
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
                                className="flex-1 bg-linen border border-line p-3 rounded-lg"
                            >
                                <Text className="text-center">Cancel</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleAddItem}
                                className="flex-1 bg-herb p-3 rounded-lg"
                            >
                                <Text className="text-white text-center">Add</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {/* List */}
                {filteredItems.length === 0 ? (
                    <View className="bg-surface rounded-xl p-6 items-center border border-line">
                        <PackageIcon size={32} color={colors.line} />
                        <Text className="text-muted mt-2">
                            No items found
                        </Text>
                        {!searchQuery && (
                            <AskAiEmptyCta
                                hint="Skip the forms — just tell the AI what you need."
                                label="Ask AI to update pantry"
                                onPress={() =>
                                    navigation.navigate(
                                        'AICookingAssistant' as never,
                                        { initialPrompt: 'Add chicken, rice, and broccoli to my pantry' } as never,
                                    )
                                }
                            />
                        )}
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
