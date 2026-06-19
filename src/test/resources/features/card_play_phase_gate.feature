Feature: Card type phase gate

  Scenario: Playing an EVENT card during MINION phase is rejected
    Given a 4-player game in "MINION" phase with rules enforced
    And "Alice" has an "Anthelios, The Red Star" EVENT card in hand
    When "Alice" plays "Anthelios, The Red Star" as an EVENT card
    Then a rule violation mentioning "phase" should occur

  Scenario: Playing an ACTION card during MASTER phase is rejected
    Given a 4-player game in "MASTER" phase with rules enforced
    And "Alice" has a "Govern the Unaligned" ACTION card in hand
    When "Alice" plays "Govern the Unaligned" as an ACTION card
    Then a rule violation mentioning "phase" should occur

  Scenario: Playing a MODIFIER card without an active action is rejected
    Given a 4-player game in "MINION" phase with rules enforced
    And "Alice" has a "Freak Drive" MODIFIER card in hand
    When "Alice" plays "Freak Drive" as a MODIFIER card
    Then a rule violation mentioning "action" should occur

  Scenario: Playing a REACTION card without an active action is rejected
    Given a 4-player game in "MINION" phase with rules enforced
    And "Alice" has a "Wake with Evening's Freshness" REACTION card in hand
    When "Alice" plays "Wake with Evening's Freshness" as a REACTION card
    Then a rule violation mentioning "action" should occur
