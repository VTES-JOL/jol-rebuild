# Referendums — Implementation Status

Documents the referendum engine: political actions, vote sources, Prisci ballots, blood hunt referendums, and Edge vote integration in JOL.

See [VTES Rules — Referendums](../rules/referendums.md) for the tabletop rules this implements.

For declaring a political action and the action lifecycle, see [Actions](./actions.md). For blood hunt triggered by diablerie, see [Combat § Diablerie](./combat.md#diablerie).

---

## Current Status

The entire referendum engine is absent. Political actions can be declared as `ActionType.POLITICAL`, but `ResolveAction` does not initiate polling. Blood hunt referendums (mandatory after diablerie) are not triggered. The Edge token is tracked by `GainEdge` but is not integrated with referendum vote-casting.

---

## Missing Mechanics

| Mechanic                                                                                                                                                           | Rulebook reference              |
|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------|
| Declaring a referendum (political action or blood hunt)                                                                                                            | Minion Phase — Political Action |
| "Before votes and ballots are cast" sequencing sub-window (ABC priority)                                                                                           | Politics & Referendums          |
| Vote sources: titled vampires — Primogen/Bishop = 1, Prince/Archbishop/Baron = 2, Justicar/Cardinal = 3, Inner Circle/Regent = 4                                   | Vampire Sects                   |
| Vote sources: acting player's political action card grants 1 vote to the acting player's controller                                                                | Politics & Referendums          |
| Vote sources: any Methuselah burns one political action card from hand for 1 vote (once per referendum per Methuselah)                                             | Politics & Referendums          |
| Vote sources: Edge holder burns the Edge for 1 vote                                                                                                                | The Edge                        |
| Vote sources: in-play card effects usable during the current referendum                                                                                            | Card text                       |
| Priscus block — 3 collective votes decided by a Prisci-only sub-referendum using one ballot per ready Priscus                                                      | Sabbat Titles                   |
| Pass / fail resolution (votes for > votes against = pass; tied or more against = fail)                                                                             | Politics & Referendums          |
| Torpored vampires cannot cast votes                                                                                                                                | Referendums                     |
| Automatic blood hunt referendum after any diablerie                                                                                                                | Diablerie                       |
| Blood hunt rules: initiated by victim's controller; not an action; cannot be blocked; action modifiers and reactions not legal unless card text explicitly permits | Diablerie                       |

---

## Proposed Commands

| Command             | Fields                                                                                                             | Description                                                                        |
|---------------------|--------------------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------|
| `CallReferendum`    | `type` (`BLOOD_HUNT` \| `POLITICAL`), `targetRef?` (diablerist for blood hunt), `cardRef?` (political action card) | Declare a referendum; locks the acting minion for political actions                |
| `CastVote`          | `playerName`, `forVotes`, `againstVotes`                                                                           | Commit a player's votes for or against the open referendum; irreversible once cast |
| `ResolveReferendum` | —                                                                                                                  | Tally votes; apply pass/fail effect; close referendum                              |
| `BurnEdgeForVote`   | `playerName`                                                                                                       | Burn the Edge to contribute 1 vote (transfers Edge away; increments vote total)    |

---

## Proposed State

A `ReferendumState` object on `GameData`:

| Field          | Type                      | Description                                       |
|----------------|---------------------------|---------------------------------------------------|
| `type`         | `BLOOD_HUNT \| POLITICAL` | Referendum type                                   |
| `callerName`   | String                    | Methuselah who called the referendum              |
| `targetRef`    | `CardRef?`                | Diablerist ref for blood hunt; null for political |
| `votesFor`     | int                       | Total votes cast in favour                        |
| `votesAgainst` | int                       | Total votes cast against                          |
| `playerVotes`  | Map\<String, int[]\>      | Per-player [for, against] tally                   |
| `status`       | `OPEN \| RESOLVED`        | Current referendum status                         |