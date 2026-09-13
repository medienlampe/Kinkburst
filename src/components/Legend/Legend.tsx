import { type JSX } from "react";
import { useTranslation } from "react-i18next";
import { STATUSES, type StatusValue } from "../../constants";

// Maps a status value to its i18n key. The labels themselves are the canonical
// (English) terms used by the markdown format, kept untranslated on purpose.
const STATUS_I18N_KEY: Record<StatusValue, string> = {
  0: "statuses.not_defined",
  1: "statuses.hard_limit",
  2: "statuses.soft_limit",
  3: "statuses.can",
  4: "statuses.should",
  5: "statuses.must",
};

// Explains the board's colors at a glance, so the sunburst is self-explanatory.
const Legend = () : JSX.Element => {
  const { t } = useTranslation();

  return (
    <ul className="legend" aria-label={t("legend.title")}>
      {(Object.values(STATUSES)).map((status) => (
        <li className="legend-item" key={status.value}>
          <span className="legend-swatch" style={{ backgroundColor: status.color }} aria-hidden></span>
          <span className="legend-label">{t(STATUS_I18N_KEY[status.value])}</span>
        </li>
      ))}
    </ul>
  );
}

export default Legend;
