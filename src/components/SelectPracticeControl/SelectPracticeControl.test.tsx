import { render, screen } from "@testing-library/react";
import * as d3 from "d3";
import { I18nextProvider } from "react-i18next";
import testPractices from "./../../fixtures/testPractices.json";
import type { Practice } from "../../interfaces";
import i18n from "../../i18n.tests";
import SelectPracticeControl from "./SelectPracticeControl";

let hierarchicalPractices = null;

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
  const physicalOption = options.find(option => option.textContent === "Physical");
  const psychologicalOption = options.find(option => option.textContent === "Psychological");
  expect(options.indexOf(physicalOption)).toBeLessThan(options.indexOf(psychologicalOption));

  // Play areas sort alphabetically within their category path.
  const bondageOption = options.find(option => option.textContent === "Physical > Bondage");
  const impactPlayOption = options.find(option => option.textContent === "Physical > Impact Play");
  expect(options.indexOf(bondageOption)).toBeLessThan(options.indexOf(impactPlayOption));

  const handOption = options.find(option => option.textContent === "Physical > Impact Play > Hand");
  const toyOption = options.find(option => option.textContent === "Physical > Impact Play > Toy");
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
