import type { Person, Practice } from "../interfaces";
import i18n from "../i18n";
import { boardTitle } from "../helpers";
import { statusLabel } from "./statusLabels";

/**
 * Serializes the internal data format into a Kinkburst markdown document.
 * The format itself is specified in docs/markdown-format.md (source of truth).
 *
 * The tree is walked depth-first so the output is always in document order,
 * independent of the ordering of the flat practice list. Keyed (default-dataset)
 * nodes are translated into the active UI language; others use their stored name.
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

  // The " - <language>" suffix records the document language for the importer.
  const lng = i18n.language;
  const lines: string[] = [
    `# ${boardTitle(persons, lng)} - ${i18n.t("board.language", { lng })}`,
  ];

  const walk = (node: Practice, depth: number): void => {
    const children = childrenByParent.get(node.uuid) ?? [];
    for (const child of children) {
      // Keyed (default-dataset) nodes are translated; others use their stored name.
      const label = child.key ? i18n.t(`practices.${child.key}`) : (child.name ?? "");
      const childDepth = depth + 1;
      if (childDepth <= 3) {
        // h2/h3 for the first two levels, blank-line separated (spec rule 2).
        lines.push("");
        lines.push(`${"#".repeat(childDepth)} ${label} (${statusLabel(child.value ?? 0)})`);
      } else {
        const indent = "  ".repeat(childDepth - 4);
        lines.push(`${indent}- ${label} (${statusLabel(child.value ?? 0)})`);
      }
      const note = child.note?.trim();
      if (note) {
        lines.push(note);
      }
      walk(child, childDepth);
    }
  };

  walk(root, 1);

  return lines.join("\n") + "\n";
};
