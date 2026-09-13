import * as d3 from "d3";
import { atom } from "jotai";
import type Flavour from "../interfaces";
import { flavoursAtom } from "./flavours.atom";

// Derived: the flat list of nodes as a d3 hierarchy.
export const hierarchicalFlavoursAtom = atom((read) => {
  const flavours = read(flavoursAtom);

  if (!flavours || flavours.length === 0) {
    return null;
  }

  return d3.stratify<Flavour>()
    .id(d => d.uuid)
    .parentId(d => d.parentUuid)(flavours);
});
