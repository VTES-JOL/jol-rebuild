package net.deckserver.jol.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import io.quarkus.runtime.annotations.RegisterForReflection;

@RegisterForReflection
public enum CryptType {
    @JsonProperty("Vampire") VAMPIRE,
    @JsonProperty("Imbued")  IMBUED
}
