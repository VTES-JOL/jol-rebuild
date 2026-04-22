package net.deckserver.jol.services;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.BadRequestException;
import net.deckserver.jol.dto.SeatingDto;
import net.deckserver.jol.dto.SeatingDto.RoundDto;
import net.deckserver.jol.dto.SeatingDto.SeatDto;
import net.deckserver.jol.dto.SeatingDto.TableDto;
import net.deckserver.jol.dto.SeatingDto.UnseatedPlayerDto;
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

        List<TournamentSeat> allSeats = TournamentSeat.findAllByTournament(tournament);
        List<TournamentTable> tables = TournamentTable.findByTournament(tournament);
        Map<String, TournamentTable> tableMap = tables.stream().collect(Collectors.toMap(t -> t.id, t -> t));

        // Group non-bye seats by round → table id (sorted)
        Map<Integer, Map<String, List<TournamentSeat>>> byRound = new HashMap<>();
        for (TournamentSeat seat : allSeats) {
            if (!seat.bye) {
                byRound.computeIfAbsent(seat.roundNumber, r -> new HashMap<>())
                       .computeIfAbsent(seat.table.id, tid -> new ArrayList<>())
                       .add(seat);
            }
        }

        Map<String, Integer> roundsPlayed = new HashMap<>();
        List<Integer> roundNumbers = byRound.keySet().stream().sorted().toList();

        for (int roundNumber : roundNumbers) {
            Map<String, List<TournamentSeat>> seatsByTable = byRound.get(roundNumber);
            List<String> tableIds = seatsByTable.keySet().stream().sorted().toList();
            int tableCounter = 0;
            for (String tableId : tableIds) {
                tableCounter++;
                List<TournamentSeat> roundSeats = new ArrayList<>(seatsByTable.get(tableId));
                roundSeats.sort(Comparator.comparingInt(s -> s.seatPosition));

                String gameName = tournament.name + ": Round " + roundNumber + " Table " + tableCounter;
                Game game = Game.create(admin, tournament, gameName, Visibility.PRIVATE, tournament.gameFormat);
                game.status = Status.ACTIVE;
                game.persist();

                TournamentTableGame ttg = new TournamentTableGame();
                ttg.table = tableMap.get(tableId);
                ttg.roundNumber = roundNumber;
                ttg.game = game;
                ttg.persist();

                registerPlayersForGame(game, roundSeats, roundsPlayed);
            }
        }
    }

    private void registerPlayersForGame(Game game, List<TournamentSeat> seats, Map<String, Integer> roundsPlayed) {
        for (TournamentSeat seat : seats) {
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

    private TournamentRegistration.DeckEntry getDeckForPlayer(TournamentRegistration reg, Map<String, Integer> roundsPlayed) {
        if (reg.tournament.format == TournamentFormat.SINGLE_DECK) {
            return reg.decks.getFirst();
        }
        int index = roundsPlayed.getOrDefault(reg.id, 0);
        if (index >= reg.decks.size()) {
            return reg.decks.getLast();
        }
        return reg.decks.get(index);
    }

    private void validateAllPlayersSeated(Tournament tournament) {
        List<TournamentRegistration> allRegs = TournamentRegistration.findByTournament(tournament);
        int totalRounds = tournament.numberOfRounds;

        List<TournamentSeat> allSeats = TournamentSeat.findAllByTournament(tournament);
        Set<String> allocatedKeys = new HashSet<>();
        for (TournamentSeat seat : allSeats) {
            allocatedKeys.add(seat.registration.id + ":" + seat.roundNumber);
        }

        List<String> unseated = new ArrayList<>();
        for (TournamentRegistration reg : allRegs) {
            for (int round = 1; round <= totalRounds; round++) {
                if (!allocatedKeys.contains(reg.id + ":" + round)) {
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
     * All tables appear in every round so the admin can assign seats per round.
     */
    public SeatingDto buildSeatingDto(Tournament tournament) {
        List<TournamentRegistration> allRegs = TournamentRegistration.findByTournament(tournament);
        List<TournamentTable> allTables = TournamentTable.findByTournament(tournament);
        List<TournamentSeat> allSeats = TournamentSeat.findAllByTournament(tournament);

        List<RoundDto> rounds = new ArrayList<>();
        for (int r = 1; r <= tournament.numberOfRounds; r++) {
            final int round = r;

            List<TableDto> tableDtos = allTables.stream()
                .sorted(Comparator.comparing(t -> t.id))
                .map(table -> {
                    List<SeatDto> seats = allSeats.stream()
                        .filter(s -> !s.bye && s.roundNumber == round
                                  && s.table != null && s.table.id.equals(table.id))
                        .sorted(Comparator.comparingInt(s -> s.seatPosition))
                        .map(s -> new SeatDto(s.id, s.registration.id, s.registration.user.username, s.seatPosition, false))
                        .toList();
                    return new TableDto(table.id, seats);
                })
                .toList();

            List<SeatDto> byeDtos = allSeats.stream()
                .filter(s -> s.bye && s.roundNumber == round)
                .map(s -> new SeatDto(s.id, s.registration.id, s.registration.user.username, 0, true))
                .toList();

            Set<String> allocatedIds = new HashSet<>();
            tableDtos.forEach(t -> t.seats().forEach(s -> allocatedIds.add(s.registrationId())));
            byeDtos.forEach(b -> allocatedIds.add(b.registrationId()));

            List<UnseatedPlayerDto> roundUnseated = allRegs.stream()
                .filter(reg -> !allocatedIds.contains(reg.id))
                .map(reg -> new UnseatedPlayerDto(reg.id, reg.user.username))
                .toList();

            rounds.add(new RoundDto(round, tableDtos, byeDtos, roundUnseated));
        }

        // Global unseated: players missing allocation in any round
        Set<String> allocatedKeys = new HashSet<>();
        for (TournamentSeat seat : allSeats) {
            allocatedKeys.add(seat.registration.id + ":" + seat.roundNumber);
        }
        List<UnseatedPlayerDto> globalUnseated = allRegs.stream()
            .filter(reg -> {
                for (int r = 1; r <= tournament.numberOfRounds; r++) {
                    if (!allocatedKeys.contains(reg.id + ":" + r)) return true;
                }
                return false;
            })
            .map(reg -> new UnseatedPlayerDto(reg.id, reg.user.username))
            .toList();

        return new SeatingDto(rounds, globalUnseated);
    }
}