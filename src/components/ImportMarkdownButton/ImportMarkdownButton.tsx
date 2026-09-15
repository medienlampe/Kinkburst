import { useRef, type JSX } from "react";
import { useTranslation } from "react-i18next";
import { useSetAtom } from "jotai";
import { practicesAtom } from "../../states/practices.atom";
import { personsAtom } from "../../states/persons.atom";
import { importMarkdown } from "../../markdown/importer";
import { ImportIcon } from "../icons";

const ImportMarkdownButton = () : JSX.Element => {
  const { t } = useTranslation();
  const setPractices = useSetAtom(practicesAtom);
  const setPersons = useSetAtom(personsAtom);

  const inputFile = useRef<HTMLInputElement>(null);

  const importNewBoard = () : void => {
    inputFile.current?.click();
  }

  const handleFileSubmission = (event) : void => {
    event.stopPropagation();
    event.preventDefault();
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = handleReaderOnLoad;
    reader.readAsText(file, "UTF-8");
  }

  const handleReaderOnLoad = (evt) : void => {
    try {
      const board = importMarkdown(evt.target.result as string);
      setPractices(board.practices);
      setPersons(board.persons);
    } catch (error) {
      console.error("Could not import markdown board:", error);
      window.alert(t("import.error"));
    }
  }

  return (
    <button className="outline is-action" onClick={importNewBoard}>
      <ImportIcon />
      <span>{t("button.import")}</span>
      <input
        type='file'
        ref={inputFile}
        onChange={handleFileSubmission}
        style={{display: "none"}}
        accept=".md,.markdown,text/markdown,text/x-markdown"/>
    </button>
  );
};

export default ImportMarkdownButton;
