import { describe, expect, it } from "vitest";
import { exportMarkdown } from "./exporter";
import { importMarkdown } from "./importer";
import type { Practice } from "../interfaces";

// The example from docs/markdown-format.md (source of truth for the format).
const docExample = `# Smorkinkboard (for Person A, Person B and Person C)

## Physical (Must)
Favourite of Person B

### Impact (Must)

### Bondage (Can)

### Blood (Soft Limit)

#### Cutting (Hard Limit)
Can trigger crash for Person A.

#### Needling (Can)
Liked by Person B.

## Psychological (Not Defined)

### Degradation (Not Defined)

## Social (Should)

### Public (Should)
`;

const byName = (practices: Practice[]): Map<string, Practice> => {
  return new Map(practices.map(practice => [practice.name, practice]));
};

describe("importMarkdown", () => {
  it("parses the example from docs/markdown-format.md", () => {
    const board = importMarkdown(docExample);

    expect(board.persons.map(person => person.name)).toEqual(["Person A", "Person B", "Person C"]);

    const nodes = byName(board.practices);
    const root = board.practices.find(practice => practice.parentUuid === "");
    expect(root).toBeDefined();
    expect(root?.name).toBe("Smorkinkboard (for Person A, Person B and Person C)");

    // Hierarchy: categories hang off the root, play areas off categories, practices off play areas.
    expect(nodes.get("Physical")?.parentUuid).toBe(root?.uuid);
    expect(nodes.get("Psychological")?.parentUuid).toBe(root?.uuid);
    expect(nodes.get("Social")?.parentUuid).toBe(root?.uuid);
    expect(nodes.get("Impact")?.parentUuid).toBe(nodes.get("Physical")?.uuid);
    expect(nodes.get("Bondage")?.parentUuid).toBe(nodes.get("Physical")?.uuid);
    expect(nodes.get("Blood")?.parentUuid).toBe(nodes.get("Physical")?.uuid);
    expect(nodes.get("Cutting")?.parentUuid).toBe(nodes.get("Blood")?.uuid);
    expect(nodes.get("Needling")?.parentUuid).toBe(nodes.get("Blood")?.uuid);
    expect(nodes.get("Degradation")?.parentUuid).toBe(nodes.get("Psychological")?.uuid);
    expect(nodes.get("Public")?.parentUuid).toBe(nodes.get("Social")?.uuid);

    // Statuses.
    expect(nodes.get("Physical")?.value).toBe(5);
    expect(nodes.get("Impact")?.value).toBe(5);
    expect(nodes.get("Bondage")?.value).toBe(3);
    expect(nodes.get("Blood")?.value).toBe(2);
    expect(nodes.get("Cutting")?.value).toBe(1);
    expect(nodes.get("Needling")?.value).toBe(3);
    expect(nodes.get("Psychological")?.value).toBe(0);
    expect(nodes.get("Social")?.value).toBe(4);
    expect(nodes.get("Public")?.value).toBe(4);

    // Context notes.
    expect(nodes.get("Physical")?.note).toBe("Favourite of Person B");
    expect(nodes.get("Cutting")?.note).toBe("Can trigger crash for Person A.");
    expect(nodes.get("Needling")?.note).toBe("Liked by Person B.");
    expect(nodes.get("Impact")?.note).toBeUndefined();
  });

  it("defaults missing or unrecognized statuses to Not Defined (0)", () => {
    const board = importMarkdown("# Smorkinkboard\n\n## Physical\n\n### Impact (Maybe)\n");

    const nodes = byName(board.practices);
    expect(nodes.get("Physical")?.value).toBe(0);
    expect(nodes.get("Impact")?.value).toBe(0);
  });

  it("matches status names case-insensitively", () => {
    const board = importMarkdown("# Smorkinkboard\n\n## Physical (mUsT)\n");

    expect(byName(board.practices).get("Physical")?.value).toBe(5);
  });

  it("synthesizes a root when the h1 is missing", () => {
    const board = importMarkdown("## Physical (Must)\n\n### Bondage (Can)\n");

    const root = board.practices.find(practice => practice.parentUuid === "");
    expect(root).toBeDefined();
    expect(root?.name).toBe("Smorkinkboard");
    expect(byName(board.practices).get("Physical")?.parentUuid).toBe(root?.uuid);
    expect(board.persons).toHaveLength(1);
  });

  it("parses a single person and omits the parenthetical for none", () => {
    const two = importMarkdown("# Smorkinkboard (for Person A and Person B)\n");
    expect(two.persons.map(person => person.name)).toEqual(["Person A", "Person B"]);

    const none = importMarkdown("# Smorkinkboard\n");
    expect(none.persons).toHaveLength(1);
    expect(none.persons[0].name).toBe("");
  });

  it("keeps headers deeper than h4 attached to their parent (h5)", () => {
    const board = importMarkdown("# Smorkinkboard\n\n## Physical (Must)\n\n### Toys (Can)\n\n#### E-Stim (Should)\n\n##### Variant (Hard Limit)\n");

    const nodes = byName(board.practices);
    expect(nodes.get("Variant")?.parentUuid).toBe(nodes.get("E-Stim")?.uuid);
  });
});

describe("exportMarkdown", () => {
  it("round-trips the example from docs/markdown-format.md", () => {
    const board = importMarkdown(docExample);
    expect(exportMarkdown(board.practices, board.persons)).toBe(docExample);
  });

  it("omits the people parenthetical with fewer than two named persons", () => {
    const board = importMarkdown("# Smorkinkboard (for Person A and Person B)\n\n## Physical (Must)\n");

    const exported = exportMarkdown(board.practices, [{ id: "1", name: "Person A" }]);
    expect(exported.startsWith("# Smorkinkboard\n")).toBe(true);
  });

  it("exports multi-line notes verbatim and round-trips them", () => {
    const board = importMarkdown("# Smorkinkboard\n\n## Physical (Must)\nLine one.\nLine two.\n");

    const physical = byName(board.practices).get("Physical");
    expect(physical?.note).toBe("Line one.\nLine two.");

    const reimported = importMarkdown(exportMarkdown(board.practices, board.persons));
    expect(byName(reimported.practices).get("Physical")?.note).toBe("Line one.\nLine two.");
  });
});
