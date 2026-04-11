package net.deckserver.jol.controller;

import io.quarkus.runtime.annotations.RegisterForReflection;
import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import net.deckserver.jol.services.NameService;
import jakarta.ws.rs.core.Response;
import net.deckserver.jol.dto.GameDetailDto;
import net.deckserver.jol.dto.GameDto;
import net.deckserver.jol.entity.*;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.Status;
import net.deckserver.jol.enums.Visibility;

import java.net.URI;
import java.util.ArrayList;
import java.util.List;

@Path("/api/games")
public class GameController {

    @Inject
    SecurityIdentity identity;

    @Inject
    NameService nameService;

    @Inject
    net.deckserver.jol.services.LobbyChatBroadcaster lobbyChatBroadcaster;

    @POST
    @Transactional
    @RolesAllowed("USER")
    public Response createGame(GameCreateCommand command) {
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
    @Authenticated
    public GameDto update(@PathParam("id") Long id, GameUpdateCommand command) {
        Game entity = Game.findById(id);
        if (entity == null) throw new NotFoundException();
        entity.visibility = command.visibility();
        entity.name = command.name();
        return new GameDto(entity);
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @RolesAllowed("USER")
    public Response deleteGame(@PathParam("id") Long id) {
        Game game = Game.findById(id);
        if (game == null) throw new NotFoundException();

        String username = identity.getPrincipal().getName();
        if (game.owner == null || !game.owner.username.equals(username)) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }
        if (game.status != Status.OPEN) {
            return Response.status(Response.Status.CONFLICT)
                .entity("Game can only be deleted when OPEN").build();
        }
        game.delete();
        return Response.noContent().build();
    }

    @GET
    @Path("/{id}")
    public GameDto get(@PathParam("id") Long id) {
        Game game = Game.findById(id);
        if (game == null) throw new NotFoundException();
        return new GameDto(game);
    }

    @GET
    @Path("/active")
    public List<GameDto> activeGames() {
        return Game.findActiveGames().stream().map(GameDto::new).toList();
    }

    @GET
    @Path("/active/me")
    public List<GameDto> myGames() {
        User user = User.findByUsername(identity.getPrincipal().getName());
        return Game.findActiveGames(user).stream().map(GameDto::new).toList();
    }

    @GET
    @Path("/open")
    public List<GameDto> openGames() {
        List<Game> result = new ArrayList<>(Game.findOpenGames());
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
        return result.stream().map(GameDto::new).toList();
    }

    @GET
    @Path("/invited/me")
    @RolesAllowed("USER")
    public List<GameDto> myInvitedGames() {
        User user = User.findByUsername(identity.getPrincipal().getName());
        return Game.findInvitedGames(user).stream().map(GameDto::new).toList();
    }

    @GET
    @Path("/registered/me")
    @RolesAllowed("USER")
    public List<GameDto> myRegisteredGames() {
        User user = User.findByUsername(identity.getPrincipal().getName());
        return Game.findRegisteredGames(user).stream().map(GameDto::new).toList();
    }

    @GET
    @Path("/owned/me")
    @RolesAllowed("USER")
    public List<GameDto> myOwnedGames() {
        User user = User.findByUsername(identity.getPrincipal().getName());
        return Game.<Game>find("owner.id = ?1 and status = ?2", user.id, Status.OPEN)
            .stream().map(GameDto::new).toList();
    }

    @GET
    @Path("/{id}/registrations")
    @RolesAllowed("USER")
    public Response getRegistrations(@PathParam("id") Long id) {
        Game game = Game.findById(id);
        if (game == null) throw new NotFoundException();

        if (game.visibility == Visibility.PRIVATE) {
            User user = User.findByUsername(identity.getPrincipal().getName());
            boolean isOwner = game.owner != null && game.owner.username.equals(user.username);
            boolean hasAccess = isOwner || Registration.findByGameAndUser(game, user) != null;
            if (!hasAccess) {
                return Response.status(Response.Status.FORBIDDEN).build();
            }
        }

        List<Registration> registrations = Registration.getRegistrations(game);
        List<Registration> invites = Registration.getInvites(game);
        return Response.ok(new GameDetailDto(game, registrations, invites)).build();
    }

    @POST
    @Path("/{id}/register")
    @Transactional
    @RolesAllowed("USER")
    public Response register(@PathParam("id") Long id, RegisterCommand command) {
        Game game = Game.findById(id);
        if (game == null) throw new NotFoundException();
        if (game.status != Status.OPEN) {
            return Response.status(Response.Status.CONFLICT).entity("Game is not open").build();
        }

        User user = User.findByUsername(identity.getPrincipal().getName());
        Deck deck = Deck.findById(command.deckId());
        if (deck == null || !deck.user.id.equals(user.id)) {
            return Response.status(Response.Status.BAD_REQUEST).entity("Invalid deck").build();
        }

        Registration existing = Registration.findByGameAndUser(game, user);
        if (existing == null && game.visibility == Visibility.PRIVATE) {
            return Response.status(Response.Status.FORBIDDEN)
                .entity("Must be invited to join a private game").build();
        }

        long registrationCount = Registration.countForGame(game.id);
        if (registrationCount >= game.gameFormat.getMaxPlayers()) {
            return Response.status(Response.Status.CONFLICT).entity("Game is full").build();
        }

        boolean validFormat = DeckFormatValidity.findByDeckAndFormat(deck.id, game.gameFormat)
            .map(v -> v.valid).orElse(false);
        if (!validFormat) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity("Deck is not valid for " + game.gameFormat.getLabel()).build();
        }

        if (existing == null) {
            Registration.invite(game, user);
        }

        Registration.register(game, user, deck);
        lobbyChatBroadcaster.broadcastLobbyUpdate(id);
        return Response.ok().build();
    }

    @DELETE
    @Path("/{id}/register")
    @Transactional
    @RolesAllowed("USER")
    public Response leaveGame(@PathParam("id") Long id) {
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
    public Response updateFormat(@PathParam("id") Long id, FormatUpdateCommand command) {
        Game game = Game.findById(id);
        if (game == null) throw new NotFoundException();

        String username = identity.getPrincipal().getName();
        if (game.owner == null || !game.owner.username.equals(username)) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }
        if (game.status != Status.OPEN) {
            return Response.status(Response.Status.CONFLICT).entity("Game is not open").build();
        }
        if (Registration.countForGame(game.id) > 0) {
            return Response.status(Response.Status.CONFLICT)
                .entity("Cannot change format once players have registered with decks").build();
        }
        game.gameFormat = command.format();
        return Response.ok(new GameDto(game)).build();
    }

    @POST
    @Path("/{id}/invite")
    @Transactional
    @RolesAllowed("USER")
    public Response invite(@PathParam("id") Long id, InviteCommand command) {
        Game game = Game.findById(id);
        if (game == null) throw new NotFoundException();

        String callerUsername = identity.getPrincipal().getName();
        if (game.owner == null || !game.owner.username.equals(callerUsername)) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }

        User user = User.findByUsername(command.username());
        if (user == null) {
            return Response.status(Response.Status.NOT_FOUND).entity("User not found").build();
        }

        Registration.invite(game, user);
        return Response.ok().build();
    }

    @RegisterForReflection
    public record GameCreateCommand(String name, Visibility visibility, GameFormat format) {
        public GameCreateCommand(String name) {
            this(name, Visibility.PUBLIC, GameFormat.STANDARD);
        }
    }

    @RegisterForReflection
    public record GameUpdateCommand(String name, Visibility visibility) {}

    @RegisterForReflection
    public record RegisterCommand(Long deckId) {}

    @RegisterForReflection
    public record FormatUpdateCommand(GameFormat format) {}

    @RegisterForReflection
    public record InviteCommand(String username) {}
}
