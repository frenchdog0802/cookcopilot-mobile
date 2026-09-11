import type { IngredientEntry, PantryItem, ShoppingListItem } from '../types';

type NamedItem = {
  name?: string;
  ingredient_id?: string;
};

/**
 * Nest list DTOs historically omitted display names. Prefer server name when
 * present; otherwise resolve from the local ingredient catalog by id.
 */
export function fillMissingNamesFromIngredients<T extends NamedItem>(
  items: T[],
  ingredients: Array<Pick<IngredientEntry, 'id' | 'name'>>,
): T[] {
  const list = Array.isArray(items) ? items : [];
  const catalog = Array.isArray(ingredients) ? ingredients : [];
  if (list.length === 0 || catalog.length === 0) {
    return list;
  }

  const byId = new Map(
    catalog
      .filter((ing) => ing.id && ing.name)
      .map((ing) => [String(ing.id), String(ing.name)]),
  );

  return list.map((item) => {
    if (item.name && String(item.name).trim()) {
      return item;
    }
    const resolved = item.ingredient_id
      ? byId.get(String(item.ingredient_id))
      : undefined;
    if (!resolved) {
      return item;
    }
    return { ...item, name: resolved };
  });
}

export function enrichPantryNames(
  items: PantryItem[],
  ingredients: IngredientEntry[],
): PantryItem[] {
  return fillMissingNamesFromIngredients(items, ingredients);
}

export function enrichShoppingNames(
  items: ShoppingListItem[],
  ingredients: IngredientEntry[],
): ShoppingListItem[] {
  return fillMissingNamesFromIngredients(items, ingredients);
}
