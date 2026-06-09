# Referendums and Votes

Use this document when resolving political actions, vote sources, Prisci ballots, blood hunt referendums, and Edge votes.

For declaring a political action and action success, see [Actions](./actions.md). For blocking the political action before the referendum starts, see [Blocking](./blocking.md). For the Edge in the wider game state, see [Game Flow](./game-flow.md#the-edge).

---

## Referendum Procedure

A referendum is initiated by a successful political action. It proceeds through three mandatory steps.

### Step 1 - Choose Terms

The terms are chosen by the acting vampire's controller **after** the action is confirmed unblocked. If the political action card offers choices, such as which player to affect, those choices are made here.

### Step 2 - Polling

1. **"Before votes and ballots are cast" effects** - a distinct sub-window fires first, following ABC sequencing.
2. **Votes and ballots are cast** - any Methuselah may cast their available votes/ballots in any order. There is no obligation to vote. Votes are irreversible once cast.
3. Cards marked **"only usable during a political action"** are legal only during this polling step.

### Step 3 - Resolution

- More votes **for** than **against** -> referendum passes; effects take place.
- Tied or more votes **against** -> referendum fails; no effect.

---

## Referendum Success

A referendum is **successful** if it passes, meaning more votes are cast for it than against it. A failed referendum is not a successful referendum even if the political action itself was successful and reached the referendum step unblocked.

---

## Vote Sources

| Source                      | Votes                                                                                                                                                                                                                                             |
|-----------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Political action card       | The card that called the referendum gives 1 vote to the acting vampire's controller. Other Methuselahs may burn one political action card from hand for 1 vote; each Methuselah can use only one political action card for votes in a referendum. |
| Primogen / Bishop           | 1 per ready vampire                                                                                                                                                                                                                               |
| Prince / Baron / Archbishop | 2 per ready vampire                                                                                                                                                                                                                               |
| Justicar / Cardinal         | 3 per ready vampire                                                                                                                                                                                                                               |
| Inner Circle / Regent       | 4 per ready vampire                                                                                                                                                                                                                               |
| The Edge                    | 1 (burn the Edge to gain it)                                                                                                                                                                                                                      |
| Card effects                | As specified                                                                                                                                                                                                                                      |

Torpored vampires cannot cast votes.

Political action cards are played to start a political action during the acting Methuselah's minion phase. Burning a political action card from hand during referendum polling to gain 1 vote is a vote-source rule, not a separate card-type phase for playing `POLITICAL` cards.

---

## Prisci Block

Priscus is a collective Sabbat title. A ready Priscus provides **one ballot**, not ordinary votes. The Prisci block provides three votes in the main referendum, decided by a Prisci-only sub-referendum.

1. During polling, each ready Priscus may cast one ballot in the Prisci sub-referendum.
2. Only Prisci ballots participate in this sub-referendum.
3. The Prisci block contributes three votes to the main referendum according to the current result of the Prisci ballots.
4. As more Prisci cast ballots, the block may shift between for, against, or no contribution if the ballots are tied.

The Prisci block is resolved as part of polling before the main referendum outcome is finalized.

---

## Blood Hunt Referendum

A blood hunt referendum is automatically called after any diablerie occurs. It differs from a political action referendum:

- It is **not** initiated by a political action card; no card is played.
- The **acting Methuselah** for impulse and sequencing is the Methuselah whose vampire was diablerized (the victim's controller).
- The terms are fixed: the referendum targets the diablerist. If it passes, the diablerist is burned.
- The blood hunt referendum follows the same three-step structure and the same vote sources as any other referendum, except that it is not an action: it cannot be blocked, and action modifiers and reaction cards cannot be played.
- Legal vote sources include votes and ballots from ready titled vampires, the Edge, one political action card burned from hand per Methuselah, and in-play card effects that are usable during the current referendum.
- Do not allow vote modifiers from hand unless the card text explicitly says it is usable during a blood hunt referendum or otherwise overrides the normal blood hunt restriction. Effects restricted to "a political action" or "the polling step of a political action" are not usable during a blood hunt.
- Trophy awards for Red List minions, if applicable, are resolved **before** the blood hunt referendum is called. See [Card Keywords § Minion Traits](./card-keywords.md#minion-traits).

---

## The Edge During Referendums

The Edge is a game token that passes between players during bleed actions:

- The acting player takes the Edge whenever their successful bleed action has a bleed amount of 1 or more.
- During referendum polling the Edge-holder may burn the Edge to gain 1 vote.
- Only one player holds the Edge at a time; it starts the game with no owner.
