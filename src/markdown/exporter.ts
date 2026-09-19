import type { Person, Practice } from "../interfaces";
import i18n from "../i18n";
import { boardTitle } from "../helpers";
import { statusLabel } from "./statusLabels";

/**
 * Serializes the internal data format into a Kinkburst markdown document.
 *
 * Format spec: docs/markdown-format.md
 * - Exactly one h1 with the board title (including the people list), followed by
 *   a " - <language>" suffix naming the language of the document (e.g. " - Deutsch")
 * - The first two tree levels are headings (h2, h3); every deeper level is an unordered
 *   list item, indented two spaces per level below the h3s — any depth round-trips
 * - Names and statuses are written in the active UI language: default-dataset nodes
 *   carry an i18n key and are translated like every other label, e.g. "## Physical (Desired)"
 *   or "## Physisch (Gewünscht)"; user-added and imported nodes export their stored name
 * - Context notes as free text below the item; items with a note get "*" appended to their title in the UI
 *
 * The tree is walked depth-first so the output is always in document order,
 * independent of the ordering of the flat practice list. Tree levels map to h2/h3
 * headings and then to list indentation (root = h1).
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

  // The document is written in the active UI language; the suffix records it
  // so the importer knows which labels to expect (see docs/markdown-format.md).
  const lng = i18n.language;
  const lines: string[] = [
    `# ${boardTitle(persons, lng)} - ${i18n.t("board.language", { lng })}`,
  ];

  const walk = (node: Practice, depth: number): void => {
    const children = childrenByParent.get(node.uuid) ?? [];
    for (const child of children) {
      // Default-dataset nodes carry an i18n key; translate them into the active
      // UI language. User-added and imported nodes fall back to their name.
      const label = child.key ? i18n.t(`practices.${child.key}`) : (child.name ?? "");
      const childDepth = depth + 1;
      if (childDepth <= 3) {
        // The first two tree levels are h2/h3 headings, separated by blank lines.
        lines.push("");
        lines.push(`${"#".repeat(childDepth)} ${label} (${statusLabel(child.value ?? 0)})`);
      } else {
        // Deeper levels are list items, indented two spaces per level below the h3s.
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
