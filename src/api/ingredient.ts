import { api } from './client';
import { IngredientEntry, ApiResponse } from '../types';

export const ingredientApi = {
    list: (query?: string): Promise<ApiResponse<IngredientEntry[]>> =>
        api.get<IngredientEntry[]>(query ? `ingredient?query=${encodeURIComponent(query)}` : 'ingredient'),

    get: (id: string | number): Promise<ApiResponse<IngredientEntry>> =>
        api.get<IngredientEntry>(`ingredient/${id}`),

    create: (data: Partial<IngredientEntry>): Promise<ApiResponse<IngredientEntry>> =>
        api.post<IngredientEntry>('ingredient', data),

    update: (id: string | number, data: Partial<IngredientEntry>): Promise<ApiResponse<IngredientEntry>> =>
        api.put<IngredientEntry>(`ingredient/${id}`, data),

    delete: (id: string | number): Promise<ApiResponse<void>> =>
        api.delete<void>(`ingredient/${id}`),
};
