import { atom } from "recoil";

import { Person } from "../interfaces";

// The board is for one person by default; more can be added or removed as needed.
const personsState = atom<Person[]>({
  key: "persons",
  default: [
    { id: "person-1", name: "" }
  ]
});

export default personsState;
