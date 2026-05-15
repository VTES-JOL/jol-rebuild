package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

/** Attaches a card as a child of another card (e.g. retainer/equipment on a vampire, or merge). */
@RegisterForReflection
public record AttachCard(String gameId, CardRef ref, CardRef targetRef) implements GameCommand {}
