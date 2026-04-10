package net.deckserver.jol.model.krcg;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

/**
 * A type group within the library section (e.g. "Action", "Action/Combat").
 * Multi-type cards produce a combined key joined by "/".
 */
@RegisterForReflection
public record KrcgLibraryGroup(String type, int count, List<KrcgCard> cards) {}
