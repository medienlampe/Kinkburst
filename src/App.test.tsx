import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import App from "./App";
import testPractices from "./fixtures/testPractices.json";

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
    expect(heading.textContent).toMatch(/smorkinkboard/i);

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

  // The detail modal stays in the DOM when closed; "is-active" marks it as open.
  const detailModal = () : Element | null => {
    return document.querySelector("#practice-note")?.closest(".modal");
  };

  it("opens the context overlay on right-click (desktop)", async () => {
    await renderLoadedApp();

    const field = document.querySelector("path[data-status]");
    expect(field).not.toBeNull();

    fireEvent.contextMenu(field, { button: 2 });

    expect(detailModal()?.className).toContain("is-active");
  });

  it("opens the context overlay on a long press (touch devices)", async () => {
    await renderLoadedApp();

    const field = document.querySelector("path[data-status]");
    expect(field).not.toBeNull();
    const statusBefore = field.getAttribute("data-status");

    vi.useFakeTimers();
    try {
      fireEvent.pointerDown(field, { pointerType: "touch", button: 0, clientX: 100, clientY: 100 });
      act(() : void => { vi.advanceTimersByTime(500); });

      expect(detailModal()?.className).toContain("is-active");
      // The first non-root node is the "Physical" category.
      expect(screen.getByRole("heading", { level: 3, name: "Physical" })).toBeInTheDocument();

      // Releasing the finger must not also cycle the status.
      fireEvent.pointerUp(field, { pointerType: "touch", button: 0, clientX: 100, clientY: 100 });
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
      fireEvent.pointerDown(field, { pointerType: "touch", button: 0, clientX: 100, clientY: 100 });
      // Move beyond the drag threshold before the long press fires.
      fireEvent.mouseMove(field, { clientX: 150, clientY: 120 });
      act(() : void => { vi.advanceTimersByTime(500); });

      expect(detailModal()?.className).not.toContain("is-active");
    } finally {
      vi.useRealTimers();
    }
  });
});
