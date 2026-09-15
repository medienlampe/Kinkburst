import { fireEvent, render, screen } from "@testing-library/react";
import AddPracticeForm from "./AddPracticeForm";
import * as d3 from "d3";
import { I18nextProvider } from "react-i18next";
import testPractices from "./../../fixtures/testPractices.json";
import type { Practice } from "../../interfaces";
import i18n from "../../i18n.tests";
import userEvent from "@testing-library/user-event";

let hierarchicalPractices: d3.HierarchyNode<Practice> | null = null;

beforeEach(() => {
  hierarchicalPractices = d3.stratify<Practice>()
    .id(d => d.uuid)
    .parentId(d => d.parentUuid)(testPractices);
});

it("renders the add practice form", async () => {
  render(
    <I18nextProvider i18n={i18n}>
      <AddPracticeForm
        onAdd={() : void => {}}
        hierarchicalPractices={hierarchicalPractices} />
    </I18nextProvider>);

  expect(screen.getByRole("button")).toHaveTextContent("Add as child");
});

it("adds a new practice when the add button is clicked", async () => {
  const onAdd = vi.fn();

  render(
    <I18nextProvider i18n={i18n}>
      <AddPracticeForm
        onAdd={onAdd}
        hierarchicalPractices={hierarchicalPractices} />
    </I18nextProvider>);

  const parentUuid = testPractices.find(practice => practice.key === "physical_impact_play")!.uuid;
  fireEvent.change(screen.getByLabelText("Parent element"), {
    target: { value: parentUuid }
  });

  await userEvent.type(screen.getByLabelText("Name of the new practice"), "Edge Play");

  fireEvent.click(screen.getByRole("button"));

  expect(onAdd).toHaveBeenCalledTimes(1);
  expect(onAdd).toHaveBeenCalledWith(
    "Edge Play",
    parentUuid
  );
});
