import type { ShoppingListItem } from '../../types';
import type { ShoppingListMutationPayload, ShoppingListMutationV1 } from './types';

function newOpId(): string {
  return `op_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createLocalItemId(): string {
  return `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function coalesce(mutations: ShoppingListMutationV1[]): ShoppingListMutationV1[] {
  const result: ShoppingListMutationV1[] = [];

  for (const op of mutations) {
    if (op.type === 'CREATE') {
      result.push({ ...op, payload: op.payload ? { ...op.payload } : undefined });
      continue;
    }

    if (op.type === 'DELETE') {
      const createIdx = result.findIndex((m) => m.type === 'CREATE' && m.itemId === op.itemId);
      if (createIdx >= 0) {
        result.splice(createIdx, 1);
        continue;
      }
      // Drop any pending UPDATEs for this id; keep a single DELETE
      for (let i = result.length - 1; i >= 0; i -= 1) {
        if (result[i].itemId === op.itemId) {
          result.splice(i, 1);
        }
      }
      result.push({ ...op });
      continue;
    }

    // UPDATE
    const createIdx = result.findIndex((m) => m.type === 'CREATE' && m.itemId === op.itemId);
    if (createIdx >= 0) {
      const create = result[createIdx];
      result[createIdx] = {
        ...create,
        payload: { ...create.payload, ...op.payload },
      };
      continue;
    }

    const updateIdx = result.findIndex((m) => m.type === 'UPDATE' && m.itemId === op.itemId);
    if (updateIdx >= 0) {
      const prev = result[updateIdx];
      result[updateIdx] = {
        ...prev,
        payload: { ...prev.payload, ...op.payload },
        createdAt: op.createdAt,
      };
      continue;
    }

    // If already deleted in queue, ignore further updates
    if (result.some((m) => m.type === 'DELETE' && m.itemId === op.itemId)) {
      continue;
    }

    result.push({ ...op, payload: op.payload ? { ...op.payload } : undefined });
  }

  return result;
}

export function enqueueCreate(
  mutations: ShoppingListMutationV1[],
  itemId: string,
  payload: ShoppingListMutationPayload,
): ShoppingListMutationV1[] {
  return coalesce([
    ...mutations,
    {
      opId: newOpId(),
      type: 'CREATE',
      itemId,
      payload,
      createdAt: Date.now(),
    },
  ]);
}

export function enqueueUpdate(
  mutations: ShoppingListMutationV1[],
  itemId: string,
  payload: ShoppingListMutationPayload,
): ShoppingListMutationV1[] {
  return coalesce([
    ...mutations,
    {
      opId: newOpId(),
      type: 'UPDATE',
      itemId,
      payload,
      createdAt: Date.now(),
    },
  ]);
}

export function enqueueDelete(
  mutations: ShoppingListMutationV1[],
  itemId: string,
): ShoppingListMutationV1[] {
  return coalesce([
    ...mutations,
    {
      opId: newOpId(),
      type: 'DELETE',
      itemId,
      createdAt: Date.now(),
    },
  ]);
}

export function remapItemId(
  mutations: ShoppingListMutationV1[],
  fromId: string,
  toId: string,
): ShoppingListMutationV1[] {
  return mutations.map((m) => (m.itemId === fromId ? { ...m, itemId: toId } : m));
}

export function remapItemsInList(
  items: ShoppingListItem[],
  fromId: string,
  toId: string,
): ShoppingListItem[] {
  return items.map((item) => (item.id === fromId ? { ...item, id: toId } : item));
}
