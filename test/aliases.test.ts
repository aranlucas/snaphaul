import { expect, test } from "vitest";
import { keyedValues } from "@/lib/listing-keys";
import { listingValues } from "@test/helpers/listing-values";

test("resolves source and test-helper aliases", () => {
  const keyed = keyedValues(listingValues, (value) => value);

  expect(keyed.map((entry) => entry.value)).toEqual(listingValues);
  expect(new Set(keyed.map((entry) => entry.key)).size).toBe(listingValues.length);
});
