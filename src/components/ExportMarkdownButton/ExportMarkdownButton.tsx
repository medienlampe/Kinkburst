import { type JSX } from "react";
import { useTranslation } from "react-i18next";
import { useAtomValue } from "jotai";
import { practicesAtom } from "../../states/practices.atom";
import { personsAtom } from "../../states/persons.atom";
import { exportMarkdown } from "../../markdown/exporter";
import { downloadBlob } from "../../download";
import { ExportIcon } from "../icons";
import type { Person } from "../../interfaces";

// Export file name: YYYYMMDD-Kinkburst[-<PersonA><PersonB>...].txt, e.g.
// 20260824-Kinkburst-EllaEmmaIda.txt (or just 20260824-Kinkburst.txt when the
// board has no named people).
export const exportFileName = (persons: Person[], now: Date = new Date()): string => {
  const date = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  // Whitespace becomes underscores so names with spaces stay a single file token.
  const names = persons.map(p => p.name.trim().replace(/\s+/g, "_")).filter(name => name !== "");
  return `${date}-Kinkburst${names.length > 0 ? `-${names.join("")}` : ""}.txt`;
};

const ExportMarkdownButton = () : JSX.Element => {
  const { t } = useTranslation();
  const practices = useAtomValue(practicesAtom);
  const persons = useAtomValue(personsAtom);

  const exportCurrentBoard = () : void => {
    const dataBlob = new Blob([exportMarkdown(practices, persons)], {type: "text/plain;charset=utf-8"});
    downloadBlob(dataBlob, exportFileName(persons));
  }

  return (
    <button className="outline is-action" onClick={exportCurrentBoard}>
      <ExportIcon />
      <span>{t("button.export")}</span>
    </button>
  );
}

export default ExportMarkdownButton;
