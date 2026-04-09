package net.deckserver.jol.controller;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import java.util.Arrays;
import net.deckserver.jol.dto.CardIconDto;
import net.deckserver.jol.dto.CardSuggestionDto;
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

    @GET
    @Path("/icons")
    public List<CardIconDto> icons(@RestQuery("ids") String ids) {
        if (ids == null || ids.isBlank()) return List.of();
        return cardService.findIconsByIds(Arrays.asList(ids.split(",")));
    }

    @GET
    @Path("/{id}/icon")
    public CardIconDto icon(@PathParam("id") String id) {
        CardIconDto dto = cardService.findIconById(id);
        if (dto == null) throw new NotFoundException("Card not found: " + id);
        return dto;
    }

}
