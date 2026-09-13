import { type JSX } from "react";
import saveAs from "file-saver";
import { useTranslation } from "react-i18next";
import { useAtomValue } from "jotai";
import { flavoursAtom } from "../../states/flavours.atom";

const ExportAsJsonButton = () : JSX.Element => {
  const { t } = useTranslation();
  const flavours = useAtomValue(flavoursAtom);

  const exportCurrentFlavours = () : void => {
    const dataBlob = new Blob([JSON.stringify(flavours)], {type: "application/json;charset=utf-8"});
    saveAs(dataBlob, "sunburst-smorgasbord.json");
  }

  return (
    <button className="button is-primary" onClick={exportCurrentFlavours}>
      <strong>{t("button.download_json")}</strong>
    </button>
  );
}

export default ExportAsJsonButton;
