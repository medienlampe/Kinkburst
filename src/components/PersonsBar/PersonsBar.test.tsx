import { fireEvent, render, screen } from "@testing-library/react";
import { Provider, createStore } from "jotai";
import { I18nextProvider } from "react-i18next";
import PersonsBar from "./PersonsBar";
import { personsAtom } from "../../states/persons.atom";
import type { Person } from "../../interfaces";
import i18n from "../../i18n.tests";

const renderPersonsBar = (persons: Person[]) => {
  const store = createStore();
  store.set(personsAtom, persons);

  return render(
    <I18nextProvider i18n={i18n}>
      <Provider store={store}>
        <PersonsBar />
      </Provider>
    </I18nextProvider>
  );
};

const personInputs = () => screen.getAllByRole("textbox");

describe("PersonsBar", () => {
  it("renders one input per person, prefilled with their names", () => {
    renderPersonsBar([
      { id: "1", name: "Person A" },
      { id: "2", name: "Person B" },
    ]);

    const inputs = personInputs();
    expect(inputs).toHaveLength(2);
    expect(inputs[0]).toHaveValue("Person A");
    expect(inputs[1]).toHaveValue("Person B");
  });

  it("updates a person's name when typing", () => {
    renderPersonsBar([{ id: "1", name: "" }]);

    fireEvent.change(personInputs()[0], { target: { value: "Immo" } });
    expect(personInputs()[0]).toHaveValue("Immo");
  });

  it("adds a person with the add button", () => {
    renderPersonsBar([{ id: "1", name: "Person A" }]);

    fireEvent.click(screen.getByRole("button", { name: /add person/i }));
    expect(personInputs()).toHaveLength(2);
  });

  it("hides the remove button for the last remaining person", () => {
    const { container } = renderPersonsBar([{ id: "1", name: "Person A" }]);

    expect(container.querySelectorAll(".delete")).toHaveLength(0);
  });

  it("removes a person with its remove button when more than one exists", () => {
    renderPersonsBar([
      { id: "1", name: "Person A" },
      { id: "2", name: "Person B" },
    ]);

    const removeButtons = screen.getAllByRole("button", { name: /remove person/i });
    expect(removeButtons).toHaveLength(2);

    fireEvent.click(removeButtons[1]);
    expect(personInputs()).toHaveLength(1);
    expect(personInputs()[0]).toHaveValue("Person A");
  });
});
