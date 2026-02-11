import type { Phrase } from "../types";

let counter = 0;

export function makePhrase(overrides?: Partial<Phrase>): Phrase {
  counter++;
  return {
    id: `test-id-${counter}`,
    phrase: `test phrase ${counter}`,
    meaning: `test meaning ${counter}`,
    source: null,
    tags: [],
    memo: null,
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}

export function makeFullPhrase(overrides?: Partial<Phrase>): Phrase {
  counter++;
  return {
    id: `test-id-${counter}`,
    phrase: `full phrase ${counter}`,
    meaning: `full meaning ${counter}`,
    source: "Test Source",
    tags: ["tag1", "tag2"],
    memo: "Test memo",
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2025-01-01T00:00:00Z",
    ...overrides,
  };
}
