import type { Person, Practice } from "../interfaces";
import i18n from "../i18n";
import { boardTitle } from "../helpers";
import { statusLabel } from "./statusLabels";

/**
 * Serializes the internal data format into a Smorkinkboard markdown document.
 *
 * Format spec: docs/markdown-format.md
 * - Exactly one h1 with the board title (including the people list), followed by
 *   a " - <language>" suffix naming the language of the document (e.g. " - Deutsch")
 * - One heading level per tree level (h2 = first level under the title), capped at h6
 * - Header names and statuses are written in the active UI language: default-dataset nodes
 *   carry an i18n key and are translated like every other label, e.g. "## Physical (Must)"
 *   or "## Physisch (Muss)"; user-added and imported nodes export their stored name
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

  // The document is written in the active UI language; the suffix records it
  // so the importer knows which labels to expect (see docs/markdown-format.md).
  const lng = i18n.language;
  const lines: string[] = [
    `# ${boardTitle(persons, lng)} - ${i18n.t("board.language", { lng })}`,
  ];

  const walk = (node: Practice, level: number): void => {
    const children = childrenByParent.get(node.uuid) ?? [];
    for (const child of children) {
      const headerLevel = Math.min(level + 1, 6);
      // Default-dataset nodes carry an i18n key; translate them into the active
      // UI language. User-added and imported nodes fall back to their name.
      const label = child.key ? i18n.t(`practices.${child.key}`) : (child.name ?? "");
      lines.push("");
      lines.push(`${"#".repeat(headerLevel)} ${label} (${statusLabel(child.value ?? 0)})`);
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
