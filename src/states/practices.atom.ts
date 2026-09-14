import { atom } from "jotai";
import type { Practice } from "../interfaces";

// Flat list of all nodes; the root node has parentUuid "".
export const practicesAtom = atom<Practice[]>([]);
