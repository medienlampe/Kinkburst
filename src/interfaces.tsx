import type { StatusValue } from "./constants";

// Smorkinkboard domain types (see docs/Outline.md).
// The tree is stored flat: the root node has parentUuid "".
export interface Practice {
  uuid: string,
  parentUuid: string,
  key?: string,
  name?: string,
  value?: StatusValue,
  note?: string,
}

export interface Person {
  id: string,
  name: string,
}
