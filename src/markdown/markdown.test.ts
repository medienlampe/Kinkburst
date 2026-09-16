import { afterEach, describe, expect, it } from "vitest";
import { exportMarkdown } from "./exporter";
import { importMarkdown } from "./importer";
import i18n from "../i18n";
import type { Practice } from "../interfaces";

// The example from docs/markdown-format.md (source of truth for the format).
const docExample = `# Smorkinkboard (for Person A, Person B and Person C)

## Physical (Desired)
Favourite of Person B

### Impact (Desired)

### Bondage (Okay)

### Blood (Soft Limit)

#### Cutting (Hard Limit)
Can trigger crash for Person A.

#### Needling (Okay)
Liked by Person B.

## Psychological (Not Defined)

### Degradation (Not Defined)

## Social (Desired)

### Public (Desired)
`;

const byName = (practices: Practice[]): Map<string, Practice> => {
  return new Map(practices.map((practice): [string, Practice] => [practice.name ?? "", practice]));
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
    expect(nodes.get("Physical")?.value).toBe(4);
    expect(nodes.get("Impact")?.value).toBe(4);
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
    const board = importMarkdown("# Smorkinkboard\n\n## Physical (dEsIred)\n");

    expect(byName(board.practices).get("Physical")?.value).toBe(4);
  });

  it("synthesizes a root when the h1 is missing", () => {
    const board = importMarkdown("## Physical (Desired)\n\n### Bondage (Okay)\n");

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
    const board = importMarkdown("# Smorkinkboard\n\n## Physical (Desired)\n\n### Toys (Okay)\n\n#### E-Stim (Desired)\n\n##### Variant (Hard Limit)\n");

    const nodes = byName(board.practices);
    expect(nodes.get("Variant")?.parentUuid).toBe(nodes.get("E-Stim")?.uuid);
  });
});

describe("exportMarkdown", () => {
  it("round-trips the example from docs/markdown-format.md", () => {
    const board = importMarkdown(docExample);
    // The exporter appends the language of the document to the h1 title.
    const expected = docExample.replace(
      "# Smorkinkboard (for Person A, Person B and Person C)",
      "# Smorkinkboard (for Person A, Person B and Person C) - English",
    );
    expect(exportMarkdown(board.practices, board.persons)).toBe(expected);
  });

  it("omits the people parenthetical with fewer than two named persons", () => {
    const board = importMarkdown("# Smorkinkboard (for Person A and Person B)\n\n## Physical (Desired)\n");

    const exported = exportMarkdown(board.practices, [{ id: "1", name: "Person A" }]);
    expect(exported.startsWith("# Smorkinkboard - English\n")).toBe(true);
  });

  it("exports multi-line notes verbatim and round-trips them", () => {
    const board = importMarkdown("# Smorkinkboard\n\n## Physical (Desired)\nLine one.\nLine two.\n");

    const physical = byName(board.practices).get("Physical");
    expect(physical?.note).toBe("Line one.\nLine two.");

    const reimported = importMarkdown(exportMarkdown(board.practices, board.persons));
    expect(byName(reimported.practices).get("Physical")?.note).toBe("Line one.\nLine two.");
  });
});

describe("localized export/import", () => {
  const board = importMarkdown(docExample);

  afterEach(() : void => {
    void i18n.changeLanguage("en");
  });

  it("exports in the active language and re-imports its own output", async () => {
    await i18n.changeLanguage("de");

    const exported = exportMarkdown(board.practices, board.persons);
    expect(exported).toContain("# Smorkinkboard (für Person A, Person B und Person C) - Deutsch");
    expect(exported).toContain("## Physical (Gewünscht)");
    expect(exported).toContain("### Bondage (Okay)");

    const reimported = importMarkdown(exported);
    expect(reimported.persons.map(person => person.name)).toEqual(["Person A", "Person B", "Person C"]);
    expect(byName(reimported.practices).get("Physical")?.value).toBe(4);
    expect(byName(reimported.practices).get("Bondage")?.value).toBe(3);
  });

  it("imports status labels in every supported language", () => {
    const cases: Array<[string, number]> = [
      // en
      ["(Not Defined)", 0], ["(Hard Limit)", 1], ["(Soft Limit)", 2],
      ["(Okay)", 3], ["(Desired)", 4],
      // de
      ["(Unbesprochen)", 0], ["(Okay)", 3], ["(Gewünscht)", 4],
      // es
      ["(No definido)", 0], ["(Está bien)", 3], ["(Deseable)", 4],
      // nl
      ["(Niet besproken)", 0], ["(Oké)", 3], ["(Gewenst)", 4],
    ];

    for (const [label, expected] of cases) {
      const parsed = importMarkdown(`# Smorkinkboard\n\n## Physical ${label}\n`);
      expect(byName(parsed.practices).get("Physical")?.value, label).toBe(expected);
    }
  });

  it("imports localized people lists and strips the language suffix", () => {
    const german = importMarkdown("# Smorkinkboard (für Lila und Fry) - Deutsch\n");
    expect(german.persons.map(person => person.name)).toEqual(["Lila", "Fry"]);

    const spanish = importMarkdown("# Smorkinkboard (para Ana y Bruno) - Español\n");
    expect(spanish.persons.map(person => person.name)).toEqual(["Ana", "Bruno"]);

    const dutch = importMarkdown("# Smorkinkboard (voor Ann en Bob) - Nederlands\n");
    expect(dutch.persons.map(person => person.name)).toEqual(["Ann", "Bob"]);
  });
});
