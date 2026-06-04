package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

/** Move blood from the player's pool to an uncontrolled vampire during the influence phase. */
@RegisterForReflection
public record TransferBlood(String gameId, CardRef ref, int amount) implements GameCommand {
    @Override public boolean isPermissiveOnly() { return true; }
}
