package net.deckserver.jol.enums;

public enum ActionStatus {
    /** Reserved for future AS_ANNOUNCED interrupt window; bypassed for now. */
    AS_ANNOUNCED,
    DURING_ACTION,
    BLOCKED,
    AFTER_RESOLUTION,
    /** Set when a "continue the action" effect fires after combat; re-enters block-attempt loop. */
    ACTION_CONTINUING
}
