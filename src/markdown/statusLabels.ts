import i18n from "../i18n";
import { STATUS_I18N_KEYS, SUPPORTED_LANGUAGES, type StatusValue } from "../constants";

// The label of a status in the given language (defaults to the active UI
// language). Labels come from the locale files via i18next.
export const statusLabel = (value: StatusValue, lng?: string): string => {
  return i18n.t(STATUS_I18N_KEYS[value], lng ? { lng } : undefined);
};

// Matches a status label written in any supported language
// (case-insensitive); unrecognized labels fall back to Not Defined (0).
export const parseStatusLabel = (label: string): StatusValue => {
  const normalized = label.trim().toLowerCase();
  for (const key of Object.keys(STATUS_I18N_KEYS)) {
    const statusValue = Number(key) as StatusValue;
    if (SUPPORTED_LANGUAGES.some(lng => statusLabel(statusValue, lng).toLowerCase() === normalized)) {
      return statusValue;
    }
  }
  return 0;
};
