package net.deckserver.jol.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public enum CryptType {
    @JsonProperty("Vampire") VAMPIRE,
    @JsonProperty("Imbued")  IMBUED
}
