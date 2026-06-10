# Referendums — Implementation

Documents the referendum engine: political actions, vote sources, Prisci ballots, blood hunt referendums, and Edge vote integration in JOL.

See [VTES Rules — Referendums](../rules/referendums.md) for the tabletop rules this implements.

For declaring a political action and the action lifecycle, see [Actions](./actions.md). For blood hunt triggered by diablerie, see [Combat § Diablerie](./combat.md#diablerie). For the cross-workflow order of referendum and blood hunt windows, see [Timing Windows](./timing-windows.md).

---

## Current Status

The entire referendum engine is absent. Political actions can be declared as `ActionType.POLITICAL` and `ResolveAction` is called, but no polling is opened. Blood hunt referendums (mandatory after diablerie) are not triggered. The Edge token is tracked by `GainEdge` but is not integrated with vote-casting.

---

## ReferendumState

A new `ReferendumState` object is added to `GameData`. It is set when a referendum opens and cleared after `ClosePolling` resolves.

| Field              | Type                           | Description                                                                              |
|--------------------|--------------------------------|------------------------------------------------------------------------------------------|
| `terms`            | `String`                       | Human-readable description of what the referendum decides                                |
| `actingPlayerName` | `String`                       | Methuselah whose action or diablerie triggered the referendum; anchor for impulse order  |
| `isBloodHunt`      | `boolean`                      | If true: fixed terms, no action modifiers or reactions legal, target is the diablerist   |
| `targetRef`        | `CardRef?`                     | For blood hunt: the diablerist. For political actions with a specific target: that card  |
| `baseVotesFor`     | `int`                          | Votes cast in favour excluding the current Prisci block contribution                     |
| `baseVotesAgainst` | `int`                          | Votes cast against excluding the current Prisci block contribution                       |
| `prisciVotesFor`   | `int`                          | Current Prisci block contribution in favour, either 0 or 3                               |
| `prisciVotesAgainst` | `int`                        | Current Prisci block contribution against, either 0 or 3                                 |
| `votesByPlayer`    | `Map<String, int[]>`           | Per-player `[for, against]` array for display/audit                                      |
| `votesByCardId`    | `Map<String, int[]>`           | Per-titled-vampire `[for, against]` ordinary votes already cast this referendum          |
| `prisciBallots`    | `Map<String, Boolean>`         | Card ID → for/against; Priscus-only sub-referendum ballots                               |
| `cardBurnedByPlayer` | `Set<String>`                | Players who have already burned one political action card this referendum                |
| `pollingOpen`      | `boolean`                      | False during "before votes" window; true once `OpenPolling` is called                   |

---

## Referendum Procedure

### Step 1 — Choose Terms

Triggered by `ResolveAction` for `ActionType.POLITICAL`:
1. Acting player chooses terms via the `referendumTerms: String?` field on `DeclareAction` (free-text description of what the referendum decides, e.g. "Make Anarch Free State"). The server stores this in `ReferendumState.terms`. For the initial implementation, effect application after `ClosePolling` is CUSTOM (handled manually by players); automated referendum-effect dispatch is a later feature.
2. `ReferendumState` is opened on `GameData` with `pollingOpen = false`.
3. A sequencing window opens for "before votes and ballots are cast" effects (ABC priority). When the window closes, `OpenPolling` becomes available.

Blood hunt referendums skip term choice — terms are fixed (`targetRef` = diablerist) and `ReferendumState` is opened automatically by the diablerie resolution.

### Step 2 — Polling

`OpenPolling` transitions `pollingOpen = true`. From this point:
- Any Methuselah may `CastVotes` (titled vampires under their control).
- Any Methuselah may `BurnCardForVote` (one political action card from hand, once per Methuselah per referendum).
- Any Methuselah may `BurnEdgeForVote` (if they hold the Edge).
- Priscus controllers may `CastPrisciBallot` — see Prisci Sub-Referendum below.
- Votes are irreversible once cast.
- Cards "only usable during political action" are legal only during this polling.

Blood hunt referendums: action modifiers and reactions not legal; only vote sources (titles, Edge, one PA card per Methuselah, in-play card effects explicitly usable during blood hunt) are accepted.

### Step 3 — Resolution

`ClosePolling` tallies `votesFor = baseVotesFor + prisciVotesFor` and `votesAgainst = baseVotesAgainst + prisciVotesAgainst`:
- If `votesFor > votesAgainst` -> referendum **passes**; apply effects.
- Tied or `votesAgainst >= votesFor` -> referendum **fails**; no effect.

Set `PendingActionState.referendumSuccessful` accordingly for political actions. Cards that depend on the referendum outcome use the referendum after-resolution hook before the enclosing action enters `ACTION_AFTER_RESOLUTION`. Clear `ReferendumState` from `GameData` only after those hooks complete.

---

## Commands

| Command            | Fields                                            | Description                                                                                     |
|--------------------|---------------------------------------------------|-------------------------------------------------------------------------------------------------|
| `OpenPolling`      | —                                                 | Transition from "before votes" window to active polling; sets `pollingOpen = true`              |
| `CastVotes`        | `playerName`, `cardRef`, `amount`, `forOrAgainst` | Cast votes from a titled ready vampire; validates vote amount against title and readiness       |
| `BurnCardForVote`  | `playerName`, `cardRef`, `forOrAgainst`           | Burn one political action card from hand for 1 vote; once per player per referendum             |
| `BurnEdgeForVote`  | `playerName`, `forOrAgainst`                      | Burn the Edge for 1 vote; clears the Edge holder                                                |
| `CastPrisciBallot` | `cardRef`, `forOrAgainst`                         | Cast one ballot for a ready Priscus in the sub-referendum; recomputes Prisci block contribution |
| `ClosePolling`     | —                                                 | Tally and resolve the referendum; clear `ReferendumState`                                       |

---

## New Effect

`ReferendumStateChangedEffect` carries the updated `ReferendumState` (or null when cleared). Applied by `GameEffectApplicator` like all other effects.

---

## Vote Source Calculation

At `CastVotes` validation, the server computes how many votes the named `cardRef` may cast:

| Title                            | Votes |
|----------------------------------|-------|
| Primogen / Bishop                | 1     |
| Prince / Archbishop / Baron      | 2     |
| Justicar / Cardinal              | 3     |
| Inner Circle / Regent            | 4     |

Validation rules:
- Card must be in the READY region (torpored vampires cannot vote).
- Card must be controlled by `playerName`.
- Card must have a `title` field matching one of the titles above.
- `amount` must be positive.
- The card's already-cast total in `votesByCardId` plus `amount` must not exceed the title's vote value.

A Methuselah may cast all of one vampire's votes as a single `CastVotes` call. They may also cast partial votes if they choose (e.g. one vote for and one vote against from a Prince, though unusual).

When `CastVotes` succeeds, add the chosen amount to `baseVotesFor` or `baseVotesAgainst`, update `votesByPlayer`, and update the card's `[for, against]` entry in `votesByCardId`. This allows split votes while preventing any titled vampire from casting more than its title value.

The political action card itself grants the **acting player's controller** 1 vote (included automatically when `CallReferendum` / `ResolveAction(POLITICAL)` opens the referendum).

---

## Prisci Sub-Referendum

The Priscus title is a collective Sabbat title. Each ready Priscus casts one ballot in a Priscus-only sub-referendum; the result determines how the Prisci block contributes to the main referendum.

`CastPrisciBallot` adds the Priscus's card ID -> `true`/`false` to `prisciBallots`. After each ballot, the server recomputes the Prisci block contribution into `prisciVotesFor` / `prisciVotesAgainst`; it does not mutate `baseVotesFor` or `baseVotesAgainst`.

| Sub-referendum result | Main referendum contribution |
|-----------------------|------------------------------|
| Majority for          | +3 votes for                 |
| Majority against      | +3 votes against             |
| Tied                  | 0 votes                      |

**Majority definition:** strictly more than half of *ballots cast so far* (not of all ready Priscus). Priscus who have not voted are not counted — their absence is neither FOR nor AGAINST. If 2 of 3 ready Priscus have voted and 1 is FOR and 1 is AGAINST (a tie), the contribution is 0. Recompute by setting both Prisci contribution fields back to 0, then setting exactly one of them to 3 only when the cast ballots have a strict majority. The final contribution is included when `ClosePolling` totals base votes plus Prisci votes.

---

## Blood Hunt Auto-Trigger

After the diablerie sequence completes (step 6 — Blood Hunt Trigger — in [Combat § Diablerie](./combat.md#diablerie)), the diablerie workflow opens a `ReferendumState` with:

- `isBloodHunt = true`
- `targetRef` = the diablerist
- `actingPlayerName` = the victim's controller (anchor for impulse order)
- `terms` = "Blood hunt against [diablerist name]"

If the blood hunt passes: `CardMovedEffect(diablerist, ASH_HEAP)` — the diablerist is burned.

Before applying that burn, open `BLOOD_HUNT_WOULD_BURN_DIABLERIST`. This is a blood-hunt result hook, not a combat burn hook; it applies even when the diablerie was caused by combat.

The blood hunt referendum must fully resolve (reach `ClosePolling` and complete `BLOOD_HUNT_WOULD_BURN_DIABLERIST`, if applicable) before the AFTER_RESOLUTION sequencing window of the triggering action opens. The overall lifecycle is: diablerie steps 1–5 → blood hunt referendum (steps 1–3 per above) → blood-hunt result hooks → enclosing workflow return.

---

## Edge During Referendums

`BurnEdgeForVote` is available to the current Edge holder during polling. It:
1. Clears the Edge holder (`EdgeChangedEffect(null)`).
2. Adds 1 vote for or against per the player's choice.

The Edge moves to the acting player via `GainEdge` at the end of a successful bleed action (standard rule); this is separate from referendum Edge burning.
