import type { ShoppingListItem } from '../../types';

function fillMissingName(
  item: ShoppingListItem,
  prevById: Map<string, ShoppingListItem>,
  prevByIngredient: Map<string, ShoppingListItem>,
): ShoppingListItem {
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
}

/**
 * Merge server fields into the cached list while preserving local display order.
 * Nest list DTOs may omit display name; keep prior cache / ingredient names.
 */
export function mergeNames(
  previous: ShoppingListItem[],
  server: ShoppingListItem[],
): ShoppingListItem[] {
  const prev = Array.isArray(previous) ? previous : [];
  const srv = Array.isArray(server) ? server : [];
  const prevById = new Map(prev.map((item) => [item.id, item]));
  const prevByIngredient = new Map(
    prev
      .filter((item) => item.ingredient_id)
      .map((item) => [item.ingredient_id as string, item]),
  );
  const serverById = new Map(srv.map((item) => [item.id, item]));
  const seen = new Set<string>();
  const merged: ShoppingListItem[] = [];

  for (const prevItem of prev) {
    const serverItem = serverById.get(prevItem.id);
    seen.add(prevItem.id);
    if (serverItem) {
      merged.push(fillMissingName(serverItem, prevById, prevByIngredient));
    } else {
      merged.push(prevItem);
    }
  }

  for (const serverItem of srv) {
    if (seen.has(serverItem.id)) {
      continue;
    }
    merged.push(fillMissingName(serverItem, prevById, prevByIngredient));
    seen.add(serverItem.id);
  }

  return merged;
}
