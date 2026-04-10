package net.deckserver.jol.model.krcg;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

/**
 * The crypt section of a KRCG deck: total count plus a flat list of vampire/imbued cards.
 */
@RegisterForReflection
public record KrcgCrypt(int count, List<KrcgCard> cards) {}
