# Smorkinkboard
## General Idea
The app should act as a fun way of manufactoring consent similar to the relationship anarchy smorgasboard (https://github.com/duizendnegen/sunburst-smorgasbord/). It should be able to be interacted with easily and showing what kind of practices are welcome for the people using it. The scale should contain practices divided by category (e.g. "Physical", "Psychological", "Social", ...) and then go down into broader play areas (e.g. "Bondage", "Impact Play", "Power Exchange", "Toys", "Edge Play" ...) down to specific practices (e.g. "Hand Spanking", "E-Stim", "Living Buffet", ...). On clicking a field, the field itself (and the parents) should change their color as it's already setup in the linked Smorgasboard (see "Statuses" for more details). On right-clicking any field, an overlay should be opened to be able to add details to any practice. If there is context added, the title of said field is to be appended with an asterisk "*" to show this.
The practices fixtures are to be pre-defined but should be able to be edited in the UI as well. For that, a markdown format is to be used where the categories must follow the header hierarchies (see "Export/Import for more details).
Unchanged are the possibilities to change, export, import and reset as well as downloading as an image. Additionally, people names should be able to be added which then are shown in th title as well like "Smorkinkboard (for Person A, Person B and Person C)". Default is one person, but more can be added or removed as needed.

## Statuses
The scale statuses are five-fold to express the dimension of the mentioned kink. Each kink can range from 0 to 4 with the following meaning and color:
0 - "Not Defined" (near-black, #111) - Default state, no consent has been created about this yet.
1 - "Hard Limit" (solarized red) – A practice which must nut be part of the planned session or dynamic, hard limit.
2 - "Soft Limit" (solarized yellow) - A practice which can be done, but is not necessarily giving the participants something back. It might be applicable in some kind of "service" dimension but is generally to be avoided.  
3 - "Can" (pale solarized green) - A practice which is okay for the people attending but not their favourite.
4 - "Desired" (light solarized green) - A practice giving pleasure to the people in the dynamic. It's giving pleasure and is very welcome to be part of a scene or dynamic.

As in the original, statuses are to be inherited bottom up as well as top down, depending on the click-interactions.

## Export/Import
Different to the original Smorgasboard, the export and import formats are to be human-readable and must be converted on export as well as import into the internal data format. The data exchange format for the Smorkinkboard is to be based upon markdown. Headers mark hierarchies and context is given as text below the headers. There must always only be one h1 (#), containing only the title of the page.
Top categories are h2 (##), below these sub-categories with h3 (###) and below these practices with h4 (####).
Next to each header in brackets "()" is the status of said item in written form as defined in "Statuses". Here's an example of how this file could look like this:

```
# Smorkinkboard (for Person A, Person B and Person C)

## Physical (Desired)
Favourite of Person B

### Impact (Desired)

### Bondage (Can)

### Blood (Soft Limit)

#### Cutting (Hard Limit)
Can trigger crash for Person A.

#### Needling (Can)
Liked by Person B.

## Psychological (Not Defined)

### Degradation (Not Defined) 

## Social (Desired)

### Public (Desired)
```