import { type JSX } from "react";
import { useTranslation } from "react-i18next";
import { ResetIcon } from "../icons";

interface ResetButtonProps {
  onClick: () => void;
}

const ResetButton = ({ onClick } : ResetButtonProps) : JSX.Element => {
  const { t } = useTranslation();

  return (
    <button className="button is-action is-danger" onClick={onClick}>
      <ResetIcon />
      <span>{t("button.reset")}</span>
    </button>
  )
}

export default ResetButton;
