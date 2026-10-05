import { type JSX } from "react";
import { useTranslation } from "react-i18next";
import { STATUSES, STATUS_I18N_KEYS, type StatusValue } from "../../constants";

interface PracticeDetailModalProps {
  isActive: boolean;
  practiceName: string;
  note: string;
  onNoteChange: (note: string) => void;
  onSave: (note: string) => void;
  onCancel: () => void;
  // Current status of the field; undefined when unknown. Selecting a swatch
  // sets the status directly — the touch-friendly alternative to click
  // cycling (and its Shift modifier).
  currentValue?: number | undefined;
  onSelectStatus: (value: StatusValue) => void;
}

// Overlay opened on right-click (long press on touch) of a field to set its
// status and view/edit its context note. Fields with a note get an asterisk
// ("*") appended to their title in the scale.
// The note draft is controlled by the parent, which resets it when a field opens.
const PracticeDetailModal = ({ isActive, practiceName, note, onNoteChange, onSave, onCancel, currentValue, onSelectStatus } : PracticeDetailModalProps) : JSX.Element => {
  const { t } = useTranslation();
  const statusLabel = t("detail.status_label");

  return (
    <dialog className="modal" open={isActive} onClick={onCancel}>
      <article onClick={(e) : void => e.stopPropagation()}>
        <header>
          <h3>{t("detail.title")}</h3>
          <button className="close" aria-label="close" onClick={onCancel}></button>
        </header>
        <section>
          <h4>{practiceName}</h4>
          <div className="status-picker" role="group" aria-label={statusLabel}>
            {Object.values(STATUSES).map(status => (
              <button
                key={status.value}
                type="button"
                className={"status-option" + (status.value === currentValue ? " current" : "")}
                aria-pressed={status.value === currentValue}
                onClick={() : void => onSelectStatus(status.value)}>
                <span className="legend-swatch" style={{ backgroundColor: status.color }} aria-hidden></span>
                <span>{t(STATUS_I18N_KEYS[status.value])}</span>
              </button>
            ))}
          </div>
          <label htmlFor="practice-note">{t("detail.note_label")}</label>
          <textarea
            id="practice-note"
            rows={5}
            value={note}
            onChange={(e) : void => onNoteChange(e.target.value)}></textarea>
        </section>
        <footer>
          <button onClick={() : void => onSave(note.trim())}>{t("detail.save")}</button>
          <button className="secondary" onClick={onCancel}>{t("detail.cancel")}</button>
        </footer>
      </article>
    </dialog>
  );
}

export default PracticeDetailModal;
