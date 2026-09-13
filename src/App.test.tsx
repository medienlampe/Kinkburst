import { render, screen, waitFor } from "@testing-library/react";
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
});
