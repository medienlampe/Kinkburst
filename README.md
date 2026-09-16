# Smorkinkboard

> A fun way of manufacturing consent.

Smorkinkboard is a kink-flavoured take on the [Relationship Anarchy Smorgasbord](https://github.com/duizendnegen/sunburst-smorgasbord/) by [Pepijn Schoen](https://github.com/duizendnegen) — thank you for creating the original project and for allowing me to do this!

It shows which practices are welcome for the people in your dynamic, organized as a rotating tree of arbitrary depth: top-level **categories** (e.g. *Physical*, *Psychological*, *Social*), their **play areas** (e.g. *Bondage*, *Impact Play*, *Toys*), and nested **practices** (e.g. *Whip*, *Living Buffet*).

## How it works

- **Click a field** to cycle its status from 0 to 5 — the field and all of its parents update their color, so statuses are inherited top-down and bottom-up, just like in the original smorgasbord.
- **Right-click a field** (long press on touch devices) to add details or context for it. Fields with context get an asterisk (`*`) appended to their title in the scale.
- The default dataset ships with a broad set of practices — and you can **add, remove or rename** items at any depth right in the UI.
- **People**: add the people the board is for; they appear in the title, e.g. *Smorkinkboard (for Person A, Person B and Person C)*. One person by default, more can be added as needed.
- Everything runs locally in your browser — your board lives in `localStorage`, no server involved.

## Statuses

Each practice ranges from 0 to 5:

| Value | Status      | Color                     | Meaning                                                                                                   |
| ----- | ----------- | ------------------------- | --------------------------------------------------------------------------------------------------------- |
| 0     | Not Defined | darkened solarized base03 | Default state — no consent has been created about this yet.                                               |
| 1     | Hard Limit  | solarized red             | Must not be part of the planned session or dynamic.                                                       |
| 2     | Soft Limit  | solarized yellow          | Can be done, but generally to be avoided; may apply in a "service" dimension.                             |
| 3     | Can         | pale solarized green      | Okay for the people attending, but not their favourite.                                                   |
| 4     | Should      | light solarized green     | Gives pleasure and is very welcome to be part of a scene or dynamic.                                       |
| 5     | Must        | solarized green (vibrant) | A favourite practice which should always be part of the session or dynamic.                                |

## Export & Import

Different from the original smorgasbord, Smorkinkboard exchanges data in a **human-readable markdown format** instead of JSON. Headers mark the hierarchy — one heading level per tree level (`#` title, then one level deeper per branch, up to `######`) — the status in brackets marks the value, and free text below a header is stored as context:

```markdown
# Smorkinkboard (for Person A, Person B and Person C)

## Physical (Must)
Favourite of Person B

### Impact Play (Must)

### Bondage (Can)

#### Cutting (Hard Limit)
Can trigger crash for Person A.
```

The full format specification lives in [docs/markdown-format.md](docs/markdown-format.md). Exports are written in the active UI language; imports accept status labels from all supported languages.

In addition, you can **download the board as an image** and **reset it** to the default dataset at any time.

## Languages

The interface ships in **English, Spanish, German and Dutch** — switch anytime via the footer; your choice is remembered.

## Mobile & touch

Smorkinkboard works on phones and tablets: horizontal drags rotate the wheel, vertical swipes scroll the page, a long press opens the details overlay, and zooming uses the browser's native pinch zoom. Light and dark mode follow your OS preference automatically.

## Running the project

```bash
npm install        # install dependencies
npm start          # dev server at http://localhost:3000/Smorkinkboard/
npm test           # run the test suite (Vitest)
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build locally
npm run lint       # lint the repo (ESLint flat config)
```

## Contributing

We're open for pull requests — best discuss your suggestion first by opening an issue. See [AGENTS.md](AGENTS.md) for the project structure and conventions (used by both humans and AI coding agents).

## License

MIT — see [LICENSE.md](LICENSE.md).

If you want to use this project commercially, please get in contact with [Pepijn, the original creator](https://github.com/duizendnegen) and me first. Thank you.
