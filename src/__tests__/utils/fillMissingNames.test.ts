import {
  enrichPantryNames,
  enrichShoppingNames,
  fillMissingNamesFromIngredients,
} from '../../utils/fillMissingNames';
import type { IngredientEntry, PantryItem, ShoppingListItem } from '../../types';

describe('fillMissingNamesFromIngredients', () => {
  const ingredients: IngredientEntry[] = [
    { id: 'ing-1', name: 'Eggs', default_unit: 'pcs' },
    { id: 'ing-2', name: 'Milk', default_unit: 'ml' },
  ];

  it('keeps existing names', () => {
    const items = [{ id: 'a', name: 'Custom', ingredient_id: 'ing-1' }];
    expect(fillMissingNamesFromIngredients(items, ingredients)[0].name).toBe('Custom');
  });

  it('fills blank names from ingredient catalog', () => {
    const items = [{ id: 'a', name: '', ingredient_id: 'ing-1' }];
    expect(fillMissingNamesFromIngredients(items, ingredients)[0].name).toBe('Eggs');
  });

  it('leaves blank when ingredient is unknown', () => {
    const items = [{ id: 'a', name: '', ingredient_id: 'missing' }];
    expect(fillMissingNamesFromIngredients(items, ingredients)[0].name).toBe('');
  });
});

describe('enrichPantryNames / enrichShoppingNames', () => {
  it('enriches pantry items', () => {
    const items: PantryItem[] = [
      { id: '1', name: '', quantity: 1, unit: 'pcs', ingredient_id: 'ing-1' },
    ];
    const ingredients: IngredientEntry[] = [
      { id: 'ing-1', name: 'Garlic', default_unit: 'clove' },
    ];
    expect(enrichPantryNames(items, ingredients)[0].name).toBe('Garlic');
  });

  it('enriches shopping items', () => {
    const items: ShoppingListItem[] = [
      {
        id: '1',
        name: '',
        quantity: 1,
        unit: 'pcs',
        checked: false,
        ingredient_id: 'ing-2',
      },
    ];
    const ingredients: IngredientEntry[] = [
      { id: 'ing-2', name: 'Onion', default_unit: 'pcs' },
    ];
    expect(enrichShoppingNames(items, ingredients)[0].name).toBe('Onion');
  });
});
