package net.deckserver.jol.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import net.deckserver.jol.dto.DeckDto;
import net.deckserver.jol.entity.Deck;
import net.deckserver.jol.entity.User;

import java.time.Instant;
import java.util.List;

@Path("/api/decks")
@Authenticated
public class DeckController {

    @Inject
    SecurityIdentity identity;

    @Inject
    ObjectMapper mapper;

    private User currentUser() {
        return User.findByUsername(identity.getPrincipal().getName());
    }

    /** Returns the deck only if it exists and belongs to the current user. */
    private Deck ownedDeck(long id) {
        Deck deck = Deck.findById(id);
        if (deck == null || !deck.user.username.equals(identity.getPrincipal().getName())) return null;
        return deck;
    }

    @GET
    public List<DeckDto> decks() {
        return Deck.findByUsername(identity.getPrincipal().getName())
                .stream().map(DeckDto::new).toList();
    }

    @GET
    @Path("/{id}/contents")
    @Produces(MediaType.APPLICATION_JSON)
    public Response contents(@PathParam("id") long id) throws JsonProcessingException {
        Deck deck = ownedDeck(id);
        if (deck == null) return Response.status(Response.Status.NOT_FOUND).build();
        String raw = deck.contents != null ? deck.contents : "{}";
        return Response.ok(mapper.readTree(raw)).build();
    }

    @POST
    @Transactional
    @RolesAllowed("USER")
    public DeckDto create(DeckCreateCommand command) {
        User owner = currentUser();
        Deck deck = Deck.create(owner, command.name(), "{}", null);
        return new DeckDto(deck);
    }

    @PUT
    @Path("/{id}")
    @Transactional
    @RolesAllowed("USER")
    public Response update(@PathParam("id") long id, DeckUpdateCommand command) throws JsonProcessingException {
        Deck deck = ownedDeck(id);
        if (deck == null) return Response.status(Response.Status.NOT_FOUND).build();
        if (command.name()     != null) deck.name     = command.name();
        if (command.comments() != null) deck.comments = command.comments();
        if (command.contents() != null) {
            // Summary is always updated alongside contents so it stays in sync (including clearing to null)
            deck.contents = mapper.writeValueAsString(command.contents());
            deck.summary  = command.summary();
        } else if (command.summary() != null) {
            deck.summary = command.summary();
        }
        deck.timestamp = Instant.now();
        return Response.ok(new DeckDto(deck)).build();
    }

    @DELETE
    @Path("/{id}")
    @Transactional
    @RolesAllowed("USER")
    public Response delete(@PathParam("id") long id) {
        Deck deck = ownedDeck(id);
        if (deck == null) return Response.status(Response.Status.NOT_FOUND).build();
        deck.delete();
        return Response.noContent().build();
    }

    public record DeckCreateCommand(String name) {}

    public record DeckUpdateCommand(String name, JsonNode contents, String summary, String comments) {}
}