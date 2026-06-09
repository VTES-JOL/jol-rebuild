# Card Keywords and Trait Markers

Use this document when deciding whether a printed keyword, trait, subtype, or marker has rules text of its own, or whether it exists only so other cards can refer to it.

The official VEKN rulebook uses **Traits** for several minion attributes. It also defines some master-card labels and reminder words. Other words appear as repeated card-text conventions; those should not be treated as standalone rules unless the card text or another rule explicitly gives them one.

---

## Classification

| Classification                     | Meaning                                                                                     |
|------------------------------------|---------------------------------------------------------------------------------------------|
| **Standalone mechanic**            | The keyword itself changes legal play or game state, even if no other card refers to it.    |
| **Requirement / reference marker** | The keyword mostly exists so cards can require, grant, count, or affect it.                 |
| **Subtype with rules**             | The word identifies a subtype with a general rule in addition to the card's own text.       |
| **Card-text convention**           | The word is useful to parse or display, but the effect comes from the individual card text. |
| **Reminder marker**                | The word reminds players of an existing general rule.                                       |

---

## Minion Traits

The rulebook defines traits as minion attributes that interact with other game effects. Some traits have direct rules; others mainly satisfy requirements.

| Keyword          | Classification                 | Mechanical effect                                                                                                                                                                                                                                                                                                     |
|------------------|--------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Black Hand**   | Requirement / reference marker | Allows the minion to play or use cards requiring a Black Hand minion. It has no default effect beyond satisfying requirements.                                                                                                                                                                                        |
| **Blood Cursed** | Standalone mechanic            | A Blood Cursed vampire cannot commit diablerie.                                                                                                                                                                                                                                                                       |
| **Circle**       | Requirement / reference marker | Blood Brothers belong to a circle. Cards can compare or require a specific circle; the circle label has no default effect by itself.                                                                                                                                                                                  |
| **Flight**       | Requirement / reference marker | Allows the minion to play or use cards requiring Flight. It has no default combat or movement rule by itself.                                                                                                                                                                                                         |
| **Infernal**     | Standalone mechanic            | An infernal minion does not unlock normally. During its controller's unlock phase, that controller may burn 1 pool to unlock it.                                                                                                                                                                                      |
| **Red List**     | Standalone mechanic            | A Red List minion can be marked with a master phase action for the current turn. A ready vampire may enter combat with a marked Red List minion as a +1 stealth directed action costing 1 blood. Burning a Red List minion in combat or as a directed action can award Trophy cards before any blood hunt referendum. |
| **Scarce**       | Standalone mechanic            | When a scarce vampire moves from uncontrolled to ready during the influence phase, its controller burns 3 pool for each ready vampire of the same clan they already control.                                                                                                                                          |
| **Slave**        | Standalone mechanic            | A slave cannot perform directed actions unless its controller controls a ready member of the specified clan. A slave can also be locked to replace combat involving a blocked vampire of the specified clan, as defined by the slave rule.                                                                            |
| **Sterile**      | Standalone mechanic            | A sterile vampire cannot perform actions to put other vampires in play.                                                                                                                                                                                                                                               |

---

## Library Card Keywords and Subtypes

| Keyword            | Classification             | Mechanical effect                                                                                                                                                                                                                                                                                 |
|--------------------|----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Location**       | Subtype / reference marker | A location represents a place controlled by a Methuselah or their minions. Most locations are master cards, but some equipment cards state that they represent a location and no longer count as equipment while in play. Location matters for effects that use, count, steal, or burn locations. |
| **Trifle**         | Subtype with rules         | When a trifle is successfully played, the Methuselah gains an additional master phase action. Only one master phase action can be gained from trifles in a given master phase; later trifles act like regular master cards.                                                                       |
| **Out-of-turn**    | Subtype with rules         | An out-of-turn master can be played only during another Methuselah's turn at an appropriate timing point. It uses a master phase action from the player's next master phase, and a Methuselah cannot play a second out-of-turn master before their next master phase.                             |
| **Trophy**         | Subtype with rules         | A Trophy can be put into play with a master phase action or awarded through Red List rules. It has no effect until moved to a vampire. Once placed on a vampire, it is controlled by that vampire's controller and cannot be awarded again.                                                       |
| **Investment**     | Card-text convention       | Investment is a useful subtype/reference label, but no general rulebook mechanic was found for the word itself. Current Investment cards define their own counters, movement, and burn timing in card text.                                                                                       |
| **Path**           | Card-text convention       | Path identifies a family of cards and is referenced by card text. The common "a vampire can have only one path" restriction appears on Path cards, so enforce it from card text unless a broader official rule is added.                                                                          |
| **Hunting ground** | Card-text convention       | Hunting ground identifies a family of locations and Trophies. The current cards define their own blood-gain timing and "one hunting ground each turn" limits in card text; do not infer a universal hunting-ground bonus without that text.                                                       |
| **Derivative**     | Card-text convention       | Derivative appears on some location text as a marker, but no standalone rulebook mechanic was found for it. Treat it as card text unless a card or ruling references it.                                                                                                                          |

---

## Equipment Keywords

| Keyword          | Classification             | Mechanical effect                                                                                                                                                                                                                                                                    |
|------------------|----------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Weapon**       | Subtype / reference marker | Identifies equipment that can provide weapon strikes or be affected by cards that refer to weapons. `Melee weapon` and `Gun` are both weapons and are valid for effects that refer to weapons. The strike, maneuver, side effects, and burn timing come from the weapon's card text. |
| **Melee weapon** | Subtype / reference marker | A weapon subtype whose strike normally uses the bearer's strength plus or minus the weapon modifier. It is both a `melee weapon` and a `weapon`. It is close-range by default unless card text says otherwise.                                                                       |
| **Gun**          | Subtype / reference marker | A weapon subtype used by ammo cards and gun-specific effects. It is both a `gun` and a `weapon`. Gun strikes generally use fixed ranged damage from card text, but the word `gun` itself does not create a default maneuver or damage value.                                         |
| **Ammo**         | Card-text convention       | Ammo cards modify a gun or other weapon as their text permits. The CSV shows ammo cards carrying their own limits, such as no more than one ammo card on a gun each combat; do not infer a universal ammo effect beyond card text.                                                   |
| **Vehicle**      | Subtype / reference marker | Identifies equipment that is a vehicle and can be affected by vehicle-specific cards. No standalone rulebook mechanic was found beyond card references and individual card text.                                                                                                     |
| **Electronic**   | Subtype / reference marker | Identifies equipment that can be affected by electronic-equipment-specific cards. No standalone rulebook mechanic was found beyond card references and individual card text.                                                                                                         |
| **Haven**        | Card-text convention       | Haven appears on equipment and master/location cards, such as `Polaris Coach` and `Secure Haven`. No standalone rulebook mechanic was found; apply the card's own text and any card effects that specifically reference havens.                                                      |
| **Cold iron**    | Card-text convention       | Appears on some weapons as a marker. No standalone rulebook mechanic was found; apply only card text and effects that specifically reference cold iron.                                                                                                                              |

---

## Combat Keywords

| Keyword                   | Classification             | Mechanical effect                                                                                                                                                                     |
|---------------------------|----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Frenzy**                | Subtype / reference marker | Identifies cards that can be cancelled or restricted by effects that refer to frenzy cards. The Frenzy keyword itself does not define a universal combat effect; use the card's text. |
| **Reflex** / **[REFLEX]** | Card type / timing marker  | Reflex appears in the official card-type symbol list and on Imbued-style text. Use the card's own timing text; most local examples cancel frenzy cards as they are played.            |
| **Aim**                   | Card-text convention       | Aim appears on combat cards played when choosing a strike. No standalone rulebook mechanic was found; use the card text, including any per-strike limits printed there.               |
| **Grapple**               | Card-text convention       | Grapple appears on combat cards and is referenced by cancellation effects. No standalone rulebook mechanic was found; use the individual card text.                                   |

---

## Event, Action, and Political Keywords

| Keyword               | Classification             | Mechanical effect                                                                                                                                                                                        |
|-----------------------|----------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Gehenna**           | Subtype / reference marker | Identifies event cards and other card effects that count or require Gehenna cards. The event's actual effect, replacement delay, and requirements are card text.                                         |
| **Title**             | Subtype with rules         | Political action cards with `Title` put a title card on a vampire if the referendum passes. Title uniqueness and vote value follow the title rules.                                                      |
| **Boon**              | Card-text convention       | Boon appears on political actions and master cards. No standalone rulebook mechanic was found; use individual card text and effects that reference Boon.                                                 |
| **Contract**          | Card-text convention       | Contract identifies a family of action cards and effects. No standalone rulebook mechanic was found; use card text and effects that reference contracts.                                                 |
| **Condemnation**      | Card-text convention       | Condemnation identifies a family of action cards. Local card text commonly burns other Condemnations on the same minion, but that rule is printed on the cards rather than being a general keyword rule. |
| **Operation Antigen** | Card-text convention       | Operation Antigen identifies a small card family. No standalone rulebook mechanic was found; use card text and effects that reference Operation Antigen.                                                 |

---

## Other Card Families and Descriptors

| Keyword                                                                                                      | Classification        | Mechanical effect                                                                                                                                                                                  |
|--------------------------------------------------------------------------------------------------------------|-----------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Archetype**                                                                                                | Card-text convention  | Archetype appears on master cards placed on vampires. Local card text usually says a vampire can have only one archetype, but enforce that from card text unless a broader official rule is added. |
| **Discipline** / **Master: Discipline**                                                                      | Subtype with rules    | A Discipline master card is played on a controlled vampire to grant a Discipline level. Most also increase capacity by 1, but do not add blood to fill that capacity.                              |
| **Government**                                                                                               | Card-text convention  | Government appears on allies and retainers. No standalone rulebook mechanic was found; use card text and effects that reference Government cards.                                                  |
| **Inconnu**                                                                                                  | Card-text convention  | Inconnu appears as a card-family or affiliation marker. No standalone rulebook mechanic was found; use card text and effects that reference Inconnu.                                               |
| **Watchtower**                                                                                               | Card-text convention  | Watchtower appears on a small family of master cards. No standalone rulebook mechanic was found; use the individual card text.                                                                     |
| **Mortal**                                                                                                   | Reference marker      | Identifies a minion or retainer as mortal. This matters for effects that refer to mortals and for the `Monster` definition.                                                                        |
| **Animal**                                                                                                   | Reference marker      | Identifies a minion or retainer as an animal. This matters for effects that refer to animals and for the `Monster` definition.                                                                     |
| **Monster**                                                                                                  | Standalone definition | The rulebook defines a monster as any minion or retainer that is neither mortal nor animal. Vampires are monsters.                                                                                 |
| **Ghoul**, **demon**, **werewolf**, **wraith**, **zombie**, **mage**, **mummy**, **changeling**, **dhampir** | Reference marker      | Creature descriptors used by card text. No shared standalone mechanic was found for the descriptor itself; use effects that specifically reference the descriptor and the card's own text.         |
| **Non-unique**                                                                                               | Standalone mechanic   | Overrides the default uniqueness of vampires or unique-like card families. Multiple copies can be in play unless card text creates another restriction.                                            |

---

## General Card Markers

| Keyword / marker | Classification      | Mechanical effect                                                                                                                                                                                                                                                                |
|------------------|---------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **Unique**       | Standalone mechanic | Only one copy of a unique card can be in play. If another Methuselah puts a copy in play, the copies are contested until all but one are yielded. Vampires are unique by default.                                                                                                |
| **Limited**      | Reminder marker     | Reminds players of existing limits: during a bleed, an action modifier cannot increase bleed if another action modifier is already increasing it unless one does not count against the limit; a minion cannot use more than one source for additional strikes in a combat round. |
| **Burn option**  | Standalone mechanic | A card with the burn option icon may be discarded during any Methuselah's unlock phase and replaced if the player does not control a minion who meets the card requirements or has no legal target for it. Each Methuselah is limited to one such discard each unlock phase.     |

---

## Source Notes

- [VEKN Rulebook § Traits](https://www.vekn.net/rulebook?start=6) defines Black Hand, Blood Cursed, Circle, Infernal, Flight, Red List, Scarce, Slave, and Sterile.
- [VEKN Rulebook § Master Cards](https://www.vekn.net/rulebook) defines Location, Trifle, Out-of-turn, Trophy, and Discipline master-card rules.
- [VEKN Rulebook § Equipment](https://www.vekn.net/rulebook) defines equipment attachment and bearer rules.
- [VEKN Rulebook](https://www.vekn.net/rulebook) defines burn option, unique-card contesting, and the Limited reminder text for bleed increases and additional strikes.
- [VEKN Rulebook § Glossaries](https://www.vekn.net/rulebook/8-glossaries) defines Unique and Limited terminology.
- [VEKN Symbols](https://www.vekn.net/what-is-v-tes/vtes-symbols) lists Reflex as a card type symbol.
- [VEKN Detailed Play Summary](https://www.vekn.net/detailed-play-summary) confirms Red List Trophy timing during diablerie before the blood hunt referendum.
- Investment, Path, Hunting ground, Derivative, Ammo, Vehicle, Electronic, Haven, Cold iron, Frenzy, Aim, Grapple, Boon, Contract, Condemnation, Operation Antigen, Archetype, Government, Inconnu, Watchtower, and creature descriptors were checked against the official rulebook and local card data. Where no general rulebook mechanic was found, this document classifies them as card-text conventions or reference markers.
