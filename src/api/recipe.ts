import { api } from './client';
import { Recipe, ApiResponse } from '../types';

export const recipeApi = {
    list: (q?: string): Promise<ApiResponse<Recipe[]>> =>
        api.get<Recipe[]>(q ? `recipe?q=${encodeURIComponent(q)}` : 'recipe'),

    get: (id: string | number): Promise<ApiResponse<Recipe>> =>
        api.get<Recipe>(`recipe/${id}`),

    create: (data: Partial<Recipe>): Promise<ApiResponse<Recipe>> =>
        api.post<Recipe>('recipe', data),

    update: (id: string | number, data: Partial<Recipe>): Promise<ApiResponse<Recipe>> =>
        api.put<Recipe>(`recipe/${id}`, data),

    delete: (id: string | number): Promise<ApiResponse<void>> =>
        api.delete<void>(`recipe/${id}`),
};
