import { v4 as uuidv4 } from "uuid";
import Flavour from "../interfaces";
import { ROOT_FLAVOUR } from "../constants";
import { parseState } from "./states";

/**
 * Parses a Sunburst Smorgasbord markdown document into the internal data format.
 *
 * Format spec: docs/markdown-format.md
 * - h1 board name (its content is not part of the data), h2 primary nodes, deeper
 *   levels as unordered list items ("-") indented two spaces per level, "(STATE)" suffixes
 * - States are NO/MAYBE/YES, accepted case-insensitively; unrecognized or missing states
 *   default to NO
 * - The root node is not part of the document; it is synthesized with its fixed identity
 * - Free text is not part of the format and is ignored (this data model has no notes)
 *
 * Items are assigned to parents with a level stack, so any depth round-trips.
 * Importing replaces the current board state entirely (same semantics as the old JSON import).
 */
export const importMarkdown = (markdown: string): Flavour[] => {
  // The root node is not part of the document (the h1 is the board name);
  // synthesize it so the tree stays connected.
  const root: Flavour = { uuid: uuidv4(), parentUuid: "", ...ROOT_FLAVOUR };
  const flavours: Flavour[] = [root];

  // Ancestors of the next item, innermost last; each entry records the level it
  // was parsed at (root = 1, h2 primary nodes = 2, list items deeper).
  const stack: Array<{ flavour: Flavour, level: number }> = [{ flavour: root, level: 1 }];

  const attach = (text: string, level: number): void => {
    // An item attaches to the most recent item at a shallower level.
    while (stack.length > 1 && stack[stack.length - 1].level >= level) {
      stack.pop();
    }

    // Split an item like "Kink (MAYBE)" into its name and state; an unrecognized
    // or missing state defaults to NO.
    const match = text.match(/^(.*?)\s*\(([^)]*)\)\s*$/);
    const flavour: Flavour = {
      uuid: uuidv4(),
      parentUuid: stack[stack.length - 1].flavour.uuid,
      name: (match ? match[1] : text).trim(),
      state: match ? parseState(match[2]) : "NO"
    };

    flavours.push(flavour);
    stack.push({ flavour, level });
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    if (rawLine.trim() === "") {
      continue; // blank lines are ignored
    }

    const headerMatch = rawLine.match(/^(#{1,6})\s+(.*)$/);
    if (headerMatch) {
      const level = headerMatch[1].length;
      if (level === 1) {
        continue; // the h1 is the board name; its content is not part of the data
      }
      attach(headerMatch[2].trim(), level);
      continue;
    }

    const listItemMatch = rawLine.match(/^(\s*)- (.*)$/);
    if (listItemMatch) {
      // List items start at level 3 (children of the h2 primary nodes), one
      // level deeper per two spaces of indentation.
      const indent = Math.floor(listItemMatch[1].length / 2);
      attach(listItemMatch[2].trim(), indent + 3);
      continue;
    }

    // Free text is not part of the format; ignore it.
  }

  return flavours;
};
