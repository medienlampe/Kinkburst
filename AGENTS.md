# AGENTS.md

Guidance for AI coding agents (and humans) working on this repository.

## What this project is

**Smorkinkboard** is a fun way of manufacturing consent: a kink-flavoured take on the
[Relationship Anarchy Smorgasbord](https://github.com/duizendnegen/sunburst-smorgasbord/) by
[Pepijn Schoen](https://github.com/duizendnegen).

It shows which practices are welcome for the people in a dynamic, organized as a rotating tree
of arbitrary depth — top-level **categories** (e.g. `Physical`, `Psychological`, `Social`), their
**play areas** (e.g. `Bondage`, `Impact Play`, `Toys`), and nested **practices**
(e.g. `Whip`, `Living Buffet`). The default dataset (`public/practices.json`, 85 nodes) nests up
to five levels deep; the importer/exporter round-trip any depth up to `h6`.

The full product requirements live in [docs/Outline.md](docs/Outline.md). Key behaviors:

- **Click** a field to cycle its status (0 → 5); the field and all of its ancestors update their
  color — same inheritance model as the original smorgasbord, statuses propagate bottom-up and
  top-down (`applyClick` in `src/helpers.tsx`).
- **Right-click** any field (long press on touch devices) opens an overlay to add details/context.
  Fields with context get an asterisk (`*`) appended to their title in the scale.
- Practices are pre-defined fixtures but fully editable in the UI: add, remove, rename.
- **People**: names can be added/removed (default: one person) and appear in the board title, e.g.
  `Smorkinkboard (for Person A, Person B and Person C)`.
- Export/import/reset/download-as-image are carried over from the original — but
  **export/import use a human-readable markdown format** instead of JSON (see below).
- The UI is multilingual (English, Spanish, German, Dutch); the language switcher lives in the
  footer and the choice is remembered via `i18next-browser-languagedetector`.

## Statuses

Each practice ranges from 0 to 5 (six statuses; defined in `docs/Outline.md`). Definitions live in
`src/constants.tsx` (`STATUSES`, `STATUS_BY_LABEL`); user-facing labels come from the locale files
(`statuses.*` keys) — English is canonical:

| Value | Label       | Color                     | Meaning                                                                              |
| ----- | ----------- | ------------------------- | ------------------------------------------------------------------------------------ |
| 0     | Not Defined | darkened solarized base03 | Default state — no consent has been created about this yet.                          |
| 1     | Hard Limit  | solarized red             | Must not be part of the planned session or dynamic.                                  |
| 2     | Soft Limit  | solarized yellow          | Can be done, but generally to be avoided; may apply in a "service" dimension.        |
| 3     | Can         | pale solarized green      | Okay for the people attending, but not their favourite.                              |
| 4     | Should      | light solarized green     | Gives pleasure and is very welcome to be part of a scene or dynamic.                 |
| 5     | Must        | solarized green (vibrant) | A favourite practice which should always be part of the session or dynamic.          |

## Markdown exchange format

Export/import uses markdown (spec: [docs/markdown-format.md](docs/markdown-format.md)):

- Exactly one `h1` with the board title (including the people list in brackets). The exporter
  appends the document language as a suffix, e.g. `# Smorkinkboard (für Person A und Person B) - Deutsch`.
- One heading level per tree level: `h2` is the first level under the title, each deeper node
  goes one heading level down (up to `h6`).
- Status in brackets after each header name, written in the active UI language on export; import
  accepts the labels of all supported languages (en/de/es/nl), e.g. `(Must)` / `(Muss)` / `(Moet)`.
- Free text below a header is stored as context for that item.

The conversion lives in `src/markdown/` (`exporter.ts`, `importer.ts`, `statusLabels.ts`). All
labels come from the locale files via i18next — never hardcode translated strings in the code.

## Repository structure

The code base was copied from the original smorgasbord (same tech stack and interaction model)
and rebranded: where the original says **"flavour"**, Smorkinkboard says **"practice"**.

```
├── AGENTS.md                 ← you are here
├── CLAUDE.md                 → symlink to this file
├── README.md                 user-facing docs
├── LICENSE.md                MIT license
├── index.html                Vite entry HTML (static assets stay in public/)
├── vite.config.ts            Vite + Vitest config; base "/Smorkinkboard/" for GitHub Pages
├── eslint.config.js          ESLint flat config
├── tsconfig.json             strict mode, isolatedModules
├── .github/workflows/
│   ├── main.yml              CI on main: lint → npm audit --omit=dev → test → build →
│   │                         deploy to GitHub Pages (pinned action versions)
│   └── branches.yml          same checks for feature branches
├── docs/
│   ├── Outline.md            product requirements (source of truth for behavior)
│   └── markdown-format.md    export/import format spec (source of truth for the format)
├── public/
│   ├── practices.json        default practice tree: flat node list, root has parentUuid ""
│   ├── locales/              i18n translations — en/de/es/nl, one translation.json each
│   └── logo.svg · manifest.json · preview.png · robots.txt    PWA + social-card assets
└── src/
    ├── index.tsx             React entry point (mounts <App/> into #root)
    ├── index.css             base page styles
    ├── App.tsx               app shell: state wiring, layout (header / board / FAQ / footer),
    │                         localStorage persistence, language switching
    ├── App.scss              design tokens + app-specific layout on top of PicoCSS
    ├── interfaces.tsx        Practice and Person domain types
    ├── constants.tsx         scale geometry + STATUSES / STATUS_BY_LABEL + BOARD_NAME
    │                         + SUPPORTED_LANGUAGES
    ├── helpers.tsx           d3 hierarchy helpers, boardTitle, applyClick (status propagation),
    │                         parseStoredPractices/parseStoredPersons (localStorage validation)
    ├── i18n.tsx              i18next setup (i18n.tests.tsx covers locale completeness)
    ├── download.ts           downloadBlob: object URL + temporary anchor for file exports
    ├── components/
    │   ├── AppHeader/        sticky header: brand + actions (inline on desktop, dropdown on mobile)
    │   ├── Legend/           status legend under the board (swatch + label per status)
    │   ├── icons.tsx         shared inline SVG stroke icons (no icon library dependency)
    │   ├── Smorgasbord/      the d3 sunburst/scale rendering (core of the app; own Smorgasbord.css)
    │   ├── AddPracticeForm/  add-item form
    │   ├── RemovePracticeForm/ remove-item form
    │   ├── SelectPracticeControl/ practice selection control (used by both forms)
    │   ├── EditModal/        edit practices in the UI
    │   ├── ExportMarkdownButton/ export the board as markdown
    │   ├── ImportMarkdownButton/ import a board from markdown
    │   ├── ExportAsImageButton/ download as image
    │   ├── ResetButton/ + ResetConfirmationModal/ reset to defaults
    │   ├── EditButton/       opens the edit modal
    │   ├── PracticeDetailModal/  right-click overlay for context notes
    │   └── PersonsBar/       add/remove people
    ├── states/               jotai atoms + derived atoms
    │   ├── practices.atom.ts            flat list of practice nodes
    │   ├── hierarchicalPractices.atom.ts nested tree derived from the flat list
    │   ├── hierarchicalNodes.atom.ts    d3 node hierarchy (layout weights live on the nodes)
    │   └── persons.atom.ts              people the board is for
    ├── markdown/             export/import conversion per docs/markdown-format.md
    │   ├── exporter.ts
    │   ├── importer.ts
    │   └── statusLabels.ts
    └── fixtures/
        └── testPractices.json practice tree for tests (mirrors public/practices.json)
```

Most components ship with a co-located `*.test.tsx`; there are also top-level tests:
`App.test.tsx`, `helpers.test.ts`, `download.test.ts`, `markdown/markdown.test.ts`.

## Tech stack & conventions

- **React 19 + TypeScript** (strict mode), bundled with **Vite**; JSX via `react-jsx`.
- Tests run on **Vitest** (jsdom environment, globals enabled, setup in `src/setupTests.ts`).
- Linting uses the **ESLint flat config** (`eslint.config.js`) with `typescript-eslint` and
  the React hooks plugin; `@typescript-eslint/no-explicit-any` is enforced.
- **d3** (v7) for the sunburst rendering; **jotai** for state; **i18next** for translations.
- Styling: **PicoCSS** imported as plain CSS in `src/App.tsx` (before `App.scss`). Pico's default
  colors are kept and light/dark follows the OS preference automatically (`prefers-color-scheme`,
  no `data-theme` set); modals are native `<dialog>` + `<article>`, buttons use Pico's default/
  outline variants. App-specific design tokens live at the top of `src/App.scss` and map to
  `--pico-*` variables so they track the theme. Board and logo colors are Solarized equivalents
  (see the status table above).
- State pattern: flat node list in an atom (`{ uuid, parentUuid, key?, name?, value?, note? }`,
  root has `parentUuid: ""`), nested tree derived via derived atoms (`atom((read) => ...)`).
  No provider wrapper is needed (jotai's default store is global). Domain types: `Practice` and
  `Person` in `src/interfaces.tsx`.
- Components live in one folder each: `src/components/<Name>/<Name>.tsx` (+ optional `.test.tsx`).
- Persistence: `localStorage` (keys `"practices"` and `"persons"`); both are validated before use
  (`parseStoredPractices` / `parseStoredPersons`) so corrupted storage falls back to the defaults.
- IDs come from native `crypto.randomUUID()`; file exports (markdown / image) go through
  `src/download.ts` (`downloadBlob`).
- Translated strings live only in `public/locales/*/translation.json`; never hardcode them.
- Deployment: `vite.config.ts` sets `base: "/Smorkinkboard/"`, so the app is served under that
  subpath everywhere (dev server, build output, and GitHub Pages at
  `https://medienlampe.github.io/Smorkinkboard/`). Keep paths relative to the page.

## Commands

```bash
npm install        # install dependencies
npm start          # dev server at http://localhost:3000/Smorkinkboard/
npm run start-open # same, but reachable on the network (host 0.0.0.0)
npm test           # vitest, single run (CI-friendly); npm run test:watch for watch mode
npm run build      # type-check (tsc --noEmit) + production build to dist/
npm run preview    # serve the production build locally
npm run lint       # eslint over the repo (flat config)
```

## Current status

The app is feature-complete per `docs/Outline.md`. Timeline of milestones:

- **2026-07 — Core port.** Runs on `public/practices.json` and the `Practice` type; 0–5 status
  model with click cycling and top-down/bottom-up inheritance (`applyClick`); markdown
  export/import per `docs/markdown-format.md`; right-click context notes (`PracticeDetailModal`,
  asterisk on titled fields); people management (`PersonsBar`) shown in the board title.
  "Flavour" terminology renamed to "practice"; JSON export/import gone (markdown only).
- **2026-07 — Tooling.** Migrated off Create React App to Vite + Vitest + ESLint flat config;
  replaced unmaintained recoil with jotai (recoil 0.7.7 is incompatible with React 19 — it reads
  the removed `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED` export).
- **2026-09 — UI/UX rework.** Sticky header with responsive actions menu (inline buttons on
  desktop, dropdown panel on mobile; replaces the old floating button row), prominent people chips
  row, status legend under the board. Status labels are translated per locale (`statuses.*` keys)
  and markdown export/import is fully multilingual: export writes the active UI language (plus a
  ` - <language>` title suffix), import accepts every supported language. The English labels in
  `src/constants.tsx` remain canonical for colors and fallbacks — when a label changes, update the
  locale files (import/export read those).
- **2026-09 — Styling.** Replaced Bulma with PicoCSS: default Pico colors, light/dark follows the
  OS preference automatically; modals are native `<dialog>` + `<article>`, forms are plain
  label/input/select markup. App-specific tokens in `src/App.scss` map to `--pico-*` variables so
  they track the theme.
- **2026-09 — Default dataset.** `public/practices.json` ships an extended tree (Aftercare, Impact
  Play incl. toy types, Bondage, Electrical, Temperature Play, Touch, Toys, Sex, Edge Play,
  Objectification, Psychological, Emotional, Social) nesting up to five levels deep. Practice names
  are translated in the locale files: each node's `key` is a flat, underscore-joined path
  (e.g. `physical_impact_play_toy_whip`) pointing at `practices.<key>` under the `practices`
  section of every locale file — keep `public/practices.json`, `src/fixtures/testPractices.json`
  and all four locales in sync when adding or renaming nodes. Keys must not contain dots (i18next
  resolves dotted keys hierarchically, so a parent key could not be a prefix of its children's keys).
- **2026-09 — Touch gestures.** The SVG uses `touch-action: pinch-zoom`, so vertical swipes scroll
  the page while horizontal drags rotate the wheel (`onPointerMove`, tracked per pointer id); long
  press opens the context overlay. Taps fire instantly on every device; zooming is left to the
  browser's native pinch zoom (an in-app double-tap zoom existed briefly but was removed).
- **2026-09 — Security & quality review.** Enabled TypeScript `strict` mode and typed previously
  untyped code (`Smorgasbord` pointer handlers, `ExportAsImageButton`, form props now accept a
  nullable hierarchy); re-enabled `@typescript-eslint/no-explicit-any`. Persisted state from
  `localStorage` is validated before use so corrupted storage falls back to the defaults instead of
  crashing on load. CI runs lint and `npm audit --omit=dev` in both workflows with pinned action
  versions. Removed dead CRA leftovers (`reportWebVitals`, `web-vitals`, `generate-react-cli.json`).
  Dropped the unmaintained `uuid` and `file-saver` packages: ids now come from native
  `crypto.randomUUID()`, file exports go through `src/download.ts`.

## Notes for agents

- `docs/Outline.md` is the product source of truth; where code and outline disagree, flag it.
- Don't wire in stubs that throw `Not implemented yet` without implementing them first.
- Keep the markdown format spec (`docs/markdown-format.md`) and its example in sync when changing
  either — and keep the README's export/import example consistent with both.
- Translated strings live only in the locale files; when adding UI text, add it to all four of
  `public/locales/{en,de,es,nl}/translation.json`.
