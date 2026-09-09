export type Selection = {index: number; score: number; reason: string};

export function validateSelections(value: unknown, count: number, total: number): Selection[] {
  if (!Array.isArray(value) || value.length !== count) throw new Error('Invalid selection count');
  const seen = new Set<number>();
  const selections = value.map((item: unknown) => {
    if (!item || typeof item !== 'object') throw new Error('Invalid selection');
    const {index, score, reason} = item as Selection;
    if (!Number.isInteger(index) || index < 0 || index >= total || seen.has(index) ||
        !Number.isInteger(score) || score < 1 || score > 100 ||
        typeof reason !== 'string' || !reason.trim() || reason.length > 2000) {
      throw new Error('Invalid selection');
    }
    seen.add(index);
    return {index, score, reason: reason.trim()};
  });
  return selections.sort((a, b) => b.score - a.score);
}
