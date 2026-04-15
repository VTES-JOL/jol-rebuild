package net.deckserver.jol.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.BadRequestException;
import net.deckserver.jol.dto.SeatingDto;
import net.deckserver.jol.dto.SeatingDto.*;
import net.deckserver.jol.entity.*;
import net.deckserver.jol.enums.Status;
import net.deckserver.jol.enums.TournamentFormat;
import net.deckserver.jol.enums.Visibility;

import java.time.OffsetDateTime;
import java.util.*;
import java.util.stream.Collectors;

@ApplicationScoped
public class TournamentService {

    /**
     * Creates games and registers players for every table in the tournament.
     * Called within an active @Transactional context.
     */
    public void activate(Tournament tournament, User admin) {
        validateAllPlayersSeated(tournament);

        List<TournamentTable> tables = TournamentTable.findByTournament(tournament);
        // Group tables by round so we can determine deck consumption order per player
        Map<Integer, List<TournamentTable>> byRound = tables.stream()
            .collect(Collectors.groupingBy(t -> t.roundNumber));

        // For MULTI_DECK, track how many non-bye rounds each player has played so far
        Map<Long, Integer> roundsPlayed = new HashMap<>();

        List<Integer> roundNumbers = byRound.keySet().stream().sorted().toList();
        int tableCounter = 0;
        for (int roundNumber : roundNumbers) {
            List<TournamentTable> roundTables = byRound.get(roundNumber);
            roundTables.sort(Comparator.comparingLong(t -> t.id));
            tableCounter = 0;
            for (TournamentTable table : roundTables) {
                tableCounter++;
                String gameName = "Round " + roundNumber + " Table " + tableCounter;
                Game game = Game.create(admin, tournament, gameName, Visibility.PRIVATE, tournament.gameFormat);
                game.status = Status.ACTIVE;
                game.persist();
                table.game = game;

                List<TournamentSeat> nonByeSeats = table.seats.stream()
                    .filter(s -> !s.bye)
                    .sorted(Comparator.comparingInt(s -> s.seatPosition))
                    .toList();

                for (TournamentSeat seat : nonByeSeats) {
                    TournamentRegistration reg = seat.registration;
                    User player = reg.user;

                    TournamentRegistration.DeckEntry deckEntry = getDeckForPlayer(reg, roundsPlayed);

                    Registration gameReg = new Registration();
                    gameReg.game = game;
                    gameReg.user = player;
                    gameReg.deck = deckEntry.deck;
                    gameReg.deckName = deckEntry.deckName;
                    gameReg.summary = deckEntry.summary;
                    gameReg.lastUpdated = OffsetDateTime.now();
                    gameReg.persist();
                    game.registrations.add(gameReg);
                    player.registrations.add(gameReg);

                    roundsPlayed.merge(reg.id, 1, Integer::sum);
                }
            }
        }
    }

    private TournamentRegistration.DeckEntry getDeckForPlayer(TournamentRegistration reg, Map<Long, Integer> roundsPlayed) {
        if (reg.tournament.format == TournamentFormat.SINGLE_DECK) {
            return reg.decks.get(0);
        }
        int index = roundsPlayed.getOrDefault(reg.id, 0);
        if (index >= reg.decks.size()) {
            // Fallback: reuse last registered deck if we run out (shouldn't happen with correct registration)
            return reg.decks.get(reg.decks.size() - 1);
        }
        return reg.decks.get(index);
    }

    private void validateAllPlayersSeated(Tournament tournament) {
        List<TournamentRegistration> allRegs = TournamentRegistration.findByTournament(tournament);
        int totalRounds = tournament.numberOfRounds;
        List<String> unseated = new ArrayList<>();

        for (TournamentRegistration reg : allRegs) {
            for (int round = 1; round <= totalRounds; round++) {
                TournamentSeat seat = TournamentSeat.findByRoundAndRegistration(tournament, round, reg);
                if (seat == null) {
                    unseated.add(reg.user.username + " (round " + round + ")");
                }
            }
        }

        if (!unseated.isEmpty()) {
            throw new BadRequestException("Not all players are seated: " + String.join(", ", unseated));
        }
    }

    /**
     * Builds the SeatingDto for the given tournament.
     */
    public SeatingDto buildSeatingDto(Tournament tournament) {
        List<TournamentRegistration> allRegs = TournamentRegistration.findByTournament(tournament);
        List<TournamentTable> allTables = TournamentTable.findByTournament(tournament);

        // Collect all registration IDs that have been seated in each round
        Set<Long> seatedRegIds = new HashSet<>();
        allTables.forEach(t -> t.seats.forEach(s -> seatedRegIds.add(s.registration.id)));

        Map<Integer, List<TournamentTable>> byRound = allTables.stream()
            .collect(Collectors.groupingBy(t -> t.roundNumber));

        List<RoundDto> rounds = new ArrayList<>();
        for (int round = 1; round <= tournament.numberOfRounds; round++) {
            List<TournamentTable> tables = byRound.getOrDefault(round, List.of());
            tables.sort(Comparator.comparingLong(t -> t.id));

            List<TableDto> tableDtos = tables.stream().map(table -> {
                List<SeatDto> seats = table.seats.stream()
                    .map(s -> new SeatDto(s.id, s.registration.id, s.registration.user.username, s.seatPosition, s.bye))
                    .sorted(Comparator.comparingInt(SeatDto::seatPosition))
                    .toList();
                return new TableDto(table.id, seats);
            }).toList();

            // Explicit bye seats for this round
            final int r = round;
            List<SeatDto> byeDtos = TournamentSeat.findByesByTournamentAndRound(tournament, r).stream()
                .map(s -> new SeatDto(s.id, s.registration.id, s.registration.user.username, 0, true))
                .toList();

            // Players not yet allocated for this round (neither in a table nor given a bye)
            Set<Long> allocatedIds = new HashSet<>();
            tableDtos.forEach(t -> t.seats().forEach(s -> allocatedIds.add(s.registrationId())));
            byeDtos.forEach(b -> allocatedIds.add(b.registrationId()));
            List<UnseatedPlayerDto> roundUnseated = allRegs.stream()
                .filter(reg -> !allocatedIds.contains(reg.id))
                .map(reg -> new UnseatedPlayerDto(reg.id, reg.user.username))
                .toList();

            rounds.add(new RoundDto(round, tableDtos, byeDtos, roundUnseated));
        }

        // Global unseated: players missing allocation in ANY round
        List<UnseatedPlayerDto> globalUnseated = allRegs.stream()
            .filter(reg -> {
                for (int r = 1; r <= tournament.numberOfRounds; r++) {
                    if (TournamentSeat.findByRoundAndRegistration(tournament, r, reg) == null) return true;
                }
                return false;
            })
            .map(reg -> new UnseatedPlayerDto(reg.id, reg.user.username))
            .toList();

        return new SeatingDto(rounds, globalUnseated);
    }
}
