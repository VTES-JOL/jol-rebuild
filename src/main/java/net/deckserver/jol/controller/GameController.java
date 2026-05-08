package net.deckserver.jol.controller;

import io.quarkus.runtime.annotations.RegisterForReflection;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import net.deckserver.jol.dto.ChatMessageDto;
import net.deckserver.jol.dto.GameDetailDto;
import net.deckserver.jol.dto.GameDto;
import net.deckserver.jol.entity.*;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.Status;
import net.deckserver.jol.enums.Visibility;
import net.deckserver.jol.services.ChatService;
import net.deckserver.jol.services.GameInitService;
import net.deckserver.jol.services.LobbyChatBroadcaster;
import net.deckserver.jol.services.NameService;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Path("/api/games")
public class GameController {

    @Inject
    SecurityIdentity identity;

    @Inject
    NameService nameService;

    @Inject
    ChatService chatService;

    @Inject
    LobbyChatBroadcaster lobbyChatBroadcaster;

    @Inject
    GameInitService gameInitService;

    @POST
    @Transactional
    @RolesAllowed("USER")
    public Response createGame(@Valid GameCreateCommand command) {
        User owner = User.findByUsername(identity.getPrincipal().getName());
        GameFormat format = command.format() != null ? command.format() : GameFormat.STANDARD;
        Visibility visibility = command.visibility() != null ? command.visibility() : Visibility.PUBLIC;
        String name = (command.name() != null && !command.name().isBlank())
            ? command.name() : nameService.generateName();
        Game game = Game.create(owner, name, visibility, format);
        return Response.created(URI.create("/games/" + game.id)).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    @RolesAllowed("USER")
    public Response update(@PathParam("id") String id, @Valid GameUpdateCommand command) {
        Game entity = Game.findById(id);
        if (entity == null) throw new NotFoundException();
        String username = identity.getPrincipal().getName();
        if (!entity.isOwnedBy(username)) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }
        if (command.visibility() != null) {
            entity.visibility = command.visibility();
        }
        if (command.name() != null) {
            entity.name = command.name();
        }
        return Response.ok(new GameDto(entity)).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @RolesAllowed("USER")
    public Response deleteGame(@PathParam("id") String id) {
        Game game = Game.findById(id);
        if (game == null) throw new NotFoundException();

        String username = identity.getPrincipal().getName();
        if (!game.isOwnedBy(username)) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }
        if (game.status != Status.OPEN) {
            throw new WebApplicationException("Game can only be deleted when OPEN", Response.Status.CONFLICT);
        }
        if (game.tournament != null) {
            throw new WebApplicationException("Cannot delete tournament games", Response.Status.CONFLICT);
        }
        game.delete();
        return Response.noContent().build();
    }

    @GET
    @Path("/{id}")
    public GameDto get(@PathParam("id") String id) {
        Game game = Game.findById(id);
        if (game == null) throw new NotFoundException();
        return new GameDto(game);
    }

    @GET
    @Path("/active")
    public List<GameDto> activeGames(
        @QueryParam("limit") @DefaultValue("50") int limit,
        @QueryParam("offset") @DefaultValue("0") int offset) {
        int clampedLimit = Math.min(limit, 200);
        List<Game> games = Game.<Game>find("visibility = ?1 and status = ?2", Visibility.PUBLIC, Status.ACTIVE)
            .range(offset, offset + clampedLimit - 1)
            .list();
        return toDtos(games);
    }

    @GET
    @Path("/active/me")
    public List<GameDto> myGames() {
        User user = User.findByUsername(identity.getPrincipal().getName());
        return toDtos(Game.findActiveGames(user));
    }

    @GET
    @Path("/open")
    public List<GameDto> openGames(
        @QueryParam("limit") @DefaultValue("50") int limit,
        @QueryParam("offset") @DefaultValue("0") int offset) {
        int clampedLimit = Math.min(limit, 200);
        List<Game> result = new ArrayList<>(
            Game.<Game>find("visibility = ?1 and status = ?2", Visibility.PUBLIC, Status.OPEN)
                .range(offset, offset + clampedLimit - 1)
                .list()
        );
        if (!identity.isAnonymous()) {
            User user = User.findByUsername(identity.getPrincipal().getName());
            // Private games the user was invited to
            Game.findInvitedGames(user).stream()
                .filter(g -> g.visibility == Visibility.PRIVATE)
                .filter(g -> !result.contains(g))
                .forEach(result::add);
            // The user's own open games (public ones already included above)
            Game.<Game>find("owner.id = ?1 and status = ?2 and visibility = ?3",
                    user.id, Status.OPEN, Visibility.PRIVATE)
                .stream()
                .filter(g -> !result.contains(g))
                .forEach(result::add);
        }
        return toDtos(result);
    }

    @GET
    @Path("/invited/me")
    @RolesAllowed("USER")
    public List<GameDto> myInvitedGames() {
        User user = User.findByUsername(identity.getPrincipal().getName());
        return toDtos(Game.findInvitedGames(user));
    }

    @GET
    @Path("/registered/me")
    @RolesAllowed("USER")
    public List<GameDto> myRegisteredGames() {
        User user = User.findByUsername(identity.getPrincipal().getName());
        return toDtos(Game.findRegisteredGames(user));
    }

    @GET
    @Path("/owned/me")
    @RolesAllowed("USER")
    public List<GameDto> myOwnedGames() {
        User user = User.findByUsername(identity.getPrincipal().getName());
        return toDtos(Game.<Game>find("owner.id = ?1 and status = ?2", user.id, Status.OPEN).list());
    }

    @GET
    @Path("/{id}/registrations")
    @RolesAllowed("USER")
    public Response getRegistrations(@PathParam("id") String id) {
        Game game = Game.findById(id);
        if (game == null) throw new NotFoundException();

        if (game.visibility == Visibility.PRIVATE) {
            User user = User.findByUsername(identity.getPrincipal().getName());
            boolean isOwner = game.isOwnedBy(user.username);
            boolean hasAccess = isOwner || Registration.findByGameAndUser(game, user) != null;
            if (!hasAccess) {
                return Response.status(Response.Status.FORBIDDEN).build();
            }
        }

        List<Registration> registrations = Registration.getRegistrations(game);
        List<Registration> invites = Registration.getInvites(game);
        return Response.ok(new GameDetailDto(game, registrations, invites)).build();
    }

    @GET
    @Path("/{id}/messages")
    @RolesAllowed("USER")
    public List<ChatMessageDto> getMessages(
        @PathParam("id") String id,
        @QueryParam("page") @DefaultValue("0") int page,
        @QueryParam("limit") @DefaultValue("50") int limit) {
        Game game = Game.findById(id);
        if (game == null) throw new NotFoundException();
        return chatService.getHistory(id, page, limit);
    }

    @POST
    @Path("/{id}/register")
    @Transactional
    @RolesAllowed("USER")
    public Response register(@PathParam("id") String id, RegisterCommand command) {
        Game game = Game.findById(id);
        if (game == null) throw new NotFoundException();
        if (game.status != Status.OPEN) {
            throw new WebApplicationException("Game is not open", Response.Status.CONFLICT);
        }

        User user = User.findByUsername(identity.getPrincipal().getName());
        Deck deck = Deck.findById(command.deckId());
        if (deck == null || !deck.user.id.equals(user.id)) {
            throw new WebApplicationException("Invalid deck", Response.Status.BAD_REQUEST);
        }

        Registration existing = Registration.findByGameAndUser(game, user);
        if (existing == null && game.visibility == Visibility.PRIVATE) {
            throw new WebApplicationException("Must be invited to join a private game", Response.Status.FORBIDDEN);
        }

        long registrationCount = Registration.countForGame(game.id);
        if (game.isFull(registrationCount)) {
            throw new WebApplicationException("Game is full", Response.Status.CONFLICT);
        }

        boolean validFormat = DeckFormatValidity.findByDeckAndFormat(deck.id, game.gameFormat)
            .map(v -> v.valid).orElse(false);
        if (!validFormat) {
            throw new WebApplicationException("Deck is not valid for " + game.gameFormat.getLabel(), Response.Status.BAD_REQUEST);
        }

        if (existing == null) {
            Registration.invite(game, user);
        }

        Registration.register(game, user, deck);
        lobbyChatBroadcaster.broadcastLobbyUpdate(id);

        long newCount = Registration.countForGame(game.id);
        if (game.isFull(newCount)) {
            gameInitService.initializeGame(game);
        }

        return Response.ok().build();
    }

    @DELETE
    @Path("/{id}/register")
    @Transactional
    @RolesAllowed("USER")
    public Response leaveGame(@PathParam("id") String id) {
        Game game = Game.findById(id);
        if (game == null) throw new NotFoundException();

        User user = User.findByUsername(identity.getPrincipal().getName());
        Registration existing = Registration.findByGameAndUser(game, user);
        if (existing == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        Registration.delete(game, user);
        lobbyChatBroadcaster.broadcastLobbyUpdate(id);
        return Response.noContent().build();
    }

    @PUT
    @Path("/{id}/format")
    @Transactional
    @RolesAllowed("USER")
    public Response updateFormat(@PathParam("id") String id, FormatUpdateCommand command) {
        Game game = Game.findById(id);
        if (game == null) throw new NotFoundException();

        String username = identity.getPrincipal().getName();
        if (!game.isOwnedBy(username)) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }
        if (game.status != Status.OPEN) {
            throw new WebApplicationException("Game is not open", Response.Status.CONFLICT);
        }
        if (Registration.countForGame(game.id) > 0) {
            throw new WebApplicationException("Cannot change format once players have registered with decks", Response.Status.CONFLICT);
        }
        game.gameFormat = command.format();
        return Response.ok(new GameDto(game)).build();
    }

    @POST
    @Path("/{id}/invite")
    @Transactional
    @RolesAllowed("USER")
    public Response invite(@PathParam("id") String id, InviteCommand command) {
        Game game = Game.findById(id);
        if (game == null) throw new NotFoundException();

        String callerUsername = identity.getPrincipal().getName();
        if (!game.isOwnedBy(callerUsername)) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }

        User user = User.findByUsername(command.username());
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).entity("User not found").build();
        }

        Registration.invite(game, user);
        return Response.ok().build();
    }

    private List<GameDto> toDtos(List<Game> games) {
        List<String> ids = games.stream().map(g -> g.id).toList();
        Map<String, Long> counts = Registration.countsByGameIds(ids);
        return games.stream()
            .map(g -> new GameDto(g, counts.getOrDefault(g.id, 0L).intValue()))
            .toList();
    }

    @RegisterForReflection
    public record GameCreateCommand(@NotBlank @Size(max = 255) String name, Visibility visibility, GameFormat format) {
        public GameCreateCommand(String name) {
            this(name, Visibility.PUBLIC, GameFormat.STANDARD);
        }
    }

    @RegisterForReflection
    public record GameUpdateCommand(@NotBlank @Size(max = 255) String name, Visibility visibility) {}

    @RegisterForReflection
    public record RegisterCommand(String deckId) {}

    @RegisterForReflection
    public record FormatUpdateCommand(GameFormat format) {}

    @RegisterForReflection
    public record InviteCommand(String username) {}
}
