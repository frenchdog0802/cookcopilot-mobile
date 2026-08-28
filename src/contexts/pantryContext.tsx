import React, { useState, createContext, useContext, useCallback, useEffect } from 'react';
import {
    PantryItem,
    ShoppingListItem,
    ShoppingListSyncStatus,
    Recipe,
    Folder,
    UserSettings,
    IngredientEntry,
    MealPlan,
    ApiResponse,
    ConfirmMealPlanResult,
} from '../types';
import { folderApi } from '../api/folder';
import { ingredientApi } from '../api/ingredient';
import { recipeApi } from '../api/recipe';
import { pantryItemApi, parsePantryItem, parsePantryItems } from '../api/pantryItem';
import { shoppingListApi, parseShoppingListItems } from '../api/shoppingList';
import { mealPlanApi } from '../api/mealPlan';
import { userPreferencesApi } from '../api/userPreferences';
import { useAuth } from './authContext';
import {
    DEFAULT_SYNC_STATUS,
    createLocalItemId,
    enqueueCreate,
    enqueueDelete,
    enqueueUpdate,
    flushShoppingListQueue,
    getIsOnline,
    loadQueue,
    loadSnapshot,
    mergeNames,
    saveQueue,
    saveSnapshot,
    subscribeConnectivity,
} from '../services/shoppingListOffline';

function unwrapListResponse<T>(data: T[] | Record<string, T[] | undefined>, key: string): T[] {
    if (Array.isArray(data)) return data;
    const list = data[key];
    return Array.isArray(list) ? list : [];
}

function unwrapEntityResponse<T>(
    data: T | Record<string, T | undefined> | undefined,
    key: string,
): T | null {
    if (!data || typeof data !== 'object') return null;
    if ('id' in data && (data as { id?: unknown }).id != null) {
        return data as T;
    }
    const nested = (data as Record<string, T | undefined>)[key];
    return nested ?? null;
}

function normalizeInstructions(raw: unknown, stepsFallback?: unknown): string[] {
    if (Array.isArray(raw)) {
        return raw.map(String).map((s) => s.trim()).filter(Boolean);
    }
    if (typeof raw === 'string' && raw.trim()) {
        return raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
    }
    if (Array.isArray(stepsFallback)) {
        return stepsFallback.map(String).map((s) => s.trim()).filter(Boolean);
    }
    return [];
}

function normalizeRecipeImage(raw: unknown): Recipe['image'] {
    if (!raw || typeof raw !== 'object') return null;
    const image = raw as { url?: string; public_id?: string };
    const url = typeof image.url === 'string' ? image.url.trim() : '';
    if (!url) return null;
    return {
        url,
        public_id: typeof image.public_id === 'string' ? image.public_id : '',
    };
}

export function normalizeRecipe(raw: Record<string, unknown> | Recipe): Recipe {
    const r = raw as Record<string, unknown>;
    return {
        id: String(r.id ?? ''),
        meal_name: String(r.meal_name ?? r.mealName ?? ''),
        folder_id: r.folder_id != null || r.folderId != null
            ? String(r.folder_id ?? r.folderId)
            : '',
        instructions: normalizeInstructions(r.instructions, r.steps),
        ingredients: Array.isArray(r.ingredients) ? (r.ingredients as Recipe['ingredients']) : [],
        image: normalizeRecipeImage(r.image),
    };
}

function normalizeMealPlan(raw: Record<string, unknown> | MealPlan): MealPlan {
    const record = raw as Record<string, unknown>;
    const statusRaw = String(record.status ?? 'PLANNED').toUpperCase();
    const status = (['PLANNED', 'PENDING_CONFIRM', 'CONFIRMED', 'SKIPPED'].includes(statusRaw)
        ? statusRaw
        : 'PLANNED') as MealPlan['status'];
    return {
        id: String(record.id ?? ''),
        recipe_id: String(record.recipe_id ?? record.recipeId ?? ''),
        meal_type: (record.meal_type ?? record.mealType ?? 'dinner') as MealPlan['meal_type'],
        serving_date: String(record.serving_date ?? record.servingDate ?? ''),
        meal_name: String(record.meal_name ?? record.mealName ?? ''),
        image: (record.image as string | null | undefined)
            ?? ((record.image_url as { url?: string } | undefined)?.url ?? null),
        status,
    };
}

/** Backend expects instructions as a single string. */
function serializeRecipeForApi(recipe: Partial<Recipe>): Record<string, unknown> {
    const instructions = recipe.instructions;
    return {
        ...recipe,
        instructions: Array.isArray(instructions)
            ? instructions.filter(Boolean).join('\n')
            : instructions ?? '',
        image: recipe.image?.url ? recipe.image : null,
    };
}

interface PantryContextType {
    // Recipes
    recipes: Recipe[];
    fetchAllRecipes: () => Promise<Recipe[]>;
    addRecipe: (recipe: Partial<Recipe>) => Promise<ApiResponse<Recipe>>;
    updateRecipe: (recipe: Recipe) => Promise<void>;
    deleteRecipe: (id: string) => Promise<void>;

    // User settings
    userSettings: UserSettings;
    updateUserSettings: (settings: UserSettings) => void;

    // Folders
    folders: Folder[];
    fetchAllFolders: () => Promise<void>;
    addFolder: (folder: Partial<Folder>) => Promise<ApiResponse<Folder>>;
    deleteFolder: (id: string) => Promise<void>;
    updateFolder: (folder: Folder) => Promise<void>;

    // Pantry items
    pantryItems: PantryItem[];
    fetchAllPantryItems: () => Promise<void>;
    updatePantryItem: (item: PantryItem) => Promise<void>;
    updatePantryItems: (items: PantryItem[]) => Promise<void>;
    addPantryItem: (item: Partial<PantryItem>) => Promise<ApiResponse<PantryItem>>;
    removePantryItem: (id: string) => Promise<void>;

    // Ingredients
    fetchAllIngredients: (query?: string | null) => Promise<void>;
    ingredients: IngredientEntry[];

    // Shopping list
    shoppingList: ShoppingListItem[];
    shoppingListSyncStatus: ShoppingListSyncStatus;
    fetchAllShoppingListItems: () => Promise<ShoppingListItem[]>;
    updateShoppingListItem: (item: ShoppingListItem) => Promise<ApiResponse<ShoppingListItem>>;
    addShoppingListItem: (item: Partial<ShoppingListItem>) => Promise<ApiResponse<ShoppingListItem>>;
    removeShoppingListItem: (id: string) => Promise<void>;
    retryShoppingListSync: () => Promise<void>;

    // Meal plans
    mealPlan: MealPlan[];
    fetchAllMealPlans: () => Promise<MealPlan[]>;
    addMealPlan: (mealPlan: Partial<MealPlan>) => Promise<ApiResponse<MealPlan>>;
    updateMealPlan: (mealPlan: MealPlan) => Promise<void>;
    deleteMealPlan: (id: string) => Promise<void>;
    confirmMealPlan: (id: string) => Promise<ApiResponse<ConfirmMealPlanResult>>;
    skipMealPlan: (id: string) => Promise<ApiResponse<{ mealPlan: MealPlan; alreadySkipped: boolean }>>;

    // Loading state
    loading: boolean;
}

const PantryContext = createContext<PantryContextType | undefined>(undefined);

// Default folders for fallback
const DEFAULT_FOLDERS: Folder[] = [
    { id: 'uncategorized', name: 'Uncategorized', icon: 'FolderIcon' },
];

export function PantryProvider({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const userId = user?.id ?? '';
    const [loading, setLoading] = useState(false);
    const [mealPlan, setMealPlan] = useState<MealPlan[]>([]);
    const [ingredients, setIngredients] = useState<IngredientEntry[]>([]);
    const [folders, setFolders] = useState<Folder[]>(DEFAULT_FOLDERS);
    const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
    const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
    const [shoppingListSyncStatus, setShoppingListSyncStatus] =
        useState<ShoppingListSyncStatus>(DEFAULT_SYNC_STATUS);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [userSettings, setUserSettings] = useState<UserSettings>({
        name: '',
        language: 'english',
        measurement_unit: 'metric',
    });

    const updateSyncStatus = useCallback((patch: Partial<ShoppingListSyncStatus>) => {
        setShoppingListSyncStatus((prev) => ({ ...prev, ...patch }));
    }, []);

    const runFlush = useCallback(async () => {
        if (!userId) return;
        updateSyncStatus({ isSyncing: true });
        const result = await flushShoppingListQueue(userId, {
            onItems: (items) => setShoppingList(items),
            onQueue: (mutations) => updateSyncStatus({ pendingCount: mutations.length }),
        });
        updateSyncStatus({
            isSyncing: false,
            pendingCount: result.remaining,
            lastSyncError: result.ok ? null : (result.error ?? 'Sync failed'),
            ...(result.ok && result.remaining === 0 ? { lastSyncedAt: Date.now() } : {}),
        });
        if (result.items) {
            setShoppingList(result.items);
        }
    }, [userId, updateSyncStatus]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const online = await getIsOnline();
            if (!cancelled) updateSyncStatus({ isOnline: online });
        })();
        const unsubscribe = subscribeConnectivity((online) => {
            updateSyncStatus({ isOnline: online });
            if (online && userId) {
                void runFlush();
            }
        });
        return () => {
            cancelled = true;
            unsubscribe();
        };
    }, [userId, updateSyncStatus, runFlush]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            if (!userId) {
                setShoppingList([]);
                setShoppingListSyncStatus(DEFAULT_SYNC_STATUS);
                return;
            }
            const cached = await loadSnapshot(userId);
            const queue = await loadQueue(userId);
            if (cancelled) return;
            setShoppingList(cached);
            updateSyncStatus({ pendingCount: queue.length });
        })();
        return () => {
            cancelled = true;
        };
    }, [userId, updateSyncStatus]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const prefs = await userPreferencesApi.get();
                if (!cancelled && prefs?.measurementUnit) {
                    setUserSettings((prev) => ({
                        ...prev,
                        measurement_unit: prefs.measurementUnit,
                    }));
                }
            } catch (err) {
                console.error('Load measurement preference failed:', err);
            }
        })();
        return () => {
            cancelled = true;
        };
    }, []);

    // === FOLDER FUNCTIONS ===
    const fetchAllFolders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await folderApi.list();
            if (response.success && response.data) {
                const fetchedFolders = unwrapListResponse(
                    response.data as Folder[] | { folders?: Folder[] },
                    'folders',
                );
                setFolders(fetchedFolders.length > 0 ? fetchedFolders : DEFAULT_FOLDERS);
            }
        } catch (error) {
            console.error('Failed to fetch folders:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const addFolder = useCallback(async (folder: Partial<Folder>): Promise<ApiResponse<Folder>> => {
        const response = await folderApi.create(folder);
        const createdFolder = unwrapEntityResponse<Folder>(
            response.data as Folder | { folder?: Folder },
            'folder',
        );
        if (response.success && createdFolder) {
            setFolders((prev) => [...prev, createdFolder]);
        }
        return createdFolder ? { ...response, data: createdFolder } : response;
    }, []);

    const deleteFolder = useCallback(async (id: string) => {
        const response = await folderApi.delete(id);
        if (response.success) {
            setFolders((prev) => prev.filter((f) => f.id !== id));
            // Move recipes to uncategorized
            setRecipes((prev) =>
                prev.map((r) => (r.folder_id === id ? { ...r, folder_id: 'uncategorized' } : r))
            );
        }
    }, []);

    const updateFolder = useCallback(async (folder: Folder) => {
        const response = await folderApi.update(folder.id, folder);
        const updatedFolder = unwrapEntityResponse<Folder>(
            response.data as Folder | { folder?: Folder },
            'folder',
        );
        if (response.success && updatedFolder) {
            setFolders((prev) => prev.map((f) => (f.id === folder.id ? updatedFolder : f)));
        }
    }, []);

    // === RECIPE FUNCTIONS ===
    const fetchAllRecipes = useCallback(async (): Promise<Recipe[]> => {
        setLoading(true);
        try {
            const response = await recipeApi.list();
            if (response.success && response.data) {
                const data = response.data as Recipe[] | { recipes?: Recipe[] };
                const recipesList = unwrapListResponse(data, 'recipes').map((recipe) =>
                    normalizeRecipe(recipe as unknown as Record<string, unknown>)
                );
                setRecipes(recipesList);
                return recipesList;
            }
        } catch (error) {
            console.error('Failed to fetch recipes:', error);
        } finally {
            setLoading(false);
        }
        return recipes;
    }, [recipes]);

    const addRecipe = useCallback(async (recipe: Partial<Recipe>): Promise<ApiResponse<Recipe>> => {
        const response = await recipeApi.create(serializeRecipeForApi(recipe) as Partial<Recipe>);
        if (response.success && response.data) {
            const raw = response.data as unknown;
            const payload = (raw && typeof raw === 'object' && 'recipe' in (raw as object)
                ? (raw as { recipe: Record<string, unknown> }).recipe
                : raw) as Record<string, unknown>;
            const saved = normalizeRecipe(payload);
            setRecipes((prev) => [...prev, saved]);
            return { ...response, data: saved };
        }
        return response;
    }, []);

    const updateRecipe = useCallback(async (recipe: Recipe) => {
        const normalized = normalizeRecipe(recipe);
        setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? normalized : r)));
        const response = await recipeApi.update(recipe.id, serializeRecipeForApi(normalized) as Partial<Recipe>);
        if (response.success && response.data) {
            const raw = response.data as unknown;
            const payload = (raw && typeof raw === 'object' && 'recipe' in (raw as object)
                ? (raw as { recipe: Record<string, unknown> }).recipe
                : raw) as Record<string, unknown>;
            setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? normalizeRecipe(payload) : r)));
        }
    }, []);

    const deleteRecipe = useCallback(async (id: string) => {
        const response = await recipeApi.delete(id);
        if (response.success) {
            setRecipes((prev) => prev.filter((r) => r.id !== id));
        }
    }, []);

    // === PANTRY ITEM FUNCTIONS ===
    const fetchAllPantryItems = useCallback(async () => {
        setLoading(true);
        try {
            const response = await pantryItemApi.list();
            if (response.success && response.data) {
                setPantryItems(parsePantryItems(response.data));
            } else if (response.success) {
                setPantryItems([]);
            }
        } catch (error) {
            console.error('Failed to fetch pantry items:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const addPantryItem = useCallback(async (item: Partial<PantryItem>): Promise<ApiResponse<PantryItem>> => {
        const response = await pantryItemApi.create(item);
        const created = response.success ? parsePantryItem(response.data) : null;
        if (response.success && created) {
            setPantryItems((prev) => [...prev, created]);
        }
        return { ...response, data: created ?? undefined };
    }, []);

    const updatePantryItem = useCallback(async (item: PantryItem) => {
        const previous = pantryItems.find((i) => i.id === item.id);
        // Optimistically update the local state first
        setPantryItems((prev) => prev.map((i) => (i.id === item.id ? item : i)));

        const response = await pantryItemApi.update(item.id, item);
        const updated = response.success ? parsePantryItem(response.data) : null;
        if (response.success && updated) {
            setPantryItems((prev) => prev.map((i) => (i.id === item.id ? { ...item, ...updated } : i)));
            return;
        }
        // Rollback on hard failure
        if (previous) {
            setPantryItems((prev) => prev.map((i) => (i.id === item.id ? previous : i)));
        }
    }, [pantryItems]);

    const updatePantryItems = useCallback(async (items: PantryItem[]) => {
        const response = await pantryItemApi.updateMany(items);
        if (response.success && response.data) {
            setPantryItems(parsePantryItems(response.data));
        }
    }, []);

    const removePantryItem = useCallback(async (id: string) => {
        const response = await pantryItemApi.delete(id);
        if (response.success) {
            setPantryItems((prev) => prev.filter((i) => i.id !== id));
        }
    }, []);

    // === INGREDIENT FUNCTIONS ===
    const fetchAllIngredients = useCallback(async (query?: string | null) => {
        try {
            const response = await ingredientApi.list(query || undefined);
            if (response.success && response.data) {
                setIngredients(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch ingredients:', error);
        }
    }, []);

    // === SHOPPING LIST FUNCTIONS ===
    const fetchAllShoppingListItems = useCallback(async (): Promise<ShoppingListItem[]> => {
        if (!userId) {
            return shoppingList;
        }

        const cached = await loadSnapshot(userId);
        setShoppingList(cached);

        const online = await getIsOnline();
        updateSyncStatus({ isOnline: online });
        if (!online) {
            const queue = await loadQueue(userId);
            updateSyncStatus({ pendingCount: queue.length });
            return cached;
        }

        setLoading(true);
        try {
            const response = await shoppingListApi.list();
            if (response.success && response.data !== undefined) {
                const serverItems = parseShoppingListItems(response.data);
                const merged = mergeNames(cached, serverItems);
                setShoppingList(merged);
                await saveSnapshot(userId, merged);
                const queue = await loadQueue(userId);
                updateSyncStatus({
                    pendingCount: queue.length,
                    lastSyncError: null,
                    lastSyncedAt: Date.now(),
                });
                if (queue.length > 0) {
                    void runFlush();
                }
                return merged;
            }
            if (response.success) {
                setShoppingList([]);
                await saveSnapshot(userId, []);
                return [];
            }
            // Keep cache on soft failure
            return cached.length > 0 ? cached : shoppingList;
        } catch (error) {
            console.error('Failed to fetch shopping list:', error);
            return cached.length > 0 ? cached : shoppingList;
        } finally {
            setLoading(false);
        }
    }, [userId, shoppingList, updateSyncStatus, runFlush]);

    const updateShoppingListItem = useCallback(async (item: ShoppingListItem): Promise<ApiResponse<ShoppingListItem>> => {
        const next = shoppingList.map((i) => (i.id === item.id ? item : i));
        setShoppingList(next);
        if (userId) {
            await saveSnapshot(userId, next);
            const queue = enqueueUpdate(await loadQueue(userId), item.id, {
                name: item.name,
                quantity: item.quantity,
                unit: item.unit,
                checked: item.checked,
            });
            await saveQueue(userId, queue);
            updateSyncStatus({ pendingCount: queue.length, lastSyncError: null });
            if (shoppingListSyncStatus.isOnline) {
                void runFlush();
            }
        }
        return { success: true, data: item };
    }, [userId, shoppingList, shoppingListSyncStatus.isOnline, updateSyncStatus, runFlush]);

    const addShoppingListItem = useCallback(async (item: Partial<ShoppingListItem>): Promise<ApiResponse<ShoppingListItem>> => {
        const localItem: ShoppingListItem = {
            id: createLocalItemId(),
            name: String(item.name ?? '').trim(),
            quantity: Number(item.quantity ?? 1),
            unit: String(item.unit ?? ''),
            checked: false,
            ingredient_id: item.ingredient_id,
            unit_kind: item.unit_kind,
            base_unit: item.base_unit,
            default_display_unit: item.default_display_unit,
        };
        if (!localItem.name) {
            return { success: false, message: 'Item name is required' };
        }

        const next = [localItem, ...shoppingList];
        setShoppingList(next);
        if (userId) {
            await saveSnapshot(userId, next);
            const queue = enqueueCreate(await loadQueue(userId), localItem.id, {
                name: localItem.name,
                quantity: localItem.quantity,
                unit: localItem.unit,
                checked: false,
            });
            await saveQueue(userId, queue);
            updateSyncStatus({ pendingCount: queue.length, lastSyncError: null });
            if (shoppingListSyncStatus.isOnline) {
                void runFlush();
            }
        }
        return { success: true, data: localItem };
    }, [userId, shoppingList, shoppingListSyncStatus.isOnline, updateSyncStatus, runFlush]);

    const removeShoppingListItem = useCallback(async (id: string) => {
        const next = shoppingList.filter((i) => i.id !== id);
        setShoppingList(next);
        if (userId) {
            await saveSnapshot(userId, next);
            const queue = enqueueDelete(await loadQueue(userId), id);
            await saveQueue(userId, queue);
            updateSyncStatus({ pendingCount: queue.length, lastSyncError: null });
            if (shoppingListSyncStatus.isOnline) {
                void runFlush();
            }
        }
    }, [userId, shoppingList, shoppingListSyncStatus.isOnline, updateSyncStatus, runFlush]);

    const retryShoppingListSync = useCallback(async () => {
        await runFlush();
    }, [runFlush]);

    // === MEAL PLAN FUNCTIONS ===
    const fetchAllMealPlans = useCallback(async (): Promise<MealPlan[]> => {
        setLoading(true);
        try {
            const response = await mealPlanApi.list();
            if (response.success && response.data) {
                const list = unwrapListResponse(
                    response.data as MealPlan[] | { mealPlans?: MealPlan[] },
                    'mealPlans'
                ).map((plan) => normalizeMealPlan(plan as unknown as Record<string, unknown>));
                setMealPlan(list);
                return list;
            }
        } catch (error) {
            console.error('Failed to fetch meal plans:', error);
        } finally {
            setLoading(false);
        }
        return mealPlan;
    }, [mealPlan]);

    const addMealPlan = useCallback(async (newMealPlan: Partial<MealPlan>): Promise<ApiResponse<MealPlan>> => {
        const response = await mealPlanApi.create(newMealPlan);
        if (response.success && response.data) {
            const raw = response.data as MealPlan | { mealPlan?: MealPlan };
            const created = normalizeMealPlan(
                (('mealPlan' in raw && raw.mealPlan) ? raw.mealPlan : raw) as unknown as Record<string, unknown>
            );
            setMealPlan((prev) => [...prev, created]);
            return { ...response, data: created };
        }
        return response as ApiResponse<MealPlan>;
    }, []);

    const updateMealPlan = useCallback(async (mp: MealPlan) => {
        const response = await mealPlanApi.update(mp.id, mp);
        if (response.success && response.data) {
            setMealPlan((prev) => prev.map((m) => (m.id === mp.id ? normalizeMealPlan(response.data!) : m)));
        }
    }, []);

    const deleteMealPlan = useCallback(async (id: string) => {
        const response = await mealPlanApi.delete(id);
        if (response.success) {
            setMealPlan((prev) => prev.filter((m) => m.id !== id));
        }
    }, []);

    const confirmMealPlan = useCallback(async (id: string): Promise<ApiResponse<ConfirmMealPlanResult>> => {
        const response = await mealPlanApi.confirm(id);
        if (response.success && response.data) {
            const confirmed = normalizeMealPlan(
                (response.data.mealPlan ?? response.data) as unknown as Record<string, unknown>
            );
            setMealPlan((prev) => prev.map((m) => (m.id === id ? confirmed : m)));
            await fetchAllPantryItems();
        }
        return response;
    }, [fetchAllPantryItems]);

    const skipMealPlan = useCallback(async (id: string) => {
        const response = await mealPlanApi.skip(id);
        if (response.success && response.data) {
            const skipped = normalizeMealPlan(
                (response.data.mealPlan ?? response.data) as unknown as Record<string, unknown>
            );
            setMealPlan((prev) => prev.map((m) => (m.id === id ? skipped : m)));
        }
        return response;
    }, []);

    // === USER SETTINGS ===
    const updateUserSettings = useCallback((settings: UserSettings) => {
        setUserSettings(settings);
        // TODO: Add API call for user settings when available
    }, []);

    const value: PantryContextType = {
        loading,
        recipes,
        pantryItems,
        shoppingList,
        shoppingListSyncStatus,
        folders,
        ingredients,
        mealPlan,
        userSettings,
        addRecipe,
        fetchAllRecipes,
        updateRecipe,
        deleteRecipe,
        updateUserSettings,
        fetchAllFolders,
        addFolder,
        deleteFolder,
        updateFolder,
        fetchAllPantryItems,
        updatePantryItem,
        updatePantryItems,
        addPantryItem,
        removePantryItem,
        fetchAllIngredients,
        fetchAllShoppingListItems,
        updateShoppingListItem,
        addShoppingListItem,
        removeShoppingListItem,
        retryShoppingListSync,
        fetchAllMealPlans,
        addMealPlan,
        updateMealPlan,
        deleteMealPlan,
        confirmMealPlan,
        skipMealPlan,
    };

    return <PantryContext.Provider value={value}>{children}</PantryContext.Provider>;
}

export function usePantry() {
    const context = useContext(PantryContext);
    if (context === undefined) {
        throw new Error('usePantry must be used within a PantryProvider');
    }
    return context;
}