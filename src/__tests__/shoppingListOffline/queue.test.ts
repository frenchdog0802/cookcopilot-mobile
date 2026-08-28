import {
  coalesce,
  createLocalItemId,
  enqueueCreate,
  enqueueDelete,
  enqueueUpdate,
  remapItemId,
} from '../../services/shoppingListOffline/queue';
import type { ShoppingListMutationV1 } from '../../services/shoppingListOffline/types';

describe('shoppingListOffline queue', () => {
  it('creates local ids with local_ prefix', () => {
    expect(createLocalItemId().startsWith('local_')).toBe(true);
  });

  it('collapses CREATE then DELETE for same id', () => {
    let queue: ShoppingListMutationV1[] = [];
    queue = enqueueCreate(queue, 'local_1', { name: 'Milk', quantity: 1, unit: 'L' });
    queue = enqueueDelete(queue, 'local_1');
    expect(queue).toHaveLength(0);
  });

  it('folds UPDATE into pending CREATE', () => {
    let queue: ShoppingListMutationV1[] = [];
    queue = enqueueCreate(queue, 'local_1', { name: 'Milk', quantity: 1, unit: 'L', checked: false });
    queue = enqueueUpdate(queue, 'local_1', { quantity: 2, checked: true });
    expect(queue).toHaveLength(1);
    expect(queue[0].type).toBe('CREATE');
    expect(queue[0].payload).toMatchObject({
      name: 'Milk',
      quantity: 2,
      unit: 'L',
      checked: true,
    });
  });

  it('keeps last UPDATE for same server id', () => {
    let queue: ShoppingListMutationV1[] = [];
    queue = enqueueUpdate(queue, 'srv-1', { quantity: 1 });
    queue = enqueueUpdate(queue, 'srv-1', { quantity: 3, checked: true });
    expect(queue).toHaveLength(1);
    expect(queue[0].payload).toMatchObject({ quantity: 3, checked: true });
  });

  it('DELETE drops prior UPDATEs for same id', () => {
    let queue: ShoppingListMutationV1[] = [];
    queue = enqueueUpdate(queue, 'srv-1', { checked: true });
    queue = enqueueDelete(queue, 'srv-1');
    expect(queue).toEqual([
      expect.objectContaining({ type: 'DELETE', itemId: 'srv-1' }),
    ]);
  });

  it('remapItemId rewrites queued ids', () => {
    const queue = coalesce([
      {
        opId: 'a',
        type: 'UPDATE',
        itemId: 'local_1',
        payload: { checked: true },
        createdAt: 1,
      },
    ]);
    expect(remapItemId(queue, 'local_1', 'uuid-9')[0].itemId).toBe('uuid-9');
  });
});
