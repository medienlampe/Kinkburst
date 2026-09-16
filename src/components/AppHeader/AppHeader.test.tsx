import { fireEvent, render, screen } from "@testing-library/react";
import { I18nextProvider } from "react-i18next";
import AppHeader from "./AppHeader";
import i18n from "../../i18n.tests";

const renderHeader = () => {
  return render(
    <I18nextProvider i18n={i18n}>
      <AppHeader>
        <button type="button">Some action</button>
      </AppHeader>
    </I18nextProvider>
  );
};

const actionsNav = () => document.querySelector("nav#app-actions") as HTMLElement;
const menuToggle = () => screen.getByRole("button", { name: "Actions" });

describe("AppHeader", () => {
  it("renders the brand and its action buttons", () => {
    renderHeader();

    expect(screen.getByRole("heading", { level: 1, name: "Smorkinkboard" })).toBeInTheDocument();
    expect(screen.getByAltText("WHIP Logo")).toHaveAttribute("src", "logo.svg");
    expect(actionsNav().querySelectorAll("button")).toHaveLength(1);
    expect(actionsNav().classList.contains("is-open")).toBe(false);
  });

  it("toggles the mobile actions panel", () => {
    renderHeader();

    fireEvent.click(menuToggle());
    expect(actionsNav().classList.contains("is-open")).toBe(true);
    expect(menuToggle()).toHaveAttribute("aria-expanded", "true");

    // While open, the toggle shows the close icon.
    fireEvent.click(menuToggle());
    expect(actionsNav().classList.contains("is-open")).toBe(false);
    expect(menuToggle()).toHaveAttribute("aria-expanded", "false");
  });

  it("closes the panel on Escape", () => {
    renderHeader();

    fireEvent.click(menuToggle());
    expect(actionsNav().classList.contains("is-open")).toBe(true);

    fireEvent.keyDown(window, { key: "Escape" });
    expect(actionsNav().classList.contains("is-open")).toBe(false);
  });

  it("closes the panel when clicking outside the header", () => {
    renderHeader();

    fireEvent.click(menuToggle());
    expect(actionsNav().classList.contains("is-open")).toBe(true);

    fireEvent.pointerDown(document.body);
    expect(actionsNav().classList.contains("is-open")).toBe(false);
  });

  it("keeps the panel open for inside clicks", () => {
    renderHeader();

    fireEvent.click(menuToggle());
    fireEvent.pointerDown(actionsNav());

    expect(actionsNav().classList.contains("is-open")).toBe(true);
  });

  it("closes the panel when the viewport grows to desktop size", () => {
    renderHeader();

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 1024 });
    fireEvent.click(menuToggle());
    expect(actionsNav().classList.contains("is-open")).toBe(true);

    fireEvent(window, new Event("resize"));
    expect(actionsNav().classList.contains("is-open")).toBe(false);
  });

  it("keeps the panel on small viewports after a resize", () => {
    renderHeader();

    Object.defineProperty(window, "innerWidth", { configurable: true, value: 500 });
    fireEvent.click(menuToggle());
    fireEvent(window, new Event("resize"));

    expect(actionsNav().classList.contains("is-open")).toBe(true);
  });
});
