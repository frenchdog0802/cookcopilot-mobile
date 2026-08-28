import { mergeNames } from '../../services/shoppingListOffline/mergeNames';
import type { ShoppingListItem } from '../../types';

describe('mergeNames', () => {
  it('keeps server name when present', () => {
    const previous: ShoppingListItem[] = [
      { id: '1', name: 'Old', quantity: 1, unit: 'x', checked: false },
    ];
    const server: ShoppingListItem[] = [
      { id: '1', name: 'New', quantity: 2, unit: 'x', checked: true },
    ];
    expect(mergeNames(previous, server)[0].name).toBe('New');
  });

  it('fills missing server name from previous id', () => {
    const previous: ShoppingListItem[] = [
      { id: '1', name: 'Eggs', quantity: 1, unit: 'pcs', checked: false },
    ];
    const server: ShoppingListItem[] = [
      { id: '1', name: '', quantity: 1, unit: 'pcs', checked: false },
    ];
    expect(mergeNames(previous, server)[0].name).toBe('Eggs');
  });

  it('fills missing name via ingredient_id', () => {
    const previous: ShoppingListItem[] = [
      {
        id: 'old',
        name: 'Butter',
        quantity: 1,
        unit: 'g',
        checked: false,
        ingredient_id: 'ing-1',
      },
    ];
    const server: ShoppingListItem[] = [
      {
        id: 'new',
        name: '',
        quantity: 2,
        unit: 'g',
        checked: false,
        ingredient_id: 'ing-1',
      },
    ];
    expect(mergeNames(previous, server)[0].name).toBe('Butter');
  });
});
