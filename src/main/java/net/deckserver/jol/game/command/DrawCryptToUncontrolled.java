package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public record DrawCryptToUncontrolled(String gameId) implements GameCommand {}
