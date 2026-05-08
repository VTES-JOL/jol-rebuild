package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

/** Unlock all cards for the specified player in READY and TORPOR regions. */
@RegisterForReflection
public record UnlockAll(String gameId, String playerName) implements GameCommand {}
