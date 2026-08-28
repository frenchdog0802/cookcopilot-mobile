import {
  parseShoppingListItem,
  parseShoppingListItems,
  shoppingListApi,
} from '../../api/shoppingList';
import type { ShoppingListItem } from '../../types';
import { getIsOnline } from './connectivity';
import { isLocalItemId, type ShoppingListMutationV1 } from './types';
import { coalesce, remapItemId, remapItemsInList } from './queue';
import { mergeNames } from './mergeNames';
import { loadQueue, loadSnapshot, saveQueue, saveSnapshot } from './store';

export type FlushResult = {
  ok: boolean;
  error?: string;
  remaining: number;
  items?: ShoppingListItem[];
};

type FlushCallbacks = {
  onItems?: (items: ShoppingListItem[]) => void;
  onQueue?: (mutations: ShoppingListMutationV1[]) => void;
};

const flushLocks = new Set<string>();
const backoffTimers = new Map<string, ReturnType<typeof setTimeout>>();
const BACKOFF_MS = [2000, 5000, 15000];
const backoffAttempt = new Map<string, number>();

function clearBackoff(userId: string): void {
  const timer = backoffTimers.get(userId);
  if (timer) {
    clearTimeout(timer);
    backoffTimers.delete(userId);
  }
  backoffAttempt.delete(userId);
}

function scheduleBackoff(userId: string, flush: () => void): void {
  clearBackoff(userId);
  const attempt = backoffAttempt.get(userId) ?? 0;
  const delay = BACKOFF_MS[Math.min(attempt, BACKOFF_MS.length - 1)];
  backoffAttempt.set(userId, attempt + 1);
  const timer = setTimeout(() => {
    backoffTimers.delete(userId);
    flush();
  }, delay);
  backoffTimers.set(userId, timer);
}

function isNetworkFailure(message?: string, statusCode?: number): boolean {
  if (statusCode != null && statusCode > 0) return false;
  const msg = (message ?? '').toLowerCase();
  return msg.includes('network') || msg.includes('failed to fetch') || msg === '';
}

export async function flushShoppingListQueue(
  userId: string,
  callbacks: FlushCallbacks = {},
): Promise<FlushResult> {
  if (!userId) {
    return { ok: false, error: 'Missing user', remaining: 0 };
  }
  if (flushLocks.has(userId)) {
    const mutations = await loadQueue(userId);
    return { ok: true, remaining: mutations.length };
  }

  flushLocks.add(userId);
  try {
    const online = await getIsOnline();
    if (!online) {
      const mutations = await loadQueue(userId);
      return { ok: false, error: 'Offline', remaining: mutations.length };
    }

    let mutations = coalesce(await loadQueue(userId));
    let items = await loadSnapshot(userId);
    callbacks.onQueue?.(mutations);

    while (mutations.length > 0) {
      const op = mutations[0];

      if (op.type === 'CREATE') {
        const response = await shoppingListApi.create({
          name: op.payload?.name,
          quantity: op.payload?.quantity,
          unit: op.payload?.unit,
          checked: op.payload?.checked ?? false,
        });
        if (!response.success) {
          if (isNetworkFailure(response.message, response.statusCode)) {
            await saveQueue(userId, mutations);
            scheduleBackoff(userId, () => {
              void flushShoppingListQueue(userId, callbacks);
            });
            return {
              ok: false,
              error: response.message || 'Network error',
              remaining: mutations.length,
              items,
            };
          }
          await saveQueue(userId, mutations);
          return {
            ok: false,
            error: response.message || 'Create failed',
            remaining: mutations.length,
            items,
          };
        }
        const created = parseShoppingListItem(response.data);
        const serverId = created?.id;
        if (!serverId) {
          await saveQueue(userId, mutations);
          return {
            ok: false,
            error: 'Create returned no id',
            remaining: mutations.length,
            items,
          };
        }
        items = remapItemsInList(items, op.itemId, serverId).map((item) =>
          item.id === serverId
            ? {
                ...item,
                ...created,
                name: created.name || item.name || op.payload?.name || '',
              }
            : item,
        );
        mutations = coalesce(remapItemId(mutations.slice(1), op.itemId, serverId));
        await saveSnapshot(userId, items);
        await saveQueue(userId, mutations);
        callbacks.onItems?.(items);
        callbacks.onQueue?.(mutations);
        continue;
      }

      if (op.type === 'UPDATE') {
        if (isLocalItemId(op.itemId)) {
          // Orphaned update — drop
          mutations = mutations.slice(1);
          await saveQueue(userId, mutations);
          callbacks.onQueue?.(mutations);
          continue;
        }
        const response = await shoppingListApi.update(op.itemId, {
          name: op.payload?.name,
          quantity: op.payload?.quantity,
          unit: op.payload?.unit,
          checked: op.payload?.checked,
        });
        if (!response.success) {
          if (response.statusCode === 404) {
            mutations = mutations.slice(1);
            await saveQueue(userId, mutations);
            callbacks.onQueue?.(mutations);
            continue;
          }
          if (isNetworkFailure(response.message, response.statusCode)) {
            await saveQueue(userId, mutations);
            scheduleBackoff(userId, () => {
              void flushShoppingListQueue(userId, callbacks);
            });
            return {
              ok: false,
              error: response.message || 'Network error',
              remaining: mutations.length,
              items,
            };
          }
          if (response.statusCode === 401) {
            await saveQueue(userId, mutations);
            return {
              ok: false,
              error: response.message || 'Unauthorized',
              remaining: mutations.length,
              items,
            };
          }
          await saveQueue(userId, mutations);
          return {
            ok: false,
            error: response.message || 'Update failed',
            remaining: mutations.length,
            items,
          };
        }
        const updated = parseShoppingListItem(response.data);
        if (updated) {
          items = items.map((item) =>
            item.id === op.itemId
              ? { ...item, ...updated, name: updated.name || item.name }
              : item,
          );
          await saveSnapshot(userId, items);
          callbacks.onItems?.(items);
        }
        mutations = mutations.slice(1);
        await saveQueue(userId, mutations);
        callbacks.onQueue?.(mutations);
        continue;
      }

      // DELETE
      if (isLocalItemId(op.itemId)) {
        mutations = mutations.slice(1);
        await saveQueue(userId, mutations);
        callbacks.onQueue?.(mutations);
        continue;
      }
      const response = await shoppingListApi.delete(op.itemId);
      if (!response.success) {
        if (response.statusCode === 404) {
          mutations = mutations.slice(1);
          await saveQueue(userId, mutations);
          callbacks.onQueue?.(mutations);
          continue;
        }
        if (isNetworkFailure(response.message, response.statusCode)) {
          await saveQueue(userId, mutations);
          scheduleBackoff(userId, () => {
            void flushShoppingListQueue(userId, callbacks);
          });
          return {
            ok: false,
            error: response.message || 'Network error',
            remaining: mutations.length,
            items,
          };
        }
        if (response.statusCode === 401) {
          await saveQueue(userId, mutations);
          return {
            ok: false,
            error: response.message || 'Unauthorized',
            remaining: mutations.length,
            items,
          };
        }
        await saveQueue(userId, mutations);
        return {
          ok: false,
          error: response.message || 'Delete failed',
          remaining: mutations.length,
          items,
        };
      }
      items = items.filter((item) => item.id !== op.itemId);
      await saveSnapshot(userId, items);
      callbacks.onItems?.(items);
      mutations = mutations.slice(1);
      await saveQueue(userId, mutations);
      callbacks.onQueue?.(mutations);
    }

    // Reconcile from server when queue empty
    const listResponse = await shoppingListApi.list();
    if (listResponse.success && listResponse.data !== undefined) {
      const serverItems = parseShoppingListItems(listResponse.data);
      items = mergeNames(items, serverItems);
      await saveSnapshot(userId, items);
      callbacks.onItems?.(items);
    }

    clearBackoff(userId);
    return { ok: true, remaining: 0, items };
  } finally {
    flushLocks.delete(userId);
  }
}
