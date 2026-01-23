import React, { useState, createContext, useContext, useCallback } from 'react';
import {
    PantryItem,
    ShoppingListItem,
    Recipe,
    Folder,
    UserSettings,
    IngredientEntry,
    MealPlan,
    ApiResponse,
} from '../types';
import { folderApi } from '../api/folder';
import { ingredientApi } from '../api/ingredient';
import { recipeApi } from '../api/recipe';
import { pantryItemApi } from '../api/pantryItem';
import { shoppingListApi } from '../api/shoppingList';
import { mealPlanApi } from '../api/mealPlan';

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
    fetchAllShoppingListItems: () => Promise<ShoppingListItem[]>;
    updateShoppingListItem: (item: ShoppingListItem) => Promise<ApiResponse<ShoppingListItem>>;
    addShoppingListItem: (item: Partial<ShoppingListItem>) => Promise<ApiResponse<ShoppingListItem>>;
    removeShoppingListItem: (id: string) => Promise<void>;

    // Meal plans
    mealPlan: MealPlan[];
    fetchAllMealPlans: () => Promise<MealPlan[]>;
    addMealPlan: (mealPlan: Partial<MealPlan>) => Promise<ApiResponse<MealPlan>>;
    updateMealPlan: (mealPlan: MealPlan) => Promise<void>;
    deleteMealPlan: (id: string) => Promise<void>;

    // Loading state
    loading: boolean;
}

const PantryContext = createContext<PantryContextType | undefined>(undefined);

// Default folders for fallback
const DEFAULT_FOLDERS: Folder[] = [
    { id: 'uncategorized', name: 'Uncategorized', icon: 'FolderIcon' },
];

export function PantryProvider({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(false);
    const [mealPlan, setMealPlan] = useState<MealPlan[]>([]);
    const [ingredients, setIngredients] = useState<IngredientEntry[]>([]);
    const [folders, setFolders] = useState<Folder[]>(DEFAULT_FOLDERS);
    const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
    const [shoppingList, setShoppingList] = useState<ShoppingListItem[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [userSettings, setUserSettings] = useState<UserSettings>({
        name: '',
        language: 'english',
        measurement_unit: 'metric',
    });

    // === FOLDER FUNCTIONS ===
    const fetchAllFolders = useCallback(async () => {
        setLoading(true);
        try {
            const response = await folderApi.list();
            if (response.success && response.data) {
                setFolders(response.data.length > 0 ? response.data : DEFAULT_FOLDERS);
            }
        } catch (error) {
            console.error('Failed to fetch folders:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const addFolder = useCallback(async (folder: Partial<Folder>): Promise<ApiResponse<Folder>> => {
        const response = await folderApi.create(folder);
        if (response.success && response.data) {
            setFolders((prev) => [...prev, response.data!]);
        }
        return response;
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
        if (response.success && response.data) {
            setFolders((prev) => prev.map((f) => (f.id === folder.id ? response.data! : f)));
        }
    }, []);

    // === RECIPE FUNCTIONS ===
    const fetchAllRecipes = useCallback(async (): Promise<Recipe[]> => {
        setLoading(true);
        try {
            const response = await recipeApi.list();
            if (response.success && response.data) {
                setRecipes(response.data);
                return response.data;
            }
        } catch (error) {
            console.error('Failed to fetch recipes:', error);
        } finally {
            setLoading(false);
        }
        return recipes;
    }, [recipes]);

    const addRecipe = useCallback(async (recipe: Partial<Recipe>): Promise<ApiResponse<Recipe>> => {
        const response = await recipeApi.create(recipe);
        if (response.success && response.data) {
            setRecipes((prev) => [...prev, response.data!]);
        }
        return response;
    }, []);

    const updateRecipe = useCallback(async (recipe: Recipe) => {
        const response = await recipeApi.update(recipe.id, recipe);
        if (response.success && response.data) {
            setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? response.data! : r)));
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
                setPantryItems(response.data);
            }
        } catch (error) {
            console.error('Failed to fetch pantry items:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const addPantryItem = useCallback(async (item: Partial<PantryItem>): Promise<ApiResponse<PantryItem>> => {
        const response = await pantryItemApi.create(item);
        if (response.success && response.data) {
            setPantryItems((prev) => [...prev, response.data!]);
        }
        return response;
    }, []);

    const updatePantryItem = useCallback(async (item: PantryItem) => {
        const response = await pantryItemApi.update(item.id, item);
        if (response.success && response.data) {
            setPantryItems((prev) => prev.map((i) => (i.id === item.id ? response.data! : i)));
        }
    }, []);

    const updatePantryItems = useCallback(async (items: PantryItem[]) => {
        const response = await pantryItemApi.updateMany(items);
        if (response.success && response.data) {
            setPantryItems(response.data);
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
        setLoading(true);
        try {
            const response = await shoppingListApi.list();
            if (response.success && response.data) {
                setShoppingList(response.data);
                return response.data;
            }
        } catch (error) {
            console.error('Failed to fetch shopping list:', error);
        } finally {
            setLoading(false);
        }
        return shoppingList;
    }, [shoppingList]);

    const updateShoppingListItem = useCallback(async (item: ShoppingListItem): Promise<ApiResponse<ShoppingListItem>> => {
        const response = await shoppingListApi.update(item.id, item);
        if (response.success && response.data) {
            setShoppingList((prev) => prev.map((i) => (i.id === item.id ? response.data! : i)));
        }
        return response;
    }, []);

    const addShoppingListItem = useCallback(async (item: Partial<ShoppingListItem>): Promise<ApiResponse<ShoppingListItem>> => {
        const response = await shoppingListApi.create({ ...item, checked: false });
        if (response.success && response.data) {
            setShoppingList((prev) => [...prev, response.data!]);
        }
        return response;
    }, []);

    const removeShoppingListItem = useCallback(async (id: string) => {
        const response = await shoppingListApi.delete(id);
        if (response.success) {
            setShoppingList((prev) => prev.filter((i) => i.id !== id));
        }
    }, []);

    // === MEAL PLAN FUNCTIONS ===
    const fetchAllMealPlans = useCallback(async (): Promise<MealPlan[]> => {
        setLoading(true);
        try {
            const response = await mealPlanApi.list();
            if (response.success && response.data) {
                setMealPlan(response.data);
                return response.data;
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
            setMealPlan((prev) => [...prev, response.data!]);
        }
        return response;
    }, []);

    const updateMealPlan = useCallback(async (mp: MealPlan) => {
        const response = await mealPlanApi.update(mp.id, mp);
        if (response.success && response.data) {
            setMealPlan((prev) => prev.map((m) => (m.id === mp.id ? response.data! : m)));
        }
    }, []);

    const deleteMealPlan = useCallback(async (id: string) => {
        const response = await mealPlanApi.delete(id);
        if (response.success) {
            setMealPlan((prev) => prev.filter((m) => m.id !== id));
        }
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
        fetchAllMealPlans,
        addMealPlan,
        updateMealPlan,
        deleteMealPlan,
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