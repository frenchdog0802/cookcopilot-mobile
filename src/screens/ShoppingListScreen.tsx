import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { usePantry } from '../contexts/pantryContext';
import { PlusIcon, CheckIcon, SearchIcon, XIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import AskAiEmptyCta from '../components/AskAiEmptyCta';
import { UnitSelect, preferredUnitForIngredient } from '../components/UnitSelect';
import { ShoppingListRow, type ShoppingListRowItem } from '../components/shopping/ShoppingListRow';
import { SkeletonList } from '../components/ui/Skeleton';
import type { MeasurementSystem } from '../utils/units';
import { colors } from '../theme/tokens';

export default function ShoppingListScreen() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const {
        shoppingList: oriShoppingList,
        shoppingListSyncStatus,
        fetchAllShoppingListItems,
        fetchAllPantryItems,
        updateShoppingListItem,
        addShoppingListItem,
        removeShoppingListItem,
        retryShoppingListSync,
        ingredients,
        userSettings,
        loading,
    } = usePantry();

    const measurementSystem = (userSettings.measurement_unit === 'imperial' ? 'imperial' : 'metric') as MeasurementSystem;
    const [shoppingList, setShoppingList] = useState<ShoppingListRowItem[]>([]);
    const [showMessage, setShowMessage] = useState(false);
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [isCompletingAll, setIsCompletingAll] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        quantity: '1',
        unit: '',
    });

    useEffect(() => {
        void (async () => {
            await fetchAllShoppingListItems();
            setHasLoadedOnce(true);
        })();
    }, [fetchAllShoppingListItems]);

    useEffect(() => {
        if (Array.isArray(oriShoppingList)) {
            setShoppingList(oriShoppingList as ShoppingListRowItem[]);
        }
    }, [oriShoppingList]);

    const filteredItems = useMemo(() => {
        const list = Array.isArray(shoppingList) ? shoppingList : [];
        if (!searchQuery.trim()) {
            return list;
        }
        return list.filter(item => {
            return item.name && item.name.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [shoppingList, searchQuery]);

    const showSkeleton = !hasLoadedOnce && loading && filteredItems.length === 0;

    const handleUpdateQuantity = useCallback(async (item: ShoppingListRowItem, delta: number) => {
        const next = item.quantity + delta;
        if (next >= 0) {
            await updateShoppingListItem({ ...item, quantity: next });
        }
    }, [updateShoppingListItem]);

    const handleTogglePurchased = useCallback(async (id: string) => {
        const item = shoppingList.find(i => i.id === id);
        if (item) {
            await updateShoppingListItem({ ...item, checked: !item.checked });
            setMessage('Item updated!');
            setShowMessage(true);
            setTimeout(() => setShowMessage(false), 2000);
        }
    }, [shoppingList, updateShoppingListItem]);

    const handleRemove = useCallback((id: string) => {
        void removeShoppingListItem(id);
    }, [removeShoppingListItem]);

    const uncheckedCount = useMemo(
        () => (Array.isArray(shoppingList) ? shoppingList : []).filter(item => !item.checked).length,
        [shoppingList]
    );

    const handleCompleteAll = async () => {
        const unchecked = (Array.isArray(shoppingList) ? shoppingList : []).filter(item => !item.checked);
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

    const renderItem = useCallback(({ item }: { item: ShoppingListRowItem }) => (
        <ShoppingListRow
            item={item}
            measurementSystem={measurementSystem}
            onToggle={handleTogglePurchased}
            onUpdateQuantity={handleUpdateQuantity}
            onRemove={handleRemove}
        />
    ), [measurementSystem, handleTogglePurchased, handleUpdateQuantity, handleRemove]);

    return (
        <View className="flex-1 bg-linen">
            <AppHeader title={t('shopping.title')} showBackButton />

            <View className="flex-1 p-4">
                {(!shoppingListSyncStatus.isOnline ||
                    shoppingListSyncStatus.pendingCount > 0 ||
                    shoppingListSyncStatus.lastSyncError) && (
                    <View className="mb-4 p-3 bg-sage border border-line rounded-xl">
                        <Text className="text-herb-deep text-sm font-medium">
                            {!shoppingListSyncStatus.isOnline
                                ? 'You?™re offline ??changes save on this device'
                                : shoppingListSyncStatus.isSyncing
                                  ? `Syncing ${shoppingListSyncStatus.pendingCount} change${shoppingListSyncStatus.pendingCount === 1 ? '' : 's'}?¦`
                                  : shoppingListSyncStatus.lastSyncError
                                    ? shoppingListSyncStatus.lastSyncError
                                    : `${shoppingListSyncStatus.pendingCount} change${shoppingListSyncStatus.pendingCount === 1 ? '' : 's'} waiting to sync`}
                        </Text>
                        {shoppingListSyncStatus.isOnline &&
                            shoppingListSyncStatus.lastSyncError &&
                            shoppingListSyncStatus.pendingCount > 0 && (
                                <TouchableOpacity
                                    onPress={() => void retryShoppingListSync()}
                                    className="mt-2 self-start bg-herb px-3 py-1.5 rounded-lg"
                                >
                                    <Text className="text-white text-sm font-medium">Retry sync</Text>
                                </TouchableOpacity>
                            )}
                    </View>
                )}

                {showMessage && (
                    <View className="mb-4 p-3 bg-sage border border-line rounded-xl">
                        <Text className="text-herb-deep text-sm font-medium">{message}</Text>
                    </View>
                )}

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
                                {isCompletingAll ? 'Completing...' : 'Complete all'}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {showSkeleton ? (
                        <SkeletonList count={5} />
                    ) : filteredItems.length === 0 ? (
                        <View className="p-6 items-center">
                            <Text className="text-muted">No items in your shopping list</Text>
                            {searchQuery ? (
                                <Text className="text-muted text-sm mt-1">Try a different search term</Text>
                            ) : (
                                <AskAiEmptyCta
                                    hint="Skip the forms ??just tell the AI what you need."
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
                        <FlashList
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
