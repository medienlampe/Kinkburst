import { atom } from "jotai";
import type Flavour from "../interfaces";

// Flat list of all nodes; the root node has parentUuid "".
export const flavoursAtom = atom<Flavour[]>([]);
