import { describe, expect, it } from "vitest";
import { applyClick, boardTitle, findAllDescendants } from "./helpers";
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
  makePractice("d", "b", 5),
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
    expect(boardTitle([])).toBe("Smorkinkboard");
    expect(boardTitle([person("")])).toBe("Smorkinkboard");
    expect(boardTitle([person("Person A")])).toBe("Smorkinkboard");
  });

  it("lists two persons with \"and\"", () => {
    expect(boardTitle([person("Person A"), person("Person B")]))
      .toBe("Smorkinkboard (for Person A and Person B)");
  });

  it("lists three or more persons with commas and an Oxford comma", () => {
    expect(boardTitle([person("Person A"), person("Person B"), person("Person C")]))
      .toBe("Smorkinkboard (for Person A, Person B and Person C)");
  });

  it("ignores unnamed persons in the list", () => {
    expect(boardTitle([person("Person A"), person(""), person("Person C")]))
      .toBe("Smorkinkboard (for Person A and Person C)");
  });
});

describe("applyClick", () => {
  it("cycles the clicked field through all statuses, wrapping at Must", () => {
    // Start from Not Defined so the full cycle is visible.
    let practices = withValues({ c: 0 });

    const expected = [1, 2, 3, 4, 5, 0];
    for (const status of expected) {
      practices = applyClick(practices, "c");
      expect(valueOf(practices, "c")).toBe(status);
    }
  });

  it("propagates Hard Limit to all descendants, but not upwards", () => {
    let practices = tree(); // b=0, c=4, d=5, a=0
    practices = applyClick(practices, "b"); // b: 0 -> 1 (Hard Limit)

    expect(valueOf(practices, "b")).toBe(1);
    expect(valueOf(practices, "c")).toBe(1);
    expect(valueOf(practices, "d")).toBe(1);
    expect(valueOf(practices, "a")).toBe(0); // unchanged
  });

  it("propagates Soft Limit only to descendants that are currently positive", () => {
    const practices = withValues({ b: 1, c: 4, d: 0 }); // Hard Limit, Should (positive), Not Defined

    const updated = applyClick(practices, "b"); // b: 1 -> 2 (Soft Limit)

    expect(valueOf(updated, "b")).toBe(2);
    expect(valueOf(updated, "c")).toBe(2); // was positive (4) -> Soft Limit
    expect(valueOf(updated, "d")).toBe(0); // was Not Defined -> unchanged
  });

  it("propagates Can/Should/Must to all practice ancestors, but not to the root", () => {
    let practices = tree(); // e=3, a=0, root=0
    practices = applyClick(practices, "e"); // e: 3 -> 4 (Should)

    expect(valueOf(practices, "e")).toBe(4);
    expect(valueOf(practices, "a")).toBe(4);
    expect(valueOf(practices, "root")).toBe(0); // the board title carries no status
  });

  it("propagates nothing when the clicked field lands on Not Defined", () => {
    const atMust = withValues({ d: 5 });

    const updated = applyClick(atMust, "d"); // d: 5 -> 0 (Not Defined)
    expect(valueOf(updated, "d")).toBe(0);
    expect(valueOf(updated, "b")).toBe(0); // unchanged
    expect(valueOf(updated, "a")).toBe(0); // unchanged
  });

  it("ignores clicks on the root and on unknown nodes", () => {
    const practices = tree();

    expect(applyClick(practices, "root")).toEqual(practices);
    expect(applyClick(practices, "does-not-exist")).toEqual(practices);
  });
});
