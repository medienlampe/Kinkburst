export const diameter = 1728;
export const radius = diameter / 2;
export const padding = 1;

// The brand name is not translated; it is part of the board title and of the
// markdown export (see docs/markdown-format.md).
export const BOARD_NAME = "Smorkinkboard";

// Smorkinkboard statuses (see docs/Outline.md, "Statuses").
// Note: the outline says "five-fold" but lists six values (0-5); the list is authoritative.
export type StatusValue = 0 | 1 | 2 | 3 | 4 | 5;

export interface StatusDefinition {
  value: StatusValue,
  label: string,
  color: string,
}

export const STATUSES: Record<StatusValue, StatusDefinition> = {
  0: { value: 0, label: "Not Defined", color: "#000000" },
  1: { value: 1, label: "Hard Limit", color: "#ff0000" },
  2: { value: 2, label: "Soft Limit", color: "#ffff00" },
  3: { value: 3, label: "Can", color: "#90ee90" }, // light green
  4: { value: 4, label: "Should", color: "#32cd32" }, // lime green
  5: { value: 5, label: "Must", color: "#008000" }, // green
};

export const STATUS_BY_LABEL: Record<string, StatusValue> = Object.fromEntries(
  (Object.values(STATUSES) as StatusDefinition[]).map((s) => [s.label.toLowerCase(), s.value])
) as Record<string, StatusValue>;

// All languages shipped in public/locales. Exports write the active UI
// language; imports accept labels from all of them (see docs/markdown-format.md).
export const SUPPORTED_LANGUAGES = ["en", "de", "es", "nl"] as const;

// i18n key per status value; the labels themselves live in the locale files.
export const STATUS_I18N_KEYS: Record<StatusValue, string> = {
  0: "statuses.not_defined",
  1: "statuses.hard_limit",
  2: "statuses.soft_limit",
  3: "statuses.can",
  4: "statuses.should",
  5: "statuses.must",
};

// The number of statuses; clicking a field cycles through all of them.
export const STATUS_COUNT = 6;
