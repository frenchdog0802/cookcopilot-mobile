import type { ShoppingListItem } from '../../types';

/**
 * Nest list DTOs may omit display name; keep prior cache / ingredient names.
 */
export function mergeNames(
  previous: ShoppingListItem[],
  server: ShoppingListItem[],
): ShoppingListItem[] {
  const prevById = new Map(previous.map((item) => [item.id, item]));
  const prevByIngredient = new Map(
    previous
      .filter((item) => item.ingredient_id)
      .map((item) => [item.ingredient_id as string, item]),
  );

  return server.map((item) => {
    if (item.name && item.name.trim()) {
      return item;
    }
    const byId = prevById.get(item.id);
    if (byId?.name) {
      return { ...item, name: byId.name };
    }
    if (item.ingredient_id) {
      const byIngredient = prevByIngredient.get(item.ingredient_id);
      if (byIngredient?.name) {
        return { ...item, name: byIngredient.name };
      }
    }
    return item;
  });
}
