package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.entity.Tournament;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.TournamentFormat;
import net.deckserver.jol.enums.TournamentStatus;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;

@RegisterForReflection
public record TournamentDto(
    String id,
    String name,
    TournamentStatus status,
    TournamentFormat format,
    GameFormat gameFormat,
    int numberOfRounds,
    int originalNumberOfRounds,
    boolean finalRound,
    boolean requiresId,
    OffsetDateTime registrationStart,
    OffsetDateTime registrationEnd,
    OffsetDateTime playingStart,
    OffsetDateTime playingEnd,
    List<Tournament.Rule> rules,
    List<Tournament.Condition> conditions,
    Instant createdAt,
    Instant updatedAt
) {
    public static TournamentDto from(Tournament t) {
        return new TournamentDto(
            t.id,
            t.name,
            t.status,
            t.format,
            t.gameFormat,
            t.numberOfRounds,
            t.originalNumberOfRounds,
            t.finalRound,
            t.requiresId,
            t.registrationStart,
            t.registrationEnd,
            t.playingStart,
            t.playingEnd,
            t.rules,
            t.conditions,
            t.createdAt,
            t.updatedAt
        );
    }
}
