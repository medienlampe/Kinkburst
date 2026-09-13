import * as d3 from "d3";
import { atom } from "jotai";
import type { Practice } from "../interfaces";
import { practicesAtom } from "./practices.atom";
import { radius } from "../constants";

// Derived: the partition layout (angles and sizes) of the sunburst.
export const hierarchicalNodesAtom = atom((read) => {
  const practices = read(practicesAtom);

  if (!practices || practices.length === 0) {
    return [];
  }

  const root = d3.stratify<Practice>()
    .id(d => d.uuid)
    .parentId(d => d.parentUuid)(practices);

  // Every leaf gets an equal layout weight so each practice takes the same
  // amount of arc space. The weights live on the hierarchy nodes, so the
  // status in data.value is left untouched for rendering.
  root.sum(() => 1000);
  root.sort((a, b) => d3.descending(a.value, b.value));

  const partition = d3.partition<Practice>().size([2 * Math.PI, radius])(root);

  return partition.descendants();
});
