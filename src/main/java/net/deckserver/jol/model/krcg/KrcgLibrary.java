package net.deckserver.jol.model.krcg;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

/**
 * The library section of a KRCG deck: total count plus type-grouped card lists.
 */
@RegisterForReflection
public record KrcgLibrary(int count, List<KrcgLibraryGroup> cards) {}
