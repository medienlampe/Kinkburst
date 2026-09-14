// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import * as matchers from "@testing-library/jest-dom/vitest";
import { expect } from "vitest";

import appI18n from "./i18n";
import testI18n from "./i18n.tests";

// The http backend cannot fetch in jsdom; make every locale available on the
// app's i18next instance by reusing the resources bundled by i18n.tests, so
// code that reads translations of any supported language (markdown import/
// export) works in tests.
const testResources = (testI18n.options.resources ?? {}) as Record<string, Record<string, unknown>>;
for (const lng of Object.keys(testResources)) {
  for (const ns of Object.keys(testResources[lng])) {
    appI18n.addResourceBundle(lng, ns, testResources[lng][ns], true, true);
  }
}

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
