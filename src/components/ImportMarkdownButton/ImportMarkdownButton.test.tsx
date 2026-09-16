import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import { Provider, createStore } from "jotai";
import ImportMarkdownButton from "./ImportMarkdownButton";
import { importMarkdown } from "../../markdown/importer";
import { practicesAtom } from "../../states/practices.atom";
import { personsAtom } from "../../states/persons.atom";
import i18n from "../../i18n.tests";

// The importer is mocked so the failure path can be exercised deterministically;
// its own behavior is covered in src/markdown/markdown.test.ts.
vi.mock("../../markdown/importer", () => ({
  importMarkdown: vi.fn(),
}));

const importedBoard = {
  practices: [
    { uuid: "root", parentUuid: "", name: "Kinkburst" },
    { uuid: "a", parentUuid: "root", name: "Physical", value: 4 },
  ],
  persons: [{ id: "p1", name: "Person A" }],
};

const renderButton = (store: ReturnType<typeof createStore>) => {
  return render(
    <I18nextProvider i18n={i18n}>
      <Provider store={store}>
        <ImportMarkdownButton />
      </Provider>
    </I18nextProvider>
  );
};

const fileInput = () => document.querySelector('input[type="file"]') as HTMLInputElement;

beforeEach(() => {
  (importMarkdown as ReturnType<typeof vi.fn>).mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("ImportMarkdownButton", () => {
  it("renders the import button with a hidden file input", () => {
    renderButton(createStore());

    expect(screen.getByRole("button", { name: "Import" })).toBeInTheDocument();
    expect(fileInput()).toHaveAttribute("accept", ".md,.markdown,text/markdown,text/x-markdown");
  });

  it("opens the file picker when clicked", () => {
    renderButton(createStore());

    const clickSpy = vi.spyOn(HTMLInputElement.prototype, "click").mockImplementation(() : void => {});
    fireEvent.click(screen.getByRole("button", { name: "Import" }));

    expect(clickSpy).toHaveBeenCalledTimes(1);
  });

  it("imports the board from the selected markdown file", async () => {
    (importMarkdown as ReturnType<typeof vi.fn>).mockReturnValue(importedBoard);
    const store = createStore();
    renderButton(store);

    const file = new File(["# Kinkburst\n"], "board.md", { type: "text/markdown" });
    fireEvent.change(fileInput(), { target: { files: [file] } });

    await waitFor(() => {
      expect(importMarkdown).toHaveBeenCalledWith("# Kinkburst\n");
    });
    expect(store.get(practicesAtom)).toEqual(importedBoard.practices);
    expect(store.get(personsAtom)).toEqual(importedBoard.persons);
  });

  it("ignores a change without a file", () => {
    (importMarkdown as ReturnType<typeof vi.fn>).mockReturnValue(importedBoard);
    const store = createStore();
    renderButton(store);

    fireEvent.change(fileInput(), {});

    expect(importMarkdown).not.toHaveBeenCalled();
  });

  it("alerts when the file cannot be parsed", async () => {
    (importMarkdown as ReturnType<typeof vi.fn>).mockImplementation(() => {
      throw new Error("unparseable");
    });
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() : void => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() : void => {});

    renderButton(createStore());

    const file = new File(["not a board"], "board.md", { type: "text/markdown" });
    fireEvent.change(fileInput(), { target: { files: [file] } });

    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith("Could not read that file as a Kinkburst markdown export.");
    });
    expect(errorSpy).toHaveBeenCalled();
  });
});
