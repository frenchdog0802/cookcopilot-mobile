import { api } from './client';
import type { PantryItem, ApiResponse } from '../types';

type PantryItemDto = {
    id?: string;
    name?: string;
    details?: Partial<PantryItem> & Record<string, unknown>;
};

function fromDto(dto: PantryItemDto): PantryItem {
    const details = dto.details ?? {};
    return {
        id: String(dto.id ?? details.id ?? ''),
        name: String(dto.name ?? details.name ?? ''),
        quantity: Number(details.quantity ?? 0),
        unit: String(details.unit ?? ''),
        item_planned: details.item_planned != null ? Number(details.item_planned) : undefined,
        item_to_buy: details.item_to_buy != null ? Number(details.item_to_buy) : undefined,
    };
}

function toCreatePayload(data: Partial<PantryItem>) {
    const { name, id: _id, ...rest } = data;
    return {
        name: name ?? '',
        details: rest,
    };
}

function toUpdatePayload(data: Partial<PantryItem>) {
    const { name, id: _id, ...rest } = data;
    return {
        ...(name != null ? { name } : {}),
        details: rest,
    };
}

export function parsePantryItems(data: unknown): PantryItem[] {
    if (Array.isArray(data)) {
        return data.map(fromDto);
    }
    if (data && typeof data === 'object' && Array.isArray((data as { items?: unknown }).items)) {
        return (data as { items: PantryItemDto[] }).items.map(fromDto);
    }
    return [];
}

export function parsePantryItem(data: unknown): PantryItem | null {
    if (!data || typeof data !== 'object') {
        return null;
    }
    const obj = data as Record<string, unknown>;
    if (obj.item && typeof obj.item === 'object') {
        return fromDto(obj.item as PantryItemDto);
    }
    return fromDto(obj as PantryItemDto);
}

export const pantryItemApi = {
    list: (): Promise<ApiResponse<unknown>> =>
        api.get<unknown>('pantry-item'),

    get: (id: string | number): Promise<ApiResponse<unknown>> =>
        api.get<unknown>(`pantry-item/${id}`),

    create: (data: Partial<PantryItem>): Promise<ApiResponse<unknown>> =>
        api.post<unknown>('pantry-item', toCreatePayload(data)),

    update: (id: string | number, data: Partial<PantryItem>): Promise<ApiResponse<unknown>> =>
        api.put<unknown>(`pantry-item/${id}`, toUpdatePayload(data)),

    updateMany: (items: Array<Pick<PantryItem, 'id'> & Partial<PantryItem>>): Promise<ApiResponse<unknown>> =>
        api.put<unknown>('pantry-item/bulk', {
            items: items.map(({ id, name, ...rest }) => ({
                id,
                ...(name != null ? { name } : {}),
                details: rest,
            })),
        }),

    delete: (id: string | number): Promise<ApiResponse<void>> =>
        api.delete<void>(`pantry-item/${id}`),
};
