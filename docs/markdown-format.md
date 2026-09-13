# Smorkinkboard Markdown Format

The data exchange format for the Smorkinkboard is human-readable markdown. It is converted to and from the internal data format on export and import (unlike the original smorgasbord, which exchanges JSON directly).

## Rules

1. There must always be **exactly one `h1` (`#`)**, containing only the title of the board. The title includes the people it was created for:
   `Smorkinkboard (for Person A, Person B and Person C)`.
   With a single person, the parenthetical may be omitted.
2. **Top categories** are `h2` (`##`) — e.g. `Physical`, `Psychological`, `Social`.
3. **Sub-categories / play areas** are `h3` (`###`) — e.g. `Bondage`, `Impact Play`, `Power Exchange`.
4. **Practices** are `h4` (`####`) — e.g. `Hand Spanking`, `E-Stim`.
5. Next to each header, in brackets `()`, is the status of that item, written out as defined in [the statuses section](../README.md#statuses):
   `(Not Defined)`, `(Hard Limit)`, `(Soft Limit)`, `(Can)`, `(Should)`, `(Must)`.
6. Free text below a header (up to the next header) is stored as **context** for that item. In the UI, items with context get an asterisk (`*`) appended to their title.
7. A play area without practices may be listed as `h3` without any `h4` children.

## Example

```markdown
# Smorkinkboard (for Person A, Person B and Person C)

## Physical (Must)
Favourite of Person B

### Impact (Must)

### Bondage (Can)

### Blood (Soft Limit)

#### Cutting (Hard Limit)
Can trigger crash for Person A.

#### Needling (Can)
Liked by Person B.

## Psychological (Not Defined)

### Degradation (Not Defined)

## Social (Should)

### Public (Should)
```

## Parsing notes

- The people list is parsed from the `h1` title: everything between `(for ` and `)`, split on `,` and ` and `.
- Status names are matched case-insensitively; any header without a recognized status defaults to `Not Defined` (0).
- Blank lines are ignored. Text blocks are trimmed of leading/trailing blank lines.
- Nesting deeper than `h4` is preserved on round-trip: any header attaches to the most recent shallower header. Export caps at `h6`, the deepest markdown heading level.
- Importing replaces the current board state entirely (same semantics as the original's JSON import).
