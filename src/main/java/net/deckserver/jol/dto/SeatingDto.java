package net.deckserver.jol.dto;

import io.quarkus.runtime.annotations.RegisterForReflection;

import java.util.List;

@RegisterForReflection
public record SeatingDto(
    List<RoundDto> rounds,
    List<UnseatedPlayerDto> unseated
) {
    @RegisterForReflection
    public record RoundDto(int roundNumber, List<TableDto> tables, List<SeatDto> byes, List<UnseatedPlayerDto> unseated) {}

    @RegisterForReflection
    public record TableDto(Long id, List<SeatDto> seats) {}

    @RegisterForReflection
    public record SeatDto(Long id, Long registrationId, String username, int seatPosition, boolean bye) {}

    @RegisterForReflection
    public record UnseatedPlayerDto(Long registrationId, String username) {}
}
