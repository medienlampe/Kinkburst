# Smorkinkboard

A fun way of manufacturing consent.

Smorkinkboard is a kink-flavoured take on the [Relationship Anarchy Smorgasbord](https://github.com/duizendnegen/sunburst-smorgasbord/), created by [Pepijn Schoen](https://github.com/duizendnegen) (thank you for creating the original project and allowing me to do this!). 

It shows which practices are welcome for the people in your dynamic, organized as a tree of
arbitrary depth — top-level **categories** (e.g. `Physical`, `Psychological`, `Social`), their
**play areas** (e.g. `Bondage`, `Impact Play`, `Toys`), and nested **practices**
(e.g. `Whip`, `Living Buffet`). The default dataset nests five levels deep; you can add or
remove items at any depth in the UI.

Click a field to cycle its status, right-click a field to add details (on touch devices: long-press the field). Fields with added context get an asterisk (`*`) appended to their title. Statuses are inherited top-down and bottom-up, just like in the original smorgasbord.

## Statuses

Each practice ranges from 0 to 5:

| Value | Status        | Color       | Meaning                                                                                                   |
| ----- | ------------- | ----------- | --------------------------------------------------------------------------------------------------------- |
| 0     | Not Defined   | black       | Default state — no consent has been created about this yet.                                                |
| 1     | Hard Limit    | red         | Must not be part of the planned session or dynamic.                                                        |
| 2     | Soft Limit    | yellow      | Can be done, but generally to be avoided; may apply in a "service" dimension.                              |
| 3     | Can           | light green | Okay for the people attending, but not their favourite.                                                    |
| 4     | Should        | lime green  | Gives pleasure and is very welcome to be part of a scene or dynamic.                                       |
| 5     | Must          | green       | A favourite practice which should always be part of the session or dynamic.                                |

## People

The title reflects who the board is for, e.g. `Smorkinkboard (for Person A, Person B and Person C)`. One person by default; more can be added or removed as needed.

## Export / Import

Different from the original smorgasbord, Smorkinkboard exchanges data in a **human-readable markdown format** instead of JSON. Headers mark the hierarchy — one heading level per tree level (`#` title, then one level deeper per branch, up to `######`) — the status in brackets marks the value, and free text below a header is stored as context:

```markdown
# Smorkinkboard (for Person A, Person B and Person C)

## Physical (Must)
Favourite of Person B

### Impact (Must)

### Bondage (Can)

#### Cutting (Hard Limit)
Can trigger crash for Person A.
```

The full format specification lives in [docs/markdown-format.md](docs/markdown-format.md). The practices are pre-defined as fixtures but can also be edited in the UI.

Additionally, you can change, export, import and reset the board, and download it as an image — all carried over from the original.

## Running the project

Install requirements using `npm install`
Run `npm start` to build the project locally and view it in the browser at [http://localhost:3000](http://localhost:3000).
Tests can be run using `npm test`.

## Contributing

We're open for pull requests — best discuss your suggestion first by opening an issue.
See [AGENTS.md](AGENTS.md) for the project structure and conventions (used by both humans and AI coding agents).

## Commercial Use
If you want to use this project commercially, please get in contact with [Pepijn, the original creator](https://github.com/duizendnegen) and me first. Thank you.