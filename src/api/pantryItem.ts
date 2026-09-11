import { api } from './client';
import type { PantryItem, ApiResponse } from '../types';

type PantryItemDto = {
    id?: string;
    name?: string;
    details?: Partial<PantryItem> & Record<string, unknown>;
};

function fromDto(dto: PantryItemDto): PantryItem {
    const details = dto.details ?? {};
    const flat = dto as PantryItemDto & Partial<PantryItem>;
    return {
        id: String(flat.id ?? details.id ?? ''),
        name: String(flat.name ?? details.name ?? ''),
        quantity: Number(flat.quantity ?? details.quantity ?? 0),
        unit: String(flat.unit ?? details.unit ?? ''),
        ingredient_id:
            flat.ingredient_id != null
                ? String(flat.ingredient_id)
                : details.ingredient_id != null
                  ? String(details.ingredient_id)
                  : undefined,
        unit_kind:
            flat.unit_kind != null
                ? String(flat.unit_kind)
                : details.unit_kind != null
                  ? String(details.unit_kind)
                  : undefined,
        base_unit:
            flat.base_unit != null
                ? String(flat.base_unit)
                : details.base_unit != null
                  ? String(details.base_unit)
                  : undefined,
        default_display_unit:
            flat.default_display_unit != null
                ? String(flat.default_display_unit)
                : details.default_display_unit != null
                  ? String(details.default_display_unit)
                  : undefined,
        item_planned:
            flat.item_planned != null
                ? Number(flat.item_planned)
                : details.item_planned != null
                  ? Number(details.item_planned)
                  : undefined,
        item_to_buy:
            flat.item_to_buy != null
                ? Number(flat.item_to_buy)
                : details.item_to_buy != null
                  ? Number(details.item_to_buy)
                  : undefined,
    };
}

/**
 * Dual-backend payload:
 * - Nest expects flat { name|ingredient_id, quantity, unit }
 * - Spring expects { name, details: { quantity, unit } }
 */
function toCreatePayload(data: Partial<PantryItem>) {
    const { name, id: _id, quantity, unit, ingredient_id, ...rest } = data;
    return {
        name: name ?? '',
        ingredient_id,
        quantity,
        unit,
        details: {
            quantity,
            unit,
            ingredient_id,
            ...rest,
        },
    };
}

function toUpdatePayload(data: Partial<PantryItem>) {
    const { name, id: _id, quantity, unit, ...rest } = data;
    return {
        ...(name != null ? { name } : {}),
        quantity,
        unit,
        details: {
            quantity,
            unit,
            ...rest,
        },
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
            items: items.map(({ id, name, quantity, unit, ingredient_id, ...rest }) => ({
                id,
                ...(name != null ? { name } : {}),
                quantity,
                unit,
                ingredient_id,
                details: {
                    quantity,
                    unit,
                    ingredient_id,
                    ...rest,
                },
            })),
        }),

    delete: (id: string | number): Promise<ApiResponse<void>> =>
        api.delete<void>(`pantry-item/${id}`),
};
