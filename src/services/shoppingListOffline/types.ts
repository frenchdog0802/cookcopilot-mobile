import type { ShoppingListItem } from '../../types';

export const SHOPPING_LIST_OFFLINE_VERSION = 1 as const;

export type ShoppingListSnapshotV1 = {
  version: typeof SHOPPING_LIST_OFFLINE_VERSION;
  updatedAt: number;
  items: ShoppingListItem[];
};

export type MutationType = 'CREATE' | 'UPDATE' | 'DELETE';

export type ShoppingListMutationPayload = {
  name?: string;
  quantity?: number;
  unit?: string;
  checked?: boolean;
};

export type ShoppingListMutationV1 = {
  opId: string;
  type: MutationType;
  itemId: string;
  payload?: ShoppingListMutationPayload;
  createdAt: number;
};

export type ShoppingListQueueV1 = {
  version: typeof SHOPPING_LIST_OFFLINE_VERSION;
  mutations: ShoppingListMutationV1[];
};

export type ShoppingListSyncStatus = {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  lastSyncError: string | null;
  lastSyncedAt: number | null;
};

export const DEFAULT_SYNC_STATUS: ShoppingListSyncStatus = {
  isOnline: true,
  pendingCount: 0,
  isSyncing: false,
  lastSyncError: null,
  lastSyncedAt: null,
};

export function isLocalItemId(id: string): boolean {
  return id.startsWith('local_');
}

export function snapshotKey(userId: string): string {
  return `@lardermind/shopping-list/v1/${userId}/snapshot`;
}

export function queueKey(userId: string): string {
  return `@lardermind/shopping-list/v1/${userId}/queue`;
}
