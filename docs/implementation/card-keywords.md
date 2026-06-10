# Card Keywords — Implementation

Documents how JOL should parse, store, and enforce VTES card keywords, trait markers, and subtype markers.

See [VTES Rules — Card Keywords](../rules/card-keywords.md) for the rules meaning and classification of each keyword. This document is implementation-focused: where the data should live, which keywords need enforcement hooks, and which keywords should remain card-text metadata.

---

## Current Status

Keyword parsing is mostly absent. `CardData.infernal` exists, but most traits, equipment markers, combat markers, and card-family markers are not detected at build time.

`CardType.LOCATION` exists in the enum but is not a reliable representation of the `Location` keyword. Most location cards import as `MASTER`, and some equipment cards represent locations while in play.

---

## Parsing Strategy

Parse keywords from structured card text during `GameInitService.buildCard()` and store them separately from `CardType`.

Most keywords appear in the first line of `Card Text`, often before the first line break:

```text
Master. Trophy.
Unique location. Hunting ground.
Weapon, gun.
[abo] [REFLEX] Cancel a frenzy card...
```

Parsing should be case-insensitive and punctuation-tolerant. Preserve the raw card text as the final authority; parsed keywords are indexes for legality checks, UI display, and effect dispatch.

---

## Proposed Data Shape

Add keyword-oriented fields to `CardData` rather than a master-only subtype enum.

| Field                 | Type                      | Purpose                                                                                                                  |
|-----------------------|---------------------------|--------------------------------------------------------------------------------------------------------------------------|
| `keywords`            | `Set<CardKeyword>`        | General parsed markers such as `TROPHY`, `LOCATION`, `WEAPON`, `GUN`, `FRENZY`, `REFLEX`, `HUNTING_GROUND`, `ARCHETYPE`. |
| `traitKeywords`       | `Set<MinionTrait>`        | Minion traits such as `BLACK_HAND`, `BLOOD_CURSED`, `FLIGHT`, `INFERNAL`, `RED_LIST`, `SCARCE`, `STERILE`.               |
| `slaveClan`           | nullable `String`         | Clan named by `Slave: [clan]` / `[clan] slave`.                                                                          |
| `circle`              | nullable `String`         | Blood Brother circle parsed from crypt card text.                                                                        |
| `creatureDescriptors` | `Set<CreatureDescriptor>` | Ally/retainer descriptors such as `MORTAL`, `ANIMAL`, `GHOUL`, `WEREWOLF`, `WRAITH`, `ZOMBIE`, `MAGE`.                   |

Keep `CardType` for printed card type and play-phase routing. Do not use `CardType.LOCATION` as a substitute for the `LOCATION` keyword.

Subtype membership should be additive. Parsing `MELEE_WEAPON` or `GUN` should also add `WEAPON`, so effects that reference `weapon` match melee weapons and guns as well as generic weapons.

---

## Enforcement Hooks

Rule-bearing keywords need explicit enforcement in the relevant mechanics:

| Keyword area | Implementation hook | Rule being enforced |
|---|---|---|
| Infernal | Unlock-phase handling: pay 1 pool to unlock, otherwise remain locked. | See [Rules — Card Keywords § Infernal](../rules/card-keywords.md). |
| Scarce | `InfluenceCard` resolution: before moving a scarce vampire to READY, count the controller's ready vampires of the same clan. For each one already in READY, burn 3 pool from the controller. No pool cap — influence is allowed even if it costs significant pool. | **Rule:** "When a scarce vampire moves from uncontrolled to ready, its controller burns 3 pool for each ready vampire of the same clan they already control." |
| Slave | (1) `DeclareAction`: if actor has `slaveClan` set and the action is directed, the target must be the controller of a ready vampire of the named clan — reject otherwise. (2) Combat: if a slave's controller has a ready unlocked vampire of the named clan when the slave would enter combat, prompt the controller to substitute that vampire as the combatant; if they have no such vampire, normal combat proceeds. | **Rule:** "A slave cannot perform directed actions unless its controller controls a ready member of the specified clan. A slave can also be locked to replace combat involving a blocked vampire of the specified clan." |
| Sterile | `DeclareAction`: reject if actor is sterile and the action would put a crypt card into READY (e.g. actions with effect `CardMovedEffect(target, READY)` for a crypt card). Allied recruitment is not restricted. | **Rule:** "A sterile vampire cannot perform actions to put other vampires in play." |
| Blood Cursed | `DeclareAction` for `DIABLERISE`: reject if actor has `BLOOD_CURSED` trait. | See [Rules — Card Keywords § Blood Cursed](../rules/card-keywords.md). |
| Red List / Trophy | `CardData.redList = true` (field to add; set by keyword parsing). Any ready vampire may take a `RUSH` action against a marked Red List minion as a +1 stealth directed action costing 1 blood. Trophy award timing: resolved at step 5 of the diablerie sequence (before blood hunt) — see [Combat § Diablerie](./combat.md#diablerie). | **Rule:** "A Red List minion can be marked with a master phase action. A ready vampire may enter combat with a marked Red List minion as a +1 stealth directed action costing 1 blood." |
| Black Hand / Flight / Circle / descriptors | Requirement checks for cards and effects. | Reference markers only — no standalone mechanic beyond satisfying card requirements. |
| Weapon / melee weapon / gun / ammo / vehicle / electronic | Combat strike legality, equipment restrictions, and card effects that reference these markers. `MELEE_WEAPON` and `GUN` must also satisfy `WEAPON` references. | See [Rules — Card Keywords § Equipment Keywords](../rules/card-keywords.md). |
| Frenzy / Reflex / Aim / Grapple | Combat card legality, cancellation windows, and effects that reference these markers. | See [Rules — Card Keywords § Combat Keywords](../rules/card-keywords.md). |
| Location / Hunting ground / Haven / Investment / Path / Archetype / Government / Watchtower / Operation Antigen | Card-effect dispatch and UI/search metadata; enforce only rule text or explicit card text, not inferred universal mechanics. Haven can appear on equipment and master/location cards. | Card-text conventions — no standalone mechanics beyond satisfying card references. |

---

## Non-Goals

- Do not infer a universal Hunting Ground bonus. Hunt resolution uses the vampire's hunt amount and capacity ceiling; individual hunting-ground card text is handled by card-effect support.
- Do not infer a universal Path or Archetype limit unless card text supplies it or an official general rule is added.
- Do not treat `Location` as master-only; equipment can become or represent locations while in play.
- Do not turn every first-line word into a rules mechanic. Unknown markers should be stored as metadata only until a rule or card effect needs them.
