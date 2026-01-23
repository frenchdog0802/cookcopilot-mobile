/**
 * Shared types for the PantryApp mobile application
 * Migrated from Diet_APP web client
 */

export interface ApiResponse<T = unknown> {
    success: boolean;
    message?: string;
    data?: T;
    statusCode?: number;
}

export type User = {
    id?: string;
    first_name: string;
    last_name: string;
    name: string;
    email: string;
    token?: string;
};

export interface UserSettings {
    name: string;
    language: string;
    measurement_unit: string;
}

export interface IngredientEntry {
    id: string;
    name: string;
    default_unit: string;
    image_url?: number;
}

export interface Folder {
    id: string;
    name: string;
    icon: string;
}

export interface Recipe {
    id: string;
    folder_id: string;
    meal_name: string;
    instructions: string[];
    ingredients: {
        name: string;
        quantity: number;
        unit: string;
    }[];
    image: {
        public_id: string;
        url: string;
    } | null;
}

export type ShoppingListItem = {
    id: string;
    name: string;
    quantity: number;
    unit: string;
    checked: boolean;
};

export interface PantryItem {
    id: string;
    name: string;
    quantity: number;
    item_planned?: number;
    item_to_buy?: number;
    unit: string;
}

export interface MealPlan {
    id: string;
    meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    serving_date: string; // YYYY-MM-DD
    recipe_id: string;
    meal_name: string;
    image?: string | null;
}

export interface RecipeSuggestion {
    id: string;
    name: string;
    ingredients: {
        name: string;
        quantity: number;
        unit: string;
    }[];
    instructions: string[];
    cookTime?: number;
    difficulty?: string;
    image?: string;
    savedAt?: number;
}
