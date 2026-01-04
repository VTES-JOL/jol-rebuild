package net.deckserver.jol.controller;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.MediaType;
import net.deckserver.jol.entity.Game;
import org.apache.http.HttpStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;

@QuarkusTest
public class GameControllerTest {

    @AfterEach
    @Transactional
    public void destroy() {
        Game.deleteAll();
    }

    /**
     * Creates game with a user role; expects success
     */
    @Test
    @TestSecurity(user = "existingUser", roles = {"user"})
    public void createGame() {
        GameController.GameCreate gameCreate = new GameController.GameCreate("Test Game");
        given().body(gameCreate)
                .contentType(MediaType.APPLICATION_JSON)
                .post("/games")
                .then()
                .statusCode(HttpStatus.SC_CREATED);
    }

    /**
     * Confirms unauthorised game creation without proper authentication
     */
    @Test
    @TestSecurity(user = "existingUser", roles = {"guest"})
    public void createGameSecurity() {
        GameController.GameCreate gameCreate = new GameController.GameCreate("Test Game");
        given().body(gameCreate)
                .contentType(MediaType.APPLICATION_JSON)
                .post("/games")
                .then()
                .statusCode(HttpStatus.SC_FORBIDDEN);
    }
}
