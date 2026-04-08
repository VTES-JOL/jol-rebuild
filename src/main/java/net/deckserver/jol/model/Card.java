package net.deckserver.jol.model;

import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

import java.util.List;

@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, property = "kind")
@JsonSubTypes({
        @JsonSubTypes.Type(value = CryptCard.class,   name = "crypt"),
        @JsonSubTypes.Type(value = LibraryCard.class, name = "library")
})
public sealed interface Card permits CryptCard, LibraryCard {
    String id();
    String name();
    List<String> aka();
    String cardText();
    String artist();
    boolean banned();
}