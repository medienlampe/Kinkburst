import { useState, type JSX } from "react";
import * as d3 from "d3";
import type { Practice } from "../../interfaces";
import SelectPracticeControl from "../SelectPracticeControl/SelectPracticeControl";
import { useTranslation } from "react-i18next";


interface AddPracticeFormProps {
  onAdd: (name: string, parentUuid: string) => void;
  hierarchicalPractices: d3.HierarchyNode<Practice> | null;
}

const AddPracticeForm = ({ onAdd, hierarchicalPractices } : AddPracticeFormProps) : JSX.Element => {
  const { t } = useTranslation();
  const [parentUuidToAddPracticeTo, setParentUuidToAddPracticeTo] = useState("");
  const [newPracticeName, setNewPracticeName] = useState("");
  const [buttonIsConfirmation, setButtonIsConfirmation] = useState(false);
  
  const addNewPractice = () : void => {
    onAdd(newPracticeName, parentUuidToAddPracticeTo);
    setButtonIsConfirmation(true);
    setParentUuidToAddPracticeTo("");
    setNewPracticeName("");

    setTimeout(() : void => {
      setButtonIsConfirmation(false);
    }, 500);
  }

  return (
    <div>
      <label htmlFor="add-select-practice">{t("edit.parent_element")}</label>
      <SelectPracticeControl
        id="add-select-practice"
        value={parentUuidToAddPracticeTo}
        onChange={setParentUuidToAddPracticeTo}
        hierarchicalPractices={hierarchicalPractices ? hierarchicalPractices
          .descendants() : []}></SelectPracticeControl>
      <label htmlFor="input-new-practice-name">{t("edit.new_practice_name")}</label>
      <input
        id="input-new-practice-name"
        type="text"
        placeholder={t("edit.new_practice")}
        onChange={(e) : void => setNewPracticeName(e.target.value)}
        value={newPracticeName}></input>

      <button
        className={ buttonIsConfirmation ? "is-confirmation" : "" }
        onClick={addNewPractice}
        disabled={parentUuidToAddPracticeTo === "" || newPracticeName === ""}>
        {t("edit.add_as_child")}
      </button>
    </div>
  )
}

export default AddPracticeForm;
