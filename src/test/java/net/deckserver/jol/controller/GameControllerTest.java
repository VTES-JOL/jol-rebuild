package net.deckserver.jol.controller;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import jakarta.ws.rs.core.MediaType;
import org.apache.http.HttpStatus;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;

@QuarkusTest
public class GameControllerTest {

    @Test
    @TestSecurity(user = "existingUser", roles = {"USER"})
    public void createGame() {
        GameController.GameCreate gameCreate = new GameController.GameCreate("Test Game");
        given().body(gameCreate)
                .contentType(MediaType.APPLICATION_JSON)
                .post("/games")
                .then()
                .statusCode(HttpStatus.SC_CREATED);
    }
}
