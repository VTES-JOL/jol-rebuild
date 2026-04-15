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
import net.deckserver.jol.dto.TournamentRegistrationDto;
import net.deckserver.jol.entity.*;
import net.deckserver.jol.enums.TournamentFormat;
import net.deckserver.jol.enums.TournamentStatus;
import net.deckserver.jol.services.TournamentService;

import java.time.OffsetDateTime;
import java.util.List;

@Path("/api/tournaments")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class TournamentController {

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
    public List<Tournament> list(@QueryParam("status") TournamentStatus status) {
        boolean isAdmin = identity.hasRole("TOURNAMENT_ADMIN");
        if (status != null) {
            if (!isAdmin && !PLAYER_VISIBLE_STATUSES.contains(status)) {
                return List.of();
            }
            return Tournament.findByStatus(status);
        }
        if (isAdmin) {
            return Tournament.listAll();
        }
        return Tournament.find("status in ?1", PLAYER_VISIBLE_STATUSES).list();
    }

    @GET
    @Path("/{id}")
    public Tournament get(@PathParam("id") Long id) {
        Tournament tournament = Tournament.findById(id);
        if (tournament == null) throw new NotFoundException();
        if (!identity.hasRole("TOURNAMENT_ADMIN") && !PLAYER_VISIBLE_STATUSES.contains(tournament.status)) {
            throw new NotFoundException();
        }
        return tournament;
    }

    @POST
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public Tournament create(Tournament tournament) {
        tournament.id = null;
        tournament.status = TournamentStatus.SETUP;
        tournament.persist();
        return tournament;
    }

    @PUT
    @Path("/{id}")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public Tournament update(@PathParam("id") Long id, Tournament updated) {
        Tournament entity = Tournament.findById(id);
        if (entity == null) throw new NotFoundException();
        if (entity.status != TournamentStatus.SETUP) {
            throw new ForbiddenException("Can only edit tournaments in SETUP status");
        }
        entity.name = updated.name;
        entity.registrationStart = updated.registrationStart;
        entity.registrationEnd = updated.registrationEnd;
        entity.playingStart = updated.playingStart;
        entity.playingEnd = updated.playingEnd;
        entity.format = updated.format;
        entity.gameFormat = updated.gameFormat;
        entity.numberOfRounds = updated.numberOfRounds;
        entity.finalRound = updated.finalRound;
        entity.requiresId = updated.requiresId;
        entity.rules = updated.rules;
        entity.conditions = updated.conditions;
        return entity;
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public void delete(@PathParam("id") Long id) {
        Tournament entity = Tournament.findById(id);
        if (entity == null) throw new NotFoundException();
        entity.delete();
    }

    // ─── Status Transitions ───────────────────────────────────────────────────

    @POST
    @Path("/{id}/publish")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public Tournament publish(@PathParam("id") Long id) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.SETUP) {
            throw new BadRequestException("Tournament must be in SETUP status to publish");
        }
        t.status = TournamentStatus.REGISTRATION;
        return t;
    }

    @POST
    @Path("/{id}/unpublish")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public Tournament unpublish(@PathParam("id") Long id) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.REGISTRATION) {
            throw new BadRequestException("Tournament must be in REGISTRATION status to unpublish");
        }
        // Delete all tournament registrations
        TournamentRegistration.find("tournament.id = ?1", id).stream()
            .forEach(r -> ((TournamentRegistration) r).delete());
        t.status = TournamentStatus.SETUP;
        return t;
    }

    @POST
    @Path("/{id}/seat")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public Tournament beginSeating(@PathParam("id") Long id) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.REGISTRATION) {
            throw new BadRequestException("Tournament must be in REGISTRATION status to begin seating");
        }
        t.status = TournamentStatus.SEATING;
        return t;
    }

    @POST
    @Path("/{id}/activate")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public Tournament activate(@PathParam("id") Long id) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.SEATING) {
            throw new BadRequestException("Tournament must be in SEATING status to activate");
        }
        User admin = currentUser();
        tournamentService.activate(t, admin);
        t.status = TournamentStatus.ACTIVE;
        return t;
    }

    // ─── Player Registration ──────────────────────────────────────────────────

    @GET
    @Path("/{id}/registrations")
    @RolesAllowed({"USER"})
    public List<TournamentRegistrationDto> getRegistrations(@PathParam("id") Long id) {
        Tournament t = require(id);
            return TournamentRegistration.findByTournament(t).stream()
                .map(TournamentRegistrationDto::from)
                .toList();
    }

    @POST
    @Path("/{id}/registrations")
    @Transactional
    @RolesAllowed("USER")
    public Response register(@PathParam("id") Long id, RegisterForTournamentCommand command) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.REGISTRATION) {
            return Response.status(Response.Status.CONFLICT).entity("Tournament is not open for registration").build();
        }
        OffsetDateTime now = OffsetDateTime.now();
        if (t.registrationStart != null && now.isBefore(t.registrationStart)) {
            return Response.status(Response.Status.CONFLICT).entity("Registration has not started yet").build();
        }
        if (t.registrationEnd != null && now.isAfter(t.registrationEnd)) {
            return Response.status(Response.Status.CONFLICT).entity("Registration has closed").build();
        }

        User me = currentUser();
        if (TournamentRegistration.findByTournamentAndUser(t, me) != null) {
            return Response.status(Response.Status.CONFLICT).entity("Already registered for this tournament").build();
        }

        int expectedDecks = t.format == TournamentFormat.SINGLE_DECK ? 1 : t.numberOfRounds;
        if (command.deckIds() == null || command.deckIds().size() != expectedDecks) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("Expected " + expectedDecks + " deck(s) for " + t.format + " tournament").build();
        }

        TournamentRegistration reg = new TournamentRegistration();
        reg.tournament = t;
        reg.user = me;

        for (Long deckId : command.deckIds()) {
            Deck deck = Deck.findById(deckId);
            if (deck == null || !deck.user.id.equals(me.id)) {
                return Response.status(Response.Status.NOT_FOUND).entity("Deck " + deckId + " not found").build();
            }
            boolean valid = DeckFormatValidity.findByDeckAndFormat(deckId, t.gameFormat)
                .map(v -> v.valid).orElse(false);
            if (!valid) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity("Deck '" + deck.name + "' is not valid for " + t.gameFormat).build();
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
    public Response unregister(@PathParam("id") Long id) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.REGISTRATION) {
            return Response.status(Response.Status.CONFLICT).entity("Cannot leave tournament outside of registration period").build();
        }
        User me = currentUser();
        TournamentRegistration reg = TournamentRegistration.findByTournamentAndUser(t, me);
        if (reg == null) {
            return Response.status(Response.Status.NOT_FOUND).entity("Not registered for this tournament").build();
        }
        reg.delete();
        return Response.noContent().build();
    }

    // ─── Seating Management ───────────────────────────────────────────────────

    @GET
    @Path("/{id}/seating")
    @RolesAllowed("TOURNAMENT_ADMIN")
    public SeatingDto getSeating(@PathParam("id") Long id) {
        Tournament t = require(id);
        return tournamentService.buildSeatingDto(t);
    }

    @POST
    @Path("/{id}/tables")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public Response addTable(@PathParam("id") Long id, AddTableCommand command) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.SEATING) {
            throw new BadRequestException("Tournament must be in SEATING status to manage tables");
        }
        if (command.roundNumber() < 1 || command.roundNumber() > t.numberOfRounds) {
            throw new BadRequestException("Round number must be between 1 and " + t.numberOfRounds);
        }
        TournamentTable table = new TournamentTable();
        table.tournament = t;
        table.roundNumber = command.roundNumber();
        table.persist();
        return Response.ok(table).build();
    }

    @DELETE
    @Path("/{id}/tables/{tableId}")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public Response removeTable(@PathParam("id") Long id, @PathParam("tableId") Long tableId) {
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
    public Response addSeat(@PathParam("id") Long id, @PathParam("tableId") Long tableId, AddSeatCommand command) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.SEATING) {
            throw new BadRequestException("Tournament must be in SEATING status to manage seats");
        }
        TournamentTable table = TournamentTable.findById(tableId);
        if (table == null || !table.tournament.id.equals(id)) throw new NotFoundException();

        TournamentRegistration reg = TournamentRegistration.findById(command.registrationId());
        if (reg == null || !reg.tournament.id.equals(id)) throw new NotFoundException();

        // Ensure player not already seated in this round
        TournamentSeat existing = TournamentSeat.findByRoundAndRegistration(t, table.roundNumber, reg);
        if (existing != null) {
            throw new BadRequestException(reg.user.username + " is already allocated for round " + table.roundNumber);
        }

        long currentSeats = table.seats.stream().filter(s -> !s.bye).count();
        if (currentSeats >= 5) {
            throw new BadRequestException("Table is full (max 5 players)");
        }
        if (command.seatPosition() < 1 || command.seatPosition() > 5) {
            throw new BadRequestException("Seat position must be between 1 and 5");
        }

        TournamentSeat seat = new TournamentSeat();
        seat.table = table;
        seat.registration = reg;
        seat.seatPosition = command.seatPosition();
        seat.bye = false;
        seat.persist();
        table.seats.add(seat);
        return Response.ok(seat).build();
    }

    @DELETE
    @Path("/{id}/tables/{tableId}/seats/{seatId}")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public Response removeSeat(@PathParam("id") Long id, @PathParam("tableId") Long tableId, @PathParam("seatId") Long seatId) {
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
    public Response addBye(@PathParam("id") Long id, @PathParam("roundNumber") int roundNumber, AddByeCommand command) {
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
        bye.byeRound = roundNumber;
        bye.seatPosition = 0;
        bye.persist();
        return Response.ok(bye).build();
    }

    @DELETE
    @Path("/{id}/seats/{seatId}")
    @Transactional
    @RolesAllowed("TOURNAMENT_ADMIN")
    public Response removeSeatOrBye(@PathParam("id") Long id, @PathParam("seatId") Long seatId) {
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
    public Tournament addExtraRound(@PathParam("id") Long id) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.SEATING) {
            throw new BadRequestException("Can only add rounds during SEATING status");
        }
        if (t.numberOfRounds >= 3) {
            throw new BadRequestException("Maximum number of rounds (3) already reached");
        }
        t.numberOfRounds++;
        return t;
    }

    // ─── Active Tournament ────────────────────────────────────────────────────

    @GET
    @Path("/{id}/games")
    @RolesAllowed({"USER", "TOURNAMENT_ADMIN"})
    public List<Object> getTournamentGames(@PathParam("id") Long id) {
        Tournament t = require(id);
        if (t.status != TournamentStatus.ACTIVE && t.status != TournamentStatus.SEEDING
                && t.status != TournamentStatus.FINALS && t.status != TournamentStatus.COMPLETED) {
            return List.of();
        }
        boolean isAdmin = identity.hasRole("TOURNAMENT_ADMIN");
        List<TournamentTable> tables = TournamentTable.findByTournament(t);

        if (isAdmin) {
            return tables.stream()
                .filter(table -> table.game != null)
                .map(table -> (Object) new TournamentGameDto(table))
                .toList();
        }

        User me = currentUser();
        return tables.stream()
            .filter(table -> table.game != null)
            .filter(table -> table.seats.stream().anyMatch(s -> !s.bye && s.registration.user.id.equals(me.id)))
            .map(table -> (Object) new TournamentGameDto(table))
            .toList();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Tournament require(Long id) {
        Tournament t = Tournament.findById(id);
        if (t == null) throw new NotFoundException();
        return t;
    }

    private User currentUser() {
        return User.findByUsername(identity.getPrincipal().getName());
    }

    // ─── Command Records ──────────────────────────────────────────────────────

    @RegisterForReflection
    public record CreateTournamentCommand(String name) {}

    @RegisterForReflection
    public record RegisterForTournamentCommand(List<Long> deckIds) {}

    @RegisterForReflection
    public record AddTableCommand(int roundNumber) {}

    @RegisterForReflection
    public record AddSeatCommand(Long registrationId, int seatPosition) {}

    @RegisterForReflection
    public record AddByeCommand(Long registrationId) {}

    @RegisterForReflection
    public record TournamentGameDto(Long tableId, int roundNumber, Long gameId, String gameName,
                                    List<SeatInfo> players) {
        TournamentGameDto(TournamentTable table) {
            this(
                table.id,
                table.roundNumber,
                table.game.id,
                table.game.name,
                table.seats.stream()
                    .filter(s -> !s.bye)
                    .sorted(java.util.Comparator.comparingInt(s -> s.seatPosition))
                    .map(s -> new SeatInfo(s.registration.user.username, s.seatPosition))
                    .toList()
            );
        }
    }

    @RegisterForReflection
    public record SeatInfo(String username, int seatPosition) {}
}
