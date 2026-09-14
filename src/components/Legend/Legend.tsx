import { type JSX } from "react";
import { useTranslation } from "react-i18next";
import { STATUSES, STATUS_I18N_KEYS } from "../../constants";

// Explains the board's colors at a glance, so the sunburst is self-explanatory.
const Legend = () : JSX.Element => {
  const { t } = useTranslation();

  return (
    <ul className="legend" aria-label={t("legend.title")}>
      {(Object.values(STATUSES)).map((status) => (
        <li className="legend-item" key={status.value}>
          <span className="legend-swatch" style={{ backgroundColor: status.color }} aria-hidden></span>
          <span className="legend-label">{t(STATUS_I18N_KEYS[status.value])}</span>
        </li>
      ))}
    </ul>
  );
}

export default Legend;
