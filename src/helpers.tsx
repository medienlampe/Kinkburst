import * as d3 from "d3";
import type { Person, Practice } from "./interfaces";
import { BOARD_NAME, STATUS_COUNT, type StatusValue } from "./constants";

export const findAllDescendants = (practices: Practice[], practiceUuid: string): string[] => {
  const children = practices
    .filter(practice => practice.parentUuid === practiceUuid)
    .map(practice => practice.uuid);

  const descendants = children.flatMap(uuid => findAllDescendants(practices, uuid));

  return children.concat(descendants);
}

// The board title, e.g. "Smorkinkboard (for Person A, Person B and Person C)".
// With fewer than two named persons the parenthetical is omitted (see
// docs/markdown-format.md, rule 1).
export const boardTitle = (persons: Person[]): string => {
  const names = persons
    .map(person => person.name.trim())
    .filter(name => name.length > 0);

  if (names.length < 2) {
    return BOARD_NAME;
  }

  const list = names.slice(0, -1).join(", ") + " and " + names[names.length - 1];
  return `${BOARD_NAME} (for ${list})`;
}

// Applies a click on the field with the given uuid to the flat practice list
// and returns the updated list. The clicked field cycles through all statuses
// (0 → 1 → … → 5 → 0) and the new status propagates:
// - Hard Limit (1) to all descendants,
// - Soft Limit (2) to descendants that are currently positive (3/4/5),
// - Can/Should/Must (3/4/5) to all practice ancestors (not the root, which is
//   just the board title and carries no status),
// - Not Defined (0) nowhere.
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

    // Hard limit? Update everything below it.
    if (newValue === 1 && descendantUuids.has(practice.uuid)) {
      return { ...practice, value: newValue };
    }
    // Soft limit? Update the children that are currently positive.
    if (newValue === 2 && descendantUuids.has(practice.uuid) && (practice.value ?? 0) >= 3) {
      return { ...practice, value: newValue };
    }
    // Positive status? Update the parents to that.
    if (newValue >= 3 && ancestorUuids.has(practice.uuid)) {
      return { ...practice, value: newValue };
    }

    return practice;
  });
};
