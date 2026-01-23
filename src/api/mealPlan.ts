import { api } from './client';
import { MealPlan, ApiResponse } from '../types';

export const mealPlanApi = {
    list: (query?: string): Promise<ApiResponse<MealPlan[]>> =>
        api.get<MealPlan[]>(query ? `meal-plan?query=${encodeURIComponent(query)}` : 'meal-plan'),

    get: (id: string | number): Promise<ApiResponse<MealPlan>> =>
        api.get<MealPlan>(`meal-plan/${id}`),

    create: (data: Partial<MealPlan>): Promise<ApiResponse<MealPlan>> =>
        api.post<MealPlan>('meal-plan', data),

    update: (id: string | number, data: Partial<MealPlan>): Promise<ApiResponse<MealPlan>> =>
        api.put<MealPlan>(`meal-plan/${id}`, data),

    delete: (id: string | number): Promise<ApiResponse<void>> =>
        api.delete<void>(`meal-plan/${id}`),
};
