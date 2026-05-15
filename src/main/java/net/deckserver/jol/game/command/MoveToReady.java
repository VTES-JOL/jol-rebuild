package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

/** Move a fully influenced vampire from UNCONTROLLED to the READY region. */
@RegisterForReflection
public record MoveToReady(String gameId, CardRef ref) implements GameCommand {}
