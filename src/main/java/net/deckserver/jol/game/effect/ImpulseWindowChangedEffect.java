package net.deckserver.jol.game.effect;

import net.deckserver.jol.game.ImpulseState;

/** The impulse window was opened, updated, or closed. state is null when active=false. */
public record ImpulseWindowChangedEffect(boolean active, ImpulseState state) implements GameEffect {
    public ImpulseWindowChangedEffect(boolean active) {
        this(active, null);
    }
}
