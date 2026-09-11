import { parsePantryItems, parsePantryItem } from '../../api/pantryItem';

describe('parsePantryItems Nest / Spring shapes', () => {
  it('parses Nest flat items with name', () => {
    const items = parsePantryItems({
      items: [
        {
          id: '1',
          name: 'Eggs',
          ingredient_id: 'ing-1',
          quantity: 2,
          unit: 'pcs',
          unit_kind: 'count',
          base_unit: 'pcs',
          default_display_unit: 'pcs',
        },
      ],
    });
    expect(items).toEqual([
      {
        id: '1',
        name: 'Eggs',
        quantity: 2,
        unit: 'pcs',
        ingredient_id: 'ing-1',
        unit_kind: 'count',
        base_unit: 'pcs',
        default_display_unit: 'pcs',
        item_planned: undefined,
        item_to_buy: undefined,
      },
    ]);
  });

  it('parses Spring { id, name, details } items', () => {
    const items = parsePantryItems({
      items: [
        {
          id: '1',
          name: 'Milk',
          details: {
            quantity: 1,
            unit: 'l',
            ingredient_id: 'ing-2',
          },
        },
      ],
    });
    expect(items[0]).toMatchObject({
      id: '1',
      name: 'Milk',
      quantity: 1,
      unit: 'l',
      ingredient_id: 'ing-2',
    });
  });

  it('parses single Nest item envelope', () => {
    const item = parsePantryItem({
      item: {
        id: '9',
        name: 'Butter',
        quantity: 100,
        unit: 'g',
        ingredient_id: 'ing-3',
      },
    });
    expect(item).toMatchObject({
      id: '9',
      name: 'Butter',
      quantity: 100,
      unit: 'g',
      ingredient_id: 'ing-3',
    });
  });
});
