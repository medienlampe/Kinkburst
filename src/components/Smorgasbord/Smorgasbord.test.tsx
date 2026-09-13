import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { Provider, createStore } from "jotai";
import { I18nextProvider } from "react-i18next";
import Smorgasbord from "./Smorgasbord";
import { practicesAtom } from "../../states/practices.atom";
import type { Practice } from "../../interfaces";
import i18n from "../../i18n.tests";
import testPractices from "../../fixtures/testPractices.json";

// matchMedia stub that reports "mobile" (overrides the desktop stub in setupTests).
const mobileMatchMedia = (query: string) => ({
  matches: true,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});

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

const zoomLayerStyle = () : string =>
  document.querySelector(".board-zoom-layer")?.getAttribute("style") ?? "";

const waitPastDoubleTapWindow = async () : Promise<void> => {
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 350));
  });
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Smorgasbord taps", () => {
  it("cycles the status on a single tap (desktop, no delay)", async () => {
    const onClick = vi.fn();
    await renderBoard(onClick);

    tap(firstSlicePath(), 100, 100);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("delays a single tap on mobile until the double-tap window has passed", async () => {
    vi.stubGlobal("matchMedia", mobileMatchMedia);
    const onClick = vi.fn();
    await renderBoard(onClick);

    tap(firstSlicePath(), 100, 100);
    expect(onClick).not.toHaveBeenCalled();

    await waitPastDoubleTapWindow();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("zooms in on a double tap (mobile) and the fit button zooms out", async () => {
    vi.stubGlobal("matchMedia", mobileMatchMedia);
    const onClick = vi.fn();
    await renderBoard(onClick);

    tap(firstSlicePath(), 100, 100);
    tap(firstSlicePath(), 102, 101);

    expect(zoomLayerStyle()).toContain("scale(2.5)");
    expect(document.querySelector(".board-fit-button")).not.toBeNull();

    // The double tap must not also cycle the status.
    await waitPastDoubleTapWindow();
    expect(onClick).not.toHaveBeenCalled();

    // The fit button zooms back out.
    fireEvent.click(document.querySelector(".board-fit-button") as HTMLElement);
    await waitFor(() => {
      expect(zoomLayerStyle()).not.toContain("scale(2.5)");
    });
  });
});
