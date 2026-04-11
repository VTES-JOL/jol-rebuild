package net.deckserver.jol.controller;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.MediaType;
import net.deckserver.jol.entity.Deck;
import net.deckserver.jol.entity.User;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.Role;
import net.deckserver.jol.model.krcg.*;
import org.apache.http.HttpStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Integration tests for DeckController.
 *
 * Setup strategy: @BeforeEach/@AfterEach are @Transactional (each commits its own transaction),
 * so data they persist is visible to the server. Test methods use the HTTP API for further
 * setup so every state change goes through a committed server transaction.
 *
 * Card fixtures:
 *   200076 - Anarch Convert  (non-banned; NOT in duel/V5 whitelists)
 *   100518 - Deflection       (non-banned; duel ✓, V5 via V5/NB/V5C sets ✓)
 *   201634 - Abraham Mellon   (non-banned; duel ✓, V5 via FOL set ✓)
 *   100046 - Ambush           (non-banned; duel ✓, V5 ID whitelist ✓)
 */
@QuarkusTest
public class DeckControllerTest {

    /** Deck ID created for otheruser — available to cross-user access tests. */
    private long otherUserDeckId;

    @BeforeEach
    @Transactional
    void setup() {
        Deck.deleteAll();
        User.deleteAll();
        User.create("testuser", "password", "testuser@example.com", Role.USER);
        User otherUser = User.create("otheruser", "password", "otheruser@example.com", Role.USER);

        // Persist a deck owned by otheruser — committed at end of this @Transactional method
        // so the server can see it in cross-user tests.
        Deck deck = new Deck();
        deck.user = otherUser;
        deck.name = "Other Deck";
        deck.contents = "{}";
        deck.timestamp = java.time.Instant.now();
        deck.persist();
        otherUserDeckId = deck.id;
    }

    @AfterEach
    @Transactional
    public void destroy() {
        Deck.deleteAll();
        User.deleteAll();
    }

    // ── Deck content fixtures ─────────────────────────────────────────────────

    /**
     * Satisfies Standard size rules (12 crypt, 60 library).
     * Anarch Convert (200076) is not in duel/V5 whitelists → Standard=true, Duel=false, V5=false.
     */
    private static KrcgDeck standardSizedDeck() {
        var crypt = new KrcgCrypt(12, List.of(new KrcgCard("200076", 12, "Anarch Convert")));
        var library = new KrcgLibrary(60, List.of(
                new KrcgLibraryGroup("Reaction", 60, List.of(new KrcgCard("100518", 60, "Deflection")))));
        return new KrcgDeck(null, null, crypt, library);
    }

    // ── List decks ────────────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void listDecks_returnsOnlyOwnedDecks() {
        // Create two decks for testuser via API (each call commits its own transaction)
        postDeck("Deck 1");
        postDeck("Deck 2");

        given()
                .when().get("/api/decks")
                .then()
                .statusCode(HttpStatus.SC_OK)
                .body("$.size()", is(2))
                .body("[0].name", notNullValue());
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void listDecks_includesFormatValidityMap() {
        postDeck("My Deck");

        // Newly created decks have no validity rows — map is present but empty
        given()
                .when().get("/api/decks")
                .then()
                .statusCode(HttpStatus.SC_OK)
                .body("[0].formatValidity", notNullValue())
                .body("[0].formatValidity.STANDARD", nullValue());
    }

    // ── Create deck ───────────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void createDeck_returnsNameAndEmptyValidity() {
        given()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new DeckController.DeckCreateCommand("New Deck"))
                .when().post("/api/decks")
                .then()
                .statusCode(HttpStatus.SC_OK)
                .body("name", is("New Deck"))
                // No validation on create — formatValidity map is empty but present
                .body("formatValidity", notNullValue())
                .body("formatValidity.STANDARD", nullValue());
    }

    // ── Update deck ───────────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void updateDeck_nameOnly_doesNotRunValidation() {
        long id = postDeck("Old Name");

        given()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new DeckController.DeckUpdateCommand("New Name", null, null, null))
                .when().put("/api/decks/" + id)
                .then()
                .statusCode(HttpStatus.SC_OK)
                .body("name", is("New Name"))
                // No contents change → no validation rows written
                .body("formatValidity.STANDARD", nullValue());
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void updateDeck_withContents_populatesFormatValidity() {
        long id = postDeck("My Deck");

        given()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new DeckController.DeckUpdateCommand(null, standardSizedDeck(), null, null))
                .when().put("/api/decks/" + id)
                .then()
                .statusCode(HttpStatus.SC_OK)
                // All three format keys present
                .body("formatValidity.STANDARD", notNullValue())
                .body("formatValidity.DUEL", notNullValue())
                .body("formatValidity.V5", notNullValue())
                // Standard passes (12 crypt, 60 library, no whitelist restriction)
                .body("formatValidity.STANDARD", is(true))
                // Duel fails: Anarch Convert not in duel whitelist
                .body("formatValidity.DUEL", is(false));
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void updateDeck_twice_doesNotViolateUniqueConstraint() {
        // Regression test: saving a deck twice must not produce a duplicate-key error
        // on deck_format_validity(deck_id, format). Fixed by em.flush() after clear().
        long id = postDeck("My Deck");
        var command = new DeckController.DeckUpdateCommand(null, standardSizedDeck(), null, null);

        given()
                .contentType(MediaType.APPLICATION_JSON)
                .body(command)
                .when().put("/api/decks/" + id)
                .then()
                .statusCode(HttpStatus.SC_OK);

        // Second save — triggered the duplicate key constraint before the flush fix
        given()
                .contentType(MediaType.APPLICATION_JSON)
                .body(command)
                .when().put("/api/decks/" + id)
                .then()
                .statusCode(HttpStatus.SC_OK)
                .body("formatValidity.STANDARD", is(true));
    }

    // ── Validity detail endpoint ──────────────────────────────────────────────

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void getValidity_returnsErrorsForInvalidFormat() {
        long id = postDeck("My Deck");
        putContents(id, standardSizedDeck());

        given()
                .when().get("/api/decks/" + id + "/validity/" + GameFormat.DUEL.name())
                .then()
                .statusCode(HttpStatus.SC_OK)
                .body("format", is("DUEL"))
                .body("valid", is(false))
                .body("errors", not(empty()));
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void getValidity_returnsEmptyErrorsForValidFormat() {
        long id = postDeck("My Deck");
        putContents(id, standardSizedDeck());

        given()
                .when().get("/api/decks/" + id + "/validity/" + GameFormat.STANDARD.name())
                .then()
                .statusCode(HttpStatus.SC_OK)
                .body("format", is("STANDARD"))
                .body("valid", is(true))
                .body("errors", empty());
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void getValidity_notFoundWhenNeverValidated() {
        long id = postDeck("My Deck");

        given()
                .when().get("/api/decks/" + id + "/validity/" + GameFormat.STANDARD.name())
                .then()
                .statusCode(HttpStatus.SC_NOT_FOUND);
    }

    // ── Delete deck ───────────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void deleteDeck_removesFromList() {
        long id = postDeck("To Delete");

        given()
                .when().delete("/api/decks/" + id)
                .then()
                .statusCode(HttpStatus.SC_NO_CONTENT);

        given()
                .when().get("/api/decks")
                .then()
                .statusCode(HttpStatus.SC_OK)
                .body("$.size()", is(0));
    }

    // ── Access control ────────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void unauthorizedAccess_returnsNotFound() {
        given()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new DeckController.DeckUpdateCommand("Hacked", null, null, null))
                .when().put("/api/decks/" + otherUserDeckId)
                .then()
                .statusCode(HttpStatus.SC_NOT_FOUND);

        given()
                .when().delete("/api/decks/" + otherUserDeckId)
                .then()
                .statusCode(HttpStatus.SC_NOT_FOUND);

        given()
                .when().get("/api/decks/" + otherUserDeckId + "/contents")
                .then()
                .statusCode(HttpStatus.SC_NOT_FOUND);
    }

    @Test
    public void unauthenticatedAccess_returnsUnauthorized() {
        given()
                .when().get("/api/decks")
                .then()
                .statusCode(HttpStatus.SC_UNAUTHORIZED);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Creates a deck via the API and returns the assigned ID. */
    private long postDeck(String name) {
        return given()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new DeckController.DeckCreateCommand(name))
                .when().post("/api/decks")
                .then()
                .statusCode(HttpStatus.SC_OK)
                .extract().<Integer>path("id").longValue();
    }

    /** Updates deck contents via the API. */
    private void putContents(long id, KrcgDeck contents) {
        given()
                .contentType(MediaType.APPLICATION_JSON)
                .body(new DeckController.DeckUpdateCommand(null, contents, null, null))
                .when().put("/api/decks/" + id)
                .then()
                .statusCode(HttpStatus.SC_OK);
    }
}
