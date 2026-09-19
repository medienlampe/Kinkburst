import { useRef, ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useSetRecoilState } from "recoil";
import flavoursState from "../../states/flavours.atom";
import { importMarkdown } from "../../markdown/importer";

const ImportMarkdownButton = () : JSX.Element => {
  const { t } = useTranslation();
  const setFlavours = useSetRecoilState(flavoursState);

  const inputFile = useRef<HTMLInputElement>(null);

  const importNewFlavours = () : void => {
    inputFile.current.click();
  }

  const handleFileSubmission = (event: ChangeEvent<HTMLInputElement>) : void => {
    event.stopPropagation();
    event.preventDefault();
    let file = event.target.files?.[0];
    if (!file) return;

    let reader = new FileReader();
    reader.onload = handleReaderOnLoad;
    reader.readAsText(file, "UTF-8");
  }

  const handleReaderOnLoad = (evt: ProgressEvent<FileReader>) : void => {
    try {
      setFlavours(importMarkdown(evt.target.result as string));
    } catch (error) {
      console.error("Could not import markdown board:", error);
      window.alert(t("import.error"));
    }
  }

  return (
    <button className="button is-primary" onClick={importNewFlavours}>
      <strong>{t("button.import_markdown")}</strong>
      <input
        type='file'
        ref={inputFile}
        onChange={handleFileSubmission}
        style={{display: "none"}}
        accept=".md,.markdown,text/markdown,text/x-markdown"/>
    </button>
  )
};

export default ImportMarkdownButton;
