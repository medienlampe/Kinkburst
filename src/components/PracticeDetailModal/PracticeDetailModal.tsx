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
    <dialog className="modal" open={isActive} onClick={onCancel}>
      <article onClick={(e) : void => e.stopPropagation()}>
        <header>
          <h3>{t("detail.title")}</h3>
          <button className="close" aria-label="close" onClick={onCancel}></button>
        </header>
        <section>
          <h4>{practiceName}</h4>
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
