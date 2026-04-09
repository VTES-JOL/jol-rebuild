package net.deckserver.jol.controller;

import io.quarkus.runtime.annotations.RegisterForReflection;
import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import net.deckserver.jol.dto.GameDto;
import net.deckserver.jol.entity.Game;
import net.deckserver.jol.entity.Registration;
import net.deckserver.jol.entity.User;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.Visibility;

import java.net.URI;
import java.util.List;

@Path("/api/games")
public class GameController {

    @Inject
    SecurityIdentity identity;

    @POST
    @Transactional
    @RolesAllowed("USER")
    public Response createGame(GameCreateCommand command) {
        User owner = User.findByUsername(identity.getPrincipal().getName());
        Game game = Game.create(owner, command.name, command.visibility, GameFormat.STANDARD);
        return Response.created(URI.create("/games/" + game.id)).build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    @Authenticated
    public GameDto update(@PathParam("id") Long id, GameUpdateCommand game) {
        Game entity = Game.findById(id);
        if (entity == null) {
            throw new NotFoundException();
        }
        entity.visibility = game.visibility;
        entity.name = game.name;
        return new GameDto(entity);
    }

    @GET
    @Path("/{id}")
    public GameDto get(@PathParam("id") Long id) {
        Game game = Game.findById(id);
        if (game == null) {
            throw new NotFoundException();
        }
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
        return Game.findOpenGames().stream().map(GameDto::new).toList();
    }

    @POST
    @Path("/{id}/invite")
    @RolesAllowed("USER")
    public Response invite(@PathParam("id") String gameId, String playerId) {
        User user = User.findById(playerId);
        Game game = Game.findById(gameId);
        Registration.invite(game, user);
        return Response.ok().build();
    }

    @RegisterForReflection
    public record GameCreateCommand(String name, Visibility visibility) {
        public GameCreateCommand(String name) {
            this(name, Visibility.PUBLIC);
        }
    }

    @RegisterForReflection
    public record GameUpdateCommand(String name, Visibility visibility) {
        public GameUpdateCommand(String name) {
            this(name, Visibility.PUBLIC);
        }
    }
}
