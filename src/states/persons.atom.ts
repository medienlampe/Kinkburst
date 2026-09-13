import { atom } from "jotai";
import type { Person } from "../interfaces";

// The board is for one person by default; more can be added or removed as needed.
export const personsAtom = atom<Person[]>([
  { id: "person-1", name: "" }
]);
