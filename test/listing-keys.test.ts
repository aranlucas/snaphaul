import { expect, test } from "vitest";
import { keyedValues } from "@/lib/listing-keys";

const identifyTag = (tag: string) => tag;

test("duplicate model output gets distinct, repeatable keys without losing entries", () => {
  const values = ["red", "red", "blue"];
  const keyed = keyedValues(values, identifyTag);

  expect(keyed.map((entry) => entry.value)).toEqual(values);
  expect(new Set(keyed.map((entry) => entry.key)).size).toBe(values.length);
  expect(keyedValues(values, identifyTag)).toEqual(keyed);
});

test("unrelated insertion and reordering preserve existing entry keys", () => {
  const original = keyedValues(["red", "blue"], identifyTag);
  const reordered = keyedValues(["green", "blue", "red"], identifyTag);

  expect(reordered[1]).toEqual(original[1]);
  expect(reordered[2]).toEqual(original[0]);
});
