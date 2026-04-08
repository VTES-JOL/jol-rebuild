package net.deckserver.jol.controller;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.MediaType;
import net.deckserver.jol.entity.Game;
import net.deckserver.jol.entity.User;
import net.deckserver.jol.enums.Role;
import org.apache.http.HttpStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;

@QuarkusTest
public class GameControllerTest {

    @BeforeEach
    @Transactional
    void setup() {
        User.deleteAll();
        User.create("existingUser", "password", "test@example.org", Role.ADMIN, Role.USER);
    }

    @AfterEach
    @Transactional
    public void destroy() {
        Game.deleteAll();
    }

    /**
     * Creates a game with a user role; expects success
     */
    @Test
    @TestSecurity(user = "existingUser", roles = {"USER"})
    public void createGame() {
        GameController.GameCreateCommand gameCreateCommand = new GameController.GameCreateCommand("Test Game");
        given().body(gameCreateCommand)
                .contentType(MediaType.APPLICATION_JSON)
                .post("/api/games")
                .then()
                .statusCode(HttpStatus.SC_CREATED);
    }

    /**
     * Confirms unauthorized game creation without proper authentication
     */
    @Test
    @TestSecurity(user = "existingUser", roles = {"guest"})
    public void createGameSecurity() {
        GameController.GameCreateCommand gameCreateCommand = new GameController.GameCreateCommand("Test Game");
        given().body(gameCreateCommand)
                .contentType(MediaType.APPLICATION_JSON)
                .post("/api/games")
                .then()
                .statusCode(HttpStatus.SC_FORBIDDEN);
    }
}
