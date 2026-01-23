import { api } from './client';
import { ShoppingListItem, ApiResponse } from '../types';

export const shoppingListApi = {
    list: (query?: string): Promise<ApiResponse<ShoppingListItem[]>> =>
        api.get<ShoppingListItem[]>(query ? `shopping-list?query=${encodeURIComponent(query)}` : 'shopping-list'),

    get: (id: string | number): Promise<ApiResponse<ShoppingListItem>> =>
        api.get<ShoppingListItem>(`shopping-list/${id}`),

    create: (data: Partial<ShoppingListItem>): Promise<ApiResponse<ShoppingListItem>> =>
        api.post<ShoppingListItem>('shopping-list', data),

    update: (id: string | number, data: Partial<ShoppingListItem>): Promise<ApiResponse<ShoppingListItem>> =>
        api.put<ShoppingListItem>(`shopping-list/${id}`, data),

    delete: (id: string | number): Promise<ApiResponse<void>> =>
        api.delete<void>(`shopping-list/${id}`),
};
