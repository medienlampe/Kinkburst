import { type JSX } from "react";
import { useTranslation } from "react-i18next";

interface PracticeDetailModalProps {
  isActive: boolean;
  practiceName: string;
  note: string;
  onNoteChange: (note: string) => void;
  onSave: (note: string) => void;
  onCancel: () => void;
}

// Overlay opened on right-click of a field to view and edit its context note.
// Fields with a note get an asterisk ("*") appended to their title in the scale.
// The note draft is controlled by the parent, which resets it when a field opens.
const PracticeDetailModal = ({ isActive, practiceName, note, onNoteChange, onSave, onCancel } : PracticeDetailModalProps) : JSX.Element => {
  const { t } = useTranslation();

  return (
    <div className={isActive ? "modal is-active" : "modal"}>
      <div className="modal-background" onClick={onCancel}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">{t("detail.title")}</p>
          <button className="delete" aria-label="close" onClick={onCancel}></button>
        </header>
        <section className="modal-card-body">
          <h3 className="subtitle is-5">{practiceName}</h3>
          <div className="field">
            <label className="label" htmlFor="practice-note">{t("detail.note_label")}</label>
            <div className="control">
              <textarea
                id="practice-note"
                className="textarea"
                rows={5}
                value={note}
                onChange={(e) : void => onNoteChange(e.target.value)}></textarea>
            </div>
          </div>
        </section>
        <footer className="modal-card-foot">
          <button className="button is-primary" onClick={() : void => onSave(note.trim())}>{t("detail.save")}</button>
          <button className="button" onClick={onCancel}>{t("detail.cancel")}</button>
        </footer>
      </div>
    </div>
  );
}

export default PracticeDetailModal;
