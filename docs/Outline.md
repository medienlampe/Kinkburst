# Kinkburst
## General Idea
The app should act as a fun way of manufactoring consent similar to the relationship anarchy smorgasboard (https://github.com/duizendnegen/sunburst-smorgasbord/). It should be able to be interacted with easily and showing what kind of practices are welcome for the people using it. The scale should contain practices divided by category (e.g. "Physical", "Psychological", "Social", ...) and then go down into broader play areas (e.g. "Bondage", "Impact Play", "Power Exchange", "Toys", "Edge Play" ...) down to specific practices (e.g. "Hand Spanking", "E-Stim", "Living Buffet", ...). On clicking a field, the field itself (and the parents) should change their color as it's already setup in the linked Smorgasboard (see "Statuses" for more details). On right-clicking (or long-pressing on touch) any field, an overlay should be opened to set the status directly and to add details to any practice. If there is context added, the title of said field is to be appended with an asterisk "*" to show this.
The practices fixtures are to be pre-defined but should be able to be edited in the UI as well. For that, a markdown format is to be used where the categories must follow the header hierarchies (see "Export/Import for more details).
Unchanged are the possibilities to change, export, import and reset as well as downloading as an image. Additionally, people names should be able to be added which then are shown in th title as well like "Kinkburst (for Person A, Person B and Person C)". Default is one person, but more can be added or removed as needed.

## Statuses
The scale statuses are five-fold to express the dimension of the mentioned kink. Each kink can range from 0 to 4 with the following meaning and color:
0 - "Not Defined" (near-black, #111) - Default state, no consent has been created about this yet.
1 - "Hard Limit" (muted brick red, #a64a3f) – A practice which must nut be part of the planned session or dynamic, hard limit.
2 - "Soft Limit" (solarized yellow) - A practice which can be done, but is not necessarily giving the participants something back. It might be applicable in some kind of "service" dimension but is generally to be avoided.  
3 - "Okay" (vibrant turquoise, #00bfa5) - A practice which is okay for the people attending but not their favourite.
4 - "Desired" (vibrant lime green, #a3d147) - A practice giving pleasure to the people in the dynamic. It's giving pleasure and is very welcome to be part of a scene or dynamic.

As in the original, statuses are to be inherited bottom up as well as top down, depending on the click-interactions.
Holding Shift while clicking cycles the status upwards (0 → 1 → … → 4) instead of downwards. On touch devices (no Shift key), the right-click/long-press overlay offers all five statuses as tappable swatches so any status can be set directly — this is the touch equivalent of the Shift modifier.
Setting a field to Hard Limit must not paint its whole subtree red: it asks for confirmation first (only if at least one of its children already has a defined status) and resets all of its children back to Not Defined, so only the clicked field itself is marked as hard limit.

## Export/Import
Different to the original Smorgasboard, the export and import formats are to be human-readable and must be converted on export as well as import into the internal data format. The data exchange format for the Kinkburst is to be based upon markdown. The first two levels of the hierarchy are headings (## and ###), deeper levels are unordered lists indented two spaces per level, and context is given as text below the items. There must always only be one h1 (#), containing only the title of the page.
Top categories are h2 (##), below these sub-categories with h3 (###) and below these practices as list items (-).
Next to each item in brackets "()" is the status of said item in written form as defined in "Statuses". Here's an example of how this file could look like this:

```
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