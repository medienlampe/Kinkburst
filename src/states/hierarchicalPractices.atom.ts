import * as d3 from "d3";
import { atom } from "jotai";
import type { Practice } from "../interfaces";
import { practicesAtom } from "./practices.atom";

// Derived: the flat list of nodes as a d3 hierarchy.
export const hierarchicalPracticesAtom = atom((read) => {
  const practices = read(practicesAtom);

  if (!practices || practices.length === 0) {
    return null;
  }

  return d3.stratify<Practice>()
    .id(d => d.uuid)
    .parentId(d => d.parentUuid)(practices);
});
