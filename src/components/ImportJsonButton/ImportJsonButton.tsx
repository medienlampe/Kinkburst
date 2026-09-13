import { useRef, type JSX } from "react";
import { useTranslation } from "react-i18next";
import { useSetRecoilState } from "recoil";
import flavoursState from "../../states/flavours.atom";

const ImportJsonButton = () : JSX.Element => {
  const { t } = useTranslation();
  const setFlavours = useSetRecoilState(flavoursState);

  const inputFile = useRef(null);

  const importNewFlavours = () : void => {
    inputFile.current.click();
  }

  const handleFileSubmission = (event) : void => {
    event.stopPropagation();
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = handleReaderOnLoad;
    reader.readAsText(file, "UTF-8");
  }

  const handleReaderOnLoad = (evt) : void => {
    const json = JSON.parse(evt.target.result as any);
    setFlavours(json);
  }

  return (
    <button className="button is-primary" onClick={importNewFlavours}>
      <strong>{t("button.import_json")}</strong>
      <input
        type='file'
        ref={inputFile}
        onChange={handleFileSubmission}
        style={{display: "none"}}
        accept="application/json"/>
    </button>
  )
};

export default ImportJsonButton;
