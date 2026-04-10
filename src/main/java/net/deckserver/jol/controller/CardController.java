package net.deckserver.jol.controller;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import net.deckserver.jol.dto.CardDetailDto;
import net.deckserver.jol.dto.ImportPreviewDto;
import net.deckserver.jol.model.Card;
import net.deckserver.jol.services.CardSearchService;
import net.deckserver.jol.services.DeckImportService;
import org.jboss.resteasy.reactive.RestQuery;

import java.util.Arrays;
import java.util.List;

@Path("/cards")
public class CardController {

    @Inject
    CardSearchService cardSearchService;

    @Inject
    DeckImportService deckImportService;

    @GET
    public List<Card> cards() {
        return cardSearchService.findAll();
    }

    @GET
    @Path("/autocomplete")
    public List<CardDetailDto> autocomplete(@RestQuery("q") String q) {
        return cardSearchService.autocomplete(q);
    }

    /** Batch card details by ID — used on deck load to enrich entries and populate the detail map. */
    @GET
    @Path("/details")
    public List<CardDetailDto> details(@RestQuery("ids") String ids) {
        if (ids == null || ids.isBlank()) return List.of();
        return cardSearchService.findDetailsByIds(Arrays.asList(ids.split(",")));
    }

    /** Single card detail by ID — used when adding a card via the deck editor search. */
    @GET
    @Path("/{id}/detail")
    public CardDetailDto detail(@PathParam("id") String id) {
        CardDetailDto dto = cardSearchService.findDetailById(id);
        if (dto == null) throw new NotFoundException("Card not found: " + id);
        return dto;
    }

    /**
     * Preview an import — auto-detects KRCG JSON vs JOL text, resolves all card names/IDs
     * against the card database, and returns resolved entries alongside any parse errors.
     */
    @POST
    @Path("/preview")
    @Consumes(MediaType.TEXT_PLAIN)
    public ImportPreviewDto preview(String text) {
        return deckImportService.preview(text);
    }
}
