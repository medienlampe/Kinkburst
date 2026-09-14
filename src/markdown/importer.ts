import { v4 as uuidv4 } from "uuid";
import type { Person, Practice } from "../interfaces";
import { BOARD_NAME, STATUS_BY_LABEL, type StatusValue } from "../constants";

export interface ParsedBoard {
  practices: Practice[],
  persons: Person[],
}

// Splits a people list like "Person A, Person B and Person C" into names.
const splitPeopleList = (list: string): string[] => {
  return list
    .split(/\s*,\s*|\s+and\s+/)
    .map(name => name.trim())
    .filter(name => name.length > 0);
};

// Parses the people from a board title like "Smorkinkboard (for Person A, Person B and Person C)".
// Without a recognizable "(for ...)" parenthetical this falls back to a single unnamed person.
const parsePersonsFromTitle = (title: string): Person[] => {
  const match = title.match(/\(for\s+(.+)\)$/);

  if (!match) {
    return [{ id: uuidv4(), name: "" }];
  }

  const names = splitPeopleList(match[1]);
  if (names.length === 0) {
    return [{ id: uuidv4(), name: "" }];
  }

  return names.map(name => ({ id: uuidv4(), name }));
};

// Splits a header line like "Physical (Must)" into its name and status.
// Status names are matched case-insensitively; an unrecognized or missing
// status defaults to Not Defined (0).
const parseHeader = (text: string): { name: string, value: StatusValue } => {
  const match = text.match(/^(.*?)\s*\(([^)]*)\)\s*$/);

  if (!match) {
    return { name: text.trim(), value: 0 };
  }

  const name = match[1].trim();
  const value = STATUS_BY_LABEL[match[2].trim().toLowerCase()] ?? 0;
  return { name, value };
};

/**
 * Parses a Smorkinkboard markdown document into the internal data format.
 *
 * Format spec: docs/markdown-format.md
 * - h1 title (with people list in brackets), h2/h3/h4 hierarchy, "(Status)" suffixes, notes below headers
 * - Unknown/missing statuses default to "Not Defined" (0)
 * - Importing replaces the current board state entirely (same semantics as the original's JSON import)
 *
 * Headers are assigned to parents with a level stack, so any header depth
 * round-trips. The h1 becomes the root node; its people parenthetical is
 * parsed into the persons list and stripped from the root name.
 */
export const importMarkdown = (markdown: string): ParsedBoard => {
  let title = BOARD_NAME;
  const practices: Practice[] = [];
  // Ancestors of the next header, innermost last; starts with the root.
  const stack: Practice[] = [];
  let noteBuffer: string[] = [];

  const flushNote = (): void => {
    if (stack.length > 0 && noteBuffer.length > 0) {
      const current = stack[stack.length - 1];
      current.note = noteBuffer.join("\n").trim();
    }
    noteBuffer = [];
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line === "") {
      continue; // blank lines are ignored
    }

    const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);

    if (!headerMatch) {
      // Free text below a header is context for that item.
      noteBuffer.push(line);
      continue;
    }

    flushNote();

    const level = headerMatch[1].length;
    const text = headerMatch[2].trim();

    if (level === 1) {
      // The h1 is the board title; ignore any further h1 lines.
      if (stack.length === 0) {
        title = text;
        const root: Practice = { uuid: uuidv4(), parentUuid: "", name: text };
        practices.push(root);
        stack.push(root);
      }
      continue;
    }

    // Without an h1, synthesize a root so the tree stays connected.
    if (stack.length === 0) {
      const root: Practice = { uuid: uuidv4(), parentUuid: "", name: BOARD_NAME };
      practices.push(root);
      stack.push(root);
    }

    // The root sits at stack index 0 (level 1); a header of level L must be
    // attached to the node at level L-1, i.e. to a stack of length L-1.
    while (stack.length > 1 && stack.length >= level) {
      stack.pop();
    }

    const { name, value } = parseHeader(text);
    const practice: Practice = {
      uuid: uuidv4(),
      parentUuid: stack[stack.length - 1].uuid,
      name,
      value,
    };
    practices.push(practice);
    stack.push(practice);
  }

  flushNote();

  return { practices, persons: parsePersonsFromTitle(title) };
};
