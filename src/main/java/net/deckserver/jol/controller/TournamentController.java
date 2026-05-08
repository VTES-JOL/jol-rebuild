package net.deckserver.jol.controller;

import io.quarkus.runtime.annotations.RegisterForReflection;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import net.deckserver.jol.dto.SeatingDto;
import net.deckserver.jol.dto.TournamentDto;
import net.deckserver.jol.dto.TournamentRegistrationDto;
import net.deckserver.jol.dto.TournamentTableDto;
import net.deckserver.jol.entity.*;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.TournamentFormat;
import net.deckserver.jol.enums.TournamentStatus;
import net.deckserver.jol.config.Config;
import net.deckserver.jol.services.TournamentService;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Path("/api/tournaments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TournamentController {

    @Inject
    Config config;

    private static final List<TournamentStatus> PLAYER_VISIBLE_STATUSES = List.of(
        TournamentStatus.REGISTRATION, TournamentStatus.SEATING, TournamentStatus.ACTIVE,
        TournamentStatus.SEEDING, TournamentStatus.FINALS, TournamentStatus.COMPLETED
    );

    @Inject
    SecurityIdentity identity;

    @Inject
    TournamentService tournamentService;

    // ─── Core CRUD ────────────────────────────────────────────────────────────

    @GET
    public List<TournamentDto> list(
            @QueryParam("status") TournamentStatus status,
            @QueryParam("limit") @DefaultValue("100") int limit,
            @QueryParam("offset") @DefaultValue("0") int offset) {
        boolean isAdmin = identity.hasRole("TOURNAMENT_ADMIN");
        int clampedLimit = Math.min(limit, 500);
        if (status != null) {
            if (!isAdmin && !PLAYER_VISIBLE_STATUSES.contains(status)) {
                return List.of();
            }
            return Tournament.findByStatus(status).stream().map(TournamentDto::from).toList();
        }
        if (isAdmin) {
            return Tournament.<Tournament>findAll()
                .range(offset, offset + clampedLimit - 1)
                .list().stream().map(TournamentDto::from).toList();
        }
        return Tournament.<Tournament>find("status in ?1", PLAYER_VISIBLE_STATUSES)
            .range(offset, offset + clampedLimit - 1)
            .list().stream().map(TournamentDto::from).toList();
    }

    @GET
    @Path("/{id}")
    public TournamentDto get(@PathParam("id") String id) {
        Tournament tournament = Tournament.findById(id);
        if (tournament == null) throw new NotFoundException();
        if (!identity.hasRole("TOURNAMENT_ADMIN") && !PLAYER_VISIBLE_STATUSES.contains(tournament.status)) {
            throw new NotFoundException();
        }
        return TournamentDto.from(tournament);
    }

    @POST
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public TournamentDto create(CreateTournamentCommand command) {
        Tournament tournament = new Tournament();
        tournament.name = command.name();
        tournament.format = command.format() != null ? command.format() : TournamentFormat.SINGLE_DECK;
        tournament.gameFormat = command.gameFormat() != null ? command.gameFormat() : GameFormat.STANDARD;
        tournament.numberOfRounds = command.numberOfRounds() != null ? command.numberOfRounds() : 2;
        tournament.finalRound = command.finalRound();
        tournament.requiresId = command.requiresId();
        tournament.registrationStart = command.registrationStart();
        tournament.registrationEnd = command.registrationEnd();
        tournament.playingStart = command.playingStart();
        tournament.playingEnd = command.playingEnd();
        tournament.rules = command.rules() != null ? command.rules() : new ArrayList<>();
        tournament.conditions = command.conditions() != null ? command.conditions() : new ArrayList<>();
        tournament.status = TournamentStatus.SETUP;
        tournament.persist();
        return TournamentDto.from(tournament);
    }

    @PUT
    @Path("/{id}")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public TournamentDto update(@PathParam("id") String id, UpdateTournamentCommand command) {
        Tournament entity = Tournament.findById(id);
        if (entity == null) throw new NotFoundException();
        if (!entity.canPublish()) {
            throw new ForbiddenException("Can only edit tournaments in SETUP status");
        }
        if (command.numberOfRounds() > config.tournament().maxRounds()) {
            throw new BadRequestException("Maximum number of rounds is " + config.tournament().maxRounds());
        }
        entity.name = command.name();
        entity.registrationStart = command.registrationStart();
        entity.registrationEnd = command.registrationEnd();
        entity.playingStart = command.playingStart();
        entity.playingEnd = command.playingEnd();
        entity.format = command.format();
        entity.gameFormat = command.gameFormat();
        entity.numberOfRounds = command.numberOfRounds();
        entity.finalRound = command.finalRound();
        entity.requiresId = command.requiresId();
        entity.rules = command.rules();
        entity.conditions = command.conditions();
        return TournamentDto.from(entity);
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public void delete(@PathParam("id") String id) {
        Tournament entity = Tournament.findById(id);
        if (entity == null) throw new NotFoundException();
        entity.delete();
    }

    // ─── Status Transitions ───────────────────────────────────────────────────

    @POST
    @Path("/{id}/publish")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public TournamentDto publish(@PathParam("id") String id) {
        Tournament t = require(id);
        if (!t.canPublish()) {
            throw new BadRequestException("Tournament must be in SETUP status to publish");
        }
        t.status = TournamentStatus.REGISTRATION;
        return TournamentDto.from(t);
    }

    @POST
    @Path("/{id}/unpublish")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public TournamentDto unpublish(@PathParam("id") String id) {
        Tournament t = require(id);
        if (!t.canBeginSeating()) {
            throw new BadRequestException("Tournament must be in REGISTRATION status to unpublish");
        }
        TournamentRegistration.delete("tournament.id = ?1", id);
        t.status = TournamentStatus.SETUP;
        return TournamentDto.from(t);
    }

    @POST
    @Path("/{id}/seat")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public TournamentDto beginSeating(@PathParam("id") String id) {
        Tournament t = require(id);
        if (!t.canBeginSeating()) {
            throw new BadRequestException("Tournament must be in REGISTRATION status to begin seating");
        }
        t.originalNumberOfRounds = t.numberOfRounds;
        t.status = TournamentStatus.SEATING;
        return TournamentDto.from(t);
    }

    @POST
    @Path("/{id}/activate")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public TournamentDto activate(@PathParam("id") String id) {
        Tournament t = require(id);
        if (!t.canActivate()) {
            throw new BadRequestException("Tournament must be in SEATING status to activate");
        }
        User admin = currentUser();
        tournamentService.activate(t, admin);
        t.status = TournamentStatus.ACTIVE;
        return TournamentDto.from(t);
    }

    // ─── Player Registration ──────────────────────────────────────────────────

    @GET
    @Path("/{id}/registrations")
    @RolesAllowed({"USER"})
    public List<TournamentRegistrationDto> getRegistrations(@PathParam("id") String id) {
        Tournament t = require(id);
        return TournamentRegistration.findByTournament(t).stream()
            .map(TournamentRegistrationDto::from)
            .toList();
    }

    @POST
    @Path("/{id}/registrations")
    @Transactional
    @RolesAllowed("USER")
    public Response register(@PathParam("id") String id, RegisterForTournamentCommand command) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.REGISTRATION) {
            throw new WebApplicationException("Tournament is not open for registration", Response.Status.CONFLICT);
        }
        OffsetDateTime now = OffsetDateTime.now();
        if (t.registrationStart != null && now.isBefore(t.registrationStart)) {
            throw new WebApplicationException("Registration has not started yet", Response.Status.CONFLICT);
        }
        if (t.registrationEnd != null && now.isAfter(t.registrationEnd)) {
            throw new WebApplicationException("Registration has closed", Response.Status.CONFLICT);
        }

        User me = currentUser();
        if (TournamentRegistration.findByTournamentAndUser(t, me) != null) {
            throw new WebApplicationException("Already registered for this tournament", Response.Status.CONFLICT);
        }

        int expectedDecks = t.format == TournamentFormat.SINGLE_DECK ? 1 : t.numberOfRounds;
        if (command.deckIds() == null || command.deckIds().size() != expectedDecks) {
            throw new BadRequestException("Expected " + expectedDecks + " deck(s) for " + t.format + " tournament");
        }

        TournamentRegistration reg = new TournamentRegistration();
        reg.tournament = t;
        t.registrations.add(reg);
        reg.user = me;

        for (String deckId : command.deckIds()) {
            Deck deck = Deck.findById(deckId);
            if (deck == null || !deck.user.id.equals(me.id)) {
                throw new WebApplicationException("Deck " + deckId + " not found", Response.Status.NOT_FOUND);
            }
            boolean valid = DeckFormatValidity.findByDeckAndFormat(deckId, t.gameFormat)
                .map(v -> v.valid).orElse(false);
            if (!valid) {
                throw new BadRequestException("Deck '" + deck.name + "' is not valid for " + t.gameFormat);
            }
            TournamentRegistration.DeckEntry entry = new TournamentRegistration.DeckEntry();
            entry.deck = deck.contents;
            entry.deckName = deck.name;
            entry.summary = deck.summary;
            reg.decks.add(entry);
        }

        reg.persist();
        return Response.ok(TournamentRegistrationDto.from(reg)).build();
    }

    @DELETE
    @Path("/{id}/registrations")
    @Transactional
    @RolesAllowed("USER")
    public Response unregister(@PathParam("id") String id) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.REGISTRATION) {
            throw new WebApplicationException("Cannot leave tournament outside of registration period", Response.Status.CONFLICT);
        }
        User me = currentUser();
        TournamentRegistration reg = TournamentRegistration.findByTournamentAndUser(t, me);
        if (reg == null) {
            throw new NotFoundException("Not registered for this tournament");
        }
        reg.delete();
        return Response.noContent().build();
    }

    // ─── Seating Management ───────────────────────────────────────────────────

    @GET
    @Path("/{id}/seating")
    @RolesAllowed({"USER", "TOURNAMENT_ADMIN"})
    public SeatingDto getSeating(@PathParam("id") String id) {
        Tournament t = require(id);
        return tournamentService.buildSeatingDto(t);
    }

    @POST
    @Path("/{id}/tables")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public Response addTable(@PathParam("id") String id) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.SEATING) {
            throw new BadRequestException("Tournament must be in SEATING status to manage tables");
        }
        TournamentTable table = new TournamentTable();
        table.tournament = t;
        t.tables.add(table);
        table.persist();
        return Response.ok(TournamentTableDto.from(table)).build();
    }

    @DELETE
    @Path("/{id}/tables/{tableId}")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public Response removeTable(@PathParam("id") String id, @PathParam("tableId") String tableId) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.SEATING) {
            throw new BadRequestException("Tournament must be in SEATING status to manage tables");
        }
        TournamentTable table = TournamentTable.findById(tableId);
        if (table == null || !table.tournament.id.equals(id)) throw new NotFoundException();
        table.delete();
        return Response.noContent().build();
    }

    @POST
    @Path("/{id}/tables/{tableId}/seats")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public Response addSeat(@PathParam("id") String id, @PathParam("tableId") String tableId, AddSeatCommand command) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.SEATING) {
            throw new BadRequestException("Tournament must be in SEATING status to manage seats");
        }
        if (command.roundNumber() < 1 || command.roundNumber() > t.numberOfRounds) {
            throw new BadRequestException("Round number must be between 1 and " + t.numberOfRounds);
        }
        TournamentTable table = TournamentTable.findById(tableId);
        if (table == null || !table.tournament.id.equals(id)) throw new NotFoundException();

        TournamentRegistration reg = TournamentRegistration.findById(command.registrationId());
        if (reg == null || !reg.tournament.id.equals(id)) throw new NotFoundException();

        TournamentSeat existing = TournamentSeat.findByRoundAndRegistration(t, command.roundNumber(), reg);
        if (existing != null) {
            throw new BadRequestException(reg.user.username + " is already allocated for round " + command.roundNumber());
        }

        long currentSeats = table.seats.stream().filter(s -> !s.bye && s.roundNumber == command.roundNumber()).count();
        if (currentSeats >= config.tournament().maxTableSize()) {
            throw new BadRequestException("Table is full (max " + config.tournament().maxTableSize() + " players)");
        }
        if (command.seatPosition() < 1 || command.seatPosition() > config.tournament().maxTableSize()) {
            throw new BadRequestException("Seat position must be between 1 and " + config.tournament().maxTableSize());
        }

        TournamentSeat seat = new TournamentSeat();
        seat.table = table;
        seat.registration = reg;
        seat.seatPosition = command.seatPosition();
        seat.roundNumber = command.roundNumber();
        seat.bye = false;
        seat.persist();
        table.seats.add(seat);
        return Response.noContent().build();
    }

    @DELETE
    @Path("/{id}/tables/{tableId}/seats/{seatId}")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public Response removeSeat(@PathParam("id") String id, @PathParam("tableId") String tableId, @PathParam("seatId") String seatId) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.SEATING) {
            throw new BadRequestException("Tournament must be in SEATING status to manage seats");
        }
        TournamentSeat seat = TournamentSeat.findById(seatId);
        if (seat == null || seat.table == null || !seat.table.id.equals(tableId)) throw new NotFoundException();
        seat.delete();
        return Response.noContent().build();
    }

    @POST
    @Path("/{id}/rounds/{roundNumber}/byes")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public Response addBye(@PathParam("id") String id, @PathParam("roundNumber") int roundNumber, AddByeCommand command) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.SEATING) {
            throw new BadRequestException("Tournament must be in SEATING status to manage byes");
        }
        if (roundNumber < 1 || roundNumber > t.numberOfRounds) {
            throw new BadRequestException("Round number must be between 1 and " + t.numberOfRounds);
        }

        TournamentRegistration reg = TournamentRegistration.findById(command.registrationId());
        if (reg == null || !reg.tournament.id.equals(id)) throw new NotFoundException();

        TournamentSeat existing = TournamentSeat.findByRoundAndRegistration(t, roundNumber, reg);
        if (existing != null) {
            throw new BadRequestException(reg.user.username + " is already allocated for round " + roundNumber);
        }

        TournamentSeat bye = new TournamentSeat();
        bye.registration = reg;
        bye.bye = true;
        bye.roundNumber = roundNumber;
        bye.seatPosition = 0;
        bye.persist();
        return Response.noContent().build();
    }

    @DELETE
    @Path("/{id}/seats/{seatId}")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public Response removeSeatOrBye(@PathParam("id") String id, @PathParam("seatId") String seatId) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.SEATING) {
            throw new BadRequestException("Tournament must be in SEATING status to manage seats");
        }
        TournamentSeat seat = TournamentSeat.findById(seatId);
        if (seat == null || !seat.registration.tournament.id.equals(id)) throw new NotFoundException();
        seat.delete();
        return Response.noContent().build();
    }

    @POST
    @Path("/{id}/extra-round")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public TournamentDto addExtraRound(@PathParam("id") String id) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.SEATING) {
            throw new BadRequestException("Can only add rounds during SEATING status");
        }
        int maxAllowed = Math.min(t.originalNumberOfRounds + 1, config.tournament().maxRounds());
        if (t.numberOfRounds >= maxAllowed) {
            throw new BadRequestException("Maximum number of rounds (" + maxAllowed + ") already reached");
        }
        t.numberOfRounds++;
        return TournamentDto.from(t);
    }

    // ─── Active Tournament ────────────────────────────────────────────────────

    @GET
    @Path("/{id}/games")
    @RolesAllowed({"USER", "TOURNAMENT_ADMIN"})
    public List<Object> getTournamentGames(@PathParam("id") String id) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.ACTIVE && t.status != TournamentStatus.SEEDING
                && t.status != TournamentStatus.FINALS && t.status != TournamentStatus.COMPLETED) {
            return List.of();
        }
        boolean isAdmin = identity.hasRole("TOURNAMENT_ADMIN");
        List<TournamentTableGame> tableGames = TournamentTableGame.findByTournament(t);

        if (isAdmin) {
            return tableGames.stream()
                .map(tg -> (Object) new TournamentGameDto(tg))
                .toList();
        }

        User me = currentUser();
        return tableGames.stream()
            .filter(tg -> tg.table.seats.stream()
                .anyMatch(s -> !s.bye && s.roundNumber == tg.roundNumber
                            && s.registration.user.id.equals(me.id)))
            .map(tg -> (Object) new TournamentGameDto(tg))
            .toList();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Tournament require(String id) {
        Tournament t = Tournament.findById(id);
        if (t == null) throw new NotFoundException();
        return t;
    }

    private User currentUser() {
        return User.findByUsername(identity.getPrincipal().getName());
    }

    // ─── Command Records ──────────────────────────────────────────────────────

    @RegisterForReflection
    public record CreateTournamentCommand(
        String name,
        TournamentFormat format,
        GameFormat gameFormat,
        Integer numberOfRounds,
        boolean finalRound,
        boolean requiresId,
        OffsetDateTime registrationStart,
        OffsetDateTime registrationEnd,
        OffsetDateTime playingStart,
        OffsetDateTime playingEnd,
        List<Tournament.Rule> rules,
        List<Tournament.Condition> conditions
    ) {}

    @RegisterForReflection
    public record UpdateTournamentCommand(
        String name,
        TournamentFormat format,
        GameFormat gameFormat,
        int numberOfRounds,
        boolean finalRound,
        boolean requiresId,
        OffsetDateTime registrationStart,
        OffsetDateTime registrationEnd,
        OffsetDateTime playingStart,
        OffsetDateTime playingEnd,
        List<Tournament.Rule> rules,
        List<Tournament.Condition> conditions
    ) {}

    @RegisterForReflection
    public record RegisterForTournamentCommand(List<String> deckIds) {}

    @RegisterForReflection
    public record AddSeatCommand(String registrationId, int seatPosition, int roundNumber) {}

    @RegisterForReflection
    public record AddByeCommand(String registrationId) {}

    @RegisterForReflection
    public record TournamentGameDto(String tableId, int roundNumber, String gameId, String gameName,
                                    List<SeatInfo> players) {
        TournamentGameDto(TournamentTableGame tg) {
            this(
                tg.table.id,
                tg.roundNumber,
                tg.game.id,
                tg.game.name,
                tg.table.seats.stream()
                    .filter(s -> !s.bye && s.roundNumber == tg.roundNumber)
                    .sorted(java.util.Comparator.comparingInt(s -> s.seatPosition))
                    .map(s -> new SeatInfo(s.registration.user.username, s.seatPosition))
                    .toList()
            );
        }
    }

    @RegisterForReflection
    public record SeatInfo(String username, int seatPosition) {}
}
