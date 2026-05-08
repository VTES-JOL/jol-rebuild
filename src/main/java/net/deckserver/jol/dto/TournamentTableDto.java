package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.entity.TournamentTable;

import java.time.Instant;

@RegisterForReflection
public record TournamentTableDto(String id, Instant createdAt) {
    public static TournamentTableDto from(TournamentTable t) {
        return new TournamentTableDto(t.id, t.createdAt);
    }
}