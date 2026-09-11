import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { FlashList, type FlashListRef } from '@shopify/flash-list';
import { useTranslation } from 'react-i18next';
import { usePantry } from '../contexts/pantryContext';
import { PlusIcon, CheckIcon, SearchIcon, XIcon } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import AppHeader from '../components/AppHeader';
import { UnitSelect, preferredUnitForIngredient } from '../components/UnitSelect';
import { ShoppingListRow, type ShoppingListRowItem } from '../components/shopping/ShoppingListRow';
import { SkeletonList } from '../components/ui/Skeleton';
import type { MeasurementSystem } from '../utils/units';
import { colors } from '../theme/tokens';
import { DRAW_DISTANCE } from '../constants/listPerf';

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
        markAllShoppingListChecked,
        retryShoppingListSync,
        ingredients,
        userSettings,
        loading,
    } = usePantry();

    const measurementSystem = (userSettings.measurement_unit === 'imperial' ? 'imperial' : 'metric') as MeasurementSystem;
    const shoppingList = useMemo(
        () => (Array.isArray(oriShoppingList) ? oriShoppingList : []) as ShoppingListRowItem[],
        [oriShoppingList],
    );
    const [showMessage, setShowMessage] = useState(false);
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddingItem, setIsAddingItem] = useState(false);
    const [isCompletingAll, setIsCompletingAll] = useState(false);
    const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
    const [newItem, setNewItem] = useState({
        name: '',
        quantity: '1',
        unit: 'pcs',
    });
    const listRef = useRef<FlashListRef<ShoppingListRowItem> | null>(null);
    const shoppingListRef = useRef(shoppingList);
    shoppingListRef.current = shoppingList;

    useEffect(() => {
        void (async () => {
            await fetchAllShoppingListItems();
            setHasLoadedOnce(true);
        })();
        // Only load on mount; list updates flow through pantry context.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

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

    const handleUpdateQuantity = useCallback((item: ShoppingListRowItem, delta: number) => {
        const current = shoppingListRef.current.find((i) => i.id === item.id) ?? item;
        const next = current.quantity + delta;
        if (next >= 0) {
            void updateShoppingListItem({ ...current, quantity: next });
        }
    }, [updateShoppingListItem]);

    const handleTogglePurchased = useCallback((id: string) => {
        const item = shoppingListRef.current.find((i) => i.id === id);
        if (item) {
            void updateShoppingListItem({ ...item, checked: !item.checked });
        }
    }, [updateShoppingListItem]);

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
            const count = await markAllShoppingListChecked();
            await fetchAllPantryItems();
            setMessage(t('shopping.allPurchased', { count }));
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
            unit: newItem.unit || 'pcs',
            checked: false,
        });

        setNewItem({ name: '', quantity: '1', unit: 'pcs' });
        setIsAddingItem(false);
        setMessage(t('shopping.itemAdded'));
        setShowMessage(true);
        setTimeout(() => setShowMessage(false), 2000);
        requestAnimationFrame(() => {
            listRef.current?.scrollToOffset({ offset: 0, animated: true });
        });
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

    // Only surface problems — routine online sync stays invisible (like Pantry).
    const showSyncBanner =
        !shoppingListSyncStatus.isOnline ||
        (Boolean(shoppingListSyncStatus.lastSyncError) &&
            shoppingListSyncStatus.pendingCount > 0);

    const syncBannerMessage = !shoppingListSyncStatus.isOnline
        ? t('shopping.syncOffline')
        : shoppingListSyncStatus.lastSyncError ?? t('shopping.syncPending', { count: shoppingListSyncStatus.pendingCount });

    return (
        <View className="flex-1 bg-linen" testID="shopping-screen">
            <AppHeader title={t('shopping.title')} showMenuButton />

            <View className="flex-1 p-4">
                {showSyncBanner && (
                    <View className="mb-4 p-3 bg-sage border border-line rounded-xl">
                        <Text className="text-herb-deep text-sm font-medium">
                            {syncBannerMessage}
                        </Text>
                        {shoppingListSyncStatus.isOnline &&
                            shoppingListSyncStatus.lastSyncError &&
                            shoppingListSyncStatus.pendingCount > 0 && (
                                <TouchableOpacity
                                    onPress={() => void retryShoppingListSync()}
                                    className="mt-2 self-start bg-herb px-3 py-1.5 rounded-lg"
                                >
                                    <Text className="text-white text-sm font-medium">
                                        {t('shopping.syncRetry')}
                                    </Text>
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
                        placeholder={t('shopping.searchPlaceholder')}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        className="w-full pl-10 pr-4 py-3 bg-surface rounded-xl border border-line text-ink"
                    />
                </View>

                {!isAddingItem ? (
                    <TouchableOpacity
                        testID="shopping-add-button"
                        onPress={() => setIsAddingItem(true)}
                        className="flex-row items-center justify-center bg-surface border border-line py-3 px-4 rounded-xl mb-4"
                    >
                        <PlusIcon size={18} color={colors.ink} />
                        <Text className="text-ink font-medium ml-2">{t('shopping.addItem')}</Text>
                    </TouchableOpacity>
                ) : (
                    <View className="bg-surface p-4 rounded-xl border border-line mb-4">
                        <View className="flex-row justify-between items-center mb-3">
                            <Text className="font-medium text-ink">{t('shopping.addItemTitle')}</Text>
                            <TouchableOpacity onPress={() => setIsAddingItem(false)}>
                                <XIcon size={20} color={colors.muted} />
                            </TouchableOpacity>
                        </View>

                        <TextInput
                            testID="shopping-item-name"
                            placeholder={t('shopping.itemNamePlaceholder')}
                            value={newItem.name}
                            onChangeText={(text) => setNewItem({ ...newItem, name: text })}
                            className="w-full p-3 border border-line rounded-lg mb-3 bg-linen text-ink"
                        />

                        <View className="flex-row gap-2 mb-3">
                            <TextInput
                                placeholder={t('pantry.quantity')}
                                value={newItem.quantity}
                                onChangeText={(text) => setNewItem({ ...newItem, quantity: text })}
                                keyboardType="numeric"
                                className="flex-1 p-3 border border-line rounded-lg bg-linen text-ink"
                            />
                            <View className="flex-[2]">
                                <UnitSelect
                                    kind={preferredUnitForIngredient(
                                        (Array.isArray(ingredients) ? ingredients : []).find(i => i.name.toLowerCase() === newItem.name.toLowerCase()) || {
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
                                    setNewItem({ name: '', quantity: '1', unit: 'pcs' });
                                    setIsAddingItem(false);
                                }}
                                className="flex-1 bg-linen border border-line py-3 rounded-lg"
                            >
                                <Text className="text-ink text-center font-medium">{t('common.cancel')}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                testID="shopping-save-item"
                                onPress={handleAddItem}
                                className="flex-1 bg-herb py-3 rounded-lg"
                            >
                                <Text className="text-white text-center font-medium">{t('common.add')}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                <View className="bg-surface rounded-xl overflow-hidden flex-1 border border-line">
                    <View className="p-4 border-b border-line bg-linen flex-row items-center justify-between">
                        <Text className="font-semibold text-ink">{t('shopping.itemsToBuy')}</Text>
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
                                {isCompletingAll ? t('shopping.completing') : t('shopping.completeAll')}
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {showSkeleton ? (
                        <SkeletonList count={5} />
                    ) : filteredItems.length === 0 ? (
                        <View className="p-6 items-center">
                            <Text className="text-muted">{t('shopping.empty')}</Text>
                            {searchQuery ? (
                                <Text className="text-muted text-sm mt-1">{t('common.tryDifferentSearch')}</Text>
                            ) : null}
                        </View>
                    ) : (
                        <FlashList
                            ref={listRef}
                            data={filteredItems}
                            renderItem={renderItem}
                            keyExtractor={(item) => item.id.toString()}
                            contentContainerStyle={{ padding: 12 }}
                            drawDistance={DRAW_DISTANCE}
                        />
                    )}
                </View>
            </View>
        </View>
    );
}
