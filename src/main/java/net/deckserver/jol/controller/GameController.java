package net.deckserver.jol.controller;

import jakarta.annotation.security.RolesAllowed;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Response;
import net.deckserver.jol.entity.Game;

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
    public Game get(@PathParam("id") Long id) {
        return Game.findById(id);
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
}
