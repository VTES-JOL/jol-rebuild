package net.deckserver.jol.game.effect;

import net.deckserver.jol.game.PendingActionState;

/** The pending action state was created, updated, or cleared. state is null when active=false. */
public record PendingActionChangedEffect(boolean active, PendingActionState state) implements GameEffect {
    public PendingActionChangedEffect(boolean active) {
        this(active, null);
    }
}
