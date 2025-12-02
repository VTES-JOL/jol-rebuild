package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public class RegistrationDto {
    public String deck;
    public String name;
    public String summary;

    public RegistrationDto(String deck, String name, String summary) {
        this.deck = deck;
        this.name = name;
        this.summary = summary;
    }
}
