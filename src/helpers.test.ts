import { describe, expect, it } from "vitest";
import { applyClick, boardTitle, findAllDescendants, parseStoredPersons, parseStoredPractices } from "./helpers";
import type { StatusValue } from "./constants";
import type { Person, Practice } from "./interfaces";

const makePractice = (uuid: string, parentUuid: string, value: StatusValue = 0): Practice => ({
  uuid,
  parentUuid,
  name: uuid,
  value,
});

// root > a > (b > (c, d), e)
const tree = (): Practice[] => [
  makePractice("root", ""),
  makePractice("a", "root"),
  makePractice("b", "a"),
  makePractice("c", "b", 4),
  makePractice("d", "b", 4),
  makePractice("e", "a", 3),
];

const valueOf = (practices: Practice[], uuid: string): number => {
  return practices.find(practice => practice.uuid === uuid)?.value ?? 0;
};

// A copy of the tree with the given status overrides applied.
const withValues = (overrides: Record<string, StatusValue>): Practice[] => {
  return tree().map((practice): Practice =>
    overrides[practice.uuid] === undefined ? practice : { ...practice, value: overrides[practice.uuid] }
  );
};

describe("findAllDescendants", () => {
  it("returns the direct children and all deeper descendants", () => {
    expect(findAllDescendants(tree(), "b")).toEqual(["c", "d"]);
    expect(findAllDescendants(tree(), "a")).toEqual(["b", "e", "c", "d"]);
    expect(findAllDescendants(tree(), "c")).toEqual([]);
  });
});

describe("boardTitle", () => {
  const person = (name: string): Person => ({ id: name || "empty", name });

  it("returns the plain board name without named persons", () => {
    expect(boardTitle([])).toBe("Kinkburst");
    expect(boardTitle([person("")])).toBe("Kinkburst");
    expect(boardTitle([person("Person A")])).toBe("Kinkburst");
  });

  it("lists two persons with \"and\"", () => {
    expect(boardTitle([person("Person A"), person("Person B")]))
      .toBe("Kinkburst (for Person A and Person B)");
  });

  it("lists three or more persons with commas and an Oxford comma", () => {
    expect(boardTitle([person("Person A"), person("Person B"), person("Person C")]))
      .toBe("Kinkburst (for Person A, Person B and Person C)");
  });

  it("ignores unnamed persons in the list", () => {
    expect(boardTitle([person("Person A"), person(""), person("Person C")]))
      .toBe("Kinkburst (for Person A and Person C)");
  });
});

it("returns an empty list unchanged", () => {
  expect(applyClick([], "x")).toEqual([]);
});

describe("applyClick", () => {
  it("cycles the clicked field downwards through all statuses, wrapping to Desired", () => {
    // Start from Not Defined so the full cycle is visible.
    let practices = withValues({ c: 0 });

    const expected = [4, 3, 2, 1, 0];
    for (const status of expected) {
      practices = applyClick(practices, "c");
      expect(valueOf(practices, "c")).toBe(status);
    }
  });

  it("propagates Hard Limit to all descendants and raises Not Defined ancestors", () => {
    let practices = withValues({ b: 2 }); // b=2, c=4, d=4, a=0
    practices = applyClick(practices, "b"); // b: 2 -> 1 (Hard Limit)

    expect(valueOf(practices, "b")).toBe(1);
    expect(valueOf(practices, "c")).toBe(1); // was positive (4) -> Hard Limit
    expect(valueOf(practices, "d")).toBe(1); // was positive (5) -> Hard Limit
    expect(valueOf(practices, "a")).toBe(1); // a hard-limit field may not sit under Not Defined
  });

  it("propagates Soft Limit to descendants that are currently positive and raises lower ancestors", () => {
    const practices = withValues({ b: 3, c: 4, d: 0 }); // Can, Desired (positive), Not Defined

    const updated = applyClick(practices, "b"); // b: 3 -> 2 (Soft Limit)

    expect(valueOf(updated, "b")).toBe(2);
    expect(valueOf(updated, "c")).toBe(2); // was positive (4) -> Soft Limit
    expect(valueOf(updated, "d")).toBe(0); // was Not Defined -> unchanged
    expect(valueOf(updated, "a")).toBe(2); // a soft-limit field may not sit under Hard Limit/Not Defined
  });

  it("propagates Can/Desired to all practice ancestors, but not to the root", () => {
    let practices = withValues({ e: 4 }); // e=4, a=0, root=0
    practices = applyClick(practices, "e"); // e: 4 -> 3 (Okay)

    expect(valueOf(practices, "e")).toBe(3);
    expect(valueOf(practices, "a")).toBe(3);
    expect(valueOf(practices, "root")).toBe(0); // the board title carries no status
  });

  it("resets all descendants when the clicked field wraps back to Not Defined", () => {
    const hardLimited = withValues({ b: 1, c: 1, d: 1 }); // Hard Limit category with hard-limited children

    const updated = applyClick(hardLimited, "b"); // b: 1 -> 0 (Not Defined)
    expect(valueOf(updated, "b")).toBe(0);
    expect(valueOf(updated, "c")).toBe(0); // reset together with the parent
    expect(valueOf(updated, "d")).toBe(0); // reset together with the parent
    expect(valueOf(updated, "a")).toBe(0); // unchanged
  });

  it("does not lower ancestors when a child wraps back to Not Defined", () => {
    const hardLimited = withValues({ a: 2, b: 1, c: 1 });

    const updated = applyClick(hardLimited, "b"); // b: 1 -> 0 (Not Defined)
    expect(valueOf(updated, "b")).toBe(0);
    expect(valueOf(updated, "c")).toBe(0); // reset together with the parent
    expect(valueOf(updated, "a")).toBe(2); // unchanged — other children may still justify it
  });

  it("raises parents when a child moves above them (Hard Limit cannot contain higher levels)", () => {
    const hardLimited = withValues({ a: 1, b: 1, c: 3, d: 1 });

    const updated = applyClick(hardLimited, "c"); // c: 3 -> 2 (Soft Limit)
    expect(valueOf(updated, "c")).toBe(2);
    expect(valueOf(updated, "b")).toBe(2); // raised to its child's level
    expect(valueOf(updated, "a")).toBe(2); // raised transitively
    expect(valueOf(updated, "d")).toBe(1); // sibling unchanged (still below the parent)
  });

  it("ignores clicks on the root and on unknown nodes", () => {
    const practices = tree();

    expect(applyClick(practices, "root")).toEqual(practices);
    expect(applyClick(practices, "does-not-exist")).toEqual(practices);
  });
});

describe("parseStoredPractices", () => {
  const serialized = JSON.stringify(tree());

  it("returns undefined for missing data", () => {
    expect(parseStoredPractices(null)).toBeUndefined();
    expect(parseStoredPractices("")).toBeUndefined();
  });

  it("returns undefined for invalid JSON", () => {
    expect(parseStoredPractices("{not json")).toBeUndefined();
  });

  it("returns the list for a well-formed tree", () => {
    expect(parseStoredPractices(serialized)).toEqual(tree());
  });

  it("rejects non-array or empty data", () => {
    expect(parseStoredPractices(JSON.stringify({ uuid: "root" }))).toBeUndefined();
    expect(parseStoredPractices("[]")).toBeUndefined();
  });

  it("rejects nodes without string uuid/parentUuid", () => {
    const broken = tree().map(p => p.uuid === "a" ? { ...p, uuid: 42 } : p);
    expect(parseStoredPractices(JSON.stringify(broken))).toBeUndefined();
  });

  it("rejects duplicate uuids", () => {
    const duplicated = [...tree(), makePractice("c", "b")];
    expect(parseStoredPractices(JSON.stringify(duplicated))).toBeUndefined();
  });

  it("clamps values from the old six-status scale to the top of the current one", () => {
    // Simulate data persisted by the old six-status scale (5 no longer exists).
    const legacy = tree().map(p => p.uuid === "d" ? { ...p, value: 5 as unknown as StatusValue } : p);

    const parsed = parseStoredPractices(JSON.stringify(legacy));
    expect(parsed).toBeDefined();
    expect(parsed?.find(practice => practice.uuid === "d")?.value).toBe(4);
  });

  it("rejects trees without exactly one root or with orphaned parents", () => {
    const noRoot = tree().filter(p => p.uuid !== "root");
    expect(parseStoredPractices(JSON.stringify(noRoot))).toBeUndefined();

    const twoRoots = [...tree(), makePractice("other-root", "")];
    expect(parseStoredPractices(JSON.stringify(twoRoots))).toBeUndefined();

    const orphaned = tree().map(p => p.uuid === "a" ? { ...p, parentUuid: "missing" } : p);
    expect(parseStoredPractices(JSON.stringify(orphaned))).toBeUndefined();
  });
});

describe("parseStoredPersons", () => {
  it("returns undefined for missing or invalid data", () => {
    expect(parseStoredPersons(null)).toBeUndefined();
    expect(parseStoredPersons("{not json")).toBeUndefined();
    expect(parseStoredPersons("[]")).toBeUndefined();
  });

  it("returns the list for well-formed persons", () => {
    const persons = [{ id: "p1", name: "Person A" }, { id: "p2", name: "" }];
    expect(parseStoredPersons(JSON.stringify(persons))).toEqual(persons);
  });

  it("rejects entries without string id/name", () => {
    expect(parseStoredPersons(JSON.stringify([{ id: "p1" }]))).toBeUndefined();
    expect(parseStoredPersons(JSON.stringify(["Person A"]))).toBeUndefined();
  });
});
