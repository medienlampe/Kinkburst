import { render, screen } from "@testing-library/react";
import * as d3 from "d3";
import { I18nextProvider } from "react-i18next";
import testPractices from "./../../fixtures/testPractices.json";
import type { Practice } from "../../interfaces";
import i18n from "../../i18n.tests";
import SelectPracticeControl from "./SelectPracticeControl";

let hierarchicalPractices: d3.HierarchyNode<Practice>[] = [];

beforeEach(() => {
  hierarchicalPractices = d3.stratify<Practice>()
    .id(d => d.uuid)
    .parentId(d => d.parentUuid)(testPractices)
    .descendants();
});

it("renders the practices selection", async () => {
  render(
    <I18nextProvider i18n={i18n}>
      <SelectPracticeControl
        onChange={() : void => {}}
        value=''
        hierarchicalPractices={hierarchicalPractices} />
    </I18nextProvider>);

  expect(screen.getByRole("combobox")).toBeInTheDocument();
});

it("sorts the practices alphabetically", async () => {
  render(
    <I18nextProvider i18n={i18n}>
      <SelectPracticeControl
        onChange={() : void => {}}
        value=''
        hierarchicalPractices={hierarchicalPractices} />
    </I18nextProvider>);

  const options = screen.getAllByRole("option");

  // Top-level categories sort alphabetically.
  const physicalOption = options.find(option => option.textContent === "Physical")!;
  const psychologicalOption = options.find(option => option.textContent === "Psychological")!;
  expect(options.indexOf(physicalOption)).toBeLessThan(options.indexOf(psychologicalOption));

  // Play areas sort alphabetically within their category path.
  const bondageOption = options.find(option => option.textContent === "Physical > Bondage")!;
  const impactPlayOption = options.find(option => option.textContent === "Physical > Impact Play")!;
  expect(options.indexOf(bondageOption)).toBeLessThan(options.indexOf(impactPlayOption));

  const handOption = options.find(option => option.textContent === "Physical > Impact Play > Hand")!;
  const toyOption = options.find(option => option.textContent === "Physical > Impact Play > Toy")!;
  expect(options.indexOf(handOption)).toBeLessThan(options.indexOf(toyOption));
});

it("renders the practice names nested hierarchically", async () => {
  render(
    <I18nextProvider i18n={i18n}>
      <SelectPracticeControl
        onChange={() : void => {}}
        value=''
        hierarchicalPractices={hierarchicalPractices} />
    </I18nextProvider>);

  expect(screen.getByRole("option", { name: "Physical > Impact Play > Toy > Whip" })).toBeInTheDocument();
  expect(screen.getByRole("option", { name: "Social > Public Play" })).toBeInTheDocument();
});

it("translates a keyed root node", () => {
  const nodes = d3.stratify<Practice>()
    .id(d => d.uuid)
    .parentId(d => d.parentUuid)([
      { uuid: "root", parentUuid: "", key: "kinkburst" },
      { uuid: "a", parentUuid: "root", name: "Area" },
    ])
    .descendants();

  render(
    <I18nextProvider i18n={i18n}>
      <SelectPracticeControl
        onChange={() : void => {}}
        value=''
        hierarchicalPractices={nodes} />
    </I18nextProvider>);

  expect(screen.getByRole("option", { name: "Kinkburst" })).toBeInTheDocument();
});

it("falls back to stored names and skips unnamed ancestors in the path", () => {
  const nodes = d3.stratify<Practice>()
    .id(d => d.uuid)
    .parentId(d => d.parentUuid)([
      { uuid: "root", parentUuid: "", name: "My Board" },
      { uuid: "a", parentUuid: "root" }, // no key, no name
      { uuid: "b", parentUuid: "a", name: "Area" },
    ])
    .descendants();

  render(
    <I18nextProvider i18n={i18n}>
      <SelectPracticeControl
        onChange={() : void => {}}
        value=''
        hierarchicalPractices={nodes} />
    </I18nextProvider>);

  expect(screen.getByRole("option", { name: "My Board" })).toBeInTheDocument();
  // The unnamed parent contributes an empty segment to the path.
  expect(screen.getAllByRole("option").some(option => option.textContent === " > Area")).toBe(true);
});

it("renders a minimal two-node board", () => {
  const nodes = d3.stratify<Practice>()
    .id(d => d.uuid)
    .parentId(d => d.parentUuid)([
      { uuid: "root", parentUuid: "", name: "My Board" },
      { uuid: "a", parentUuid: "root", name: "Area" },
    ])
    .descendants();

  render(
    <I18nextProvider i18n={i18n}>
      <SelectPracticeControl
        onChange={() : void => {}}
        value=''
        hierarchicalPractices={nodes} />
    </I18nextProvider>);

  expect(screen.getAllByRole("option")).toHaveLength(3); // empty + root + area
});
