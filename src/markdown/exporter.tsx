import Flavour from "../interfaces";
import i18n from "../i18n";
import { BOARD_NAME } from "../constants";

/**
 * Serializes the internal data format into a Sunburst Smorgasbord markdown document.
 *
 * Format spec: docs/markdown-format.md
 * - Exactly one h1 with the board name, followed by a " - <language>" suffix naming the
 *   language of the document (e.g. " - Deutsch")
 * - Primary nodes (children of the root) as h2 headers; deeper levels as unordered list
 *   items ("-"), indented two spaces per level — e.g. "## Kink (MAYBE)" followed by
 *   "- Body contact (YES)" and "  - Deep pressure (NO)"
 * - Header names are written in the active UI language: default-dataset nodes carry an i18n
 *   key and are translated like every other label; user-added and imported nodes export
 *   their stored name
 * - States are the internal values NO/MAYBE/YES; the root node is not exported (importing
 *   synthesizes it)
 *
 * The tree is walked depth-first so the output is always in document order,
 * independent of the ordering of the flat flavour list.
 */
export const exportMarkdown = (flavours: Flavour[]): string => {
  let root: Flavour | undefined;
  const childrenByParent = new Map<string, Flavour[]>();

  for (const flavour of flavours) {
    if (flavour.parentUuid === "") {
      root = flavour;
    } else {
      const siblings = childrenByParent.get(flavour.parentUuid) ?? [];
      siblings.push(flavour);
      childrenByParent.set(flavour.parentUuid, siblings);
    }
  }

  if (!root) {
    return "";
  }

  // The document is written in the active UI language; the suffix records it
  // (see docs/markdown-format.md).
  const lng = i18n.language;
  const lines: string[] = [
    `# ${BOARD_NAME} - ${i18n.t("board.language", { lng })}`,
  ];

  // Default-dataset nodes carry an i18n key; translate them into the active
  // UI language. User-added and imported nodes fall back to their name.
  const label = (flavour: Flavour): string => {
    return flavour.key ? i18n.t(`flavours.${flavour.key}`) : (flavour.name ?? "");
  };

  const state = (flavour: Flavour): string => {
    return flavour.state ?? "NO";
  };

  // Deeper levels are unordered list items, indented two spaces per level.
  const walkListItems = (node: Flavour, indent: number): void => {
    const children = childrenByParent.get(node.uuid) ?? [];
    for (const child of children) {
      lines.push(`${"  ".repeat(indent)}- ${label(child)} (${state(child)})`);
      walkListItems(child, indent + 1);
    }
  };

  // Primary nodes (children of the root) are h2 headers; their descendants
  // are the list items below them.
  const primaries = childrenByParent.get(root.uuid) ?? [];
  for (const primary of primaries) {
    lines.push("");
    lines.push(`## ${label(primary)} (${state(primary)})`);
    walkListItems(primary, 0);
  }

  return lines.join("\n") + "\n";
};
