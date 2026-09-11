import {
  applyItemUpdate,
  applyItemRemove,
  applyMarkAllChecked,
  createSerialQueue,
  enqueueMarkAllUpdates,
} from '../../services/shoppingListOffline/localWrites';
import type { ShoppingListItem } from '../../types';
import { loadSnapshot, saveSnapshot, loadQueue, saveQueue } from '../../services/shoppingListOffline/store';

jest.mock('../../services/shoppingListOffline/store', () => ({
  loadSnapshot: jest.fn(),
  saveSnapshot: jest.fn(),
  loadQueue: jest.fn(),
  saveQueue: jest.fn(),
}));

const item = (id: string, checked = false): ShoppingListItem => ({
  id,
  name: id,
  quantity: 1,
  unit: 'pcs',
  checked,
});

describe('shopping list local writes', () => {
  it('applyMarkAllChecked marks every unchecked item once', () => {
    const list = [item('a'), item('b', true), item('c')];
    const { next, changed } = applyMarkAllChecked(list);
    expect(changed).toHaveLength(2);
    expect(next.every((i) => i.checked)).toBe(true);
  });

  it('serial queue applies concurrent updates without clobbering', async () => {
    const userId = 'user-1';
    let snapshot = [item('a'), item('b'), item('c')];
    (loadSnapshot as jest.Mock).mockImplementation(async () => [...snapshot]);
    (saveSnapshot as jest.Mock).mockImplementation(async (_uid: string, next: ShoppingListItem[]) => {
      snapshot = next;
    });
    (loadQueue as jest.Mock).mockResolvedValue([]);
    (saveQueue as jest.Mock).mockResolvedValue(undefined);

    const enqueue = createSerialQueue();

    const updateOne = (id: string) =>
      enqueue(async () => {
        const current = await loadSnapshot(userId);
        const updated = applyItemUpdate(current, { ...item(id), checked: true, quantity: 9 });
        await saveSnapshot(userId, updated);
        return updated;
      });

    await Promise.all([updateOne('a'), updateOne('b'), updateOne('c')]);

    expect(snapshot.find((i) => i.id === 'a')?.checked).toBe(true);
    expect(snapshot.find((i) => i.id === 'b')?.checked).toBe(true);
    expect(snapshot.find((i) => i.id === 'c')?.checked).toBe(true);
    expect(saveSnapshot).toHaveBeenCalledTimes(3);
  });

  it('mark-all writes a single complete snapshot', async () => {
    const userId = 'user-1';
    let snapshot = [item('a'), item('b'), item('c')];
    (loadSnapshot as jest.Mock).mockImplementation(async () => [...snapshot]);
    (saveSnapshot as jest.Mock).mockImplementation(async (_uid: string, next: ShoppingListItem[]) => {
      snapshot = next;
    });
    (loadQueue as jest.Mock).mockResolvedValue([]);
    (saveQueue as jest.Mock).mockResolvedValue(undefined);

    const enqueue = createSerialQueue();
    const count = await enqueue(async () => {
      const current = await loadSnapshot(userId);
      const { next, changed } = applyMarkAllChecked(current);
      await saveSnapshot(userId, next);
      const queue = enqueueMarkAllUpdates(await loadQueue(userId), changed);
      await saveQueue(userId, queue);
      return changed.length;
    });

    expect(count).toBe(3);
    expect(snapshot.every((i) => i.checked)).toBe(true);
    expect(saveSnapshot).toHaveBeenCalledTimes(1);
  });

  it('remove uses latest snapshot', () => {
    const next = applyItemRemove([item('a'), item('b')], 'a');
    expect(next.map((i) => i.id)).toEqual(['b']);
  });
});
