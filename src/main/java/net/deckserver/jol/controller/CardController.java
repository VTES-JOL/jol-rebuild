package net.deckserver.jol.controller;

import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
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

}
