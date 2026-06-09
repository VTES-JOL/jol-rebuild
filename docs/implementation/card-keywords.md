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

| Keyword area                                                                                            | Implementation hook                                                                                                          |
|---------------------------------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------|
| Infernal                                                                                                | Unlock-phase handling: pay 1 pool to unlock, otherwise remain locked.                                                        |
| Scarce                                                                                                  | Influence resolution when moving a scarce vampire to ready.                                                                  |
| Slave                                                                                                   | Directed-action legality and slave combat replacement.                                                                       |
| Sterile                                                                                                 | Actions that put vampires in play.                                                                                           |
| Blood Cursed                                                                                            | Diablerie declaration/resolution.                                                                                            |
| Red List / Trophy                                                                                       | Marking, rush action legality, Trophy award timing before blood hunt.                                                        |
| Black Hand / Flight / Circle / descriptors                                                              | Requirement checks for cards and effects.                                                                                    |
| Weapon / melee weapon / gun / ammo / vehicle / electronic                                               | Combat strike legality, equipment restrictions, and card effects that reference these markers. `MELEE_WEAPON` and `GUN` must also satisfy `WEAPON` references. |
| Frenzy / Reflex / Aim / Grapple                                                                         | Combat card legality, cancellation windows, and effects that reference these markers.                                        |
| Location / Hunting ground / Haven / Investment / Path / Archetype / Government / Watchtower / Operation Antigen | Card-effect dispatch and UI/search metadata; enforce only rule text or explicit card text, not inferred universal mechanics. Haven can appear on equipment and master/location cards. |

---

## Non-Goals

- Do not infer a universal Hunting Ground bonus. Hunt resolution uses the vampire's hunt amount and capacity ceiling; individual hunting-ground card text is handled by card-effect support.
- Do not infer a universal Path or Archetype limit unless card text supplies it or an official general rule is added.
- Do not treat `Location` as master-only; equipment can become or represent locations while in play.
- Do not turn every first-line word into a rules mechanic. Unknown markers should be stored as metadata only until a rule or card effect needs them.
