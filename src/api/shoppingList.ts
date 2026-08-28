import { api } from './client';
import { ShoppingListItem, ApiResponse } from '../types';

type ShoppingListItemDto = {
    id?: string;
    name?: string;
    details?: Partial<ShoppingListItem> & Record<string, unknown>;
};

function fromDto(dto: ShoppingListItemDto): ShoppingListItem {
    const details = dto.details ?? {};
    return {
        id: String(dto.id ?? details.id ?? ''),
        name: String(dto.name ?? details.name ?? ''),
        quantity: Number(details.quantity ?? 0),
        unit: String(details.unit ?? ''),
        checked: Boolean(details.checked ?? false),
    };
}

/**
 * Dual-backend payload:
 * - Spring expects { name, details: { quantity, unit, checked } }
 * - Nest expects flat { name, quantity, unit, checked }
 */
export function toRequestPayload(data: Partial<ShoppingListItem>) {
    const quantity = data.quantity;
    const unit = data.unit;
    const checked = data.checked ?? false;
    return {
        name: data.name,
        quantity,
        unit,
        checked,
        details: {
            quantity,
            unit,
            checked,
        },
    };
}

export function parseShoppingListItems(data: unknown): ShoppingListItem[] {
    if (Array.isArray(data)) {
        return data.map(fromDto);
    }
    if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
        return (data as { items: ShoppingListItemDto[] }).items.map(fromDto);
    }
    return [];
}

export function parseShoppingListItem(data: unknown): ShoppingListItem | null {
    if (!data || typeof data !== 'object') {
        return null;
    }
    const obj = data as Record<string, unknown>;
    if (obj.item && typeof obj.item === 'object') {
        return fromDto(obj.item as ShoppingListItemDto);
    }
    return fromDto(obj as ShoppingListItemDto);
}

export const shoppingListApi = {
    list: (query?: string): Promise<ApiResponse<unknown>> =>
        api.get<unknown>(query ? `shopping-list?query=${encodeURIComponent(query)}` : 'shopping-list'),

    get: (id: string | number): Promise<ApiResponse<unknown>> =>
        api.get<unknown>(`shopping-list/${id}`),

    create: (data: Partial<ShoppingListItem>): Promise<ApiResponse<unknown>> =>
        api.post<unknown>('shopping-list', toRequestPayload(data)),

    update: (id: string | number, data: Partial<ShoppingListItem>): Promise<ApiResponse<unknown>> =>
        api.put<unknown>(`shopping-list/${id}`, toRequestPayload(data)),

    delete: (id: string | number): Promise<ApiResponse<void>> =>
        api.delete<void>(`shopping-list/${id}`),
};
