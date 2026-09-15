# AGENTS.md

Guidance for AI coding agents (and humans) working on this repository.

## What this project is

**Smorkinkboard** is a fun way of manufacturing consent: a kink-flavoured take on the
[Relationship Anarchy Smorgasbord](https://github.com/duizendnegen/sunburst-smorgasbord/).
It shows which practices are welcome for the people in a dynamic, organized as a tree of
arbitrary depth — top-level **categories** (e.g. `Physical`, `Psychological`, `Social`), their
**play areas** (e.g. `Bondage`, `Impact Play`, `Toys`), and nested **practices**
(e.g. `Whip`, `Living Buffet`). The default dataset (`public/practices.json`) nests five levels
deep; the importer/exporter round-trip any header depth (capped at `h6` on export).

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
| 0     | Not Defined   | darkened solarized base03     | Default state — no consent has been created about this yet.                          |
| 1     | Hard Limit    | solarized red                 | Must not be part of the planned session or dynamic.                                  |
| 2     | Soft Limit    | solarized yellow              | Can be done, but generally to be avoided; may apply in a "service" dimension.        |
| 3     | Can           | pale solarized green          | Okay for the people attending, but not their favourite.                              |
| 4     | Should        | light solarized green         | Gives pleasure and is very welcome to be part of a scene or dynamic.                 |
| 5     | Must          | solarized green (vibrant)     | A favourite practice which should always be part of the session or dynamic.          |

## Markdown exchange format

Export/import uses markdown (spec: [docs/markdown-format.md](docs/markdown-format.md)):

- Exactly one `h1` with the board title (including the people list in brackets). The exporter
  appends the document language as a suffix, e.g. `# Smorkinkboard (für Sven und Abba) - Deutsch`.
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
├── CLAUDE.md                 → links here
├── README.md                 user-facing docs
├── index.html                Vite entry HTML (static assets stay in public/)
├── vite.config.ts            Vite + Vitest config (dev server on port 3000)
├── eslint.config.js          ESLint flat config
├── docs/
│   ├── Outline.md            product requirements (source of truth for behavior)
│   └── markdown-format.md    export/import format spec (source of truth for the format)
├── public/
│   ├── practices.json        Smorkinkboard default practice tree (loaded by App.tsx;
│   │                         node names resolve via i18n keys — see below)
│   └── locales/              i18n translations (en, de, es, nl)
└── src/
    ├── App.tsx               app shell: state wiring, page layout (header / board / FAQ / footer)
    ├── interfaces.tsx        Practice and Person domain types
    ├── constants.tsx         scale geometry + STATUSES / STATUS_BY_LABEL + BOARD_NAME
    ├── helpers.tsx           d3 hierarchy helpers, boardTitle, applyClick (status propagation)
    ├── i18n.tsx              i18next setup
    ├── components/
    │   ├── AppHeader/        sticky header: brand + actions (inline on desktop, dropdown on mobile)
    │   ├── Legend/           status legend under the board (swatch + label per status)
    │   ├── icons.tsx         shared inline SVG stroke icons (no icon library dependency)
    │   ├── Smorgasbord/      the d3 sunburst/scale rendering (core of the app)
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
    │   └── importer.ts
    └── fixtures/
        └── testPractices.json practice tree for tests (mirrors public/practices.json)
```

## Tech stack & conventions

- **React 19 + TypeScript**, bundled with **Vite** (dev server + build), JSX via `react-jsx`.
- Tests run on **Vitest** (jsdom environment, globals enabled, setup in `src/setupTests.ts`).
- Linting uses the **ESLint flat config** (`eslint.config.js`) with `typescript-eslint` and
  the React hooks plugin.
- **d3** (v7) for the sunburst rendering; **jotai** for state; **PicoCSS** (imported as
  plain CSS via `@picocss/pico/css/pico.min.css` in `src/App.tsx`, before `App.scss`) for
  styling — Pico's default colors are kept, and light/dark follows the OS preference
  (`prefers-color-scheme`) automatically; **i18next** for translations.
- State pattern: flat node list in an atom (`{ uuid, parentUuid, key?, name?, value?, note? }`,
  root has `parentUuid: ""`), nested tree derived via derived atoms (`atom((read) => ...)`).
  No provider wrapper is needed (jotai's default store is global). New domain types:
  `Practice` and `Person` in `src/interfaces.tsx`.
- Components live in one folder each: `src/components/<Name>/<Name>.tsx` (+ optional `.test.tsx`).
- Persistence: `localStorage` (keys `"practices"` and `"persons"`).
- `tsconfig` has `isolatedModules: true` — use `import type` for type-only imports.

## Commands

```bash
npm install        # install dependencies
npm start          # dev server at http://localhost:3000
npm test           # vitest, single run (CI-friendly); npm run test:watch for watch mode
npm run build      # type-check (tsc --noEmit) + production build to dist/
npm run preview    # serve the production build locally
npm run lint       # eslint over the repo (flat config)
```

## Current status

All planned work is done (2026-07): the app runs on `public/practices.json` and the `Practice`
type, implements the 0–5 status model with click cycling and top-down/bottom-up inheritance
(`applyClick` in `src/helpers.tsx`), markdown export/import per `docs/markdown-format.md`,
right-click context notes (`PracticeDetailModal`, asterisk on titled fields), and people
management (`PersonsBar`) shown in the board title. "Flavour" terminology has been renamed to
"practice" across the code base; JSON export/import is gone (markdown only).

Done: migrated off Create React App to Vite + Vitest + ESLint flat config (2026-07).
Done: replaced unmaintained recoil with jotai (2026-07) — recoil 0.7.7 is incompatible with
React 19 (it reads the removed `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED` export).
Done: UI/UX rework (2026-09) — sticky header with responsive actions menu (inline buttons on
desktop, dropdown panel on mobile; replaces the old floating button row), prominent people
chips row, status legend under the board, and a dark plum theme built on CSS custom
properties in `src/App.scss` (design tokens at the top of that file). Status labels are
translated per locale (`statuses.*` keys) and markdown export/import is fully multilingual:
export writes the active UI language (plus a ` - <language>` title suffix), import accepts every
supported language. The English labels in `src/constants.tsx` remain canonical for colors and
fallbacks; when a label changes, update the locale files (import/export read those).
Done: replaced Bulma with PicoCSS (2026-09) — Pico's default colors are kept and light/dark
follows the OS preference automatically (`prefers-color-scheme`, no `data-theme` set); modals
are native `<dialog>` + `<article>`, buttons use Pico's default/outline variants, forms are
plain label/input/select markup. The app-specific tokens in `src/App.scss` map to `--pico-*`
variables so they track the theme. Board and logo colors are now Solarized equivalents
(see the status table above).

Default dataset (2026-09): `public/practices.json` ships an extended tree (Aftercare, Impact
Play incl. toy types, Bondage, Electrical, Temperature Play, Touch, Toys, Sex, Edge Play,
Objectification, Psychological, Emotional, Social) nesting up to five levels deep. Practice
names are translated in the locale files: each node's `key` is a flat, underscore-joined path
(e.g. `physical_impact_play_toy_whip`) pointing at `practices.<key>` under the `practices`
section of every locale file — keep `public/practices.json`, `src/fixtures/testPractices.json`
and all four locales in sync when adding or renaming nodes. Keys must not contain dots
(i18next resolves dotted keys hierarchically, so a parent key could not be a prefix of its
children's keys).

Touch gestures (2026-09): the SVG uses `touch-action: pinch-zoom`, so vertical
swipes scroll the page while horizontal drags rotate the wheel (`onPointerMove`, tracked
per pointer id); long press opens the context overlay. Taps fire instantly on every
device; zooming is left to the browser's native pinch zoom (an in-app double-tap zoom
existed briefly but was removed).

Security & quality review (2026-10): enabled TypeScript `strict` mode and typed the
previously untyped code (`Smorgasbord` pointer handlers, `ExportAsImageButton`, form
props now accept a nullable hierarchy); re-enabled `@typescript-eslint/no-explicit-any`
in the ESLint config. Persisted state from `localStorage` is validated before use
(`parseStoredPractices` / `parseStoredPersons` in `src/helpers.tsx`) so corrupted
storage falls back to the defaults instead of crashing on load. CI now runs lint and
`npm audit --omit=dev` in both workflows, and `branches.yml` uses the same pinned
action versions as `main.yml`. Removed dead CRA leftovers (`reportWebVitals`,
`web-vitals`, `generate-react-cli.json`).

## Notes for agents

- `docs/Outline.md` is the product source of truth; where code and outline disagree, flag it.
  (The outline's original "five-fold / 0 to 4" wording contradicted its own six-value list;
  it has been corrected to six-fold / 0 to 5.)
- Don't wire in stubs that throw `Not implemented yet` without implementing them first.
- Keep the markdown format spec and its example in sync when changing either.
