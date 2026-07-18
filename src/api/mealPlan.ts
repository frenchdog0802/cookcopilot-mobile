import { api } from './client';
import { MealPlan, ApiResponse, ConfirmMealPlanResult } from '../types';

export const mealPlanApi = {
    list: (query?: string): Promise<ApiResponse<MealPlan[] | { mealPlans?: MealPlan[] }>> =>
        api.get(query ? `meal-plan?query=${encodeURIComponent(query)}` : 'meal-plan'),

    get: (id: string | number): Promise<ApiResponse<MealPlan>> =>
        api.get(`meal-plan/${id}`),

    pendingConfirm: (): Promise<ApiResponse<MealPlan[] | { mealPlans?: MealPlan[] }>> =>
        api.get('meal-plan/pending-confirm'),

    create: (data: Partial<MealPlan>): Promise<ApiResponse<MealPlan | { mealPlan?: MealPlan }>> =>
        api.post('meal-plan', data),

    confirm: (id: string | number): Promise<ApiResponse<ConfirmMealPlanResult>> =>
        api.post(`meal-plan/${id}/confirm`),

    skip: (id: string | number): Promise<ApiResponse<{ mealPlan: MealPlan; alreadySkipped: boolean }>> =>
        api.post(`meal-plan/${id}/skip`),

    update: (id: string | number, data: Partial<MealPlan>): Promise<ApiResponse<MealPlan>> =>
        api.put(`meal-plan/${id}`, data),

    delete: (id: string | number): Promise<ApiResponse<void>> =>
        api.delete(`meal-plan/${id}`),
};
