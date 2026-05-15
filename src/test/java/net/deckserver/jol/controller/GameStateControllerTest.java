package net.deckserver.jol.controller;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import net.deckserver.jol.entity.Game;
import net.deckserver.jol.entity.User;
import net.deckserver.jol.enums.CardType;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.enums.RegionType;
import net.deckserver.jol.enums.Role;
import net.deckserver.jol.enums.Status;
import net.deckserver.jol.enums.Visibility;
import net.deckserver.jol.game.CardData;
import net.deckserver.jol.game.GameData;
import net.deckserver.jol.game.PlayerData;
import net.deckserver.jol.game.RegionData;
import net.deckserver.jol.services.GameStateStore;
import org.apache.http.HttpStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.*;

@QuarkusTest
public class GameStateControllerTest {

    @Inject
    GameStateStore store;

    private String gameId;

    // Card IDs seeded into the fixture — accessible across test assertions.
    private String handCardId;
    private String libraryCardId;
    private String readyCardId;

    @BeforeEach
    @Transactional
    void setup() {
        Game.deleteAll();
        User.deleteAll();

        User alice = User.create("alice", "password", "alice@example.com", Role.USER);
        User.create("bob", "password", "bob@example.com", Role.USER);

        Game game = new Game();
        game.owner = alice;
        game.name = "State Test Game";
        game.status = Status.ACTIVE;
        game.visibility = Visibility.PUBLIC;
        game.gameFormat = GameFormat.STANDARD;
        game.persist();
        gameId = game.id;

        // Build in-memory game state and register it with the store.
        store.put(gameId, buildGameData(gameId));
    }

    @AfterEach
    @Transactional
    void destroy() {
        store.remove(gameId);
        Game.deleteAll();
        User.deleteAll();
    }

    // ── 404 / 409 guard rails ─────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "alice", roles = {"USER"})
    void unknownGameReturns404() {
        given().get("/api/games/no-such-id/state")
                .then().statusCode(HttpStatus.SC_NOT_FOUND);
    }

    @Test
    @TestSecurity(user = "alice", roles = {"USER"})
    void inactiveGameReturns409() {
        // Create an OPEN game with no state in the store.
        String openId = createOpenGame();

        given().get("/api/games/" + openId + "/state")
                .then().statusCode(HttpStatus.SC_CONFLICT);

        deleteOpenGame(openId);
    }

    // ── Structural fields ─────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "alice", roles = {"USER"})
    void topLevelFieldsPopulated() {
        given().get("/api/games/" + gameId + "/state")
                .then().statusCode(HttpStatus.SC_OK)
                .body("gameId",      equalTo(gameId))
                .body("gameName",    equalTo("State Test Game"))
                .body("playerOrder", hasItems("alice", "bob"));
    }

    @Test
    @TestSecurity(user = "alice", roles = {"USER"})
    void playersIncludedInOrder() {
        given().get("/api/games/" + gameId + "/state")
                .then().statusCode(HttpStatus.SC_OK)
                .body("players.size()", equalTo(2))
                .body("players[0].name", equalTo("alice"))
                .body("players[1].name", equalTo("bob"));
    }

    // ── Region visibility ─────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "alice", roles = {"USER"})
    void ownerSeesHandRegionAsVisible() {
        given().get("/api/games/" + gameId + "/state")
                .then().statusCode(HttpStatus.SC_OK)
                .body("players.find { it.name == 'alice' }.regions.HAND.visible", equalTo(true))
                .body("players.find { it.name == 'alice' }.regions.HAND.count", equalTo(1))
                .body("players.find { it.name == 'alice' }.regions.HAND.cardIds", hasItem(handCardId));
    }

    @Test
    @TestSecurity(user = "bob", roles = {"USER"})
    void otherPlayerSeesAliceHandRegionAsHidden() {
        given().get("/api/games/" + gameId + "/state")
                .then().statusCode(HttpStatus.SC_OK)
                .body("players.find { it.name == 'alice' }.regions.HAND.visible", equalTo(false))
                .body("players.find { it.name == 'alice' }.regions.HAND.count", equalTo(1))
                // cardIds must be empty for hidden regions — no UUID leakage to opponents
                .body("players.find { it.name == 'alice' }.regions.HAND.cardIds", empty());
    }

    @Test
    @TestSecurity(user = "alice", roles = {"USER"})
    void ownerSeesLibraryRegionAsHidden() {
        // LIBRARY has ownerVisibility=false — even the owner can't see their own library cards
        given().get("/api/games/" + gameId + "/state")
                .then().statusCode(HttpStatus.SC_OK)
                .body("players.find { it.name == 'alice' }.regions.LIBRARY.visible", equalTo(false))
                .body("players.find { it.name == 'alice' }.regions.LIBRARY.count", equalTo(1))
                // cardIds must be empty for hidden regions
                .body("players.find { it.name == 'alice' }.regions.LIBRARY.cardIds", empty());
    }

    @Test
    @TestSecurity(user = "alice", roles = {"USER"})
    void bobReadyRegionVisibleToAlice() {
        // READY has otherVisibility=true
        given().get("/api/games/" + gameId + "/state")
                .then().statusCode(HttpStatus.SC_OK)
                .body("players.find { it.name == 'bob' }.regions.READY.visible", equalTo(true))
                .body("players.find { it.name == 'bob' }.regions.READY.cardIds", hasItem(readyCardId));
    }

    // ── Card map: full detail for visible cards ────────────────────────────────

    @Test
    @TestSecurity(user = "alice", roles = {"USER"})
    void visibleCardHasFullDetail() {
        given().get("/api/games/" + gameId + "/state")
                .then().statusCode(HttpStatus.SC_OK)
                .body("cards." + handCardId + ".id",        equalTo(handCardId))
                .body("cards." + handCardId + ".name",      equalTo("Deflection"))
                .body("cards." + handCardId + ".cardId",    equalTo("hand-001"))
                .body("cards." + handCardId + ".ownerName", equalTo("alice"));
    }

    @Test
    @TestSecurity(user = "alice", roles = {"USER"})
    void visibleCardFromBobReadyHasFullDetail() {
        given().get("/api/games/" + gameId + "/state")
                .then().statusCode(HttpStatus.SC_OK)
                .body("cards." + readyCardId + ".name",   equalTo("Blood Doll"))
                .body("cards." + readyCardId + ".cardId", equalTo("ready-001"));
    }

    // ── Card map: hidden cards absent ─────────────────────────────────────────

    @Test
    @TestSecurity(user = "alice", roles = {"USER"})
    void hiddenLibraryCardAbsentFromOwnerCardMap() {
        // Library has ownerVisibility=false — not included in cards map even for the owner
        given().get("/api/games/" + gameId + "/state")
                .then().statusCode(HttpStatus.SC_OK)
                .body("cards." + libraryCardId, nullValue());
    }

    @Test
    @TestSecurity(user = "bob", roles = {"USER"})
    void hiddenHandCardAbsentFromOpponentCardMap() {
        // Alice's HAND is hidden to bob — no UUID transmitted to opponents
        given().get("/api/games/" + gameId + "/state")
                .then().statusCode(HttpStatus.SC_OK)
                .body("cards." + handCardId, nullValue());
    }

    // ── Security ──────────────────────────────────────────────────────────────

    @Test
    void unauthenticatedReturns401() {
        given().get("/api/games/" + gameId + "/state")
                .then().statusCode(HttpStatus.SC_UNAUTHORIZED);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private GameData buildGameData(String id) {
        GameData game = new GameData(id, "State Test Game");

        PlayerData alice = new PlayerData("alice");
        PlayerData bob = new PlayerData("bob");
        game.addPlayer(alice);
        game.addPlayer(bob);

        // Alice's HAND — ownerVisibility=true, otherVisibility=false
        CardData handCard = new CardData("hand-001", alice);
        handCard.setName("Deflection");
        handCard.setType(CardType.REACTION);
        RegionData aliceHand = alice.getRegion(RegionType.HAND);
        aliceHand.addCard(handCard, false);
        game.getCards().put(handCard.getId(), handCard);
        handCardId = handCard.getId();

        // Alice's LIBRARY — ownerVisibility=false, otherVisibility=false
        CardData libraryCard = new CardData("lib-001", alice);
        libraryCard.setName("Secret Library Card");
        RegionData aliceLibrary = alice.getRegion(RegionType.LIBRARY);
        aliceLibrary.addCard(libraryCard, false);
        game.getCards().put(libraryCard.getId(), libraryCard);
        libraryCardId = libraryCard.getId();

        // Bob's READY — ownerVisibility=true, otherVisibility=true
        CardData readyCard = new CardData("ready-001", bob);
        readyCard.setName("Blood Doll");
        readyCard.setType(CardType.MASTER);
        RegionData bobReady = bob.getRegion(RegionType.READY);
        bobReady.addCard(readyCard, false);
        game.getCards().put(readyCard.getId(), readyCard);
        readyCardId = readyCard.getId();

        return game;
    }

    @Transactional
    String createOpenGame() {
        User alice = User.findByUsername("alice");
        Game game = new Game();
        game.owner = alice;
        game.name = "Open Game";
        game.status = Status.OPEN;
        game.visibility = Visibility.PUBLIC;
        game.gameFormat = GameFormat.STANDARD;
        game.persist();
        return game.id;
    }

    @Transactional
    void deleteOpenGame(String id) {
        Game game = Game.findById(id);
        if (game != null) game.delete();
    }
}
