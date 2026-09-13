// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import * as matchers from "@testing-library/jest-dom/vitest";
import { expect } from "vitest";

expect.extend(matchers);

// jsdom does not implement window.matchMedia; provide a minimal stub that
// reports "no match" so media-query hooks take their desktop path in tests.
// Individual tests can override it with vi.stubGlobal("matchMedia", ...).
if (typeof window.matchMedia !== "function") {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}
