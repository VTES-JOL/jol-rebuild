package net.deckserver.jol.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.runtime.annotations.RegisterForReflection;
import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import net.deckserver.jol.dto.CardDetailDto;
import net.deckserver.jol.dto.DeckDto;
import net.deckserver.jol.entity.Deck;
import net.deckserver.jol.entity.User;
import net.deckserver.jol.services.CardService;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Path("/api/decks")
@Authenticated
public class DeckController {

    @Inject
    SecurityIdentity identity;

    @Inject
    ObjectMapper mapper;

    @Inject
    CardService cardService;

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

    @POST
    @Path("/import")
    @Transactional
    @RolesAllowed("USER")
    public DeckDto importDeck(DeckImportCommand command) throws JsonProcessingException {
        List<String> ids = command.entries().stream().map(DeckImportCommand.Entry::cardId).toList();
        Map<String, CardDetailDto> detailMap = cardService.findDetailsByIds(ids).stream()
                .collect(Collectors.toMap(CardDetailDto::id, d -> d));

        // Partition into crypt and library, grouping library by type key
        List<Map<String, Object>> cryptCards = new ArrayList<>();
        Map<String, List<Map<String, Object>>> libGroups = new LinkedHashMap<>();

        for (DeckImportCommand.Entry entry : command.entries()) {
            CardDetailDto detail = detailMap.get(entry.cardId());
            if (detail == null) continue;
            Map<String, Object> card = Map.of("id", entry.cardId(), "count", entry.count(), "name", detail.name());
            if (detail.crypt()) {
                cryptCards.add(card);
            } else {
                String typeKey = String.join("/", detail.types());
                libGroups.computeIfAbsent(typeKey, k -> new ArrayList<>()).add(card);
            }
        }

        List<Map<String, Object>> libraryGroups = libGroups.entrySet().stream()
                .map(e -> {
                    int count = e.getValue().stream().mapToInt(c -> (int) c.get("count")).sum();
                    return (Map<String, Object>) Map.of("type", e.getKey(), "count", count, "cards", e.getValue());
                })
                .collect(Collectors.toList());

        int cryptCount = cryptCards.stream().mapToInt(c -> (int) c.get("count")).sum();
        int libCount   = libraryGroups.stream().mapToInt(g -> (int) g.get("count")).sum();

        Map<String, Object> contents = Map.of(
                "crypt",   Map.of("count", cryptCount, "cards", cryptCards),
                "library", Map.of("count", libCount,   "cards", libraryGroups)
        );

        String name = command.name() != null && !command.name().isBlank() ? command.name() : "Imported Deck";
        Deck deck = Deck.create(currentUser(), name, mapper.writeValueAsString(contents), null);
        return new DeckDto(deck);
    }

    @RegisterForReflection
    public record DeckCreateCommand(String name) {}

    @RegisterForReflection
    public record DeckUpdateCommand(String name, JsonNode contents, String summary, String comments) {}

    @RegisterForReflection
    public record DeckImportCommand(String name, List<Entry> entries) {
        @RegisterForReflection
        public record Entry(String cardId, int count) {}
    }
}