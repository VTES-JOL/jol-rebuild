package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record SetPool(String gameId, String playerName, int amount) implements GameCommand {
    @Override public boolean isPermissiveOnly() { return true; }
}
