import { Person, Practice } from "../interfaces";

export interface ParsedBoard {
  practices: Practice[],
  persons: Person[],
}

/**
 * Parses a Smorkinkboard markdown document into the internal data format.
 *
 * Format spec: docs/markdown-format.md
 * - h1 title (with people list in brackets), h2/h3/h4 hierarchy, "(Status)" suffixes, notes below headers
 * - Unknown/missing statuses default to "Not Defined" (0)
 *
 * TODO: implement per spec.
 */
export const importMarkdown = (_markdown: string): ParsedBoard => {
  throw new Error("Not implemented yet");
};
