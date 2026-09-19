import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { getDefaultStore } from "jotai";
import App from "./App";
import appI18n from "./i18n";
import testPractices from "./fixtures/testPractices.json";
import { createDefaultPersons, personsAtom } from "./states/persons.atom";

// Smoke test: mounts the whole app (state atoms, i18n, d3 sunburst) to catch
// runtime errors such as broken state-library integrations.
describe("App", () => {
  it("renders the board without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: () => Promise.resolve(testPractices) })
    );

    render(<App />);

    // The page title heading shows the board name (no named persons yet).
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toMatch(/kinkburst/i);

    // The footer disclaimer renders its attribution links as real anchors
    // (the locale strings use Trans component placeholders, not raw HTML).
    const footerLinks = document.querySelectorAll(".app-footer a");
    expect(Array.from(footerLinks).map((a) => a.getAttribute("href"))).toEqual([
      "https://github.com/duizendnegen/sunburst-smorgasbord",
      "https://d3js.org/",
      "https://observablehq.com/@d3/sunburst",
      "https://github.com/medienlampe/Kinkburst",
      "https://whip-leipzig.de/impressum.html"
    ]);

    // The sunburst renders one <g> per node once the (mocked) fixture load resolves.
    await waitFor(() => {
      expect(document.querySelectorAll("#smorgasbordImage g").length).toBeGreaterThan(0);
    });
  });

  const renderLoadedApp = async () : Promise<void> => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: () => Promise.resolve(testPractices) })
    );

    render(<App />);

    await waitFor(() => {
      expect(document.querySelectorAll("#smorgasbordImage g").length).toBeGreaterThan(0);
    });
  };

  // The detail modal stays in the DOM when closed; the `open` attribute marks it as open.
  const detailModal = () : Element | null => {
    return document.querySelector("#practice-note")?.closest(".modal") ?? null;
  };

  it("opens the context overlay on right-click (desktop)", async () => {
    await renderLoadedApp();

    const field = document.querySelector("path[data-status]");
    expect(field).not.toBeNull();

    fireEvent.contextMenu(field!, { button: 2 });

    expect(detailModal()?.hasAttribute("open")).toBe(true);
  });

  it("opens the context overlay on a long press (touch devices)", async () => {
    await renderLoadedApp();

    const field = document.querySelector("path[data-status]");
    expect(field).not.toBeNull();
    const statusBefore = field!.getAttribute("data-status");

    vi.useFakeTimers();
    try {
      fireEvent.pointerDown(field!, { pointerType: "touch", button: 0, clientX: 100, clientY: 100 });
      act(() : void => { vi.advanceTimersByTime(500); });

      expect(detailModal()?.hasAttribute("open")).toBe(true);
      // The first non-root node is the "Physical" category.
      expect(screen.getByRole("heading", { level: 4, name: "Physical" })).toBeInTheDocument();

      // Releasing the finger must not also cycle the status.
      fireEvent.pointerUp(field!, { pointerType: "touch", button: 0, clientX: 100, clientY: 100 });
      expect(document.querySelector("path[data-status]")?.getAttribute("data-status")).toBe(statusBefore);
    } finally {
      vi.useRealTimers();
    }
  });

  it("cancels the long press when the finger moves (rotation)", async () => {
    await renderLoadedApp();

    const field = document.querySelector("path[data-status]");
    expect(field).not.toBeNull();

    vi.useFakeTimers();
    try {
      fireEvent.pointerDown(field!, { pointerType: "touch", button: 0, clientX: 100, clientY: 100 });
      // Move beyond the drag threshold before the long press fires.
      fireEvent.pointerMove(field!, { clientX: 150, clientY: 120 });
      act(() : void => { vi.advanceTimersByTime(500); });

      expect(detailModal()?.hasAttribute("open")).toBe(false);
    } finally {
      vi.useRealTimers();
    }
  });

  it("cycles a field's status on tap", async () => {
    await renderLoadedApp();

    const group = document.querySelector("path[data-status]")!.closest("g")!;
    const before = document.querySelector("path[data-status]")?.getAttribute("data-status");

    // A tap is a pointer down/up at the same spot (see endDrag in Smorgasbord).
    fireEvent.pointerDown(group, { pointerId: 1, button: 0, clientX: 10, clientY: 20, pointerType: "mouse" });
    fireEvent.pointerUp(group, { pointerId: 1, button: 0, clientX: 10, clientY: 20, pointerType: "mouse" });

    expect(document.querySelector("path[data-status]")?.getAttribute("data-status")).not.toBe(before);
  });

  it("does not cycle the status when the browser cancels the pointer", async () => {
    await renderLoadedApp();

    const group = document.querySelector("path[data-status]")!.closest("g")!;
    const before = document.querySelector("path[data-status]")?.getAttribute("data-status");

    fireEvent.pointerDown(group, { pointerId: 1, button: 0, clientX: 10, clientY: 20, pointerType: "mouse" });
    // e.g. the browser took over the gesture for scrolling.
    fireEvent.pointerCancel(group, { pointerId: 1 });

    expect(document.querySelector("path[data-status]")?.getAttribute("data-status")).toBe(before);
  });

  it("does not cycle the status when the pointer leaves the board", async () => {
    await renderLoadedApp();

    const group = document.querySelector("path[data-status]")!.closest("g")!;
    const before = document.querySelector("path[data-status]")?.getAttribute("data-status");

    fireEvent.pointerDown(group, { pointerId: 1, button: 0, clientX: 10, clientY: 20, pointerType: "mouse" });
    fireEvent.pointerLeave(group, { pointerId: 1 });

    expect(document.querySelector("path[data-status]")?.getAttribute("data-status")).toBe(before);
  });

  it("renders without storage when localStorage is unavailable", async () => {
    vi.stubGlobal("localStorage", undefined);
    // No stored persons either, so the app starts with an empty people list.
    getDefaultStore().set(personsAtom, []);

    try {
      const fetchMock = vi.fn().mockResolvedValue({ json: () => Promise.resolve(testPractices) });
      vi.stubGlobal("fetch", fetchMock);

      render(<App />);
      await waitFor(() => {
        expect(document.querySelectorAll("#smorgasbordImage g").length).toBeGreaterThan(0);
      });

      // Let in-flight promise chains from earlier tests settle while our stubs
      // are still active, so they cannot resolve against the next test's mocks.
      await new Promise(resolve => setTimeout(resolve, 0));
    } finally {
      vi.unstubAllGlobals();
      getDefaultStore().set(personsAtom, createDefaultPersons());
    }
  });

  it("switches the UI language from the footer", async () => {
    await renderLoadedApp();

    try {
      fireEvent.click(screen.getByRole("button", { name: "German" }));
      await waitFor(() => expect(appI18n.language).toBe("de"));
    } finally {
      appI18n.changeLanguage("en");
    }
  });

  it("toggles the edit modal from the header actions", async () => {
    await renderLoadedApp();

    const editDialog = () => Array.from(document.querySelectorAll("dialog.modal"))
      .find(dialog => dialog.textContent?.includes("Customize")) as HTMLElement;

    expect(editDialog().hasAttribute("open")).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(editDialog().hasAttribute("open")).toBe(true);

    // The modal's close button (aria-label) is inside the card.
    fireEvent.click(editDialog().querySelector('button[aria-label="close"]')!);
    expect(editDialog().hasAttribute("open")).toBe(false);
  });

  it("resets the board through the confirmation modal", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ json: () => Promise.resolve(testPractices) });
    vi.stubGlobal("fetch", fetchMock);
    // Count only the practices fetch: i18next may fire its own locale requests
    // ("locales/.../translation.json") against whichever fetch mock is active.
    const practiceCalls = () : number => fetchMock.mock.calls.filter(([url]) => String(url).includes("practices.json")).length;

    // Start from a clean slate so the initial load goes through fetch.
    localStorage.clear();

    render(<App />);
    await waitFor(() => {
      expect(document.querySelectorAll("#smorgasbordImage g").length).toBeGreaterThan(0);
    });
    expect(practiceCalls()).toBe(1);

    // Cancel first: the board is left untouched.
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    const resetDialog = () => Array.from(document.querySelectorAll("dialog.modal"))
      .find(dialog => dialog.textContent?.includes("Yes, reset")) as HTMLElement;
    expect(resetDialog().hasAttribute("open")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "No, cancel" }));
    expect(resetDialog().hasAttribute("open")).toBe(false);
    expect(practiceCalls()).toBe(1);

    // Confirm: the defaults are re-fetched.
    fireEvent.click(screen.getByRole("button", { name: "Reset" }));
    fireEvent.click(screen.getByRole("button", { name: "Yes, reset" }));
    await waitFor(() => expect(practiceCalls()).toBe(2));
  });

  it("saves a context note from the detail modal", async () => {
    await renderLoadedApp();

    const group = document.querySelector("path[data-status]")!.closest("g")!;
    const label = () => group.querySelector("text")?.textContent ?? "";
    expect(label().endsWith("*")).toBe(false);

    fireEvent.contextMenu(group, { button: 2 });
    expect(detailModal()?.hasAttribute("open")).toBe(true);

    await screen.findByLabelText("Context / notes");
    const note = document.querySelector('#practice-note') as HTMLTextAreaElement;
    fireEvent.change(note, { target: { value: "Slowly." } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(detailModal()?.hasAttribute("open")).toBe(false);
    // Items with context get an asterisk in the scale.
    await waitFor(() => expect(label().endsWith("*")).toBe(true));
  });

  it("cancels the detail modal without saving", async () => {
    await renderLoadedApp();

    // Use a different field than the note-saving test (the jotai store is
    // shared across tests in this file).
    const group = document.querySelectorAll("path[data-status]")[1].closest("g")!;
    const label = () => group.querySelector("text")?.textContent ?? "";

    fireEvent.contextMenu(group, { button: 2 });
    expect(detailModal()?.hasAttribute("open")).toBe(true);

    await screen.findByLabelText("Context / notes");
    fireEvent.change(document.querySelector('#practice-note')!, { target: { value: "unsaved" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(detailModal()?.hasAttribute("open")).toBe(false);
    expect(label().endsWith("*")).toBe(false);
  });
});
