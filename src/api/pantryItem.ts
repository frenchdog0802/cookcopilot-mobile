import { api } from './client';
import { PantryItem, ApiResponse } from '../types';

export const pantryItemApi = {
    list: (): Promise<ApiResponse<PantryItem[]>> =>
        api.get<PantryItem[]>('pantry-item'),

    get: (id: string | number): Promise<ApiResponse<PantryItem>> =>
        api.get<PantryItem>(`pantry-item/${id}`),

    create: (data: Partial<PantryItem>): Promise<ApiResponse<PantryItem>> =>
        api.post<PantryItem>('pantry-item', data),

    update: (id: string | number, data: Partial<PantryItem>): Promise<ApiResponse<PantryItem>> =>
        api.put<PantryItem>(`pantry-item/${id}`, data),

    updateMany: (items: Array<Pick<PantryItem, 'id'> & Partial<PantryItem>>): Promise<ApiResponse<PantryItem[]>> =>
        api.put<PantryItem[]>('pantry-item/bulk', items),

    delete: (id: string | number): Promise<ApiResponse<void>> =>
        api.delete<void>(`pantry-item/${id}`),
};
