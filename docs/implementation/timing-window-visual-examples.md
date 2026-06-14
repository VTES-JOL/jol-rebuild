# Timing Window Visual Examples

These are draft visual examples for the layout ideas in [Timing Window Review Guide](./timing-window-review-guide.md#alternative-visual-layouts). They are intentionally review-friendly rather than canonical. The canonical implementation source remains [action-state-machine.puml](./action-state-machine.puml).

The examples use PlantUML so they can be rendered with the same tooling as the canonical state machine:

```bash
plantuml -tsvg docs/implementation/timing-window-visual-examples.md
```

---

## 1. Swimlane Sequence

Use this when reviewers need to see who owns each step and when control moves into nested workflows.

```plantuml
@startuml
title Swimlane Sequence - Action Workflow Ownership

participant "Acting controller" as A
participant "Other Methuselahs" as O
participant "Card Play" as CP
participant "Action workflow" as ACT
participant "Combat" as C
participant "Referendum / Blood Hunt" as R

A -> ACT: Declare action
opt Action card from hand
    ACT -> CP: Run Card Play
    CP -> O: CARD_AS_PLAYED responses
    CP --> ACT: Card not canceled
end

ACT -> O: ACTION_AS_ANNOUNCED responses
ACT -> O: ACTION_DURING_ACTION responses
O -> ACT: Block attempt
ACT -> O: ACTION_STEALTH_INTERCEPT exchange

alt Block succeeds
    ACT -> O: ACTION_BLOCK_RESOLUTION_PRE_COMBAT responses
    ACT -> C: Run combat
    C --> ACT: Combat ends
    alt Action continues
        ACT -> O: ACTION_CONTINUING
        ACT -> O: Return to ACTION_DURING_ACTION
    else Action ends
        ACT -> O: ACTION_AFTER_RESOLUTION
    end
else Blocks declined
    ACT -> O: ACTION_BLOCKS_DECLINED responses
    alt Political action
        ACT -> R: Run referendum
        R --> ACT: Referendum complete
    else Diablerie action
        ACT -> R: Run diablerie and blood hunt
        R --> ACT: Blood hunt complete
    else Other action
        ACT -> A: Resolve action effect
    end
    ACT -> O: ACTION_AFTER_RESOLUTION
end
@enduml
```

---

## 2. Subway Map

Use this as a one-page orientation map. It emphasizes routes and branch points instead of every implementation edge.

```plantuml
@startuml
title Subway Map - Action Route And Branches
left to right direction

skinparam rectangle {
    RoundCorner 18
}

rectangle "Action starts" as Start #EAF3FF
rectangle "Card Play loop\nCARD_AS_PLAYED\nreplacement / cost / destination" as CardPlay #F4EDFF
rectangle "ACTION_AS_ANNOUNCED" as Announced #EAF3FF
rectangle "ACTION_DURING_ACTION" as During #EAF3FF
rectangle "ACTION_BLOCK_ATTEMPT" as BlockAttempt #EAF3FF
rectangle "ACTION_STEALTH_INTERCEPT" as SI #EAF3FF
rectangle "ACTION_BLOCKS_DECLINED" as Declined #EAF3FF
rectangle "Action resolution" as Resolve #EAF3FF
rectangle "ACTION_AFTER_RESOLUTION" as After #EAF3FF

rectangle "Combat branch" as CombatStart #FFF2CC
rectangle "range -> strikes -> damage -> press -> end" as Combat #FFF2CC
rectangle "ACTION_CONTINUING" as Continue #EAF3FF

rectangle "Referendum branch" as ReferendumStart #E6FFF7
rectangle "terms -> before votes -> polling -> tally -> after" as Referendum #E6FFF7

rectangle "Diablerie branch" as DiablerieStart #FFECEC
rectangle "attempt -> success -> trophy -> blood hunt" as Diablerie #FFECEC

Start --> CardPlay
CardPlay --> Announced
Start --> Announced
Announced --> During
During --> BlockAttempt
BlockAttempt --> SI
SI --> CombatStart
BlockAttempt --> CombatStart
CombatStart --> Combat
Combat --> Continue
Continue --> During
Combat --> After
During --> Declined
Declined --> Resolve
Resolve --> ReferendumStart
ReferendumStart --> Referendum
Referendum --> After
Resolve --> DiablerieStart
DiablerieStart --> Diablerie
Diablerie --> After
Resolve --> After
@enduml
```

---

## 3. Timing Ladder

Use this for a focused subset. This example is the combat ladder.

```plantuml
@startuml
title Timing Ladder - Combat
top to bottom direction

skinparam rectangle {
    RoundCorner 12
}

rectangle "COMBAT_BEFORE_RANGE\nCarrion Crows" as BR #EAF3FF
rectangle "COMBAT_DETERMINE_RANGE\nFlash" as DR #EAF3FF
rectangle "COMBAT_BEFORE_STRIKES\nImmortal Grapple" as BS #EAF3FF
rectangle "COMBAT_STRIKE_DECLARATION\nTheft of Vitae" as SD #EAF3FF
rectangle "COMBAT_BEFORE_STRIKE_RESOLUTION\nBlood to Water" as BSR #EAF3FF
rectangle "COMBAT_DAMAGE_PREVENTION\nForearm Block" as DP #EAF3FF
rectangle "COMBAT_DAMAGE_RESOLUTION" as DRES #E6FFF7
rectangle "COMBAT_WOULD_GO_TO_TORPOR\nAmaranth" as TORPOR #FFF7E6
rectangle "COMBAT_WOULD_BE_BURNED\nReform Body" as BURN #FFF7E6
rectangle "COMBAT_ADDITIONAL_STRIKE\nBlur" as AS #EAF3FF
rectangle "COMBAT_PRESS_STEP\nPsyche! basic" as PRESS #EAF3FF
rectangle "COMBAT_END_OF_ROUND\nTaste of Vitae" as EOR #EAF3FF
rectangle "COMBAT_WOULD_END\nTelepathic Tracking superior" as WOULDEND #FFF7E6
rectangle "COMBAT_ABOUT_TO_END\nPsyche! superior" as ABOUT #FFF7E6
rectangle "COMBAT_AFTER_ENDS\nForm of Mist" as AFTER #EAF3FF

BR --> DR
DR --> BS
BS --> SD
SD --> BSR
BSR --> DP
DP --> DRES
DRES --> TORPOR
TORPOR --> AS
DRES --> BURN
BURN --> AS
DRES --> AS
AS --> SD : additional strike
AS --> PRESS : no additional strike
PRESS --> BR : continue
PRESS --> EOR : end round
EOR --> WOULDEND
WOULDEND --> BR : new round
WOULDEND --> ABOUT : still ending
ABOUT --> AFTER
@enduml
```

---

## 4. Scenario Trace Card

Use this for one tricky edge case. This example traces Amaranth replacing torpor with diablerie during combat.

```plantuml
@startuml
title Scenario Trace - Amaranth During Combat
left to right direction

skinparam rectangle {
    RoundCorner 12
}

rectangle "Setup:\nA combat result would move\nthe opposing vampire to torpor" as Setup #F6F8FA
rectangle "COMBAT_DAMAGE_RESOLUTION\npending torpor result exists" as Damage #E6FFF7
rectangle "COMBAT_WOULD_GO_TO_TORPOR\ntorpor replacement window" as Torpor #EAF3FF
rectangle "CARD_AS_PLAYED\nAmaranth can be canceled\nas it is played" as CardPlay #F4EDFF
rectangle "DIABLERIE_CANCEL_OR_REPLACE\ndiablerie attempt begins" as Diablerie #FFECEC
rectangle "Blood Hunt\npolling -> result -> burn replacement" as BloodHunt #E6FFF7
rectangle "Return:\nresume combat ending at\nCOMBAT_END_OF_ROUND" as Return #FFF2CC

Setup --> Damage
Damage --> Torpor
Torpor --> CardPlay
CardPlay --> Diablerie
Diablerie --> BloodHunt
BloodHunt --> Return
@enduml
```

Reviewer prompts:

| Question | Expected answer |
|----------|-----------------|
| Is Amaranth a blood hunt card? | No. It replaces the pending torpor result. |
| Does `CARD_AS_PLAYED` replace `COMBAT_WOULD_GO_TO_TORPOR`? | No. It is nested inside the card play. |
| After blood hunt, is combat already fully cleared? | No. Combat still runs ending hooks. |

---

## 5. Decision Tree

Use this when the reader wants to answer "what happens next?" without learning every window name first.

```plantuml
@startuml
title Decision Tree - Action Outcome
top to bottom direction

skinparam rectangle {
    RoundCorner 12
}

rectangle "Action declared" as Declare #EAF3FF
rectangle "Action card\nfrom hand?" as ActionCard #FFF7E6
rectangle "Canceled\nas played?" as AsPlayed #FFF7E6
rectangle "Action announced" as Announce #EAF3FF
rectangle "Block succeeds?" as Block #FFF7E6
rectangle "Run combat" as Combat #FFF2CC
rectangle "Action\ncontinues?" as Continue #FFF7E6
rectangle "All blocks\ndeclined?" as Declined #FFF7E6
rectangle "Redirect or\ntarget change?" as Redirect #FFF7E6
rectangle "Resolution type" as Resolve #FFF7E6
rectangle "Run referendum" as Referendum #E6FFF7
rectangle "Run diablerie\nand blood hunt" as Diablerie #FFECEC
rectangle "Apply normal\naction effect" as Effect #EAF3FF
rectangle "ACTION_AFTER_RESOLUTION" as After #EAF3FF
rectangle "Return to action in progress" as InProgress #EAF3FF
rectangle "Clear action state" as Clear #F6F8FA

Declare --> ActionCard
ActionCard --> AsPlayed : yes
ActionCard --> Announce : no
AsPlayed --> Clear : yes
AsPlayed --> Announce : no
Announce --> Block
Block --> Combat : yes
Combat --> Continue
Continue --> InProgress : yes
Continue --> After : no
Block --> Declined : no
Declined --> InProgress : not yet
Declined --> Redirect : yes
Redirect --> InProgress : yes
Redirect --> Resolve : no
Resolve --> Referendum : political
Resolve --> Diablerie : diablerie
Resolve --> Effect : other
Referendum --> After
Diablerie --> After
Effect --> After
After --> Clear
@enduml
```

---

## 6. Window Matrix

Use this for card-text classification review. It is a table-first image: the goal is fast lookup rather than path following.

| Workflow | Early window | Middle window | Result or replacement | After / return |
|----------|--------------|---------------|-----------------------|----------------|
| Card Play | `CARD_AS_PLAYED` | replacement and cost | destination | enclosing workflow resumes |
| Action | `ACTION_AS_ANNOUNCED` | `ACTION_DURING_ACTION`, `ACTION_BLOCK_ATTEMPT`, `ACTION_STEALTH_INTERCEPT`, `ACTION_BLOCKS_DECLINED` | `ACTION_RESOLUTION_SUCCESS`, `ACTION_BLOCK_RESOLUTION_PRE_COMBAT` | `ACTION_CONTINUING`, `ACTION_AFTER_RESOLUTION` |
| Combat | `COMBAT_BEFORE_RANGE` | range, strikes, damage | `COMBAT_WOULD_GO_TO_TORPOR`, `COMBAT_WOULD_BE_BURNED`, `COMBAT_WOULD_END`, `COMBAT_ABOUT_TO_END` | `COMBAT_AFTER_ENDS`, enclosing action return |
| Referendum | `REFERENDUM_CHOOSE_TERMS` | `REFERENDUM_BEFORE_VOTES`, `REFERENDUM_POLLING` | `REFERENDUM_RESOLUTION` | `REFERENDUM_AFTER_RESOLUTION`, then action after-resolution |
| Diablerie | `DIABLERIE_CANCEL_OR_REPLACE` | blood transfer, equipment, burn victim | `DIABLERIE_AFTER_SUCCESS`, `TROPHY_AWARD_BEFORE_BLOOD_HUNT` | blood hunt |
| Blood Hunt | `BLOOD_HUNT_POLLING` | vote-source count | `BLOOD_HUNT_RESOLUTION`, `BLOOD_HUNT_WOULD_BURN_DIABLERIST` | enclosing workflow return |

Color-coding suggestion for a rendered image:

| Color | Meaning |
|-------|---------|
| Blue | Player card/effect window |
| Green | Automatic rules resolution |
| Amber | Decision, vote, or result branch |
| Purple | Nested card-play lifecycle |
| Red | Diablerie or burn-risk path |
