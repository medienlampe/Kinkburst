import { fireEvent, render, screen } from "@testing-library/react";
import RemovePracticeForm from "./RemovePracticeForm";
import * as d3 from "d3";
import { I18nextProvider } from "react-i18next";
import testPractices from "./../../fixtures/testPractices.json";
import type { Practice } from "../../interfaces";
import i18n from "../../i18n.tests";

let hierarchicalPractices: d3.HierarchyNode<Practice> | null = null;

beforeEach(() => {
  hierarchicalPractices = d3.stratify<Practice>()
    .id(d => d.uuid)
    .parentId(d => d.parentUuid)(testPractices);
});

it("renders the remove practice form", async () => {
  render(
    <I18nextProvider i18n={i18n}>
      <RemovePracticeForm
        onRemove={() : void => {}}
        hierarchicalPractices={hierarchicalPractices} />
    </I18nextProvider>);

  expect(screen.getByRole("button")).toHaveTextContent("Remove");
});

it("removes the selected practice when the remove button is clicked", async () => {
  const onRemove = vi.fn();

  render(
    <I18nextProvider i18n={i18n}>
      <RemovePracticeForm
        onRemove={onRemove}
        hierarchicalPractices={hierarchicalPractices} />
    </I18nextProvider>);

  const uuid = testPractices.find(practice => practice.key === "physical_impact_play")!.uuid;
  fireEvent.change(screen.getByLabelText(/practice to remove/i), {
    target: { value: uuid }
  });

  fireEvent.click(screen.getByRole("button"));

  expect(onRemove).toHaveBeenCalledTimes(1);
  expect(onRemove).toHaveBeenCalledWith(
    uuid
  );
});
