package net.deckserver.jol.controller;

import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import java.util.Arrays;
import net.deckserver.jol.dto.CardDetailDto;
import net.deckserver.jol.dto.CardSuggestionDto;
import net.deckserver.jol.dto.ImportPreviewDto;
import net.deckserver.jol.model.Card;
import net.deckserver.jol.services.CardService;
import org.jboss.resteasy.reactive.RestQuery;

import java.util.List;

@Path("/cards")
public class CardController {

    @Inject
    CardService cardService;

    @GET
    public List<Card> cards() {
        return cardService.findAll();
    }

    @GET
    @Path("/autocomplete")
    public List<CardSuggestionDto> autocomplete(@RestQuery("q") String q) {
        return cardService.autocomplete(q);
    }

    /** Batch card details by ID — used on deck load to enrich entries and populate the detail map. */
    @GET
    @Path("/details")
    public List<CardDetailDto> details(@RestQuery("ids") String ids) {
        if (ids == null || ids.isBlank()) return List.of();
        return cardService.findDetailsByIds(Arrays.asList(ids.split(",")));
    }

    /** Single card detail by ID — used when adding a card via the deck editor search. */
    @GET
    @Path("/{id}/detail")
    public CardDetailDto detail(@PathParam("id") String id) {
        CardDetailDto dto = cardService.findDetailById(id);
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
        return cardService.preview(text);
    }

}
