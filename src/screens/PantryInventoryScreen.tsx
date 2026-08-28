import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import {
    PlusIcon,
    SearchIcon,
    PackageIcon,
} from 'lucide-react-native';
import { usePantry } from '../contexts/pantryContext';
import useSearchIngredients from '../hooks/useSearchIngredient';
import { PantryItem } from '../types';
import AppHeader from '../components/AppHeader';
import AskAiEmptyCta from '../components/AskAiEmptyCta';
import { UnitSelect, preferredUnitForIngredient } from '../components/UnitSelect';
import { PantryItemRow } from '../components/pantry/PantryItemRow';
import { SkeletonList } from '../components/ui/Skeleton';
import type { MeasurementSystem } from '../utils/units';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/tokens';

interface PantryInventoryProps {
    onBack?: () => void;
}

export default function PantryInventoryScreen({ onBack }: PantryInventoryProps = {}) {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const {
        pantryItems: oriPantryItems,
        updatePantryItem,
        addPantryItem,
        removePantryItem,
        ingredients,
        fetchAllPantryItems,
        userSettings,
        loading,
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
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

    useEffect(() => {
        void (async () => {
            await fetchAllPantryItems();
            setHasLoadedOnce(true);
        })();
    }, [fetchAllPantryItems]);

    useEffect(() => {
        setPantryItems(Array.isArray(oriPantryItems) ? oriPantryItems : []);
    }, [oriPantryItems]);

    const { filteredIngredients, loading: searchLoading } = useSearchIngredients(
        newItem.name,
        ingredients
    );

    const filteredItems = useMemo(() => {
        const list = Array.isArray(pantryItems) ? pantryItems : [];
        if (!searchQuery.trim()) {
            return list;
        }
        return list.filter(item =>
            item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [pantryItems, searchQuery]);

    const showSkeleton = !hasLoadedOnce && loading && filteredItems.length === 0;

    const handleAddItem = () => {
        if (!newItem.name.trim()) return;

        const existing = pantryItems.find(
            i => i.name.toLowerCase() === newItem.name.toLowerCase()
        );

        if (existing) {
            void updatePantryItem({ ...existing, quantity: newItem.quantity });
        } else {
            void addPantryItem(newItem);
        }

        setNewItem({ name: '', quantity: 1, unit: '' });
        setIsAddingItem(false);
        setShowDropdown(false);
    };

    const handleUpdateQuantity = useCallback((item: PantryItem, delta: number) => {
        const next = item.quantity + delta;
        if (next >= 0) {
            void updatePantryItem({ ...item, quantity: next });
        }
    }, [updatePantryItem]);

    const handleRemove = useCallback((id: string) => {
        void removePantryItem(id);
    }, [removePantryItem]);

    const renderItem = useCallback(({ item }: { item: PantryItem }) => (
        <PantryItemRow
            item={item}
            measurementSystem={measurementSystem}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemove}
        />
    ), [measurementSystem, handleUpdateQuantity, handleRemove]);

    const listHeader = (
        <View className="pb-2">
            <View className="flex-row items-center bg-surface rounded-xl px-3 mb-4 border border-line">
                <SearchIcon size={18} color={colors.muted} />
                <TextInput
                    placeholder="Search ingredients..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    className="flex-1 p-3"
                />
            </View>

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
                            {searchLoading ? (
                                <Text className="p-3 text-center">Loading...</Text>
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
        </View>
    );

    const listEmpty = (
        <View className="bg-surface rounded-xl p-6 items-center border border-line">
            <PackageIcon size={32} color={colors.line} />
            <Text className="text-muted mt-2">No items found</Text>
            {!searchQuery && (
                <AskAiEmptyCta
                    hint="Skip the forms ??just tell the AI what you need."
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
    );

    return (
        <View className="flex-1 bg-linen">
            <AppHeader title={t('pantry.title')} showBackButton onBack={onBack} />

            <View className="flex-1 p-4">
                {showSkeleton ? (
                    <>
                        {listHeader}
                        <SkeletonList count={6} />
                    </>
                ) : (
                    <FlashList
                        data={filteredItems}
                        keyExtractor={item => String(item.id)}
                        renderItem={renderItem}
                        ListHeaderComponent={listHeader}
                        ListEmptyComponent={listEmpty}
                        keyboardShouldPersistTaps="handled"
                    />
                )}
            </View>
        </View>
    );
}
