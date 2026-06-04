package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record MergeAdvanced(String gameId, CardRef ref, CardRef targetRef) implements GameCommand {
    @Override public boolean isPermissiveOnly() { return true; }
}
