import type { Person, Practice } from "../interfaces";
import { STATUSES } from "../constants";
import { boardTitle } from "../helpers";

/**
 * Serializes the internal data format into a Smorkinkboard markdown document.
 *
 * Format spec: docs/markdown-format.md
 * - Exactly one h1 with the board title (including the people list)
 * - h2 top categories, h3 play areas, h4 practices
 * - Status in brackets after each header name, e.g. "## Physical (Must)"
 * - Context notes as text below the header; items with a note get "*" appended to their title in the UI
 *
 * The tree is walked depth-first so the output is always in document order,
 * independent of the ordering of the flat practice list. Header levels map to
 * tree depth (root = h1), capped at h6 for arbitrarily deep user edits.
 */
export const exportMarkdown = (practices: Practice[], persons: Person[]): string => {
  let root: Practice | undefined;
  const childrenByParent = new Map<string, Practice[]>();

  for (const practice of practices) {
    if (practice.parentUuid === "") {
      root = practice;
    } else {
      const siblings = childrenByParent.get(practice.parentUuid) ?? [];
      siblings.push(practice);
      childrenByParent.set(practice.parentUuid, siblings);
    }
  }

  if (!root) {
    return "";
  }

  const lines: string[] = [`# ${boardTitle(persons)}`];

  const walk = (node: Practice, level: number): void => {
    const children = childrenByParent.get(node.uuid) ?? [];
    for (const child of children) {
      const headerLevel = Math.min(level + 1, 6);
      const statusLabel = STATUSES[child.value ?? 0].label;
      lines.push("");
      lines.push(`${"#".repeat(headerLevel)} ${child.name ?? ""} (${statusLabel})`);
      const note = child.note?.trim();
      if (note) {
        lines.push(note);
      }
      walk(child, headerLevel);
    }
  };

  walk(root, 1);

  return lines.join("\n") + "\n";
};
