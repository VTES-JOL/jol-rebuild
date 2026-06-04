package net.deckserver.jol.game.effect;

import net.deckserver.jol.game.SequencingWindowState;

/** The sequencing window was opened, updated, or closed. state is null when active=false. */
public record SequencingWindowChangedEffect(boolean active, SequencingWindowState state) implements GameEffect {
    public SequencingWindowChangedEffect(boolean active) {
        this(active, null);
    }
}
