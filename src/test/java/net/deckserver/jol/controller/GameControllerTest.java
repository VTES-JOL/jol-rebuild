package net.deckserver.jol.controller;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.MediaType;
import net.deckserver.jol.entity.Deck;
import net.deckserver.jol.entity.Game;
import net.deckserver.jol.entity.Registration;
import net.deckserver.jol.entity.User;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.Role;
import net.deckserver.jol.enums.Visibility;
import net.deckserver.jol.model.krcg.*;
import org.apache.http.HttpStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

/**
 * Integration tests for GameController.
 *
 * Setup: @BeforeEach/@AfterEach are @Transactional so their changes are committed and
 * visible to the server. API calls under test each run in their own server transaction.
 *
 * Deck fixture: standardSizedDeck() produces a 12-crypt / 60-library deck valid only
 * for STANDARD (Anarch Convert is not in the Duel/V5 whitelists).
 */
@QuarkusTest
public class GameControllerTest {

    @BeforeEach
    @Transactional
    void setup() {
        Registration.deleteAll();
        Game.deleteAll();
        Deck.deleteAll();
        User.deleteAll();
        User.create("testuser",  "password", "testuser@example.com",  Role.USER);
        User otherUser = User.create("otheruser", "password", "otheruser@example.com", Role.USER);

        // A validated STANDARD deck owned by otheruser (no DeckFormatValidity rows yet)
        Deck deck = new Deck();
        deck.user      = otherUser;
        deck.name      = "Other Deck";
        deck.contents  = "{}";
        deck.timestamp = java.time.Instant.now();
        deck.persist();
    }

    @AfterEach
    @Transactional
    void destroy() {
        Registration.deleteAll();
        Game.deleteAll();
        Deck.deleteAll();
        User.deleteAll();
    }

    // ── Create game ───────────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void createGame() {
        given().contentType(MediaType.APPLICATION_JSON)
                .body(new GameController.GameCreateCommand("Test Game"))
                .post("/api/games")
                .then().statusCode(HttpStatus.SC_CREATED);
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void createGameWithFormat() {
        given().contentType(MediaType.APPLICATION_JSON)
                .body(new GameController.GameCreateCommand("Duel Game", Visibility.PUBLIC, GameFormat.DUEL))
                .post("/api/games")
                .then().statusCode(HttpStatus.SC_CREATED);
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"guest"})
    public void createGameSecurity() {
        given().contentType(MediaType.APPLICATION_JSON)
                .body(new GameController.GameCreateCommand("Test Game"))
                .post("/api/games")
                .then().statusCode(HttpStatus.SC_FORBIDDEN);
    }

    // ── Delete game ───────────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void deleteOwnGame() {
        long id = createGame("My Game", Visibility.PUBLIC, GameFormat.STANDARD);

        given().delete("/api/games/" + id)
                .then().statusCode(HttpStatus.SC_NO_CONTENT);
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void deleteOtherUsersGame() {
        long id = createGameAsOtherUser();

        given().delete("/api/games/" + id)
                .then().statusCode(HttpStatus.SC_FORBIDDEN);
    }

    // ── Get registrations ─────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void getRegistrations_publicGame_anyUserCanView() {
        long id = createGame("Public Game", Visibility.PUBLIC, GameFormat.STANDARD);

        given().get("/api/games/" + id + "/registrations")
                .then().statusCode(HttpStatus.SC_OK)
                .body("id",                equalTo((int) id))
                .body("registrations",     notNullValue())
                .body("invites",           notNullValue())
                .body("registrationCount", equalTo(0))
                .body("maxPlayers",        equalTo(5));
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void getRegistrations_privateGame_forbiddenWithoutInvite() {
        long id = createGameAsOtherUser(Visibility.PRIVATE);

        given().get("/api/games/" + id + "/registrations")
                .then().statusCode(HttpStatus.SC_FORBIDDEN);
    }

    // ── Register for game ─────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void registerForPublicGame() {
        long gameId = createGame("Public Game", Visibility.PUBLIC, GameFormat.STANDARD);
        long deckId = createAndValidateDeck("My Deck");

        given().contentType(MediaType.APPLICATION_JSON)
                .body(new GameController.RegisterCommand(deckId))
                .post("/api/games/" + gameId + "/register")
                .then().statusCode(HttpStatus.SC_OK);

        given().get("/api/games/" + gameId + "/registrations")
                .then().statusCode(HttpStatus.SC_OK)
                .body("registrationCount", equalTo(1))
                .body("registrations[0].username", equalTo("testuser"))
                .body("registrations[0].deckName", equalTo("My Deck"));
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void registerForPrivateGameWithoutInvite() {
        long gameId = createGameAsOtherUser(Visibility.PRIVATE);
        long deckId = createAndValidateDeck("My Deck");

        given().contentType(MediaType.APPLICATION_JSON)
                .body(new GameController.RegisterCommand(deckId))
                .post("/api/games/" + gameId + "/register")
                .then().statusCode(HttpStatus.SC_FORBIDDEN);
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void registerWithInvalidFormatDeck() {
        // DUEL game, but the deck is only valid for STANDARD
        long gameId = createGame("Duel Game", Visibility.PUBLIC, GameFormat.DUEL);
        long deckId = createAndValidateDeck("Standard-only Deck");

        given().contentType(MediaType.APPLICATION_JSON)
                .body(new GameController.RegisterCommand(deckId))
                .post("/api/games/" + gameId + "/register")
                .then().statusCode(HttpStatus.SC_BAD_REQUEST);
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void registerWhenGameFull() {
        // Create a STANDARD game (max 5) and fill all slots via the entity layer
        long gameId = fillStandardGame();

        long deckId = createAndValidateDeck("My Deck");

        given().contentType(MediaType.APPLICATION_JSON)
                .body(new GameController.RegisterCommand(deckId))
                .post("/api/games/" + gameId + "/register")
                .then().statusCode(HttpStatus.SC_CONFLICT);
    }

    // ── Leave game ────────────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void leaveGame() {
        long gameId = createGame("Public Game", Visibility.PUBLIC, GameFormat.STANDARD);
        long deckId = createAndValidateDeck("My Deck");

        given().contentType(MediaType.APPLICATION_JSON)
                .body(new GameController.RegisterCommand(deckId))
                .post("/api/games/" + gameId + "/register")
                .then().statusCode(HttpStatus.SC_OK);

        given().delete("/api/games/" + gameId + "/register")
                .then().statusCode(HttpStatus.SC_NO_CONTENT);

        given().get("/api/games/" + gameId + "/registrations")
                .then().statusCode(HttpStatus.SC_OK)
                .body("registrationCount", equalTo(0));
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void leaveGameNotRegistered() {
        long gameId = createGame("Public Game", Visibility.PUBLIC, GameFormat.STANDARD);

        given().delete("/api/games/" + gameId + "/register")
                .then().statusCode(HttpStatus.SC_NOT_FOUND);
    }

    // ── Change format ─────────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void changeFormat() {
        long id = createGame("My Game", Visibility.PUBLIC, GameFormat.STANDARD);

        given().contentType(MediaType.APPLICATION_JSON)
                .body(new GameController.FormatUpdateCommand(GameFormat.DUEL))
                .put("/api/games/" + id + "/format")
                .then().statusCode(HttpStatus.SC_OK)
                .body("format", equalTo("DUEL"))
                .body("maxPlayers", equalTo(2));
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void changeFormatForbiddenForNonOwner() {
        long id = createGameAsOtherUser();

        given().contentType(MediaType.APPLICATION_JSON)
                .body(new GameController.FormatUpdateCommand(GameFormat.DUEL))
                .put("/api/games/" + id + "/format")
                .then().statusCode(HttpStatus.SC_FORBIDDEN);
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void changeFormatBlockedWhenPlayersRegistered() {
        long gameId = createGame("My Game", Visibility.PUBLIC, GameFormat.STANDARD);
        long deckId = createAndValidateDeck("My Deck");

        given().contentType(MediaType.APPLICATION_JSON)
                .body(new GameController.RegisterCommand(deckId))
                .post("/api/games/" + gameId + "/register")
                .then().statusCode(HttpStatus.SC_OK);

        given().contentType(MediaType.APPLICATION_JSON)
                .body(new GameController.FormatUpdateCommand(GameFormat.DUEL))
                .put("/api/games/" + gameId + "/format")
                .then().statusCode(HttpStatus.SC_CONFLICT);
    }

    // ── Invite ────────────────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void invitePlayerToGame() {
        long gameId = createGame("Private Game", Visibility.PRIVATE, GameFormat.STANDARD);

        given().contentType(MediaType.APPLICATION_JSON)
                .body(new GameController.InviteCommand("otheruser"))
                .post("/api/games/" + gameId + "/invite")
                .then().statusCode(HttpStatus.SC_OK);

        given().get("/api/games/" + gameId + "/registrations")
                .then().statusCode(HttpStatus.SC_OK)
                .body("invites[0].username", equalTo("otheruser"))
                .body("invites[0].deckName", nullValue());
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void inviteForbiddenForNonOwner() {
        long gameId = createGameAsOtherUser();

        given().contentType(MediaType.APPLICATION_JSON)
                .body(new GameController.InviteCommand("testuser"))
                .post("/api/games/" + gameId + "/invite")
                .then().statusCode(HttpStatus.SC_FORBIDDEN);
    }

    // ── My invited games ──────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void myInvitedGames() {
        long gameId = inviteTestuserToPrivateGame();

        given().get("/api/games/invited/me")
                .then().statusCode(HttpStatus.SC_OK)
                .body("$.size()", equalTo(1))
                .body("[0].id", equalTo((int) gameId));
    }

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void myInvitedGames_emptyWhenNoInvites() {
        given().get("/api/games/invited/me")
                .then().statusCode(HttpStatus.SC_OK)
                .body("$.size()", equalTo(0));
    }

    // ── Open games ────────────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "testuser", roles = {"USER"})
    public void openGames_includesPrivateGamesUserIsInvitedTo() {
        long privateGameId = inviteTestuserToPrivateGame();

        given().get("/api/games/open")
                .then().statusCode(HttpStatus.SC_OK)
                .body("id", hasItem((int) privateGameId));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Creates a game via the API as testuser and returns the game ID. */
    private long createGame(String name, Visibility visibility, GameFormat format) {
        String location = given().contentType(MediaType.APPLICATION_JSON)
                .body(new GameController.GameCreateCommand(name, visibility, format))
                .post("/api/games")
                .then().statusCode(HttpStatus.SC_CREATED)
                .extract().header("Location");
        return Long.parseLong(location.substring(location.lastIndexOf('/') + 1));
    }

    /** Creates a PUBLIC STANDARD game owned by otheruser via the entity layer. */
    @Transactional
    long createGameAsOtherUser() {
        return createGameAsOtherUser(Visibility.PUBLIC);
    }

    @Transactional
    long createGameAsOtherUser(Visibility visibility) {
        User other = User.findByUsername("otheruser");
        Game game = Game.create(other, "Other Game", visibility, GameFormat.STANDARD);
        return game.id;
    }

    /**
     * Creates a deck for testuser via the API, then saves contents to trigger
     * format validation. Returns the deck ID.
     * The fixture deck (Anarch Convert crypt) is valid for STANDARD only.
     */
    private long createAndValidateDeck(String name) {
        long id = given().contentType(MediaType.APPLICATION_JSON)
                .body(new DeckController.DeckCreateCommand(name))
                .post("/api/decks")
                .then().statusCode(HttpStatus.SC_OK)
                .extract().<Integer>path("id").longValue();

        given().contentType(MediaType.APPLICATION_JSON)
                .body(new DeckController.DeckUpdateCommand(null, standardSizedDeck(), null, null))
                .put("/api/decks/" + id)
                .then().statusCode(HttpStatus.SC_OK);

        return id;
    }

    /**
     * Creates a STANDARD game (max 5) owned by otheruser and fills all 5 slots
     * via the entity layer. Returns the game ID so the test can attempt a 6th registration.
     */
    @Transactional
    long fillStandardGame() {
        String fakeDeck = "{\"crypt\":{\"count\":12,\"cards\":[]},\"library\":{\"count\":60,\"cards\":[]}}";
        User other = User.findByUsername("otheruser");
        Game game  = Game.create(other, "Full Standard", Visibility.PUBLIC, GameFormat.STANDARD);
        Game managedGame = Game.findById(game.id);

        for (int i = 0; i < 5; i++) {
            String username = "filler" + i;
            User filler = User.find("username", username).firstResult();
            if (filler == null) {
                filler = User.create(username, "password", username + "@example.com", Role.USER);
            }
            Registration r = new Registration();
            r.game = managedGame; r.user = filler;
            r.deck = fakeDeck; r.deckName = "Filler Deck";
            r.lastUpdated = java.time.OffsetDateTime.now(); r.persist();
            managedGame.registrations.add(r); filler.registrations.add(r);
        }

        return game.id;
    }

    /** Invites testuser to a private game owned by otheruser. Returns the game ID. */
    @Transactional
    long inviteTestuserToPrivateGame() {
        User other    = User.findByUsername("otheruser");
        User testuser = User.findByUsername("testuser");
        Game game     = Game.create(other, "Private Game", Visibility.PRIVATE, GameFormat.STANDARD);
        Registration.invite(game, testuser);
        return game.id;
    }

    /** 12-crypt / 60-library deck valid for STANDARD only (Anarch Convert not in Duel/V5 whitelists). */
    private static KrcgDeck standardSizedDeck() {
        var crypt   = new KrcgCrypt(12, List.of(new KrcgCard("200076", 12, "Anarch Convert")));
        var library = new KrcgLibrary(60, List.of(
                new KrcgLibraryGroup("Reaction", 60, List.of(new KrcgCard("100518", 60, "Deflection")))));
        return new KrcgDeck(null, null, crypt, library);
    }
}
