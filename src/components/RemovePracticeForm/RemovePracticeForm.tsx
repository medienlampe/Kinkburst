import { useState, type JSX } from "react";
import type { Practice } from "../../interfaces";
import * as d3 from "d3";
import SelectPracticeControl from "../SelectPracticeControl/SelectPracticeControl";
import { useTranslation } from "react-i18next";


interface RemovePracticeFormProps {
  onRemove: (uuid: string) => void;
  hierarchicalPractices: d3.HierarchyNode<Practice> | null;
}

const RemovePracticeForm = ({ onRemove, hierarchicalPractices } : RemovePracticeFormProps) : JSX.Element => {
  const { t } = useTranslation();
  const [practiceToRemove, setPracticeToRemove] = useState("");

  const removePractice = () : void => {
    onRemove(practiceToRemove);
    setPracticeToRemove("");
  }

  return (
    <div>
      <label htmlFor="select-practice">{t("edit.remove_practice")}</label>
      <SelectPracticeControl
        value={practiceToRemove}
        onChange={setPracticeToRemove}
        hierarchicalPractices={hierarchicalPractices ? hierarchicalPractices
          .descendants()
          .filter((practice) => practice.parent): []}></SelectPracticeControl>
      <button
        onClick={removePractice}
        disabled={practiceToRemove === ""}>
        {t("edit.remove_practice_button")}
      </button>
    </div>
  )
}

export default RemovePracticeForm;
