import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

import { SUPPORTED_LANGUAGES } from "./constants";

i18n
  // load translation using http -> see /public/locales (i.e. https://github.com/i18next/react-i18next/tree/master/example/react/public/locales)
  .use(Backend)
  // detect user language
  // learn more: https://github.com/i18next/i18next-browser-languageDetector
  .use(LanguageDetector)
  // pass the i18n instance to react-i18next.
  .use(initReactI18next)
  // init i18next
  // for all options read: https://www.i18next.com/overview/configuration-options
  .init({
    fallbackLng: "en",
    // Preload every locale so markdown export/import can read the labels of
    // any supported language, not just the active one.
    supportedLngs: [...SUPPORTED_LANGUAGES],
    preload: [...SUPPORTED_LANGUAGES],
    load: "languageOnly",
    backend: {
      // Relative path so the files are resolved against the page's own
      // folder (public/locales) instead of the domain root. Needed for
      // deployments under a subpath, e.g. GitHub Pages:
      // https://medienlampe.github.io/Kinkburst/locales/en.json
      loadPath: "locales/{{lng}}/{{ns}}.json",
    },
  });


export default i18n;