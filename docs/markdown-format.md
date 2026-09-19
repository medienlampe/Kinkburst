# Kinkburst Markdown Format

The data exchange format for the Kinkburst is human-readable markdown. It is converted to and from the internal data format on export and import (unlike the original smorgasbord, which exchanges JSON directly).

## Rules

1. There must always be **exactly one `h1` (`#`)**, containing only the title of the board. The title includes the people it was created for:
   `Kinkburst (for Person A, Person B and Person C)`.
   With a single person, the parenthetical may be omitted. 
   The exporter appends the language of the document as a suffix, e.g. 
   `# Kinkburst (für Person A und Person B) - Deutsch` — the importer strips it again.
2. The tree is encoded with headings and unordered lists:
   - the first level under the title is `h2` (`##`) — e.g. top categories like `Physical`, `Psychological`, `Social`;
   - the second level is `h3` (`###`) — e.g. play areas like `Impact Play`, `Bondage`;
   - every further level of nesting is an **unordered list item** `- Name (STATE)`, indented two spaces per level below the `h3`. A node without children is simply a line with no more deeply indented lines below it.
   Unlike headings, lists have no depth cap, so any tree depth round-trips.
3. Next to each name, in brackets `()`, is the status of that item, written out as defined in [the statuses section](../README.md#statuses).
   The exporter writes the label in the **active UI language**; the importer accepts the labels of
   **all supported languages** (case-insensitive):

   | Value | English      | German         | Spanish          | Dutch            |
   | ----- | ------------ | -------------- | ---------------- | ---------------- |
   | 0     | Not Defined  | Unbesprochen   | No definido      | Niet besproken   |
   | 1     | Hard Limit   | Hard Limit     | Hard Limit       | Hard Limit       |
   | 2     | Soft Limit   | Soft Limit     | Soft Limit       | Soft Limit       |
   | 3     | Okay         | Okay           | Está bien        | Oké              |
   | 4     | Desired      | Gewünscht      | Deseable         | Gewenst          |
 
   The English labels are the canonical terms; the others are read from the locale files (`public/locales`).
   Item names follow the same rule for default-dataset nodes (which carry translation keys);
   user-added and imported items export their stored name verbatim.
   An unrecognized or missing status defaults to `Not Defined` (0).
4. A node's status never exceeds its parent's (in the app, setting a node to `Desired` sets all of
   its ancestors to `Desired` as well). On import, each node's status is therefore lifted up to its
   ancestors — e.g. importing `## Physical (Okay)` with `- Whip (Hard Limit)` yields `Physical` as
   `Hard Limit`.
5. Free text after an item (up to the next heading or list item) is stored as **context** for that
   item, at any depth. Notes are written verbatim, without indentation. In the UI, items with
   context get an asterisk (`*`) appended to their title.

## Example

```markdown
# Kinkburst (for Person A, Person B and Person C)

## Physical (Desired)
Favourite of Person B

### Impact (Desired)

### Bondage (Okay)

### Blood (Soft Limit)
- Cutting (Hard Limit)
Can trigger crash for Person A.
- Needling (Soft Limit)
Liked by Person B.

## Psychological (Not Defined)

### Degradation (Not Defined)

## Social (Desired)

### Public (Desired)
```

## Parsing notes

- The people list is parsed from the `h1` title: everything between the localized preposition
  (`for`, `für`, `para`, `voor`) and `)`, split on `,` and the localized conjunction (`and`, `und`, `y`, `en`).
- Status labels are matched case-insensitively in every supported language; any item without a
  recognized status defaults to `Not Defined` (0).
- A trailing ` - <language>` suffix on the `h1` title (e.g. ` - Deutsch`) is stripped before parsing.
- Blank lines are ignored. Text blocks are trimmed of leading/trailing blank lines.
- Items attach by level: each item attaches to the most recent item at a shallower level — headings
  (`h2`, `h3`) and list items (two spaces of indentation = one level deeper) share one stack, so
  any depth round-trips.
- Importing replaces the current board state entirely (same semantics as the original's JSON import).
