# AGENTS.md

Guidance for AI coding agents (and humans) working on this repository.

## What this project is

**Smorkinkboard** is a fun way of manufacturing consent: a kink-flavoured take on the
[Relationship Anarchy Smorgasbord](https://github.com/duizendnegen/sunburst-smorgasbord/).
It shows which practices are welcome for the people in a dynamic, organized as a tree:

- **Categories** (h2 level, e.g. `Physical`, `Psychological`, `Social`)
  - **Play areas** (h3 level, e.g. `Bondage`, `Impact Play`, `Power Exchange`, `Toys`, `Edge Play`)
    - **Practices** (h4 level, e.g. `Hand Spanking`, `E-Stim`, `Living Buffet`)

The full product requirements live in [docs/Outline.md](docs/Outline.md). Key behaviors:

- **Click** a field to change its status; the field and its parents update their color (same
  inheritance model as the original smorgasbord — statuses propagate bottom-up and top-down).
- **Right-click** any field opens an overlay to add details/context. Fields with context get an
  asterisk (`*`) appended to their title in the scale.
- Practices are pre-defined fixtures but editable in the UI.
- **People**: names can be added/removed (default: one person) and appear in the title, e.g.
  `Smorkinkboard (for Person A, Person B and Person C)`.
- Change, export, import, reset, and download-as-image are carried over from the original — but
  **export/import use a human-readable markdown format** instead of JSON (see below).

## Statuses

Each practice ranges from 0 to 5. The outline says "five-fold" but lists six values; the list is
authoritative. Definitions live in `src/constants.tsx` (`STATUSES`, `STATUS_BY_LABEL`):

| Value | Label         | Color     | Meaning                                                                              |
| ----- | ------------- | --------- | ------------------------------------------------------------------------------------ |
| 0     | Not Defined   | black     | Default state — no consent has been created about this yet.                          |
| 1     | Hard Limit    | red       | Must not be part of the planned session or dynamic.                                  |
| 2     | Soft Limit    | yellow    | Can be done, but generally to be avoided; may apply in a "service" dimension.        |
| 3     | Can           | light green | Okay for the people attending, but not their favourite.                            |
| 4     | Should        | lime green  | Gives pleasure and is very welcome to be part of a scene or dynamic.               |
| 5     | Must          | green     | A favourite practice which should always be part of the session or dynamic.         |

## Markdown exchange format

Export/import uses markdown (spec: [docs/markdown-format.md](docs/markdown-format.md)):

- Exactly one `h1` with the board title (including the people list in brackets).
- `h2` top categories, `h3` play areas, `h4` practices.
- Status in brackets after each header name: `(Not Defined)`, `(Hard Limit)`, `(Soft Limit)`,
  `(Can)`, `(Should)`, `(Must)`.
- Free text below a header is stored as context for that item.

The conversion lives in `src/markdown/` (`exporter.ts`, `importer.ts`) — currently stubs.

## Repository structure

The code base was copied from the original smorgasbord (same tech stack and interaction model).
Original code still uses the term **"flavour"** where Smorkinkboard says **"practice"**; renaming
is a planned follow-up, not yet done.

```
├── AGENTS.md                 ← you are here
├── CLAUDE.md                 → links here
├── README.md                 user-facing docs
├── docs/
│   ├── Outline.md            product requirements (source of truth for behavior)
│   └── markdown-format.md    export/import format spec (source of truth for the format)
├── public/
│   ├── flavours.json         default fixture from the original (still used by base code)
│   ├── practices.json        Smorkinkboard default practice tree (new, not yet wired in)
│   └── locales/              i18n translations (en, de, es, nl)
└── src/
    ├── App.tsx               app shell: state wiring, toolbar buttons, language switcher
    ├── interfaces.tsx        Flavour (base), Practice and Person (new domain types)
    ├── constants.tsx         scale geometry + STATUSES / STATUS_BY_LABEL
    ├── helpers.tsx           d3 hierarchy helpers (base code)
    ├── i18n.tsx              i18next setup
    ├── components/
    │   ├── Smorgasbord/      the d3 sunburst/scale rendering (base code, core of the app)
    │   ├── AddFlavourForm/   add-item form (base)
    │   ├── RemoveFlavourForm/ remove-item form (base)
    │   ├── SelectFlavourControl/ status selection control (base)
    │   ├── EditModal/        edit practices in the UI (base)
    │   ├── ImportJsonButton/ import JSON (base — to be replaced/augmented by markdown import)
    │   ├── ExportAsJsonButton/ export JSON (base — to be replaced/augmented by markdown export)
    │   ├── ExportAsImageButton/ download as image (base, keep)
    │   ├── ResetButton/ + ResetConfirmationModal/ reset (base, keep)
    │   ├── EditButton/       opens the edit modal (base)
    │   ├── PracticeDetailModal/  right-click overlay for context notes (stub)
    │   └── PersonsBar/       add/remove people (stub)
    ├── states/               recoil atoms/selectors
    │   ├── flavours.atom.tsx            flat list of nodes (base)
    │   ├── hierarchicalFlavours.selector.tsx  nested tree derived from the flat list
    │   ├── hierarchicalNodes.selector.tsx     d3 node hierarchy
    │   └── persons.atom.tsx             people the board is for (new, not yet wired in)
    ├── markdown/             export/import conversion (stubs)
    │   ├── exporter.ts
    │   └── importer.ts
    └── fixtures/
        ├── testFlavours.json  test fixture from the original
        └── testPractices.json small practice tree for new tests
```

## Tech stack & conventions

- **React 18 + TypeScript**, Create React App (`react-scripts` 5), JSX via `react-jsx`.
- **d3** (v7) for the sunburst rendering; **recoil** for state; **bulma** (scss) for styling;
  **i18next** for translations.
- State pattern: flat node list in an atom (`{ uuid, parentUuid, key?, name?, value?, note? }`,
  root has `parentUuid: ""`), nested tree derived via selectors. New domain types:
  `Practice` and `Person` in `src/interfaces.tsx`.
- Components live in one folder each: `src/components/<Name>/<Name>.tsx` (+ optional `.test.tsx`).
- Persistence: `localStorage` (base code uses the key `"flavours"`).
- `tsconfig` has `isolatedModules: true` — use `import type` for type-only imports.

## Commands

```bash
npm install        # install dependencies
npm start          # dev server at http://localhost:3000
npm test           # jest (add --watchAll=false for a single run, e.g. in CI)
npm run build      # production build
npm run lint       # eslint over src
```

## Current status / follow-up tasks

Scaffolding is done; the app currently runs the original smorgasbord behavior with Smorkinkboard
branding. Remaining work (roughly in order):

1. Wire `public/practices.json` + `Practice` type into the app (replace `flavours.json` loading).
2. Implement the 0–5 status model: click cycling, colors from `STATUSES`, top-down/bottom-up
   inheritance (adapt base code's two-state logic).
3. Implement `src/markdown/` exporter/importer per `docs/markdown-format.md` + tests against the
   example in that doc; add markdown export/import UI buttons (keep or drop JSON ones — decide).
4. Right-click → `PracticeDetailModal` for context notes; asterisk (`*`) on titles with notes.
5. `PersonsBar`: add/remove people; render the people list in the board title and in the h1 of
   markdown export.
6. Rename "flavour" terminology to "practice" across base code (mechanical, but touches many files).
7. Consider migrating off Create React App (Vite) — optional, only if desired.

## Notes for agents

- `docs/Outline.md` is the product source of truth; where code and outline disagree, flag it.
  Known ambiguity: "five-fold" statuses vs. six listed values — follow the six-value list.
- Don't wire in stubs that throw `Not implemented yet` without implementing them first.
- Keep the markdown format spec and its example in sync when changing either.
