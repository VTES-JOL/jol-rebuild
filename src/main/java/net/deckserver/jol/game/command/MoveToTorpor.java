package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record MoveToTorpor(String gameId, CardRef ref) implements GameCommand {
    @Override public boolean isPermissiveOnly() { return true; }
}
