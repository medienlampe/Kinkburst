import { Suspense, useCallback, useEffect, useState, type JSX } from "react";
import { useTranslation } from "react-i18next";
import { useAtom } from "jotai";

import "./App.scss";

import Smorgasbord from "./components/Smorgasbord/Smorgasbord";
import ExportMarkdownButton from "./components/ExportMarkdownButton/ExportMarkdownButton";
import ImportMarkdownButton from "./components/ImportMarkdownButton/ImportMarkdownButton";
import ExportAsImageButton from "./components/ExportAsImageButton/ExportAsImageButton";
import ResetButton from "./components/ResetButton/ResetButton";
import EditButton from "./components/EditButton/EditButton";
import EditModal from "./components/EditModal/EditModal";
import ResetConfirmationModal from "./components/ResetConfirmationModal/ResetConfirmationModal";
import PracticeDetailModal from "./components/PracticeDetailModal/PracticeDetailModal";
import PersonsBar from "./components/PersonsBar/PersonsBar";
import { practicesAtom } from "./states/practices.atom";
import { personsAtom, createDefaultPersons } from "./states/persons.atom";
import type { Practice } from "./interfaces";
import { applyClick, boardTitle } from "./helpers";
import { BOARD_NAME } from "./constants";

const App = () : JSX.Element => {
  const { t, i18n } = useTranslation();

  const [practices, setPractices] = useAtom(practicesAtom);
  const [persons, setPersons] = useAtom(personsAtom);

  const [resetConfirmationModalActive, setResetConfirmationModalActive] = useState<boolean>(false);
  const [editModalActive, setEditModalActive] = useState<boolean>(false);
  const [detailTargetUuid, setDetailTargetUuid] = useState<string | null>(null);
  const [detailDraft, setDetailDraft] = useState<string>("");

  const [buttonsFloating, setButtonsFloating] = useState<boolean>(false);

  const changeLanguage = (lang) : void => {
    i18n.changeLanguage(lang);
  };

  const fetchDefaultPractices = () : Promise<Practice[]> => {
    return fetch("practices.json")
      .then((response) => response.json())
      .then((fetched: Practice[]) => fetched.map(practice => ({ ...practice, value: practice.value ?? 0 })));
  }

  useEffect(() => {
    let storedPractices;
    let storedPersons;

    if (localStorage) {
      storedPractices = JSON.parse(localStorage.getItem("practices"));
      storedPersons = JSON.parse(localStorage.getItem("persons"));
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

  const handleScroll = useCallback(() => {
    const buttonPosition = document.getElementsByClassName("js-button-container-scrolltop")[0].getBoundingClientRect().top;
    if (buttonPosition < 30 && !buttonsFloating) {
      setButtonsFloating(true);
    } else if (buttonPosition >= 30 && buttonsFloating) {
      setButtonsFloating(false);
    }
  }, [ buttonsFloating ]);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [ handleScroll ]);

  const resetBoard = () : void => {
    fetchDefaultPractices().then((fetched) => {
      setPractices(fetched);
    });
    setPersons(createDefaultPersons());
  }

  const toggleEditMode = () : void => {
    setEditModalActive(!editModalActive);
  }

  const handleElementClick = (uuid: string) : void => {
    setPractices(applyClick(practices, uuid));
  }

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

  const detailTarget = practices.find(practice => practice.uuid === detailTargetUuid) ?? null;

  return (
    <Suspense fallback="loading">
      <section className="section">
        <div className="container content has-text-centered">
          <h1 className="title">{boardTitle(persons)}</h1>
          <h2 className="subtitle">{t("header.subtitle")}</h2>
          <PersonsBar></PersonsBar>
          <p>
            <a href="#what-is-this">{t("faq.whats_this")}</a>
          </p>
        </div>
      </section>
      <section className="section">
        <div className="container content">
          <div className='js-button-container-scrolltop buttons-wrapper'>
            <div className={ buttonsFloating
              ? "buttons has-addons is-centered is-fixed"
              : "buttons has-addons is-centered"}>
              <ExportAsImageButton></ExportAsImageButton>
              <ExportMarkdownButton></ExportMarkdownButton>
              <ImportMarkdownButton></ImportMarkdownButton>
              <EditButton onClick={toggleEditMode}></EditButton>
              <ResetButton onClick={() : void => { setResetConfirmationModalActive(true); }}></ResetButton>
            </div>
          </div>
        </div>
      </section>
      <ResetConfirmationModal
        isActive={resetConfirmationModalActive}
        onReset={() : void => { resetBoard(); setResetConfirmationModalActive(false); }}
        onCancel={() : void => { setResetConfirmationModalActive(false); }}
      ></ResetConfirmationModal>
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
      ></PracticeDetailModal>
      <section className="section">
        <div className="container content has-text-centered">
          <Smorgasbord
            onElementClick={handleElementClick}
            onElementRightClick={handleElementRightClick}></Smorgasbord>
        </div>
      </section>
      <section className="section">
        <div className="container">
          <div className="content has-text-centered">
            <h2 id="what-is-this" className="title is-4">{t("faq.whats_this")}</h2>
            <p dangerouslySetInnerHTML={{__html: t("faq.whats_this_content")}}></p>
            <h2 className="title is-4">{t("faq.how_to_use")}</h2>
            <p>{t("faq.how_to_use_content_1")}</p>
            <p>{t("faq.how_to_use_content_2")}</p>
            <h2 className="title is-4">{t("faq.safety")}</h2>
            <p dangerouslySetInnerHTML={{__html: t("faq.safety_content")}}></p>
          </div>
        </div>
      </section>
      <footer className="footer">
        <div className="content">
          <h3>{BOARD_NAME}</h3>
          <p>
            {t("footer.languages")}&nbsp;
            <button className="button-link" onClick={() : void => changeLanguage("en")}>{t("footer.languages_english")}</button>,&nbsp;
            <button className="button-link" onClick={() : void => changeLanguage("es")}>{t("footer.languages_spanish")}</button>,&nbsp;
            <button className="button-link" onClick={() : void => changeLanguage("de")}>{t("footer.languages_german")}</button>,&nbsp;
            <button className="button-link" onClick={() : void => changeLanguage("nl")}>{t("footer.languages_dutch")}</button>.
          </p>
          <p dangerouslySetInnerHTML={{__html: t("footer.disclaimer")}}></p>
        </div>
      </footer>
    </Suspense>
  );
}

export default App;
