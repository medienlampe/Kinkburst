import { type JSX } from "react";
import { useTranslation } from "react-i18next";
import { EditIcon } from "../icons";

interface EditButtonProps {
  onClick: () => void;
}

const EditButton = ({ onClick } : EditButtonProps) : JSX.Element => {
  const { t } = useTranslation();

  return (
    <button className="outline is-action" onClick={onClick}>
      <EditIcon />
      <span>{t("button.edit")}</span>
    </button>
  )
}

export default EditButton;
