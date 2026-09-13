import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { lstatSync, readdirSync, readFileSync } from "fs";
import { join } from "path";

// Load every locale synchronously as inline resources. i18next v23+ no longer
// supports synchronous init through a backend (initImmediate was removed), so
// bundling the resources directly keeps translations available immediately.
const localesDir = join(__dirname, "../public/locales");

const languages = readdirSync(localesDir).filter((fileName) =>
  lstatSync(join(localesDir, fileName)).isDirectory()
);

const resources: Record<string, Record<string, unknown>> = {};
for (const lng of languages) {
  resources[lng] = {};
  for (const nsFile of readdirSync(join(localesDir, lng))) {
    if (!nsFile.endsWith(".json")) continue;
    const namespace = nsFile.slice(0, -".json".length);
    resources[lng][namespace] = JSON.parse(
      readFileSync(join(localesDir, lng, nsFile), "utf-8")
    );
  }
}

i18n
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    lng: "en",
    resources,
    react: {
      useSuspense: false
    }
  });


export default i18n;
