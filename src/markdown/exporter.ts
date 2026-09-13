import { Person, Practice } from "../interfaces";

/**
 * Serializes the internal data format into a Smorkinkboard markdown document.
 *
 * Format spec: docs/markdown-format.md
 * - Exactly one h1 with the board title (including the people list)
 * - h2 top categories, h3 play areas, h4 practices
 * - Status in brackets after each header name, e.g. "## Physical (Must)"
 * - Context notes as text below the header; items with a note get "*" appended to their title in the UI
 *
 * TODO: implement per spec.
 */
export const exportMarkdown = (_practices: Practice[], _persons: Person[]): string => {
  throw new Error("Not implemented yet");
};
