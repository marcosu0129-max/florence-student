/** Merge overlapping server pages without duplicate cards; fresher rows replace old metadata. */
export function mergeMaterialRows<T extends { id: string }>(previous: T[], page: T[]): T[] {
  const items = [...previous];
  const positions = new Map(items.map((item, index) => [item.id, index]));
  for (const item of page) {
    const position = positions.get(item.id);
    if (position === undefined) { positions.set(item.id, items.length); items.push(item); }
    else items[position] = item;
  }
  return items;
}
