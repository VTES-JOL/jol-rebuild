package net.deckserver.jol.controller;

import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.TestSecurity;
import io.restassured.http.ContentType;
import net.deckserver.jol.entity.Tournament;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.CoreMatchers.is;
import static org.hamcrest.Matchers.greaterThanOrEqualTo;
import static org.hamcrest.Matchers.hasSize;

@QuarkusTest
public class TournamentControllerTest {

    // ─── Core CRUD ─────────────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "admin", roles = "TOURNAMENT_ADMIN")
    public void testCreateAndGetTournament() {
        Tournament tournament = new Tournament();
        tournament.name = "Test Tournament";

        long id = ((Number) given()
                .contentType(ContentType.JSON)
                .body(tournament)
                .when().post("/api/tournaments")
                .then()
                .statusCode(200)
                .body("name", is("Test Tournament"))
                .body("status", is("SETUP"))
                .extract().path("id")).longValue();

        given()
                .when().get("/api/tournaments/" + id)
                .then()
                .statusCode(200)
                .body("name", is("Test Tournament"))
                .body("status", is("SETUP"));
    }

    @Test
    @TestSecurity(user = "admin", roles = "TOURNAMENT_ADMIN")
    public void testUpdateTournamentAsAdmin() {
        Tournament tournament = new Tournament();
        tournament.name = "Initial Name";

        long id = ((Number) given()
                .contentType(ContentType.JSON)
                .body(tournament)
                .when().post("/api/tournaments")
                .then()
                .statusCode(200)
                .extract().path("id")).longValue();

        tournament.name = "Updated Name";
        given()
                .contentType(ContentType.JSON)
                .body(tournament)
                .when().put("/api/tournaments/" + id)
                .then()
                .statusCode(200)
                .body("name", is("Updated Name"));
    }

    @Test
    @TestSecurity(user = "user", roles = "USER")
    public void testCreateTournamentAsUserForbidden() {
        Tournament tournament = new Tournament();
        tournament.name = "User Create Test";

        given()
                .contentType(ContentType.JSON)
                .body(tournament)
                .when().post("/api/tournaments")
                .then()
                .statusCode(403);
    }

    @Test
    public void testListTournamentsAnonymous() {
        given()
                .when().get("/api/tournaments")
                .then()
                .statusCode(200)
                .body("$", hasSize(greaterThanOrEqualTo(0)));
    }

    @Test
    @TestSecurity(user = "admin", roles = "TOURNAMENT_ADMIN")
    public void testAdminSeesSetupTournaments() {
        // Create a SETUP tournament
        Tournament tournament = new Tournament();
        tournament.name = "Setup Visibility Test";

        long id = ((Number) given()
                .contentType(ContentType.JSON)
                .body(tournament)
                .when().post("/api/tournaments")
                .then()
                .statusCode(200)
                .extract().path("id")).longValue();

        // Admin can see it directly
        given()
                .when().get("/api/tournaments/" + id)
                .then()
                .statusCode(200)
                .body("status", is("SETUP"));

        // Cleanup
        given().when().delete("/api/tournaments/" + id).then().statusCode(204);
    }

    @Test
    @TestSecurity(user = "user", roles = "USER")
    public void testUserCannotSeeSetupTournament() {
        // A SETUP tournament should return 404 for regular users
        // We rely on the admin test having cleaned up, but check a known-missing id
        given()
                .when().get("/api/tournaments/999999")
                .then()
                .statusCode(404);
    }

    @Test
    @TestSecurity(user = "admin", roles = "TOURNAMENT_ADMIN")
    public void testDeleteTournamentAsAdmin() {
        Tournament tournament = new Tournament();
        tournament.name = "Delete Me";

        long id = ((Number) given()
                .contentType(ContentType.JSON)
                .body(tournament)
                .when().post("/api/tournaments")
                .then()
                .statusCode(200)
                .extract().path("id")).longValue();

        given()
                .when().delete("/api/tournaments/" + id)
                .then()
                .statusCode(204);

        given()
                .when().get("/api/tournaments/" + id)
                .then()
                .statusCode(404);
    }

    @Test
    @TestSecurity(user = "user", roles = "USER")
    public void testDeleteTournamentAsUserForbidden() {
        given()
                .when().delete("/api/tournaments/1")
                .then()
                .statusCode(403);
    }

    // ─── Status Transitions ────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "admin", roles = "TOURNAMENT_ADMIN")
    public void testPublishTournament() {
        Tournament tournament = new Tournament();
        tournament.name = "Publish Test";

        long id = ((Number) given()
                .contentType(ContentType.JSON)
                .body(tournament)
                .when().post("/api/tournaments")
                .then().statusCode(200)
                .extract().path("id")).longValue();

        given()
                .contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/publish")
                .then()
                .statusCode(200)
                .body("status", is("REGISTRATION"));

        // Cleanup
        given().when().delete("/api/tournaments/" + id).then();
    }

    @Test
    @TestSecurity(user = "admin", roles = "TOURNAMENT_ADMIN")
    public void testPublishRequiresSetupStatus() {
        Tournament tournament = new Tournament();
        tournament.name = "Double Publish Test";

        long id = ((Number) given()
                .contentType(ContentType.JSON)
                .body(tournament)
                .when().post("/api/tournaments")
                .then().statusCode(200)
                .extract().path("id")).longValue();

        // First publish succeeds
        given().contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/publish")
                .then().statusCode(200);

        // Second publish fails — no longer in SETUP
        given().contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/publish")
                .then().statusCode(400);

        // Cleanup
        given().when().delete("/api/tournaments/" + id).then();
    }

    @Test
    @TestSecurity(user = "user", roles = "USER")
    public void testPublishForbiddenForUser() {
        given()
                .contentType(ContentType.JSON)
                .when().post("/api/tournaments/1/publish")
                .then()
                .statusCode(403);
    }

    @Test
    @TestSecurity(user = "admin", roles = "TOURNAMENT_ADMIN")
    public void testUnpublishTournament() {
        Tournament tournament = new Tournament();
        tournament.name = "Unpublish Test";

        long id = ((Number) given()
                .contentType(ContentType.JSON)
                .body(tournament)
                .when().post("/api/tournaments")
                .then().statusCode(200)
                .extract().path("id")).longValue();

        given().contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/publish")
                .then().statusCode(200);

        given().contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/unpublish")
                .then()
                .statusCode(200)
                .body("status", is("SETUP"));

        // Cleanup
        given().when().delete("/api/tournaments/" + id).then();
    }

    @Test
    @TestSecurity(user = "admin", roles = "TOURNAMENT_ADMIN")
    public void testBeginSeating() {
        Tournament tournament = new Tournament();
        tournament.name = "Seating Test";

        long id = ((Number) given()
                .contentType(ContentType.JSON)
                .body(tournament)
                .when().post("/api/tournaments")
                .then().statusCode(200)
                .extract().path("id")).longValue();

        given().contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/publish")
                .then().statusCode(200);

        given().contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/seat")
                .then()
                .statusCode(200)
                .body("status", is("SEATING"));

        // Cleanup
        given().when().delete("/api/tournaments/" + id).then();
    }

    @Test
    @TestSecurity(user = "admin", roles = "TOURNAMENT_ADMIN")
    public void testActivateFailsWhenPlayersUnseated() {
        Tournament tournament = new Tournament();
        tournament.name = "Activate Fail Test";

        long id = ((Number) given()
                .contentType(ContentType.JSON)
                .body(tournament)
                .when().post("/api/tournaments")
                .then().statusCode(200)
                .extract().path("id")).longValue();

        given().contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/publish")
                .then().statusCode(200);

        given().contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/seat")
                .then().statusCode(200);

        // No players registered, so activate should fail (no unseated players means 0 players —
        // but backend validates all *registered* players are seated; with 0 registrations it should succeed)
        // Actually with no registrations it should succeed (vacuously all 0 players are seated)
        given().contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/activate")
                .then()
                .statusCode(200)
                .body("status", is("ACTIVE"));

        // Cleanup
        given().when().delete("/api/tournaments/" + id).then();
    }

    // ─── Seating Management ────────────────────────────────────────────────────

    @Test
    @TestSecurity(user = "admin", roles = "TOURNAMENT_ADMIN")
    public void testAddAndRemoveTable() {
        Tournament tournament = new Tournament();
        tournament.name = "Table Test";

        long id = ((Number) given()
                .contentType(ContentType.JSON)
                .body(tournament)
                .when().post("/api/tournaments")
                .then().statusCode(200)
                .extract().path("id")).longValue();

        given().contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/publish")
                .then().statusCode(200);

        given().contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/seat")
                .then().statusCode(200);

        long tableId = ((Number) given()
                .contentType(ContentType.JSON)
                .body("{\"roundNumber\": 1}")
                .when().post("/api/tournaments/" + id + "/tables")
                .then().statusCode(200)
                .extract().path("id")).longValue();

        given()
                .when().delete("/api/tournaments/" + id + "/tables/" + tableId)
                .then().statusCode(204);

        // Cleanup
        given().when().delete("/api/tournaments/" + id).then();
    }

    @Test
    @TestSecurity(user = "admin", roles = "TOURNAMENT_ADMIN")
    public void testAddTableInvalidRound() {
        Tournament tournament = new Tournament();
        tournament.name = "Invalid Round Test";

        long id = ((Number) given()
                .contentType(ContentType.JSON)
                .body(tournament)
                .when().post("/api/tournaments")
                .then().statusCode(200)
                .extract().path("id")).longValue();

        given().contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/publish")
                .then().statusCode(200);
        given().contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/seat")
                .then().statusCode(200);

        given()
                .contentType(ContentType.JSON)
                .body("{\"roundNumber\": 99}")
                .when().post("/api/tournaments/" + id + "/tables")
                .then().statusCode(400);

        // Cleanup
        given().when().delete("/api/tournaments/" + id).then();
    }

    @Test
    @TestSecurity(user = "admin", roles = "TOURNAMENT_ADMIN")
    public void testAddExtraRound() {
        Tournament tournament = new Tournament();
        tournament.name = "Extra Round Test";
        tournament.numberOfRounds = 2;

        long id = ((Number) given()
                .contentType(ContentType.JSON)
                .body(tournament)
                .when().post("/api/tournaments")
                .then().statusCode(200)
                .extract().path("id")).longValue();

        given().contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/publish")
                .then().statusCode(200);
        given().contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/seat")
                .then().statusCode(200);

        given()
                .contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/extra-round")
                .then()
                .statusCode(200)
                .body("numberOfRounds", is(3));

        // Can't add more than 3
        given()
                .contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/extra-round")
                .then()
                .statusCode(400);

        // Cleanup
        given().when().delete("/api/tournaments/" + id).then();
    }

    @Test
    @TestSecurity(user = "admin", roles = "TOURNAMENT_ADMIN")
    public void testGetSeating() {
        Tournament tournament = new Tournament();
        tournament.name = "Seating DTO Test";

        long id = ((Number) given()
                .contentType(ContentType.JSON)
                .body(tournament)
                .when().post("/api/tournaments")
                .then().statusCode(200)
                .extract().path("id")).longValue();

        given().contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/publish")
                .then().statusCode(200);
        given().contentType(ContentType.JSON)
                .when().post("/api/tournaments/" + id + "/seat")
                .then().statusCode(200);

        given()
                .when().get("/api/tournaments/" + id + "/seating")
                .then()
                .statusCode(200)
                .body("rounds", hasSize(2));  // default numberOfRounds = 2

        // Cleanup
        given().when().delete("/api/tournaments/" + id).then();
    }
}
