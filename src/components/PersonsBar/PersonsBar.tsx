import { type JSX } from "react";
import { v4 as uuidv4 } from "uuid";
import { useTranslation } from "react-i18next";
import { useAtom } from "jotai";
import { personsAtom } from "../../states/persons.atom";
import type { Person } from "../../interfaces";
import { PlusIcon } from "../icons";

// Controls the people the board is for (default: one person). The names are shown
// as chips and feed the board title, e.g. "Smorkinkboard (for Person A, Person B)".
const PersonsBar = () : JSX.Element => {
  const { t } = useTranslation();
  const [persons, setPersons] = useAtom(personsAtom);

  const changeName = (id: string, name: string) : void => {
    setPersons(persons.map((person): Person => person.id === id ? { ...person, name } : person));
  }

  const addPerson = () : void => {
    setPersons([...persons, { id: uuidv4(), name: "" }]);
  }

  const removePerson = (id: string) : void => {
    // The board always keeps at least one person.
    if (persons.length <= 1) {
      return;
    }
    setPersons(persons.filter(person => person.id !== id));
  }

  return (
    <div className="persons-bar">
      <span className="persons-label" id="persons-label">{t("persons.label")}</span>
      <div className="persons-chips" role="group" aria-labelledby="persons-label">
        {persons.map((person: Person, index: number) => (
          <div className="person-chip" key={person.id}>
            <input
              className="person-input"
              type="text"
              placeholder={t("persons.placeholder")}
              aria-label={`${t("persons.placeholder")} ${index + 1}`}
              value={person.name}
              onChange={(e) : void => changeName(person.id, e.target.value)}></input>
            {persons.length > 1 && (
              <button
                className="delete is-small person-delete"
                aria-label={`${t("persons.remove")} ${index + 1}`}
                onClick={() : void => removePerson(person.id)}></button>
            )}
          </div>
        ))}
        <button type="button" className="person-add" onClick={addPerson}>
          <PlusIcon size={14} />
          {t("persons.add")}
        </button>
      </div>
    </div>
  );
}

export default PersonsBar;
