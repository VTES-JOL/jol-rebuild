package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

/** Burn a minion from READY or TORPOR to the ASH_HEAP. */
@RegisterForReflection
public record BurnMinion(String gameId, CardRef ref) implements GameCommand {}
