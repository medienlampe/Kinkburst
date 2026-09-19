import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { I18nextProvider } from "react-i18next";
import ExportAsImageButton from "./ExportAsImageButton";
import { downloadBlob } from "../../download";
import i18n from "../../i18n.tests";

vi.mock("../../download", () => ({
  downloadBlob: vi.fn(),
}));

const renderButton = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <ExportAsImageButton />
    </I18nextProvider>
  );
};

// Builds a minimal stand-in for the rendered sunburst: an svg with the id the
// component looks up, containing one "Not Defined" field (path + label).
const mountBoardSvg = () => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.id = "smorgasbordImage";

  // The group shares a class with the path (duplicate selector) and the label
  // carries an id, to exercise both branches of collectSelectors.
  const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
  group.setAttribute("class", "board-field board-path");

  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("data-status", "0");
  path.setAttribute("class", "board-path");

  const label = document.createElementNS("http://www.w3.org/2000/svg", "text");
  label.setAttribute("id", "field-label");
  label.setAttribute("class", "board-label");

  group.appendChild(path);
  group.appendChild(label);
  svg.appendChild(group);
  document.body.appendChild(svg);
  return svg;
};

afterEach(() => {
  vi.restoreAllMocks();
  document.getElementById("smorgasbordImage")?.remove();
  (downloadBlob as ReturnType<typeof vi.fn>).mockClear();
});

describe("ExportAsImageButton", () => {
  it("renders the download button", () => {
    renderButton();
    expect(screen.getByRole("button", { name: "Image" })).toBeInTheDocument();
  });

  it("does nothing when the board svg is not in the document", () => {
    renderButton();
    fireEvent.click(screen.getByRole("button", { name: "Image" }));
    expect(downloadBlob).not.toHaveBeenCalled();
  });

  it("hides Not Defined fields and injects matching CSS into the exported svg", () => {
    // A stylesheet rule that matches a class on the board, to exercise the
    // CSS extraction (jsdom exposes same-origin sheets).
    // One rule matches the board (kept), one does not (dropped).
    const style = document.createElement("style");
    style.textContent = ".board-path { fill: rgb(220, 50, 47); } .not-on-board { color: rgb(1, 2, 3); }";
    document.head.appendChild(style);

    mountBoardSvg();
    renderButton();

    const serializeSpy = vi.spyOn(XMLSerializer.prototype, "serializeToString");
    fireEvent.click(screen.getByRole("button", { name: "Image" }));

    expect(serializeSpy).toHaveBeenCalled();
    const exported = serializeSpy.mock.results[0].value as string;
    // The Not Defined field is hidden in the export...
    expect(exported).toContain('fill-opacity="0"');
    // ...and matching CSS rules are carried along, while non-matching ones are dropped.
    expect(exported).toContain("board-path");
    expect(exported).not.toContain("not-on-board");

    style.remove();
  });

  it("exports an svg without an id and without children", () => {
    // A board element that has a class (collected for the CSS) but neither an
    // id nor any descendants.
    const plain = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    plain.setAttribute("class", "board-frame");
    vi.spyOn(document, "getElementById").mockReturnValue(plain as unknown as HTMLElement);

    renderButton();
    expect(() : void => {
      fireEvent.click(screen.getByRole("button", { name: "Image" }));
    }).not.toThrow();
  });

  it("rethrows stylesheet errors that are not SecurityErrors", () => {
    mountBoardSvg();
    renderButton();

    const brokenSheet = {
      get cssRules() : CSSRuleList {
        throw new Error("boom");
      },
    };
    const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, "styleSheets");
    Object.defineProperty(document, "styleSheets", { configurable: true, value: [brokenSheet] });

    // React reports errors thrown in event handlers as a window "error" event.
    const reported : string[] = [];
    const onError = (event : ErrorEvent) : void => { reported.push(event.message); };
    window.addEventListener("error", onError);

    try {
      fireEvent.click(screen.getByRole("button", { name: "Image" }));
      expect(reported).toContain("boom");
    } finally {
      window.removeEventListener("error", onError);
      if (descriptor) {
        Object.defineProperty(document, "styleSheets", descriptor);
      } else {
        delete (document as unknown as Record<string, unknown>).styleSheets;
      }
    }
  });

  it("does nothing when the canvas context is unavailable", () => {
    mountBoardSvg();
    renderButton();

    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
    fireEvent.click(screen.getByRole("button", { name: "Image" }));

    expect(downloadBlob).not.toHaveBeenCalled();
  });

  it("skips cross-origin stylesheets (SecurityError) instead of throwing", () => {
    mountBoardSvg();
    renderButton();

    const blockedSheet = {
      get cssRules() : CSSRuleList {
        throw new DOMException("blocked", "SecurityError");
      },
    };
    const descriptor = Object.getOwnPropertyDescriptor(Document.prototype, "styleSheets");
    Object.defineProperty(document, "styleSheets", { configurable: true, value: [blockedSheet] });

    try {
      const serializeSpy = vi.spyOn(XMLSerializer.prototype, "serializeToString");
      expect(() : void => {
        fireEvent.click(screen.getByRole("button", { name: "Image" }));
      }).not.toThrow();
      // The export pipeline still ran past the blocked stylesheet.
      expect(serializeSpy).toHaveBeenCalled();
    } finally {
      if (descriptor) {
        Object.defineProperty(document, "styleSheets", descriptor);
      } else {
        delete (document as unknown as Record<string, unknown>).styleSheets;
      }
    }
  });

  it("renders the svg to a canvas and downloads a png blob", async () => {
    mountBoardSvg();
    renderButton();

    // jsdom has no canvas implementation: provide the bare minimum the code uses.
    const context = { clearRect: vi.fn(), drawImage: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      function (this : HTMLCanvasElement, callback : BlobCallback) : void {
        callback(new Blob(["png"], { type: "image/png" }));
      }
    );

    // jsdom never loads images; fire onload once src is assigned.
    class FakeImage {
      onload : (() => void) | null = null;
      #src = "";
      get src() : string { return this.#src; }
      set src(value : string) {
        this.#src = value;
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", FakeImage);

    fireEvent.click(screen.getByRole("button", { name: "Image" }));

    await waitFor(() => {
      expect(vi.mocked(downloadBlob)).toHaveBeenCalledTimes(1);
    });
    const [blob, fileName] = vi.mocked(downloadBlob).mock.calls[0];
    expect(blob).toBeInstanceOf(Blob);
    expect(fileName).toBe("kinkburst.png");
  });

  it("does not download when toBlob produces no blob", async () => {
    mountBoardSvg();
    renderButton();

    const context = { clearRect: vi.fn(), drawImage: vi.fn() };
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(context as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation(
      function (this : HTMLCanvasElement, callback : BlobCallback) : void {
        callback(null); // e.g. the canvas is tainted or unsupported
      }
    );

    class FakeImage {
      onload : (() => void) | null = null;
      #src = "";
      get src() : string { return this.#src; }
      set src(value : string) {
        this.#src = value;
        queueMicrotask(() => this.onload?.());
      }
    }
    vi.stubGlobal("Image", FakeImage);

    fireEvent.click(screen.getByRole("button", { name: "Image" }));

    // Give the (fired) onload microtask a chance to run.
    await new Promise(resolve => setTimeout(resolve, 0));
    expect(downloadBlob).not.toHaveBeenCalled();
  });
});
