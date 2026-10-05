import { Suspense, useEffect, useState, type JSX } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useAtom } from "jotai";

// PicoCSS base (default colors + automatic light/dark via prefers-color-scheme),
// then the app-specific layout on top.
import "@picocss/pico/css/pico.min.css";
import "./App.scss";

import AppHeader from "./components/AppHeader/AppHeader";
import Smorgasbord from "./components/Smorgasbord/Smorgasbord";
import ExportMarkdownButton from "./components/ExportMarkdownButton/ExportMarkdownButton";
import ImportMarkdownButton from "./components/ImportMarkdownButton/ImportMarkdownButton";
import ExportAsImageButton from "./components/ExportAsImageButton/ExportAsImageButton";
import ResetButton from "./components/ResetButton/ResetButton";
import EditButton from "./components/EditButton/EditButton";
import EditModal from "./components/EditModal/EditModal";
import ResetConfirmationModal from "./components/ResetConfirmationModal/ResetConfirmationModal";
import HardLimitConfirmationModal from "./components/HardLimitConfirmationModal/HardLimitConfirmationModal";
import PracticeDetailModal from "./components/PracticeDetailModal/PracticeDetailModal";
import PersonsBar from "./components/PersonsBar/PersonsBar";
import Legend from "./components/Legend/Legend";
import UsageTips from "./components/UsageTips/UsageTips";
import { practicesAtom } from "./states/practices.atom";
import { personsAtom, createDefaultPersons } from "./states/persons.atom";
import type { Person, Practice } from "./interfaces";
import { applyClick, applyStatus, hasDefinedDescendants, nextStatus, parseStoredPersons, parseStoredPractices } from "./helpers";
import { BOARD_NAME, type StatusValue } from "./constants";

const App = () : JSX.Element => {
  const { t, i18n } = useTranslation();

  const [practices, setPractices] = useAtom(practicesAtom);
  const [persons, setPersons] = useAtom(personsAtom);

  const [resetConfirmationModalActive, setResetConfirmationModalActive] = useState<boolean>(false);
  // A pending Hard Limit change awaiting confirmation (from click cycling or
  // the status picker in the detail overlay). Both paths share this state so
  // the destructive child reset is confirmed identically.
  const [pendingHardLimit, setPendingHardLimit] = useState<{ uuid: string; value: StatusValue } | null>(null);
  const [editModalActive, setEditModalActive] = useState<boolean>(false);
  const [detailTargetUuid, setDetailTargetUuid] = useState<string | null>(null);
  const [detailDraft, setDetailDraft] = useState<string>("");

  const changeLanguage = (lang: string) : void => {
    i18n.changeLanguage(lang);
  };

  const fetchDefaultPractices = () : Promise<Practice[]> => {
    return fetch("practices.json")
      .then((response) => response.json())
      .then((fetched: Practice[]) => fetched.map(practice => ({ ...practice, value: practice.value ?? 0 })));
  }

  useEffect(() => {
    // Stored state is validated before use; corrupted data falls back to the
    // defaults instead of crashing the app on load.
    let storedPractices: Practice[] | undefined;
    let storedPersons: Person[] | undefined;

    if (localStorage) {
      storedPractices = parseStoredPractices(localStorage.getItem("practices"));
      storedPersons = parseStoredPersons(localStorage.getItem("persons"));
    }

    if (storedPractices) {
      setPractices(storedPractices);
    } else {
      fetchDefaultPractices().then((fetched) => {
        setPractices(fetched);
      });
    }

    if (storedPersons) {
      setPersons(storedPersons);
    }
  }, [ setPractices, setPersons ]);

  useEffect(() => {
    if (!practices || practices.length === 0) {
      return;
    }

    if (localStorage) {
      localStorage.setItem("practices", JSON.stringify(practices));
    }
  }, [ practices ]);

  useEffect(() => {
    if (!persons || persons.length === 0) {
      return;
    }

    if (localStorage) {
      localStorage.setItem("persons", JSON.stringify(persons));
    }
  }, [ persons ]);

  const resetBoard = () : void => {
    fetchDefaultPractices().then((fetched) => {
      setPractices(fetched);
    });
    setPersons(createDefaultPersons());
  }

  const toggleEditMode = () : void => {
    setEditModalActive(!editModalActive);
  }

  const handleElementClick = (uuid: string, cycleUp = false) : void => {
    const target = practices.find(practice => practice.uuid === uuid);
    if (!target || target.parentUuid === "") {
      return;
    }

    // Setting a field to Hard Limit resets all of its children — ask first,
    // but only if that would actually change something (any colored child).
    if (nextStatus(target.value, cycleUp) === 1 && hasDefinedDescendants(practices, uuid)) {
      setPendingHardLimit({ uuid, value: 1 });
      return;
    }

    setPractices(applyClick(practices, uuid, cycleUp));
  }

  const hardLimitTarget = practices.find(practice => practice.uuid === (pendingHardLimit?.uuid ?? "")) ?? null;
  const hardLimitTargetName = hardLimitTarget
    ? (hardLimitTarget.key ? t("practices." + hardLimitTarget.key) : (hardLimitTarget.name ?? ""))
    : "";

  const handleElementRightClick = (uuid: string) : void => {
    const target = practices.find(practice => practice.uuid === uuid);
    setDetailTargetUuid(uuid);
    setDetailDraft(target?.note ?? "");
  }

  const saveNote = (note: string) : void => {
    if (!detailTargetUuid) {
      return;
    }

    setPractices(
      practices.map((practice): Practice => practice.uuid === detailTargetUuid
        ? { ...practice, note }
        : practice
      )
    );
    setDetailTargetUuid(null);
  }

  // Sets the field's status directly from the detail overlay — the
  // touch-friendly alternative to click cycling (and its Shift modifier).
  // Applied immediately (the board updates live behind the open overlay);
  // the modal itself only closes on Save or Cancel.
  const handleSelectStatus = (value: StatusValue) : void => {
    if (!detailTargetUuid) {
      return;
    }

    // Same guard as the click path: Hard Limit resets colored children.
    if (value === 1 && hasDefinedDescendants(practices, detailTargetUuid)) {
      setPendingHardLimit({ uuid: detailTargetUuid, value });
      return;
    }

    setPractices(applyStatus(practices, detailTargetUuid, value));
  }

  const detailTarget = practices.find(practice => practice.uuid === detailTargetUuid) ?? null;

  return (
    <Suspense fallback="loading">
      <AppHeader>
        <ExportAsImageButton></ExportAsImageButton>
        <ExportMarkdownButton></ExportMarkdownButton>
        <ImportMarkdownButton></ImportMarkdownButton>
        <EditButton onClick={toggleEditMode}></EditButton>
        <ResetButton onClick={() : void => { setResetConfirmationModalActive(true); }}></ResetButton>
      </AppHeader>

      <main className="app-main">
        <section className="board-section">
          <div className="container board-container">
            <PersonsBar></PersonsBar>
            <Smorgasbord
              onElementClick={handleElementClick}
              onElementRightClick={handleElementRightClick}></Smorgasbord>
            <Legend></Legend>
            <p className="board-learn-more">
              <a href="#what-is-this">{t("faq.whats_this")}</a>
            </p>
          </div>
        </section>

        <section className="faq-section">
          <div className="container faq-container">
            <h2 id="what-is-this" className="faq-title">{t("faq.whats_this")}</h2>
            <p><Trans i18nKey="faq.whats_this_content"></Trans></p>
            <h2 className="faq-title">{t("faq.how_to_use")}</h2>
            <p>{t("faq.how_to_use_content_1")}</p>
            <p>{t("faq.how_to_use_content_2")}</p>
            <UsageTips></UsageTips>
            <h2 className="faq-title">{t("faq.safety")}</h2>
            <p><Trans i18nKey="faq.safety_content"></Trans></p>
          </div>
        </section>
      </main>

      <footer className="app-footer">
        <div className="container footer-inner">
          <h3>
            {BOARD_NAME} <span className="footer-version">v{__APP_VERSION__}</span>
          </h3>
          <p className="footer-build-date">{t("footer.updated")} {new Date(__BUILD_DATE__).toLocaleDateString()}</p>
          <p className="footer-languages">
            {t("footer.languages")}&nbsp;
            <button className="button-link" onClick={() : void => changeLanguage("en")}>{t("footer.languages_english")}</button>,&nbsp;
            <button className="button-link" onClick={() : void => changeLanguage("de")}>{t("footer.languages_german")}</button>
          </p>
          <p>
            <Trans
              i18nKey="footer.disclaimer"
              components={[
                <a key="smorgasbord" href="https://github.com/duizendnegen/sunburst-smorgasbord" target="_blank" rel="noopener noreferrer" />,
                <a key="d3" href="https://d3js.org/" target="_blank" rel="noopener noreferrer" />,
                <a key="sunburst" href="https://observablehq.com/@d3/sunburst" target="_blank" rel="noopener noreferrer" />,
              ]}
            />
          </p>
          <p>
            <a key="github" href="https://github.com/medienlampe/Kinkburst" target="_blank" rel="noopener noreferrer">Github</a>&nbsp;|&nbsp;
            <a key="imprint" href="https://whip-leipzig.de/impressum.html" target="_blank" rel="noopener noreferrer"><Trans i18nKey="footer.imprint" /></a>
          </p>
        </div>
      </footer>

      <ResetConfirmationModal
        isActive={resetConfirmationModalActive}
        onReset={() : void => { resetBoard(); setResetConfirmationModalActive(false); }}
        onCancel={() : void => { setResetConfirmationModalActive(false); }}
      ></ResetConfirmationModal>
      <HardLimitConfirmationModal
        isActive={hardLimitTarget !== null}
        practiceName={hardLimitTargetName}
        onConfirm={() : void => {
          if (pendingHardLimit) {
            setPractices(applyStatus(practices, pendingHardLimit.uuid, pendingHardLimit.value));
          }
          setPendingHardLimit(null);
        }}
        onCancel={() : void => { setPendingHardLimit(null); }}
      ></HardLimitConfirmationModal>
      <EditModal
        isActive={editModalActive}
        onClose={toggleEditMode}></EditModal>
      <PracticeDetailModal
        isActive={detailTarget !== null}
        practiceName={detailTarget?.name ?? ""}
        note={detailDraft}
        onNoteChange={setDetailDraft}
        onSave={saveNote}
        onCancel={() : void => { setDetailTargetUuid(null); }}
        currentValue={detailTarget?.value}
        onSelectStatus={handleSelectStatus}
      ></PracticeDetailModal>
    </Suspense>
  );
}

export default App;
