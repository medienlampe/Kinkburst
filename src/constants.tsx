export const diameter = 1728;
export const radius = diameter / 2;
export const padding = 1;

// The brand name is not translated; it is part of the board title and of the
// markdown export (see docs/markdown-format.md).
export const BOARD_NAME = "Kinkburst";

// Kinkburst statuses (see docs/Outline.md, "Statuses"): five-fold, 0 to 4.
export type StatusValue = 0 | 1 | 2 | 3 | 4;

export interface StatusDefinition {
  value: StatusValue,
  label: string,
  color: string,
}

// Colors are the Solarized palette, tuned for harmony and contrast: a muted
// brick red for Hard Limit (prominent without shouting), a vibrant turquoise
// for Okay and a vibrant lime green for Desired so the two welcome levels
// read clearly apart from each other and from the yellow.
export const STATUSES: Record<StatusValue, StatusDefinition> = {
  0: { value: 0, label: "Not Defined", color: "#111" }, // near-black
  1: { value: 1, label: "Hard Limit", color: "#a64a3f" }, // muted brick red
  2: { value: 2, label: "Soft Limit", color: "#b58900" }, // solarized yellow
  3: { value: 3, label: "Okay", color: "#00bfa5" }, // vibrant turquoise
  4: { value: 4, label: "Desired", color: "#a3d147" }, // vibrant lime green
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
  4: "statuses.desired",
};

// The number of statuses; clicking a field cycles through all of them.
export const STATUS_COUNT = 5;
