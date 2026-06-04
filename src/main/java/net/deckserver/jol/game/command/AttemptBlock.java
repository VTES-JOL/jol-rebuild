package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record AttemptBlock(
        String gameId,
        CardRef blockerRef
) implements GameCommand {
    // Not impulse-exempt: player must hold the impulse to attempt a block.
    @Override public boolean isSequencingExempt() { return true; }
    @Override public boolean isEnforcedOnly() { return true; }
}