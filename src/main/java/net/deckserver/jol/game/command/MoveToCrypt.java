package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

/** Return a vampire from UNCONTROLLED back to CRYPT (influence cancelled). */
@RegisterForReflection
public record MoveToCrypt(String gameId, String cardId) implements GameCommand {}
