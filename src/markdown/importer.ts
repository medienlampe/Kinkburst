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

// Splits an item like "Physical (Desired)" into its name and status.
// Status names are matched case-insensitively; an unrecognized or missing
// status defaults to Not Defined (0).
const parseItem = (text: string): { name: string, value: StatusValue } => {
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
 *   h2/h3 for the first two tree levels, unordered lists (two spaces per level)
 *   below that, "(Status)" suffixes, notes as free text after an item
 * - Status labels and the people preposition/conjunction are accepted in every
 *   supported language (en/de/es/nl); unknown/missing statuses default to "Not Defined" (0)
 * - A node's status never exceeds its parent's: after parsing, each node's status is
 *   lifted up to its ancestors (see applyClick in helpers.tsx for the app's invariant)
 * - Importing replaces the current board state entirely (same semantics as the original's JSON import)
 *
 * Items are assigned to parents with a level stack, so any depth round-trips.
 * The h1 becomes the root node; its people parenthetical is parsed into the
 * persons list and stripped from the root name.
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

  // The h1 is the board title; its people parenthetical becomes the persons list.
  const handleTitle = (text: string): void => {
    if (stack.length > 0) {
      return; // ignore any further h1 lines
    }
    title = stripLanguageSuffix(text);
    const root: Practice = { uuid: crypto.randomUUID(), parentUuid: "", name: text };
    practices.push(root);
    stack.push(root);
  };

  // Attaches an item to the most recent item at a shallower level.
  const attach = (text: string, level: number): void => {
    // Without an h1, synthesize a root so the tree stays connected.
    if (stack.length === 0) {
      const root: Practice = { uuid: crypto.randomUUID(), parentUuid: "", name: BOARD_NAME };
      practices.push(root);
      stack.push(root);
    }

    // The root sits at stack index 0; an item of level L attaches to the node at
    // level L-1, i.e. to a stack of length L-1.
    while (stack.length > 1 && stack.length >= level) {
      stack.pop();
    }

    const { name, value } = parseItem(text);
    const practice: Practice = {
      uuid: crypto.randomUUID(),
      parentUuid: stack[stack.length - 1].uuid,
      name,
      value,
    };
    practices.push(practice);
    stack.push(practice);
  };

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line === "") {
      continue; // blank lines are ignored
    }

    // The h1 is the board title; the first two tree levels are h2/h3 headings.
    const headerMatch = line.match(/^(#{1,3})\s+(.*)$/);
    if (headerMatch) {
      flushNote();
      const level = headerMatch[1].length;
      if (level === 1) {
        handleTitle(headerMatch[2].trim());
      } else {
        attach(headerMatch[2].trim(), level);
      }
      continue;
    }

    // Two spaces of indentation = one level deeper; list items sit below the h3s.
    const listItemMatch = rawLine.match(/^(\s*)- (.*)$/);
    if (listItemMatch) {
      flushNote();
      const indent = Math.floor(listItemMatch[1].length / 2);
      attach(listItemMatch[2].trim(), indent + 4);
      continue;
    }

    // Free text after an item is context for that item.
    noteBuffer.push(line);
  }

  flushNote();

  // Restore the app's invariant (see applyClick in helpers.tsx): a field may never be
  // higher than its parents — lift each node's status up to its ancestors, so a
  // "Desired" leaf renders together with its whole branch.
  const byUuid = new Map(practices.map((practice): [string, Practice] => [practice.uuid, practice]));
  for (const practice of practices) {
    let cursor = byUuid.get(practice.parentUuid);
    while (cursor) {
      if ((practice.value ?? 0) > (cursor.value ?? 0)) {
        cursor.value = practice.value;
      }
      cursor = byUuid.get(cursor.parentUuid);
    }
  }

  return { practices, persons: parsePersonsFromTitle(title) };
};
