package net.deckserver.jol.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.MediaType;
import net.deckserver.jol.entity.Deck;
import net.deckserver.jol.entity.User;
import net.deckserver.jol.enums.Role;
import org.apache.http.HttpStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class DeckControllerTest {

    @Inject
    ObjectMapper mapper;

    @BeforeEach
    @Transactional
    void setup() {
        Deck.deleteAll();
        User.deleteAll();
        User.create("testuser", "password", "testuser@example.com", Role.USER);
        User.create("otheruser", "password", "otheruser@example.com", Role.USER);
    }

    @AfterEach
    @Transactional
    public void destroy() {
        Deck.deleteAll();
        User.deleteAll();
    }

    @Test
    @Transactional
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void listDecks() {
        User user = User.findByUsername("testuser");
        createDeck(user, "Deck 1", "{}", "Summary 1");
        createDeck(user, "Deck 2", "{}", "Summary 2");

        given()
                .when().get("/api/decks")
                .then()
                .statusCode(HttpStatus.SC_OK);
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void createDeck() {
        DeckController.DeckCreateCommand command = new DeckController.DeckCreateCommand("New Deck");

        given()
                .contentType(MediaType.APPLICATION_JSON)
                .body(command)
                .when().post("/api/decks")
                .then()
                .statusCode(HttpStatus.SC_OK)
                .body("name", is("New Deck"));
    }

    @Test
    @Transactional
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void updateDeck() {
        User user = User.findByUsername("testuser");
        Deck deck = createDeck(user, "Old Name", "{}", "Old Summary");

        DeckController.DeckUpdateCommand command = new DeckController.DeckUpdateCommand(
                "New Name", mapper.createObjectNode().put("cards", 1), "New Summary", "New Comment"
        );

        given()
                .contentType(MediaType.APPLICATION_JSON)
                .body(command)
                .when().put("/api/decks/" + deck.id)
                .then()
                .log().all();
    }

    @Test
    @Transactional
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void getContents() {
        User user = User.findByUsername("testuser");
        Deck deck = createDeck(user, "Deck", "{\"cards\": [1, 2, 3]}", "Summary");

        given()
                .when().get("/api/decks/" + deck.id + "/contents")
                .then()
                .log().all();
    }

    @Test
    @Transactional
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void deleteDeck() {
        User user = User.findByUsername("testuser");
        Deck deck = createDeck(user, "To Delete", "{}", "Summary");

        given()
                .when().delete("/api/decks/" + deck.id)
                .then()
                .log().all();

        given()
                .when().get("/api/decks")
                .then()
                .statusCode(HttpStatus.SC_OK);
    }

    @Test
    @Transactional
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void unauthorizedAccess() {
        User otherUser = User.findByUsername("otheruser");
        Deck otherDeck = createDeck(otherUser, "Other Deck", "{}", "Other Summary");

        // Try to update other user's deck
        given()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new DeckController.DeckUpdateCommand("Hacked", null, null, null))
                .when().put("/api/decks/" + otherDeck.id)
                .then()
                .statusCode(HttpStatus.SC_NOT_FOUND);

        // Try to delete other user's deck
        given()
                .when().delete("/api/decks/" + otherDeck.id)
                .then()
                .statusCode(HttpStatus.SC_NOT_FOUND);

        // Try to get contents of other user's deck
        given()
                .when().get("/api/decks/" + otherDeck.id + "/contents")
                .then()
                .statusCode(HttpStatus.SC_NOT_FOUND);
    }

    private Deck createDeck(User user, String name, String contents, String summary) {
        Deck deck = new Deck();
        deck.user = user;
        deck.name = name;
        deck.contents = contents;
        deck.summary = summary;
        deck.timestamp = java.time.Instant.now();
        deck.persist();
        return deck;
    }

    @Test
    public void unauthenticatedAccess() {
        given()
                .when().get("/api/decks")
                .then()
                .statusCode(HttpStatus.SC_UNAUTHORIZED);
    }
}
