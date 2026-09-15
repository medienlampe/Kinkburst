import { type JSX } from "react";
import saveAs from "file-saver";
import { useTranslation } from "react-i18next";
import { useAtomValue } from "jotai";
import { practicesAtom } from "../../states/practices.atom";
import { personsAtom } from "../../states/persons.atom";
import { exportMarkdown } from "../../markdown/exporter";
import { ExportIcon } from "../icons";

const ExportMarkdownButton = () : JSX.Element => {
  const { t } = useTranslation();
  const practices = useAtomValue(practicesAtom);
  const persons = useAtomValue(personsAtom);

  const exportCurrentBoard = () : void => {
    const dataBlob = new Blob([exportMarkdown(practices, persons)], {type: "text/markdown;charset=utf-8"});
    saveAs(dataBlob, "smorkinkboard.md");
  }

  return (
    <button className="is-action" onClick={exportCurrentBoard}>
      <ExportIcon />
      <span>{t("button.export")}</span>
    </button>
  );
}

export default ExportMarkdownButton;
