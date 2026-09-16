<div align="center">

# Smorkinkboard

**A fun way of manufacturing consent.**

A kink-flavoured take on the [Relationship Anarchy Smorgasbord](https://github.com/duizendnegen/sunburst-smorgasbord/) by [Pepijn Schoen](https://github.com/duizendnegen) — thank you for creating the original project and for allowing me to do this!

[![Test, Build & Deploy to Pages](https://github.com/medienlampe/Smorkinkboard/actions/workflows/main.yml/badge.svg)](https://github.com/medienlampe/Smorkinkboard/actions/workflows/main.yml)
[![React](https://img.shields.io/badge/react-19.3-61DAFB?logo=react&logoColor=fff)](https://react.dev/)
[![Vite](https://img.shields.io/badge/vite-8.x-646CFF?logo=vite&logoColor=fff)](https://vite.dev/)
[![TypeScript](https://img.shields.io/badge/typescript-6.0-3178C6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org/)
[![d3](https://img.shields.io/badge/d3-v7-197CE6)](https://d3js.org/)

[How it works](#how-it-works) · [Statuses](#statuses) · [Export & Import](#export--import) · [Languages](#languages) · [Quick Start](#quick-start) · [Made with local LLMs](#made-with-local-llms)

</div>

---

Smorkinkboard shows which practices are welcome for the people in your dynamic, organized as a
rotating tree of arbitrary depth: top-level **categories** (e.g. *Physical*, *Psychological*,
*Social*), their **play areas** (e.g. *Bondage*, *Impact Play*, *Toys*), and nested
**practices** (e.g. *Whip*, *Living Buffet*).

It is a single-page app with no backend: your board lives entirely in your browser
(`localStorage`), and the whole thing runs on [React](https://react.dev/),
[d3](https://d3js.org/) and [Pico CSS](https://picocss.com/).

## How it works

- **Click a field** to cycle its status from 0 to 4 — the field and all of its parents update their color, so statuses are inherited top-down and bottom-up, just like in the original smorgasbord.
- **Right-click a field** (long press on touch devices) to add details or context for it. Fields with context get an asterisk (`*`) appended to their title in the scale.
- The default dataset ships with a broad set of practices — and you can **add, remove or rename** items at any depth right in the UI.
- **People**: add the people the board is for; they appear in the title, e.g. *Smorkinkboard (for Person A, Person B and Person C)*. One person by default, more can be added as needed.

A small excerpt of what a filled-in board looks like:

```text
Smorkinkboard (for Gerald and Yennefer)
└── Physical (Desired)
    ├── Impact Play (Desired)
    │   └── Toy
    │       ├── Whip (Desired) *
    │       └── Flogger (Can)
    └── Bondage (Soft Limit)
        └── Cutting (Hard Limit) *   ← "can trigger crash"
```

## Statuses

Each practice ranges from 0 to 4:

| Value | Status      | Color                     | Meaning                                                                                                   |
| ----- | ----------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| 0     | Not Defined | near-black (#111)         | Default state — no consent has been created about this yet.                                               |
| 1     | Hard Limit  | solarized red             | Must not be part of the planned session or dynamic.                                                       |
| 2     | Soft Limit  | solarized yellow          | Can be done, but generally to be avoided; may apply in a "service" dimension.                             |
| 3     | Can         | pale solarized green      | Okay for the people attending, but not their favourite.                                                   |
| 4     | Desired     | light solarized green     | Gives pleasure and is very welcome to be part of a scene or dynamic.                                       |

## Export & Import

Different from the original smorgasbord, Smorkinkboard exchanges data in a **human-readable markdown format** instead of JSON. Headers mark the hierarchy — one heading level per tree level (`#` title, then one level deeper per branch, up to `######`) — the status in brackets marks the value, and free text below a header is stored as context:

```markdown
# Smorkinkboard (for Gerald and Yennefer) - Deutsch

## Physical (Desired)
Favourite of Yennefer

### Impact Play (Desired)

#### Toy (Can)

##### Whip (Desired)
Slowly.

### Bondage (Soft Limit)

#### Cutting (Hard Limit)
Can trigger crash for Yennefer.
```

The full format specification lives in [docs/markdown-format.md](docs/markdown-format.md). Exports are written in the active UI language; imports accept status labels from all supported languages.

In addition, you can **download the board as an image** and **reset it** to the default dataset at any time.

## Languages

The interface ships in **English, Spanish, German and Dutch** — switch anytime via the footer; your choice is remembered.

Smorkinkboard also works great on phones and tablets: taps cycle the status, a long press opens the details overlay, vertical swipes scroll the page (the wheel itself only rotates with a mouse drag), and zooming uses the browser's native pinch zoom. Light and dark mode follow your OS preference automatically.

## Quick Start

```bash
npm install        # install dependencies
npm start          # dev server at http://localhost:3000/Smorkinkboard/
```

More commands (CI runs on Node.js 26.x):

```bash
npm test           # run the test suite (Vitest)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
npm run lint       # lint the repo (ESLint flat config)
```

## Made with local LLMs

This project was built and is maintained with the help of a fully local, home-brewed LLM setup running on Apple Silicon and powered by green energy. Model used: [Qwen3.8 27B](https://huggingface.co/Qwen), served from [unsloth's GGUF quant](https://huggingface.co/unsloth/Qwen3.8-27B-GGUF) as well as [Jackrong's MTP variant](https://huggingface.co/Jackrong/Qwen3.8-27B-MTP-GGUF).

## Contributing

We're open for pull requests — best discuss your suggestion first by opening an issue. See [AGENTS.md](AGENTS.md) for the project structure and conventions (used by both humans and AI coding agents).

## License

MIT — see [LICENSE.md](LICENSE.md).

If you want to use this project commercially, please get in contact with [Pepijn, the original creator](https://github.com/duizendnegen) and me first. Thank you.
