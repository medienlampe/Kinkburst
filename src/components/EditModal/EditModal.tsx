import { type JSX } from "react";
import { v4 as uuidv4 } from "uuid";
import AddPracticeForm from "../AddPracticeForm/AddPracticeForm";
import RemovePracticeForm from "../RemovePracticeForm/RemovePracticeForm";
import { useTranslation } from "react-i18next";
import { useAtom, useAtomValue } from "jotai";
import { practicesAtom } from "../../states/practices.atom";
import { hierarchicalPracticesAtom } from "../../states/hierarchicalPractices.atom";
import type { Practice } from "../../interfaces";
import { findAllDescendants } from "../../helpers";

interface EditModalProps {
  isActive: boolean;
  onClose: () => void;
}

const EditModal = ({ isActive, onClose } : EditModalProps) : JSX.Element => {
  const { t } = useTranslation();
  const [practices, setPractices] = useAtom(practicesAtom);
  const hierarchicalPractices = useAtomValue(hierarchicalPracticesAtom);
  
  // A newly added practice starts as Not Defined (0): adding it to the list
  // is not yet consent, so nothing propagates.
  const addNewPractice = (newPracticeName: string, parentUuidToAddPracticeTo: string) : void => {
    const practice: Practice = {
      "uuid": uuidv4(),
      "parentUuid": parentUuidToAddPracticeTo,
      "name": newPracticeName,
      "value": 0
    }

    setPractices([practice, ...practices]);
  }

  const removePracticeAndDescendents = (practiceUuid: string) : void => {
    const practiceUuidsToRemove = [ practiceUuid, ...findAllDescendants(practices, practiceUuid) ];
    setPractices(practices.filter(practice => !practiceUuidsToRemove.includes(practice.uuid)));
  }

  return (
    <div className={isActive ? "modal is-active" : "modal"}>
      <div className="modal-background" onClick={onClose}></div>
      <div className="modal-card">
        <header className="modal-card-head">
          <p className="modal-card-title">{t("edit.customize")}</p>
          <button className="delete" aria-label="close" onClick={onClose}></button>
        </header>
        <section className="modal-card-body">
          <h3 className="subtitle is-5">{t("edit.add")}</h3>
          <AddPracticeForm
            hierarchicalPractices={hierarchicalPractices}
            onAdd={addNewPractice}
          ></AddPracticeForm>
          <hr></hr>
          <h3 className="subtitle is-5">{t("edit.remove")}</h3>
          <RemovePracticeForm
            hierarchicalPractices={hierarchicalPractices}
            onRemove={removePracticeAndDescendents}
          ></RemovePracticeForm>
        </section>
        <footer className="modal-card-foot">
          <button className="button" onClick={onClose}>{t("edit.close")}</button>
        </footer>
      </div>
    </div>
  )
}

export default EditModal;
