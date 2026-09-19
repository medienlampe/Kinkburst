import { fireEvent, render, screen } from "@testing-library/react";
import { vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import { Provider, createStore } from "jotai";
import ExportMarkdownButton, { exportFileName } from "./ExportMarkdownButton";
import { downloadBlob } from "../../download";
import { practicesAtom } from "../../states/practices.atom";
import { personsAtom } from "../../states/persons.atom";
import i18n from "../../i18n.tests";

vi.mock("../../download", () => ({
  downloadBlob: vi.fn(),
}));

describe("exportFileName", () => {
  const now = new Date(2026, 7, 24); // August 24th, 2026

  it("joins the date and the person names", () => {
    expect(exportFileName([
      { id: "1", name: "Ella" },
      { id: "2", name: "Emma" },
      { id: "3", name: "Ida" },
    ], now)).toBe("20260824-Kinkburst-EllaEmmaIda.txt");
  });

  it("replaces whitespace in names with underscores", () => {
    expect(exportFileName([
      { id: "1", name: "John Doe" },
      { id: "2", name: "Jane   Roe" },
    ], now)).toBe("20260824-Kinkburst-John_DoeJane_Roe.txt");
  });

  it("omits the person suffix when no people are named", () => {
    expect(exportFileName([], now)).toBe("20260824-Kinkburst.txt");
    expect(exportFileName([{ id: "1", name: "   " }], now)).toBe("20260824-Kinkburst.txt");
  });
});

describe("ExportMarkdownButton", () => {
  it("renders the export button", () => {
    render(
      <I18nextProvider i18n={i18n}>
        <Provider store={createStore()}>
          <ExportMarkdownButton />
        </Provider>
      </I18nextProvider>
    );

    expect(screen.getByRole("button", { name: "Export" })).toBeInTheDocument();
  });

  it("downloads the board as a markdown blob", async () => {
    const store = createStore();
    store.set(practicesAtom, [
      { uuid: "root", parentUuid: "", name: "Kinkburst" },
      { uuid: "a", parentUuid: "root", name: "Physical", value: 4 },
    ]);
    // boardTitle only lists the people when there are at least two named ones.
    store.set(personsAtom, [
      { id: "p1", name: "Person A" },
      { id: "p2", name: "Person B" },
    ]);

    render(
      <I18nextProvider i18n={i18n}>
        <Provider store={store}>
          <ExportMarkdownButton />
        </Provider>
      </I18nextProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Export" }));

    expect(vi.mocked(downloadBlob)).toHaveBeenCalledTimes(1);
    const [blob, fileName] = vi.mocked(downloadBlob).mock.calls[0];
    expect(fileName).toBe(exportFileName([
      { id: "p1", name: "Person A" },
      { id: "p2", name: "Person B" },
    ]));
    expect(fileName).toMatch(/^\d{8}-Kinkburst-Person_APerson_B\.txt$/);
    expect(blob.type).toBe("text/plain;charset=utf-8");
    const text = await blob.text();
    expect(text).toContain("# Kinkburst (for Person A and Person B) - English");
    expect(text).toContain("## Physical (Desired)");
  });
});
