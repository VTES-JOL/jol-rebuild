# Card Text Parsing — Implementation

Documents how JOL parses raw VTES library card text into structured declaration modes.

---

## Purpose

Each library card in `vteslib.csv` carries a free-text `Card Text` field. For most cards this text contains multiple *declaration modes* — distinct ways the card can be played depending on which discipline level the controller declares. Before the engine can route card effects, it must know what effect a given declaration produces.

The parsing script at `scripts/split_card_modes.py` reads `vteslib.csv` and produces two output files:

| File | Description |
|---|---|
| `csv/modes/vteslib_modes.csv` | One row per declaration mode per card (~3,500 rows) |
| `csv/modes/vteslib_index.csv` | One row per original card with mode count and mode list |

---

## Card Text Structure

Card text uses **newlines as block separators**. Each line is a distinct mechanical clause. Lines come in two forms:

### Plain lines
No leading bracket. Used for preamble conditions, requirement statements, and no-cost effects.
```
Requires an Anarch.
Only usable during a bleed action.
Weapon: gun.
```

### Mode lines
One or more leading bracket tokens followed by an effect. These define a playable declaration.
```
[ani] Strike: 1R damage, with 1 optional maneuver.
[ANI] As above, with 1 optional press.
[aus] [REACTION] Reduce a bleed against you by 1.
[dom][pre] [COMBAT][REACTION] Cancel a frenzy card as it is played.
```

---

## Bracket Token Classification

Each bracket in a mode-line header is classified left to right. Parsing stops when a bracket does not fit a known category; the remainder of the line becomes the effect text.

| Bracket content | Rule | Example |
|---|---|---|
| In `TYPE_QUALIFIERS` set | → **type code** (goes to `DeclaredType`) | `[REACTION]`, `[COMBAT]`, `[ACTION MODIFIER]`, `[ACTION]`, `[REFLEX]` |
| Matches `^[a-zA-Z]{2,6}$` and not a type qualifier | → **discipline code** | `[ani]`, `[AUS]`, `[FLIGHT]`, `[pot]` |
| Contains a digit or space, or a type code appears after a disc code | → **stop** — rest of line is effect text | `[1 CONVICTION]`, `[POLITICAL ACTION]` |

Discipline codes use **case to signal level**: all-lowercase = inferior, all-uppercase = superior, mixed case = mixed level (rare, e.g. `[FOR][obf]`).

Multi-discipline requirements are expressed by adjacent brackets with no space: `[pot][pre]` requires both disciplines simultaneously.

Alternate discipline requirements are expressed with `or` between bracket headers. These produce one declaration mode per alternative, all with the same effect text:
```
[pot] or [pre] +1 bleed.
→ one `[pot]` mode and one `[pre]` mode
```

---

## Preamble and Postamble

Lines **before** the first mode line are **preamble** — they apply to all modes and are repeated verbatim in every mode's `CardText` output.

Lines **after** the last mode line are **postamble** and are likewise appended to every mode's `CardText` (mainly seen on Power/Imbued cards).

Cards with **no mode lines at all** produce a single mode carrying the full card text unchanged.

---

## "As Above" Resolution

Many superior-level effects are defined relative to their inferior counterpart:

```
[ani] Strike: 1R damage, with 1 optional maneuver.
[ANI] As above, with 1 optional press.
```

The parser expands these references by substituting the referenced effect text. Resolution is sequential — each mode's resolved text is stored by its discipline key so chains work across multiple levels:

```
[tha]  Put this card on a slave Gargoyle …
[vis]  As [tha] above, but put this card on this acting Gargoyle.
[VIS]  As [vis] above, and the Gargoyle … may prevent 1 damage each combat.
```

**Syntax variants:**

| Text | Reference target |
|---|---|
| `As above` | Matching inferior discipline when available; otherwise the immediately preceding mode |
| `As [xxx] above` | The most recently resolved mode with discipline key `xxx` |
| `As [xxx][yyy] above` | The most recently resolved mode with discipline key `xxx+yyy` |

Substitution strips the trailing period from the referenced text before appending the suffix:
```
"Strike: 1R damage, with 1 optional maneuver." + ", with 1 optional press."
→ "Strike: 1R damage, with 1 optional maneuver, with 1 optional press."
```

For alternate discipline syntax, a plain `As above` on a superior-level mode resolves to the matching inferior discipline when that inferior mode exists. This keeps `[POT] or [PRE] As above …` tied to `[pot]` and `[pre]` respectively instead of whichever alternative happened to be parsed immediately before it.

---

## DeclaredType Assignment

### Single-type cards
`DeclaredType` = `OriginalType` for every mode. Never ambiguous.

### Multi-type cards with explicit type qualifiers
The type qualifier bracket(s) on each mode line determine `DeclaredType`:
```
[aus] [REACTION] …     → DeclaredType = "Reaction"
[AUS] [ACTION MODIFIER] … → DeclaredType = "Action Modifier"
[dom][pre] [COMBAT][REACTION] … → DeclaredType = "Combat/Reaction"
```

### Multi-type cards without type qualifiers (`Auto = no`)
When a multi-type card's mode line carries no type qualifier, the engine cannot determine which type the mode serves. The row is **duplicated once per component type**, all duplicates marked `Auto = no`:

```
Absolute Tyranny (Action Modifier/Reaction)
[pot][pre] This vampire gets +3 votes.

→  102308:MODIFIER:pot+pre  DeclaredType="Action Modifier"  Auto=no
→  102308:REACTION:pot+pre  DeclaredType="Reaction"         Auto=no
```

These cards require manual review to assign the correct `DeclaredType`.

---

## ModeId Format

```
{CardId}:{TYPE_ENUM}
{CardId}:{TYPE_ENUM}:{discipline}
```

`TYPE_ENUM` is the `CardType` Java enum **object name** (not the label):

| DeclaredType label | TYPE_ENUM |
|---|---|
| Action | `ACTION` |
| Action Modifier | `MODIFIER` |
| Reaction | `REACTION` |
| Combat | `COMBAT` |
| Political Action | `POLITICAL` |
| Equipment | `EQUIPMENT` |
| Master | `MASTER` |
| Ally | `ALLY` |
| Retainer | `RETAINER` |
| Event | `EVENT` |
| Conviction | `CONVICTION` |
| Power | `POWER` |

`discipline` is the discipline cost string — discipline codes joined with `+`, case preserved for level: `ani`, `ANI`, `ani+for`, `POT+PRE`. Omitted entirely when there is no discipline cost.

Collisions (same card, same type, same discipline) are disambiguated with a numeric suffix: `:1`, `:2`.

**Examples:**

| Card | ModeId |
|---|---|
| Abbot (Action, no discipline) | `100006:ACTION` |
| Aid from Bats inferior | `100029:COMBAT:ani` |
| Aid from Bats superior | `100029:COMBAT:ANI` |
| Ancestor's Insight (Reaction mode) | `100062:REACTION:aus` |
| Ancestor's Insight (Action Modifier mode) | `100062:MODIFIER:AUS` |
| Absolute Tyranny (ambiguous inferior) | `102308:MODIFIER:pot+pre`, `102308:REACTION:pot+pre` |
| Angel's Gift (two type-only COMBAT modes) | `102349:COMBAT:1`, `102349:COMBAT:2` |

---

## Output Columns

### `vteslib_modes.csv`

| Column | Description |
|---|---|
| `CardId` | Original card Id from `vteslib.csv` |
| `ModeId` | Unique mode identifier (see format above) |
| `Name` | Card name |
| `OriginalType` | Unmodified `Type` column from the source CSV |
| `DeclaredType` | The card type for this specific mode |
| `DisciplineCost` | Discipline code(s) joined with `+`; blank if none |
| `Level` | `inferior` / `superior` / `mixed` / `none` |
| `CardText` | Preamble + resolved effect text for this mode (curly braces stripped) |
| `Auto` | `yes` if parsed automatically; `no` if type is ambiguous |

### `vteslib_index.csv`

| Column | Description |
|---|---|
| `CardId` | Original card Id |
| `Name` | Card name |
| `OriginalType` | Unmodified `Type` column |
| `ModeCount` | Number of modes generated (including Auto=no duplicates) |
| `ModeIds` | Pipe-separated list of all `ModeId` values for this card |
| `Auto` | `yes` if all modes are `Auto=yes` |

---

## Curly Brace Notation

The source CSV uses `{…}` to mark errata text — corrections to the printed card that differ between superior and inferior levels or reflect rules updates. The parser strips brace markers and keeps the inner text:
```
{Only usable during a bleed action. +1 bleed (limited).}
→  Only usable during a bleed action. +1 bleed (limited).
```

---

## Known Limitations

- **32 cards** with multi-type `OriginalType` and no explicit type qualifiers produce `Auto=no` duplicate rows. These need manual correction before being used for mechanics enforcement.
- `[REFLEX]` maps to `DeclaredType = "Reflex"` with no corresponding `CardType` enum entry. Reflex cards should be added to `CardType` when combat reflex mechanics are implemented.
- The script processes `vteslib.csv` only. Crypt card text has a different structure (faction-header format) and is not covered here.

---

## Regenerating the Output

```bash
python3 scripts/split_card_modes.py
```

Re-run whenever `vteslib.csv` is updated. The script is idempotent and overwrites `csv/modes/` on each run.
