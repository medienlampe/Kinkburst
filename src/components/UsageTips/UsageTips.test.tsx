import { render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import UsageTips from "./UsageTips";
import i18n from "../../i18n.tests";

const stubMatchMedia = (matches: boolean) : void => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
};

const renderTips = () : void => {
  render(
    <I18nextProvider i18n={i18n}>
      <UsageTips />
    </I18nextProvider>
  );
};

describe("UsageTips", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the desktop tips on fine-pointer devices", () => {
    stubMatchMedia(true);
    renderTips();

    expect(screen.getByText("Drag the wheel to rotate it.")).toBeInTheDocument();
    expect(screen.getByText("Right-click a field to open the context overlay.")).toBeInTheDocument();
    expect(screen.getByText("Hold Shift while clicking to cycle statuses in reverse order.")).toBeInTheDocument();
    expect(screen.queryByText("Long-press a field to open the context menu.")).not.toBeInTheDocument();
  });

  it("shows only the long-press tip on touch devices", () => {
    stubMatchMedia(false);
    renderTips();

    expect(screen.getByText("Long-press a field to open the context menu.")).toBeInTheDocument();
    expect(screen.queryByText("Drag the wheel to rotate it.")).not.toBeInTheDocument();
    expect(screen.queryByText("Right-click a field to open the context overlay.")).not.toBeInTheDocument();
    expect(screen.queryByText("Hold Shift while clicking to cycle statuses in reverse order.")).not.toBeInTheDocument();
  });
});
