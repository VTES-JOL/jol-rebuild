# Card Language — Implementation Draft

This document sketches the structured card language JOL intends to use as the source of truth for rules-enforced card automation. It captures the starting assumptions from early design discussion so future schema changes can be compared against the original intent.

The goal is not to change the current game-state implementation yet. The immediate goal is to define a readable, editable language that can be generated from card CSV text, reviewed by humans, and later compiled into engine behavior.

See [Card Text Parsing](./card-text-parsing.md) for the current CSV mode-splitting pipeline and [Timing Windows](./timing-windows.md) for the timing taxonomy this language should target.

---

## Goals

- Make structured card definitions the authoritative source consumed by the engine.
- Support both library cards and crypt cards.
- Allow automatic preprocessing from English card text, with manual review and editing for hard cards.
- Make card behavior inspectable enough for a future UI or crowd-sourced editing workflow.
- Allow game formats that admit only cards with supported structured definitions.
- Keep unsupported/manual cards out of rules-enforced automation until their behavior is represented.

---

## Non-Goals

- This draft does not replace the current in-memory game state.
- This draft does not require immediate implementation of card automation.
- This draft does not attempt to parse every VTES card text pattern in one pass.
- This draft does not silently drop unsupported clauses. Unknown behavior must be visible as unsupported or partial.

---

## Core Model

Cards own abilities. Abilities describe when an option or modifier exists. Effects describe what changes when an ability or choice resolves.

```yaml
id: string
name: string
kind: library | crypt
types: []
keywords: []
automation:
  status: supported | partial | unsupported
  reason: string?
lifecycle: {}
abilities:
  - id: string
    kind: declaration | granted | activated | passive | triggered | replacement | delayed
    source: hand | ash-heap | in-play | attached-card | crypt-card | self
    user: actor | bearer | controller | self | target
    timing: []
    trigger: {}
    action: {}
    requirements: {}
    cost: {}
    limit: {}
    choices: []
    effects: []
    applies: {}
    permission: {}
    referendum: {}
```

Guideline:

- A complete structured card definition is stored as one top-level object with `id`, `name`, `kind`, metadata, lifecycle rules, and abilities.
- Abilities answer: "When may this option be offered or this modifier be active?"
- Effects answer: "What changes if it resolves?"
- Future options created by an effect are represented as granted, delayed, or obligated abilities, not as immediate state mutations.
- Costs may exist on initial declaration abilities, later granted abilities, activated crypt abilities, or individual choices.
- Choices are explicit branches, similar to declaration modes.
- Actions, referendums, and permissions are first-class enough that they should not be hidden inside generic effects.

---

## Lifecycle Rules

Some card text changes replacement, uniqueness, trifle handling, burn timing, or other card lifecycle behavior. These rules belong in top-level `lifecycle` when they affect the card as a card, rather than in an ordinary ability.

```yaml
lifecycle:
  unique: true
  trifle: true
  doNotReplace:
    while: in-play
```

Guidelines:

- Use `lifecycle` for text such as `Unique`, `Trifle`, and "Do not replace as long as this card is in play."
- Use triggered abilities for burn or state checks that happen because of game events, phases, or card counters.
- Use ordinary effects for immediate destination changes such as attaching or putting the card in play.

---

## Card Kinds

### Library Cards

Library cards normally have one or more `declaration` abilities corresponding to ways the card can be played. These are seeded from the current split-mode parser.

```yaml
abilities:
  - id: play
    kind: declaration
    source: hand
    timing: [MINION_PHASE_DECLARE_ACTION]
    user: actor
    cost:
      pool: 2
    effects:
      - attach:
          card: self
          to: actor
```

### Crypt Cards

Crypt cards do not need a synthetic play ability in this language. Their abilities exist once the crypt card is in play.

```yaml
abilities:
  - id: political-stealth
    kind: passive
    timing: [ACTION_DURING_ACTION, ACTION_STEALTH_INTERCEPT]
    applies:
      stealth: +1
    condition:
      action:
        actor: self
        type: political
```

---

## Ability Kinds

| Kind | Meaning |
|---|---|
| `declaration` | A card or action is declared from a legal source. |
| `granted` | A card in play grants a later option, such as an equipment strike. |
| `activated` | A chosen ability with requirements and optional cost. |
| `passive` | An always-on modifier while its condition is true. |
| `triggered` | An ability that fires from a timing condition or game event. |
| `replacement` | An ability that replaces a pending result before it commits. |
| `delayed` | An ability or effect created now and resolved later. |

Passive abilities use `applies` rather than `effects` because they do not resolve as one-off events.

```yaml
abilities:
  - id: prey-clan-bleed
    kind: passive
    timing: [ACTION_DURING_ACTION]
    applies:
      bleed: +1
    condition:
      action:
        actor: self
        type: bleed
      prey:
        controls:
          readyMinion:
            clan: nosferatu
```

---

## Triggers

Triggered abilities fire from a game event, phase/window opening, counter threshold, or state transition.

```yaml
abilities:
  - id: trigger-id
    kind: triggered
    trigger: {}
    requirements: {}
    effects: []
```

Examples:

```yaml
trigger:
  event: card-locked
  card: self
```

```yaml
trigger:
  phase: UNLOCK
  player: each-methuselah
```

```yaml
trigger:
  event: region-changed
  card: bearer
  to: torpor
```

```yaml
trigger:
  state:
    card: self
    counterAtLeast: 3
```

Guidelines:

- Use `trigger` for "after", "each time", "during each phase", and state-threshold text.
- Use `timing` for when a player may choose to use an option.
- A triggered ability may still have `choices`, especially when the affected player chooses between paying pool, burning blood, or another alternative.

---

## Actions

Action cards, political actions, equipment/employ/recruit actions, and crypt-card actions need an `action` block. Effects describe what happens if the action succeeds; the `action` block describes what kind of action is being declared and how it enters the action workflow.

```yaml
action:
  type: bleed | political | equip | employ-retainer | recruit-ally | enter-combat | generic
  directed: true | false
  stealth: +1
  target: {}
```

Examples:

```yaml
action:
  type: bleed
  directed: true
```

```yaml
action:
  type: generic
  stealth: +1
  target:
    youngerVampire:
      region: uncontrolled
      controller: self
```

Guidelines:

- A bleed action should be represented as `action.type: bleed`, not only as an effect that modifies bleed.
- A political action should be represented as `action.type: political`, with referendum terms in `referendum`.
- Directed action notation such as `(D)` should become `directed: true`.
- Stealth that is intrinsic to the action declaration, such as "+1 stealth action", belongs in the `action` block.
- Stealth added during an action by a modifier or passive ability belongs in `effects` or `applies`.

---

## Referendums

Political actions often define terms before polling and effects after the referendum passes, fails, or is canceled. This should be explicit rather than modeled as ordinary immediate effects.

```yaml
referendum:
  chooseTerms: {}
  onPass:
    effects: []
  onFail:
    effects: []
  onCancel:
    effects: []
```

Example:

```yaml
referendum:
  chooseTerms:
    target:
      methuselah:
        poolGreaterThan: acting-player
    allocate:
      amount: 3
      from: target.pool
      among: methuselahs
  onPass:
    effects:
      - distributePool: chosen-allocation
```

Guidelines:

- `chooseTerms` captures choices made when the political action is announced.
- `onPass` captures the successful referendum result.
- `onFail` and `onCancel` are separate because some cards distinguish them.
- Vote modifiers remain ordinary effects or passive `applies` entries unless the card is defining the referendum terms.

---

## Permissions

Some text changes what a player, minion, or card is allowed to do rather than adding a numeric modifier or resolving an effect. These should use `permission` for passive abilities or `effects.restrictChoices` / `effects.grantPermission` for temporary changes.

Passive permission example:

```yaml
abilities:
  - id: wider-blocking
    kind: passive
    source: crypt-card
    user: self
    permission:
      block:
        ignoreRestrictions:
          - prey
          - predator
          - target
    condition:
      blockAttempt:
        blocker: self
        actingMinion:
          controller: another-methuselah
```

Temporary restriction example:

```yaml
effects:
  - restrictChoices:
      target: both-combatants
      choiceType: strike
      legalOnly:
        strikeKind: hand
      duration: current-round
```

Guidelines:

- Use `applies` for numeric modifiers such as bleed, stealth, intercept, strength, hand size, or cost reduction.
- Use `permission` when the text changes eligibility or legal actions.
- Use `restrictChoices` when a resolving effect narrows future legal options for a duration.
- Use `grantPermission` if a resolving effect temporarily broadens future legal options.

---

## Timing

Abilities and choices should use the narrowest timing windows reasonably available.

```yaml
timing: [COMBAT_DETERMINE_RANGE]
```

When an ability can be relevant in multiple windows, choices can narrow the usable branch.

```yaml
abilities:
  - id: weapon-combat
    kind: granted
    timing: [COMBAT_DETERMINE_RANGE, COMBAT_STRIKE_DECLARATION]
    choices:
      - id: maneuver-and-commit
        timing: [COMBAT_DETERMINE_RANGE]
        effects: []
      - id: strike-now
        timing: [COMBAT_STRIKE_DECLARATION]
        effects: []
```

---

## Requirements and Conditions

`requirements` are gates for using an ability or choice. `condition` is preferred for passive abilities.

Shorthand is acceptable in authored definitions while the language is immature:

```yaml
requirements:
  user: ready-vampire
  action: bleed
```

The compiler may later normalize shorthand into structured predicates:

```yaml
requirements:
  user:
    type: vampire
    state: ready
  action:
    type: bleed
```

---

## Costs

Costs can appear on the card-level declaration, a specific declaration mode, a granted ability, an activated crypt ability, or a choice branch.

```yaml
cost:
  pool: 2
```

```yaml
cost:
  blood:
    from: self
    amount: 1
```

Some English card text links a cost directly to an effect working. Those cards should be modeled at the narrowest level that matches the wording. If the cost is paid to choose the branch, place it on the choice. If the cost is paid as part of resolving a particular effect, place it with that effect or split the branch.

Locking or burning a card/minion can be a cost or an effect depending on wording and legality needs. If a card says "lock this vampire" as part of making the card work, model it at the narrowest level and preserve whether the ability requires the card to be unlockable.

```yaml
cost:
  lock: user
```

```yaml
effects:
  - lock: user
```

---

## Choices

Choices are explicit branches. This applies to:

- Inferior and superior discipline text.
- Cards where multiple disciplines may be used.
- Optional branches in one timing window.
- Branches that create later obligations.

```yaml
choices:
  - id: inferior
    requirements:
      discipline: ani
    effects:
      - strike: 1R

  - id: superior
    requirements:
      discipline: ANI
    effects:
      - strike: 1R
      - press:
          amount: 1
          optional: true
```

For cards where more than one discipline may be used together, model each supported combination explicitly rather than relying on implicit merging.

---

## Effects

Common concise effects should remain readable in authored card definitions:

```yaml
effects:
  - strike: 2R
  - strike: 2R aggravated
  - bleed: +1
  - stealth: +1
  - intercept: +1
  - maneuver: 1
  - press: continue
```

The compiler can normalize these into typed engine structures. For example:

```yaml
- strike: 2R aggravated
```

can compile to:

```yaml
kind: damage
amount: 2
range: ranged
aggravated: true
```

Other effect families expected in the language:

```yaml
effects:
  - attach: {}
  - move: {}
  - burn: {}
  - lock: {}
  - unlock: {}
  - pool: -2
  - blood: -1
  - restrictChoices: {}
  - createObligation: {}
  - createDelayedEffect: {}
  - addCounter: {}
  - removeCounter: {}
  - modifyHandSize: {}
  - modifyCost: {}
```

---

## Limits

Limits may be attached to the effect, choice, or whole ability they constrain. Prefer the narrowest placement that matches the card text.

```yaml
effects:
  - maneuver:
      amount: 1
      optional: true
      limit: once-per-combat
  - strike: 2R
```

Ability-level example:

```yaml
limit:
  frequency: once
  scope: combat-round
  key: user + card-name
```

The intended default interpretation for an effect-level combat limit is:

```yaml
limit:
  frequency: once
  scope: combat-instance
  key: user + ability-id
```

This means the minion may use that named ability once in that combat. If a new combat starts, including a restarted combat caused by an effect, the limit is available again because the combat instance changed.

For phase or window text such as "During X, do Y", the typical limit is once per turn in the named phase or timing window.

```yaml
limit:
  frequency: once
  scope: turn
  key: user + ability-id + timing-window
```

Card-wide limits should be explicit:

```yaml
limit:
  frequency: once
  scope: combat-instance
  key: source-instance + card-id + user
  appliesTo: card
```

Open assumption: default limit keys should not include `source-instance` unless the card text implies the physical card instance is the limiter. Equipment, crypt, and granted minion abilities usually read closer to `user + ability-id + scope`.

Guidelines:

- Use effect-level limits for text such as "with 1 optional maneuver each combat".
- Use ability-level limits for text such as "A vampire can play only one [named card] each round."
- Use card-level or source-instance keys when the physical permanent is the limited object.
- A restarted or newly created combat has a new `combat-instance`, so `once-per-combat` limits reset unless card text says otherwise.

---

## Obligations

Some effects make a future choice mandatory. This should be represented as a generic obligation, not as a combat-only construct, so future card patterns can reuse it. Obligations can be created by permanents, crypt abilities, or hand-played cards.

`createObligation` is a language-level effect that would later compile into an engine state record. This draft does not change the current game state.

```yaml
- createObligation:
    id: magnum-strike
    subject: user
    timing: COMBAT_STRIKE_DECLARATION
    choiceType: strike
    choice:
      strike: 2R
    duration: until-satisfied
    fallback:
      ifInvalid: release
```

The engine behavior intended later:

1. Gather legal choices at the obligation timing.
2. Apply choice restrictions.
3. Check pending obligations.
4. If the obligated choice is legal, force it.
5. If the obligated choice is illegal and `fallback.ifInvalid` is `release`, release the obligation and present legal alternatives.

This models interactions such as a weapon maneuver committing its bearer to a later weapon strike, while a later effect such as a hand-strike-only restriction can make that obligation invalid and release it.

Hand-played combat cards may need the same pattern when the card text combines effects that occur in different combat windows:

```yaml
effects:
  - maneuver:
      amount: 1
      optional: true
  - createObligation:
      id: committed-strike
      subject: user
      timing: COMBAT_STRIKE_DECLARATION
      choiceType: strike
      choice:
        strike: 1R
      fallback:
        ifInvalid: release
```

---

## Worked Example: .44 Magnum

This is a draft shape, not a verified final encoding.

```yaml
id: 100xxx
name: .44 Magnum
kind: library
types: [equipment]
keywords: [weapon, gun]
automation:
  status: supported

abilities:
  - id: play
    kind: declaration
    source: hand
    timing: [MINION_PHASE_DECLARE_ACTION]
    user: actor
    requirements:
      user: ready-minion
    cost:
      pool: 2
    effects:
      - attach:
          card: self
          to: actor

  - id: magnum-combat
    kind: granted
    source: attached-card
    user: bearer
    timing: [COMBAT_DETERMINE_RANGE, COMBAT_STRIKE_DECLARATION]
    requirements:
      user: in-combat
    choices:
      - id: maneuver-and-commit-strike
        timing: [COMBAT_DETERMINE_RANGE]
        effects:
          - maneuver:
              amount: 1
              optional: true
              limit: once-per-combat
          - createObligation:
              id: magnum-strike
              subject: user
              timing: COMBAT_STRIKE_DECLARATION
              choiceType: strike
              choice:
                strike: 2R
              duration: until-satisfied
              fallback:
                ifInvalid: release

      - id: strike
        timing: [COMBAT_STRIKE_DECLARATION]
        effects:
          - strike: 2R
```

---

## Worked Example: Crypt Passive

```yaml
id: 200xxx
name: Example Vampire
kind: crypt
clan: toreador
capacity: 8
disciplines:
  AUS: superior
  PRE: superior
automation:
  status: supported

abilities:
  - id: political-stealth
    kind: passive
    source: crypt-card
    user: self
    timing: [ACTION_DURING_ACTION, ACTION_STEALTH_INTERCEPT]
    applies:
      stealth: +1
    condition:
      action:
        actor: self
        type: political
```

---

## Worked Example: Action Modes

```yaml
id: 100845
name: Govern the Unaligned
kind: library
types: [action]
automation:
  status: partial
  reason: draft-example

abilities:
  - id: bleed
    kind: declaration
    source: hand
    timing: [MINION_PHASE_DECLARE_ACTION]
    user: actor
    requirements:
      discipline: dom
    cost:
      blood:
        from: actor
        amount: 1
    action:
      type: bleed
      directed: true
    effects:
      - bleed: +2

  - id: move-to-uncontrolled
    kind: declaration
    source: hand
    timing: [MINION_PHASE_DECLARE_ACTION]
    user: actor
    requirements:
      discipline: DOM
    cost:
      blood:
        from: actor
        amount: 1
    action:
      type: generic
      stealth: +1
      target:
        youngerVampire:
          region: uncontrolled
          controller: self
    effects:
      - addBlood:
          amount: 3
          to: chosen-target
```

---

## Worked Example: Referendum

```yaml
id: 101353
name: Parity Shift
kind: library
types: [political-action]
automation:
  status: partial
  reason: draft-example

abilities:
  - id: referendum
    kind: declaration
    source: hand
    timing: [MINION_PHASE_DECLARE_ACTION]
    user: actor
    requirements:
      actor: prince-or-justicar
    action:
      type: political
    referendum:
      chooseTerms:
        target:
          methuselah:
            poolGreaterThan: acting-player
        allocate:
          amount: 3
          from: target.pool
          among: methuselahs
      onPass:
        effects:
          - distributePool: chosen-allocation
```

---

## Worked Example: Permission Modifier

```yaml
id: 200106
name: Anneke
kind: crypt
clan: toreador
capacity: 10
title: justicar
automation:
  status: partial
  reason: draft-example

abilities:
  - id: wider-blocking
    kind: passive
    source: crypt-card
    user: self
    permission:
      block:
        ignoreRestrictions:
          - prey
          - predator
          - target
    condition:
      blockAttempt:
        blocker: self
        actingMinion:
          controller: another-methuselah

  - id: bleed-bonus
    kind: passive
    source: crypt-card
    user: self
    applies:
      bleed: +1
    condition:
      action:
        actor: self
        type: bleed
```

---

## Worked Example: Choice Restriction and Ability Limit

```yaml
id: 100959
name: Immortal Grapple
kind: library
types: [combat]
keywords: [grapple]
automation:
  status: partial
  reason: draft-example

abilities:
  - id: superior
    kind: declaration
    source: hand
    timing: [COMBAT_BEFORE_STRIKES]
    user: combatant
    requirements:
      discipline: POT
      range: close
    limit:
      frequency: once
      scope: combat-round
      key: user + card-name
    effects:
      - restrictChoices:
          target: both-combatants
          choiceType: strike
          legalOnly:
            strikeKind: hand
          duration: current-round
      - press:
          amount: 1
          optional: true
      - setNextRound:
          range: close
          skipDetermineRange: true
```

---

## Worked Example: Triggered Permanent

```yaml
id: 100588
name: Dreams of the Sphinx
kind: library
types: [master]
keywords: [unique]
automation:
  status: partial
  reason: draft-example
lifecycle:
  unique: true

abilities:
  - id: play
    kind: declaration
    source: hand
    timing: [MASTER_PHASE]
    cost:
      pool: 1
    effects:
      - putInPlay: self

  - id: add-counter-when-locked
    kind: triggered
    source: in-play
    trigger:
      event: card-locked
      card: self
    effects:
      - addCounter:
          card: self
          type: generic
          amount: 1

  - id: hand-size
    kind: activated
    source: in-play
    timing: [ANY]
    cost:
      lock: self
    effects:
      - modifyHandSize:
          player: controller
          amount: 2
          duration: current-turn

  - id: edge-pool
    kind: activated
    source: in-play
    timing: [UNLOCK_PHASE]
    requirements:
      controller: has-edge
    cost:
      lock: self
    effects:
      - pool:
          player: controller
          amount: +1

  - id: uncontrolled-blood
    kind: activated
    source: in-play
    timing: [ANY]
    cost:
      lock: self
    target:
      vampire:
        region: uncontrolled
        controller: controller
    effects:
      - addBlood:
          amount: 1
          to: chosen-target

  - id: burn-at-three
    kind: triggered
    source: in-play
    trigger:
      state:
        card: self
        counterAtLeast: 3
    effects:
      - burn: self
```

---

## Worked Example: Event Lifecycle

```yaml
id: 100581
name: Dragonbound
kind: library
types: [event]
keywords: [gehenna]
automation:
  status: partial
  reason: draft-example
lifecycle:
  doNotReplace:
    while: in-play

abilities:
  - id: play
    kind: declaration
    source: hand
    timing: [DISCARD_PHASE_EVENT]
    effects:
      - putInPlay: self

  - id: torpor-pool-burn
    kind: triggered
    source: in-play
    trigger:
      phase: DISCARD
      player: each-methuselah
    effects:
      - pool:
          player: phase-player
          amount:
            multiply:
              value: -1
              by:
                count:
                  vampires:
                    controller: phase-player
                    region: torpor
```

---

## Worked Example: Attached Permission and Burn Action

```yaml
id: 101384
name: Pentex(TM) Subversion
kind: library
types: [master]
keywords: [unique]
automation:
  status: partial
  reason: draft-example
lifecycle:
  unique: true

abilities:
  - id: play
    kind: declaration
    source: hand
    timing: [MASTER_PHASE]
    cost:
      pool: 2
    target:
      minion:
        state: ready
    effects:
      - attach:
          card: self
          to: chosen-target

  - id: cannot-block
    kind: passive
    source: attached-card
    user: bearer
    permission:
      block:
        allowed: false

  - id: burn-action
    kind: granted
    source: attached-card
    user: other-minion
    timing: [MINION_PHASE_DECLARE_ACTION]
    action:
      type: generic
      directed: true
      target: self
    effects:
      - burn: self
```

---

## Worked Example: Activated Crypt Ability

```yaml
abilities:
  - id: treat-aggravated-as-normal
    kind: activated
    source: crypt-card
    user: self
    timing: [COMBAT_DAMAGE_PREVENTION]
    requirements:
      user: in-combat
      pendingDamage:
        aggravated: true
    cost:
      blood:
        from: self
        amount: 1
    effects:
      - modifyDamage:
          target: pending-damage
          aggravated: false
          duration: this-combat
```

---

## Unsupported Cards

Cards that cannot yet be represented should be explicit.

```yaml
automation:
  status: unsupported
  reason: manual-card-text
```

Partially represented cards should not pretend to be fully automated.

```yaml
automation:
  status: partial
  reason: unmodeled-replacement-effect
```

A future game format may validate that every deck card has `automation.status: supported`.

---

## Initial Parsing Strategy

The first parser should be conservative:

1. Reuse the existing split-mode output as the first stage.
2. Convert each mode row into a `declaration` ability.
3. Carry over card id, name, type, discipline requirement, costs, and timing audit output.
4. Parse obvious basic effects such as bleed, stealth, intercept, maneuver, press, strike, damage prevention, pool, blood, lock, unlock, move, burn, attach, and put-in-play.
5. Detect "put this card on/in play" as a boundary where granted abilities may exist after resolution.
6. Extract simple granted combat abilities from permanents: strikes, optional maneuvers, presses, and additional strikes.
7. Represent clear passive crypt text as `kind: passive` with `applies` and `condition`.
8. Parse clear action declarations into `action`, not just effects.
9. Parse clear political terms into `referendum.chooseTerms` and successful results into `referendum.onPass`.
10. Represent permission-changing text separately from numeric modifiers.
11. Mark unresolved text as `partial` or `unsupported`; do not silently discard it.

The parser output should be reviewable and editable. Human-authored corrections should be preserved as the source of truth after review.

---

## Open Questions

- How much shorthand should be accepted in committed card definitions versus only parser drafts?
- Should the compiler normalize all concise effects before storage, or store concise authored text and compile on load?
- What exact set of timing windows should be allowed in the card language once the timing taxonomy stabilizes?
- Which limits require `source-instance` keys rather than `user + ability-id` keys?
- How should partial automation be exposed to users in a rules-enforced game?
- What review metadata is needed for crowd-sourced card structure editing?
- Which lock/burn clauses are costs for legality purposes versus ordinary resolution effects?
- How should complex referendum term editing be represented in a UI?
