import { fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import { Provider, createStore } from "jotai";
import EditModal from "./EditModal";
import { practicesAtom } from "../../states/practices.atom";
import { findAllDescendants } from "../../helpers";
import testPractices from "../../fixtures/testPractices.json";
import type { Practice } from "../../interfaces";
import i18n from "../../i18n.tests";

const seedStore = () => {
  const store = createStore();
  store.set(practicesAtom, testPractices as unknown as Practice[]);
  return store;
};

const renderModal = (store: ReturnType<typeof seedStore>, onClose : () => void = () => {}) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <Provider store={store}>
        <EditModal isActive onClose={onClose} />
      </Provider>
    </I18nextProvider>
  );
};

const modalDialog = () => document.querySelector("dialog.modal") as HTMLElement;

describe("EditModal", () => {
  it("renders open when active", () => {
    renderModal(seedStore());
    expect(modalDialog().hasAttribute("open")).toBe(true);
    expect(screen.getByRole("heading", { level: 3, name: "Customize" })).toBeInTheDocument();
  });

  it("closes via the close button and the footer button", () => {
    const onClose = vi.fn();
    renderModal(seedStore(), onClose);

    fireEvent.click(screen.getByRole("button", { name: "close" }));
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(onClose).toHaveBeenCalledTimes(2);
  });

  it("closes when clicking the backdrop, but not inside the card", () => {
    const onClose = vi.fn();
    renderModal(seedStore(), onClose);

    fireEvent.click(modalDialog());
    expect(onClose).toHaveBeenCalledTimes(1);

    fireEvent.click(modalDialog().querySelector("article")!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("adds a new practice as a child of the selected parent", () => {
    const store = seedStore();
    const before = (store.get(practicesAtom) as Practice[]).length;
    renderModal(store);

    // The "Physical" category is a top-level node with children.
    const physical = (testPractices as unknown as Practice[]).find(p => p.key === "physical");
    expect(physical).toBeDefined();

    fireEvent.change(screen.getByLabelText("Parent element"), { target: { value: physical!.uuid } });
    fireEvent.change(screen.getByLabelText("Name of the new practice"), { target: { value: "New Thing" } });
    fireEvent.click(screen.getByRole("button", { name: "Add as child" }));

    const practices = store.get(practicesAtom) as Practice[];
    expect(practices).toHaveLength(before + 1);
    const added = practices.find(p => p.name === "New Thing");
    expect(added).toBeDefined();
    expect(added?.parentUuid).toBe(physical!.uuid);
    // A new practice starts at Not Defined (0): adding is not yet consent.
    expect(added?.value ?? 0).toBe(0);
  });

  it("removes a practice together with all of its descendants", () => {
    const store = seedStore();
    const practices = store.get(practicesAtom) as Practice[];

    // Pick a non-root node that has at least one child (the remove form only
    // offers nodes with a parent).
    const parent = practices.find(p =>
      p.parentUuid !== "" && practices.some(child => child.parentUuid === p.uuid));
    expect(parent).toBeDefined();
    // The modal removes the node plus every descendant (not just direct children).
    const descendantCount = 1 + findAllDescendants(practices, parent!.uuid).length;

    renderModal(store);

    fireEvent.change(screen.getByLabelText("Practice to remove (including all its children)"), {
      target: { value: parent!.uuid },
    });
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));

    const remaining = store.get(practicesAtom) as Practice[];
    expect(remaining).toHaveLength(practices.length - descendantCount);
    expect(remaining.find(p => p.uuid === parent!.uuid)).toBeUndefined();
  });
});
