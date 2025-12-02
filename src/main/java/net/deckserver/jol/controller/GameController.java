package net.deckserver.jol.controller;

import jakarta.annotation.security.RolesAllowed;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import net.deckserver.jol.dto.GameDto;
import net.deckserver.jol.entity.Game;
import net.deckserver.jol.entity.Registration;
import net.deckserver.jol.entity.User;

import java.net.URI;
import java.util.List;

@Path("/games")
public class GameController {

    @POST
    @Transactional
    @RolesAllowed("USER")
    public Response createGame(Game game) {
        game.persist();
        return Response.created(URI.create("/games/" + game.id)).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @RolesAllowed("ADMIN")
    public Response delete(@PathParam("id") Long id) {
        Game.deleteById(id);
        return Response.accepted().build();
    }

    @PUT
    @Path("/{id}")
    @Transactional
    public Game update(@PathParam("id") Long id, Game game) {
        Game entity = Game.findById(id);
        if (entity == null) {
            throw new NotFoundException();
        }
        if (game.visibility != null) {
            entity.visibility = game.visibility;
        }
        if (game.status != null) {
            entity.status = game.status;
        }
        if (game.name != null) {
            entity.name = game.name;
        }
        return entity;
    }

    @GET
    @Path("/{id}")
    public GameDto get(@PathParam("id") Long id) {
        return Game.find("id", id).project(GameDto.class).firstResult();
    }

    @GET
    @Path("/active")
    public List<Game> activeGames() {
        return Game.findActiveGames();
    }

    @GET
    @Path("/open")
    public List<Game> openGames() {
        return Game.findOpenGames();
    }

    @POST
    @Path("/{id}/invite")
    public Response invite(@PathParam("id") String gameId, String playerId) {
        User user = User.findById(playerId);
        Game game = Game.findById(gameId);
        Registration.invite(game, user);
        return Response.ok().build();
    }
}
