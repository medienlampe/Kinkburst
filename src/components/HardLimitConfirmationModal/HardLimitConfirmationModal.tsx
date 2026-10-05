import { type JSX } from "react";
import { useTranslation } from "react-i18next";

interface HardLimitConfirmationModalProps {
  practiceName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isActive: boolean;
}

// Setting a field to Hard Limit resets all of its children to Not Defined.
// This modal warns about that before the click is applied (see App.tsx).
// Pico styles every <dialog> as a modal overlay and the inner <article> as
// the card. Clicking the dimmed backdrop (the dialog itself) cancels.
const HardLimitConfirmationModal = ({ practiceName, onConfirm, onCancel, isActive } : HardLimitConfirmationModalProps) : JSX.Element => {
  const { t } = useTranslation();

  return (
    <dialog className="modal" open={isActive} onClick={onCancel}>
      <article onClick={(e) : void => e.stopPropagation()}>
        <p>
          {t("hard_limit_confirm.content", { name: practiceName })}
        </p>
        <footer>
          <button onClick={onConfirm}>{t("hard_limit_confirm.confirm")}</button>
          <button className="secondary" onClick={onCancel}>{t("hard_limit_confirm.cancel")}</button>
        </footer>
      </article>
    </dialog>
  )
}

export default HardLimitConfirmationModal;
