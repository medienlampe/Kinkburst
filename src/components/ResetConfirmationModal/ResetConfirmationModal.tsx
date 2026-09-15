import { type JSX } from "react";
import { useTranslation } from "react-i18next";

interface ResetConfirmationModalProps {
  onReset: () => void;
  onCancel: () => void;
  isActive: boolean;
}

// Pico styles every <dialog> as a modal overlay and the inner <article> as the
// card. Clicking the dimmed backdrop (the dialog itself) cancels.
const ResetConfirmationModal = ({ onReset, onCancel, isActive } : ResetConfirmationModalProps) : JSX.Element => {
  const { t } = useTranslation();

  return (
    <dialog className="modal" open={isActive} onClick={onCancel}>
      <article onClick={(e) : void => e.stopPropagation()}>
        <p>
          {t("reset.content")}
        </p>
        <footer>
          <button onClick={onReset}>{t("reset.confirm")}</button>
          <button className="secondary" onClick={onCancel}>{t("reset.cancel")}</button>
        </footer>
      </article>
    </dialog>
  )
}

export default ResetConfirmationModal;
