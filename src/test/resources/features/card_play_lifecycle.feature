Feature: Card play lifecycle

  Background:
    Given a 4-player game in "MINION" phase with rules enforced
    And "Alice" controls a ready vampire "Dima" with 3 blood and capacity 5

  Scenario: Playing an action card opens the CARD_AS_PLAYED window
    And "Alice" has an "Govern the Unaligned" ACTION card in hand
    When "Alice" declares a BLEED action
    And "Alice" plays "Govern the Unaligned" as an ACTION card
    Then the CARD_AS_PLAYED window should be open
    And "Govern the Unaligned" should be in action limbo
    And no rule violation should occur

  Scenario: After CARD_AS_PLAYED window closes, a replacement card is drawn
    And "Alice" has an "Govern the Unaligned" ACTION card in hand
    And "Alice" has a "Dummy" ACTION card in library
    When "Alice" declares a BLEED action
    And "Alice" plays "Govern the Unaligned" as an ACTION card
    And "Alice" snapshots her hand size
    And all players pass the card-as-played window
    Then "Alice"'s hand size should increase by 1

  Scenario: Playing a MASTER card during MINION phase is rejected
    And "Alice" has a "Blood Doll" MASTER card in hand
    When "Alice" plays "Blood Doll" as a MASTER card
    Then a rule violation mentioning "phase" should occur

  Scenario: Playing a MASTER card during MASTER phase succeeds
    Given a 4-player game in "MASTER" phase with rules enforced
    And "Alice" has a "Blood Doll" MASTER card in hand
    When "Alice" plays "Blood Doll" as a MASTER card
    Then the CARD_AS_PLAYED window should be open
    And no rule violation should occur

  Scenario: Non-acting player may play a REACTION card
    And "Bob" controls a ready vampire "Meridian" with 3 blood and capacity 5
    And "Bob" has a "Wake with Evening's Freshness" REACTION card in hand
    When "Alice" declares a BLEED action
    And "Alice" passes the impulse
    And "Bob" plays "Wake with Evening's Freshness" as a REACTION card
    Then the CARD_AS_PLAYED window should be open
    And no rule violation should occur

  Scenario: Acting player may not play a REACTION card
    And "Alice" has a "Wake with Evening's Freshness" REACTION card in hand
    When "Alice" declares a BLEED action
    And "Alice" plays "Wake with Evening's Freshness" as a REACTION card
    Then a rule violation mentioning "reaction" should occur
