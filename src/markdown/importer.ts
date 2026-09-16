import type { Person, Practice } from "../interfaces";
import i18n from "../i18n";
import { BOARD_NAME, SUPPORTED_LANGUAGES, type StatusValue } from "../constants";
import { parseStatusLabel } from "./statusLabels";

export interface ParsedBoard {
  practices: Practice[],
  persons: Person[],
}

// The value of an i18n key in every supported language (from the locale files).
const localized = (key: string): string[] => {
  return SUPPORTED_LANGUAGES.map(lng => i18n.t(key, { lng }));
};

// Strips the trailing " - <language>" suffix the exporter appends to the h1
// title (e.g. " - Deutsch"), so it does not leak into the people list.
const stripLanguageSuffix = (title: string): string => {
  const lower = title.toLowerCase();
  for (const name of localized("board.language")) {
    const suffix = ` - ${name}`.toLowerCase();
    if (lower.endsWith(suffix)) {
      return title.slice(0, title.length - suffix.length);
    }
  }
  return title;
};

// Splits a people list like "Person A, Person B and Person C" into names.
// The conjunction is localized: "and", "und", "y", "en" (see "board.and").
const splitPeopleList = (list: string): string[] => {
  const conjunctions = localized("board.and").join("|");
  return list
    .split(new RegExp(`\\s*,\\s*|\\s+(?:${conjunctions})\\s+`))
    .map(name => name.trim())
    .filter(name => name.length > 0);
};

// Parses the people from a board title like "Kinkburst (for Person A, Person B and Person C)".
// The preposition is localized: "for", "für", "para", "voor" (see "board.for").
// Without a recognizable parenthetical this falls back to a single unnamed person.
const parsePersonsFromTitle = (title: string): Person[] => {
  const prepositions = localized("board.for").join("|");
  const match = title.match(new RegExp(`\\((${prepositions})\\s+(.+)\\)$`));

  if (!match) {
    return [{ id: crypto.randomUUID(), name: "" }];
  }

  const names = splitPeopleList(match[2]);
  if (names.length === 0) {
    return [{ id: crypto.randomUUID(), name: "" }];
  }

  return names.map(name => ({ id: crypto.randomUUID(), name }));
};

// Splits a header line like "Physical (Desired)" into its name and status.
// Status names are matched case-insensitively; an unrecognized or missing
// status defaults to Not Defined (0).
const parseHeader = (text: string): { name: string, value: StatusValue } => {
  const match = text.match(/^(.*?)\s*\(([^)]*)\)\s*$/);

  if (!match) {
    return { name: text.trim(), value: 0 };
  }

  const name = match[1].trim();
  // Status labels are accepted in every supported language (case-insensitive).
  const value = parseStatusLabel(match[2]);
  return { name, value };
};

/**
 * Parses a Kinkburst markdown document into the internal data format.
 *
 * Format spec: docs/markdown-format.md
 * - h1 title (with people list in brackets and an optional " - <language>" suffix),
 *   h2/h3/h4 hierarchy, "(Status)" suffixes, notes below headers
 * - Status labels and the people preposition/conjunction are accepted in every
 *   supported language (en/de/es/nl); unknown/missing statuses default to "Not Defined" (0)
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
        title = stripLanguageSuffix(text);
        const root: Practice = { uuid: crypto.randomUUID(), parentUuid: "", name: text };
        practices.push(root);
        stack.push(root);
      }
      continue;
    }

    // Without an h1, synthesize a root so the tree stays connected.
    if (stack.length === 0) {
      const root: Practice = { uuid: crypto.randomUUID(), parentUuid: "", name: BOARD_NAME };
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
      uuid: crypto.randomUUID(),
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
