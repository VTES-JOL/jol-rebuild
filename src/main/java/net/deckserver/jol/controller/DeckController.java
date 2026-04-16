package net.deckserver.jol.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.runtime.annotations.RegisterForReflection;
import io.quarkus.security.Authenticated;
import io.quarkus.security.identity.SecurityIdentity;
import jakarta.annotation.security.RolesAllowed;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import net.deckserver.jol.dto.DeckDto;
import net.deckserver.jol.entity.Deck;
import net.deckserver.jol.entity.DeckFormatValidity;
import net.deckserver.jol.entity.User;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.model.CryptCard;
import net.deckserver.jol.model.krcg.KrcgCrypt;
import net.deckserver.jol.model.krcg.KrcgDeck;
import net.deckserver.jol.model.krcg.KrcgLibrary;
import net.deckserver.jol.services.CardRegistry;
import net.deckserver.jol.services.DeckImportService;
import net.deckserver.jol.services.DeckValidatorService;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Path("/api/decks")
@Authenticated
public class DeckController {

    @Inject
    SecurityIdentity identity;

    @Inject
    ObjectMapper mapper;

    @Inject
    CardRegistry cardRegistry;

    @Inject
    DeckImportService deckImportService;

    @Inject
    DeckValidatorService validatorService;

    @GET
    public List<DeckDto> decks(
            @QueryParam("format") GameFormat format,
            @QueryParam("card") String cardId) {
        String username = identity.getPrincipal().getName();
        List<Deck> decks;
        if (format != null && cardId != null) {
            decks = Deck.findByUsernameWithFormatAndCard(username, format, cardId);
        } else if (format != null) {
            decks = Deck.findByUsernameAndFormat(username, format);
        } else if (cardId != null) {
            decks = Deck.findByUsernameContainingCard(username, cardId);
        } else {
            decks = Deck.findByUsername(username);
        }
        return decks.stream().map(DeckDto::new).toList();
    }

    @GET
    @Path("/{id}/contents")
    @Produces(MediaType.APPLICATION_JSON)
    public Response contents(@PathParam("id") long id) throws JsonProcessingException {
        Deck deck = ownedDeck(id);
        if (deck == null) return Response.status(Response.Status.NOT_FOUND).build();
        String raw = deck.contents != null ? deck.contents : "{}";
        return Response.ok(mapper.readValue(raw, KrcgDeck.class)).build();
    }

    @GET
    @Path("/{id}/validity")
    public Response validityAll(@PathParam("id") long id) {
        Deck deck = ownedDeck(id);
        if (deck == null) return Response.status(Response.Status.NOT_FOUND).build();
        Map<String, Boolean> result = DeckFormatValidity.findByDeck(id).stream()
                .collect(Collectors.toMap(v -> v.format.name(), v -> v.valid));
        return Response.ok(result).build();
    }

    @GET
    @Path("/{id}/validity/{format}")
    public Response validity(@PathParam("id") long id, @PathParam("format") GameFormat format) {
        Deck deck = ownedDeck(id);
        if (deck == null) return Response.status(Response.Status.NOT_FOUND).build();
        return DeckFormatValidity.findByDeckAndFormat(id, format)
                .map(v -> Response.ok(new ValidityDetailDto(v)).build())
                .orElse(Response.status(Response.Status.NOT_FOUND).build());
    }

    @POST
    @Transactional
    @RolesAllowed("USER")
    public DeckDto create(@Valid DeckCreateCommand command) throws JsonProcessingException {
        User owner = currentUser();
        KrcgDeck empty = new KrcgDeck(command.name, null, new KrcgCrypt(0, List.of()), new KrcgLibrary(0, List.of()));
        Deck deck = Deck.create(owner, command.name(), mapper.writeValueAsString(empty), null);
        return new DeckDto(deck);
    }

    @PUT
    @Path("/{id}")
    @Transactional
    @RolesAllowed("USER")
    public Response update(@PathParam("id") long id, @Valid DeckUpdateCommand command) throws JsonProcessingException {
        Deck deck = ownedDeck(id);
        if (deck == null) return Response.status(Response.Status.NOT_FOUND).build();
        if (command.name() != null) deck.name = command.name();
        if (command.comments() != null) deck.comments = command.comments();
        List<DeckFormatValidity> freshValidity = null;
        if (command.contents() != null) {
            deck.contents = mapper.writeValueAsString(command.contents());
            deck.summary = command.summary();
            freshValidity = validatorService.validateAndPersist(deck, command.contents());
        } else if (command.summary() != null) {
            deck.summary = command.summary();
        }
        deck.timestamp = Instant.now();
        return Response.ok(new DeckDto(deck, freshValidity != null ? freshValidity : deck.formatValidity)).build();
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
        Map<String, Integer> cardCounts = new LinkedHashMap<>();
        command.entries().forEach(e -> cardCounts.put(e.cardId(), e.count()));

        KrcgDeck contents = deckImportService.buildKrcgContents(cardCounts);
        String name = command.name() != null && !command.name().isBlank() ? command.name() : "Imported Deck";
        Deck deck = Deck.create(currentUser(), name, mapper.writeValueAsString(contents), computeSummary(contents));
        if (command.comments() != null && !command.comments().isBlank()) deck.comments = command.comments();
        List<DeckFormatValidity> validity = validatorService.validateAndPersist(deck, contents);
        return new DeckDto(deck, validity);
    }

    private User currentUser() {
        return User.findByUsername(identity.getPrincipal().getName());
    }

    /**
     * Returns the deck only if it exists and belongs to the current user.
     */
    private Deck ownedDeck(long id) {
        Deck deck = Deck.findById(id);
        if (deck == null || !deck.user.username.equals(identity.getPrincipal().getName())) return null;
        return deck;
    }

    /**
     * Computes "{crypt},{library},{groups}" from built KRCG contents, matching the frontend format.
     */
    private String computeSummary(KrcgDeck contents) {
        int crypt = contents.crypt().count();
        int library = contents.library().count();
        String groups = contents.crypt().cards().stream()
                .map(c -> cardRegistry.findById(c.id()))
                .filter(c -> c instanceof CryptCard cc && !"ANY".equals(cc.group()))
                .map(c -> ((CryptCard) c).group())
                .flatMap(g -> {
                    try {
                        return java.util.stream.Stream.of(Integer.parseInt(g));
                    } catch (NumberFormatException e) {
                        return java.util.stream.Stream.empty();
                    }
                })
                .distinct()
                .sorted()
                .map(String::valueOf)
                .collect(Collectors.joining("/"));
        return crypt + "," + library + "," + groups;
    }

    // ── Commands & responses ──────────────────────────────────────────────────

    @RegisterForReflection
    public record DeckCreateCommand(@NotBlank @Size(max = 255) String name) {
    }

    @RegisterForReflection
    public record DeckUpdateCommand(@NotBlank @Size(max = 255) String name, KrcgDeck contents, String summary, String comments) {
    }

    @RegisterForReflection
    public record DeckImportCommand(String name, String comments, List<Entry> entries) {
        @RegisterForReflection
        public record Entry(String cardId, int count) {
        }
    }

    @RegisterForReflection
    public record ValidityDetailDto(String format, boolean valid, List<String> errors, String computedAt) {
        public ValidityDetailDto(DeckFormatValidity v) {
            this(v.format.name(), v.valid, v.errors != null ? v.errors : List.of(), v.computedAt.toString());
        }
    }
}
