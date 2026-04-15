package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;
import net.deckserver.jol.entity.TournamentRegistration;

import java.util.List;

@RegisterForReflection
public record TournamentRegistrationDto(
    Long id,
    String userId,
    String username,
    List<DeckEntryDto> decks
) {
    @RegisterForReflection
    public record DeckEntryDto(String deckName, String summary) {}

    public static TournamentRegistrationDto from(TournamentRegistration reg) {
        List<DeckEntryDto> deckDtos = reg.decks.stream()
            .map(d -> new DeckEntryDto(d.deckName, d.summary))
            .toList();
        return new TournamentRegistrationDto(reg.id, reg.user.id, reg.user.username, deckDtos);
    }
}
