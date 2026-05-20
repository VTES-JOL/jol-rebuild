package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;

/** Move a fully influenced vampire/imbued from UNCONTROLLED to the READY region. */
@RegisterForReflection
public record InfluenceCard(String gameId, CardRef ref) implements GameCommand {}
