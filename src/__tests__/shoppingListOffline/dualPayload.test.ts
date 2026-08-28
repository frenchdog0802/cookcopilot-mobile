import { toRequestPayload } from '../../api/shoppingList';

describe('toRequestPayload dual backend shape', () => {
  it('includes flat fields and nested details', () => {
    expect(
      toRequestPayload({
        name: 'Milk',
        quantity: 2,
        unit: 'L',
        checked: true,
      }),
    ).toEqual({
      name: 'Milk',
      quantity: 2,
      unit: 'L',
      checked: true,
      details: {
        quantity: 2,
        unit: 'L',
        checked: true,
      },
    });
  });
});
