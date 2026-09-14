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

// The board title, e.g. "Smorkinkboard (for Person A, Person B and Person C)".
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

// Applies a click on the field with the given uuid to the flat practice list
// and returns the updated list. The clicked field cycles through all statuses
// (0 → 1 → … → 5 → 0) and the new status propagates so that no field is ever
// higher than one of its parents:
// - Not Defined (0, the overflow case) resets all descendants to Not Defined,
// - Hard Limit (1) sets all descendants to Hard Limit,
// - Soft Limit (2) / Can / Should / Must (3/4/5) lower any descendant that
//   exceeds the new value (e.g. a positive child of a newly soft-limited
//   category),
// - any defined status (1-5) raises every practice ancestor (not the root,
//   which is just the board title and carries no status) that is lower than it.
// Clicks on the root (the board title) or unknown nodes are ignored.
export const applyClick = (practices: Practice[], uuid: string): Practice[] => {
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

  const newValue = (((target.data.value ?? 0) + 1) % STATUS_COUNT) as StatusValue;
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
      // Hard limit? Everything below it is a hard limit as well.
      if (newValue === 1) {
        return { ...practice, value: newValue };
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
