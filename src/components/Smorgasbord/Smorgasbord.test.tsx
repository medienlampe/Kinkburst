import { fireEvent, render, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { Provider, createStore } from "jotai";
import { I18nextProvider } from "react-i18next";
import Smorgasbord from "./Smorgasbord";
import { practicesAtom } from "../../states/practices.atom";
import type { Practice } from "../../interfaces";
import i18n from "../../i18n.tests";
import testPractices from "../../fixtures/testPractices.json";

const renderBoard = async (onElementClick: (uuid: string) => void) : Promise<void> => {
  const store = createStore();
  store.set(practicesAtom, testPractices as Practice[]);

  render(
    <I18nextProvider i18n={i18n}>
      <Provider store={store}>
        <Smorgasbord onElementClick={onElementClick} onElementRightClick={vi.fn()} />
      </Provider>
    </I18nextProvider>
  );

  await waitFor(() => {
    expect(document.querySelectorAll("#smorgasbordImage path[data-status]").length).toBeGreaterThan(0);
  });
};

// A tap is a pointerdown + pointerup at the same coordinates.
const tap = (element: Element, x: number, y: number) : void => {
  fireEvent.pointerDown(element, { clientX: x, clientY: y, button: 0 });
  fireEvent.pointerUp(element, { clientX: x, clientY: y, button: 0 });
};

// First non-root arc (the root circle has no data-status attribute).
const firstSlicePath = () : Element =>
  document.querySelector("#smorgasbordImage path[data-status]") as Element;

describe("Smorgasbord taps", () => {
  it("cycles the status on a single tap (instant, no delay)", async () => {
    const onClick = vi.fn();
    await renderBoard(onClick);

    tap(firstSlicePath(), 100, 100);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not treat a second tap as anything special", async () => {
    const onClick = vi.fn();
    await renderBoard(onClick);

    tap(firstSlicePath(), 100, 100);
    tap(firstSlicePath(), 102, 101);
    expect(onClick).toHaveBeenCalledTimes(2);
  });
});
