package net.deckserver.jol.model;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;
import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

@RegisterForReflection
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "kind")
@JsonSubTypes({
        @JsonSubTypes.Type(value = CryptCard.class,   name = "crypt"),
        @JsonSubTypes.Type(value = LibraryCard.class, name = "library")
})
public sealed interface Card permits CryptCard, LibraryCard {
    String id();
    String name();
    List<String> aka();
    List<String> sets();
    String cardText();
    String artist();
    boolean banned();
}