package net.deckserver.jol.game.command;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.enums.CardType;
import net.deckserver.jol.enums.RegionType;

/**
 * Play a card from HAND or RESEARCH. In enforced mode, phase/type/actor gates apply.
 * playAsType selects the resolution path for dual-type cards; null infers from card.getType().
 */
@RegisterForReflection
public record PlayCard(String gameId, CardRef ref, String targetPlayerName, RegionType targetRegionType, CardType playAsType) implements GameCommand {}
