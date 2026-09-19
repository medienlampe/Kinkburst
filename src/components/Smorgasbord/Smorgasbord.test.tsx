import { fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { Provider, createStore } from "jotai";
import { I18nextProvider } from "react-i18next";
import Smorgasbord from "./Smorgasbord";
import { practicesAtom } from "../../states/practices.atom";
import type { Practice } from "../../interfaces";
import i18n from "../../i18n.tests";
import testPractices from "../../fixtures/testPractices.json";

const renderBoard = async (onElementClick: (uuid: string) => void) : Promise<ReturnType<typeof render>> => {
  const store = createStore();
  store.set(practicesAtom, testPractices as Practice[]);

  return render(
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

describe("Smorgasbord edge cases", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("cleans up a pending long press on unmount", async () => {
    const view = await renderBoard(vi.fn());

    vi.useFakeTimers();
    try {
      fireEvent.pointerDown(firstSlicePath(), { pointerType: "touch", button: 0, clientX: 10, clientY: 10 });
      // Unmounting before the long press fires must clear the pending timer.
      view.unmount();
      expect(() : void => { vi.runOnlyPendingTimers(); }).not.toThrow();
    } finally {
      vi.useRealTimers();
    }
  });

  it("labels unkeyed fields by their stored name and marks notes with an asterisk", async () => {
    const store = createStore();
    store.set(practicesAtom, [
      { uuid: "root", parentUuid: "", name: "My Board" },
      { uuid: "a", parentUuid: "root", name: "Custom Area", note: "Slowly." },
      { uuid: "b", parentUuid: "root" }, // no key, no name
    ] as Practice[]);

    render(
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>
          <Smorgasbord onElementClick={vi.fn()} onElementRightClick={vi.fn()} />
        </Provider>
      </I18nextProvider>
    );

    const labels = Array.from(document.querySelectorAll("#smorgasbordImage text")).map(text => text.textContent);
    expect(labels).toContain("Custom Area*");
    expect(labels).toContain(""); // unnamed field renders an empty label
  });

  it("does nothing when the board center is missing", async () => {
    const onClick = vi.fn();
    await renderBoard(onClick);

    document.querySelector(".board-root-node")?.remove();
    const group = firstSlicePath().closest("g")!;

    fireEvent.pointerDown(group, { button: 0, clientX: 5, clientY: 5 });
    fireEvent.pointerUp(group, { button: 0, clientX: 5, clientY: 5 });
    expect(onClick).not.toHaveBeenCalled();
  });

  it("ignores pointer downs that are not left-button taps", async () => {
    const onClick = vi.fn();
    await renderBoard(onClick);

    const group = firstSlicePath().closest("g")!;
    fireEvent.pointerDown(group, { button: 2, clientX: 5, clientY: 5 });
    fireEvent.pointerUp(group, { button: 0, clientX: 5, clientY: 5 });
    expect(onClick).not.toHaveBeenCalled();
  });

  it("ignores a second pointer while one is already active", async () => {
    const onClick = vi.fn();
    await renderBoard(onClick);

    // Two distinct field groups (the board center never fires a click).
    const groups = Array.from(document.querySelectorAll("#smorgasbordImage g g"))
      .filter(group => !group.classList.contains("board-root-node"));
    expect(groups.length).toBeGreaterThanOrEqual(2);

    fireEvent.pointerDown(groups[0], { pointerId: 1, button: 0, clientX: 5, clientY: 5 });
    fireEvent.pointerDown(groups[1], { pointerId: 2, button: 0, clientX: 6, clientY: 6 }); // ignored
    fireEvent.pointerUp(groups[0], { pointerId: 1, button: 0, clientX: 5, clientY: 5 });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("ignores touch moves and stray pointer moves", async () => {
    const onClick = vi.fn();
    const view = await renderBoard(onClick);
    const svg = document.querySelector("#smorgasbordImage")!;

    // Touch drags are ignored (rotation is mouse-only)...
    fireEvent.pointerMove(svg, { pointerType: "touch", clientX: 50, clientY: 50 });
    // ...and a move without an active drag does nothing either.
    fireEvent.pointerMove(svg, { pointerId: 99, clientX: 60, clientY: 60 });

    expect(onClick).not.toHaveBeenCalled();
    view.unmount();
  });

  it("stops a running drag when the board center disappears", async () => {
    const onClick = vi.fn();
    await renderBoard(onClick);
    const svg = document.querySelector("#smorgasbordImage")!;
    const group = firstSlicePath().closest("g")!;

    fireEvent.pointerDown(group, { pointerId: 1, button: 0, clientX: 5, clientY: 5 });
    document.querySelector(".board-root-node")?.remove();
    expect(() : void => {
      fireEvent.pointerMove(svg, { pointerId: 1, clientX: 40, clientY: 40 });
    }).not.toThrow();

    fireEvent.pointerUp(group, { pointerId: 1, button: 0, clientX: 40, clientY: 40 });
    expect(onClick).not.toHaveBeenCalled();
  });

  it("does not open the context overlay for the board center", async () => {
    const onRightClick = vi.fn();
    const store = createStore();
    store.set(practicesAtom, testPractices as Practice[]);

    render(
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>
          <Smorgasbord onElementClick={vi.fn()} onElementRightClick={onRightClick} />
        </Provider>
      </I18nextProvider>
    );

    await waitFor(() => {
      expect(document.querySelector("#smorgasbordImage .board-root-node")).not.toBeNull();
    });

    fireEvent.contextMenu(document.querySelector(".board-root-node")!, { button: 2 });
    expect(onRightClick).not.toHaveBeenCalled();
  });
});
