package net.deckserver.jol.enums;

/** Categories of eligibility restriction that can be imposed on a minion during an action or combat. */
public enum RestrictionType {
    // Blocking
    CANNOT_BLOCK,
    // Reactions
    CANNOT_REACT,
    // Action modifiers
    CANNOT_PLAY_MODIFIER,
    // Referendum
    CANNOT_VOTE,
    // Combat (applied to CombatState when implemented)
    CANNOT_MANEUVER,
    CANNOT_PRESS,
    CANNOT_USE_STRIKE_HAND,
    CANNOT_USE_STRIKE_RANGED,
    CANNOT_USE_ADDITIONAL_STRIKE,
}
