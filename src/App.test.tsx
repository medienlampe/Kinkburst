import { render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import App from "./App";
import testFlavours from "./fixtures/testFlavours.json";

// Smoke test: mounts the whole app (state atoms, i18n, d3 sunburst) to catch
// runtime errors such as broken state-library integrations.
describe("App", () => {
  it("renders the board without throwing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ json: () => Promise.resolve(testFlavours) })
    );

    render(<App />);

    // The page title heading is present (i18n may not have loaded in tests,
    // so match either the translation or the key).
    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading.textContent).toMatch(/header\.title|smorgasbord/i);

    // The sunburst renders one <g> per node once the (mocked) fixture load resolves.
    await waitFor(() => {
      expect(document.querySelectorAll("#smorgasbordImage g").length).toBeGreaterThan(0);
    });
  });
});
