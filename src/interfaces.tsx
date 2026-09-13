import type { StatusValue } from "./constants";

interface Flavour {
  uuid: string,
  parentUuid: string,
  key?: string,
  name?: string,
  value?: number,
  state?: string,
}

// Smorkinkboard domain types (see docs/Outline.md).
// The tree is stored flat, like the original flavours: the root node has parentUuid "".
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

export default Flavour;