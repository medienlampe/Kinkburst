import * as d3 from "d3";
import type { Person, Practice } from "./interfaces";
import { BOARD_NAME, STATUS_COUNT, type StatusValue } from "./constants";
import i18n from "./i18n";

export const findAllDescendants = (practices: Practice[], practiceUuid: string): string[] => {
  const children = practices
    .filter(practice => practice.parentUuid === practiceUuid)
    .map(practice => practice.uuid);

  const descendants = children.flatMap(uuid => findAllDescendants(practices, uuid));

  return children.concat(descendants);
}

// True if any descendant of the given practice carries a defined status
// (value > 0). Used to decide whether setting the field to Hard Limit would
// actually reset anything — an all-Not-Defined subtree needs no warning.
export const hasDefinedDescendants = (practices: Practice[], practiceUuid: string): boolean => {
  const descendantUuids = new Set(findAllDescendants(practices, practiceUuid));
  return practices.some(practice => descendantUuids.has(practice.uuid) && (practice.value ?? 0) > 0);
}

// The status a click produces from the current value: downwards by default
// (0 → 4 → … → 1 → 0), upwards when `cycleUp` is set (Shift held, 0 → 1 → …).
// Shared by applyClick and the UI so both can never disagree.
export const nextStatus = (value: number | undefined, cycleUp: boolean): StatusValue => {
  const delta = cycleUp ? 1 : -1;
  return (((value ?? 0) + delta + STATUS_COUNT) % STATUS_COUNT) as StatusValue;
}

// The board title, e.g. "Kinkburst (for Person A, Person B and Person C)".
// With fewer than two named persons the parenthetical is omitted (see
// docs/markdown-format.md, rule 1). The preposition and conjunction are
// localized via the locale files ("board.for", "board.and"); `lng` pins a
// specific language (used by the markdown exporter), defaulting to the
// active UI language.
export const boardTitle = (persons: Person[], lng?: string): string => {
  const names = persons
    .map(person => person.name.trim())
    .filter(name => name.length > 0);

  if (names.length < 2) {
    return BOARD_NAME;
  }

  const t = (key: string): string => i18n.t(key, lng ? { lng } : undefined);
  const list = names.slice(0, -1).join(", ") + " " + t("board.and") + " " + names[names.length - 1];
  return `${BOARD_NAME} (${t("board.for")} ${list})`;
}

// Safely parses the board state persisted in localStorage. Returns undefined
// for missing or corrupted data (invalid JSON, wrong shape, broken tree) so
// the app falls back to the default dataset instead of crashing on load.
export const parseStoredPractices = (raw: string | null): Practice[] | undefined => {
  if (!raw) {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return undefined;
  }

  const nodes = parsed as Partial<Practice>[];
  if (!nodes.every(node => typeof node.uuid === "string" && typeof node.parentUuid === "string")) {
    return undefined;
  }

  // Boards saved with an older status scale may carry values that no longer
  // exist (e.g. 5, before "Must" was removed) — clamp them to the top of the
  // current scale so rendering never hits an unknown status.
  const clamped = nodes.map(node => {
    if (typeof node.value === "number" && node.value > STATUS_COUNT - 1) {
      return { ...node, value: STATUS_COUNT - 1 };
    }
    return node;
  });

  // The tree must be well-formed: unique uuids, exactly one root (parentUuid
  // ""), and every other node's parent must exist — otherwise d3.stratify
  // throws during rendering.
  const uuids = new Set(nodes.map(node => node.uuid));
  if (uuids.size !== nodes.length) {
    return undefined;
  }

  const roots = nodes.filter(node => node.parentUuid === "");
  if (roots.length !== 1 || !nodes.every(node => node.parentUuid === "" || uuids.has(node.parentUuid))) {
    return undefined;
  }

  return clamped as Practice[];
};

// Safely parses the persons persisted in localStorage; returns undefined for
// missing or corrupted data so the app falls back to the default person.
export const parseStoredPersons = (raw: string | null): Person[] | undefined => {
  if (!raw) {
    return undefined;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    return undefined;
  }

  const people = parsed as Partial<Person>[];
  if (!people.every(person => typeof person.id === "string" && typeof person.name === "string")) {
    return undefined;
  }

  return people as Person[];
};

// Sets the field with the given uuid to an explicit status and propagates it,
// keeping the invariant that no field is ever higher than one of its parents:
// - Not Defined (0) resets all descendants to Not Defined,
// - Hard Limit (1) resets all descendants to Not Defined — only the set field
//   itself turns red, so a hard limit does not visually dominate the whole
//   subtree (the caller asks for confirmation first, see App),
// - Soft Limit (2) / Okay / Desired (3/4) lower any descendant that exceeds
//   the new value (e.g. a positive child of a newly soft-limited category),
// - Ancestors are raised to at least the new value so a hard-limited field can
//   never sit under a looser one.
// The root (the board title) and unknown nodes are ignored.
export const applyStatus = (practices: Practice[], uuid: string, newValue: StatusValue): Practice[] => {
  if (!practices || practices.length === 0) {
    return practices;
  }

  const root = d3.stratify<Practice>()
    .id(d => d.uuid)
    .parentId(d => d.parentUuid)(practices);

  const nodeByUuid = new Map(root.descendants().map(node => [node.data.uuid, node]));
  const target = nodeByUuid.get(uuid);

  if (!target || target.depth === 0) {
    return practices;
  }

  const descendantUuids = new Set(target.descendants().map(node => node.data.uuid));
  const ancestorUuids = new Set(
    target.ancestors()
      .filter(node => node.depth > 0) // the root is the board title, not a practice
      .map(node => node.data.uuid)
  );

  return practices.map(practice => {
    if (practice.uuid === uuid) {
      return { ...practice, value: newValue };
    }

    if (descendantUuids.has(practice.uuid)) {
      // Not defined (overflow)? Reset everything below it.
      if (newValue === 0) {
        return { ...practice, value: newValue };
      }
      // Hard limit? Only the clicked field is red — everything below it goes
      // back to Not Defined so the user can mark individual children again.
      if (newValue === 1) {
        return { ...practice, value: 0 };
      }
      // A field may never exceed its parents — clamp the child.
      if ((practice.value ?? 0) > newValue) {
        return { ...practice, value: newValue };
      }
    }

    // A field may never be higher than its parents — raise them.
    if (newValue >= 1 && ancestorUuids.has(practice.uuid) && (practice.value ?? 0) < newValue) {
      return { ...practice, value: newValue };
    }

    return practice;
  });
};

// Applies a click on the field with the given uuid to the flat practice list
// and returns the updated list. The clicked field cycles through all statuses
// downwards (0 → 4 → … → 1 → 0, i.e. from Not Defined straight to Desired and
// back down through the scale); with `cycleUp` (Shift held) it cycles upwards
// instead (0 → 1 → … → 4 → 0). Propagation is identical to applyStatus.
export const applyClick = (practices: Practice[], uuid: string, cycleUp = false): Practice[] => {
  if (!practices || practices.length === 0) {
    return practices;
  }

  const target = practices.find(practice => practice.uuid === uuid);
  if (!target) {
    return practices;
  }

  return applyStatus(practices, uuid, nextStatus(target.value, cycleUp));
};
