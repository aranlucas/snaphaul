type KeyedValue<T> = { key: string; value: T };

// Content plus occurrence keeps unrelated insertions/reordering from remounting
// read-only entries, while preserving legitimate duplicate model output.
export function keyedValues<T>(
  values: readonly T[],
  identify: (value: T) => string,
): KeyedValue<T>[] {
  const occurrences = new Map<string, number>();

  return values.map((value) => {
    const identity = identify(value);
    const occurrence = occurrences.get(identity) ?? 0;
    occurrences.set(identity, occurrence + 1);

    return { key: JSON.stringify([identity, occurrence]), value };
  });
}
