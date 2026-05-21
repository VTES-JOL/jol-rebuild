package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record DrawCrypt(String gameId, int count) implements GameCommand {}
