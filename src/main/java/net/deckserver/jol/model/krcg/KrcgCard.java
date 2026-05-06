package net.deckserver.jol.model.krcg;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import io.quarkus.runtime.annotations.RegisterForReflection;

/**
 * A single card entry as it appears in KRCG JSON — used in both crypt and
 * library (as the leaf nodes inside each type group).
 * KRCG spec uses integer IDs; we normalise to String on deserialisation so the
 * rest of the application can treat IDs uniformly. The {@link JsonCreator}
 * factory accepts both {@code "id": 200204} and {@code "id": "200204"}.
 */
@RegisterForReflection
public record KrcgCard(String id, int count, String name) {

    @JsonCreator
    public static KrcgCard of(
            @JsonProperty("id")    JsonNode id,
            @JsonProperty("count") int count,
            @JsonProperty("name")  String name) {
        return new KrcgCard(id.asText(), count, name);
    }
}
