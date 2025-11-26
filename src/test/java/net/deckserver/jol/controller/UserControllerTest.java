package net.deckserver.jol.controller;

import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import io.restassured.authentication.FormAuthConfig;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import jakarta.ws.rs.core.MediaType;
import org.apache.http.HttpStatus;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.is;

@QuarkusTest
public class UserControllerTest {

    private final FormAuthConfig formAuthConfig = new FormAuthConfig("/user/login", "j_username", "j_password");

    @Test
    @TestTransaction
    void register() {
        UserController.Register register = new UserController.Register("NewUser", "password", "shannon.dowley@gmail.com");
        given().body(register)
                .contentType(MediaType.APPLICATION_JSON)
                .post("/user/register")
                .then()
                .statusCode(201);
    }

    @Test
    @TestTransaction
    void registerDuplicate() {
        UserController.Register register = new UserController.Register("DupUser", "password", "dup@gmail.com");
        // First registration
        given().body(register)
                .contentType(MediaType.APPLICATION_JSON)
                .post("/user/register")
                .then()
                .statusCode(201);

        // Second registration (Duplicate)
        given().body(register)
                .contentType(MediaType.APPLICATION_JSON)
                .post("/user/register")
                .then()
                // Expects 500 because IllegalArgumentException propagates out.
                // Ideally, you would add an ExceptionMapper to return 409 Conflict or 400 Bad Request.
                .statusCode(HttpStatus.SC_CONFLICT);
    }

    @Test
    @TestTransaction
    void changePassword() {
        // 0. Register a user to ensure it exists
        String username = "PasswordChange-" + System.currentTimeMillis();
        String password = "password";
        String newPassword = "newPassword";
        UserController.Register register = new UserController.Register(username, password, "logout@example.com");

        given().body(register)
                .contentType(MediaType.APPLICATION_JSON)
                .post("/user/register")
                .then()
                .statusCode(HttpStatus.SC_CREATED);

        // Login with new password - should fail
        given()
                .contentType(ContentType.URLENC)
                .formParam("j_username", username)
                .formParam("j_password", newPassword)
                .post("/user/login")
                .then()
                .statusCode(HttpStatus.SC_UNAUTHORIZED);

        // 1. Log in to obtain a session cookie
        Response loginResponse = given()
                .contentType(ContentType.URLENC)
                .formParam("j_username", username)
                .formParam("j_password", password)
                .post("/user/login");

        String sessionId = loginResponse.cookie("quarkus-credential"); // Get the session cookie

        given().body(newPassword)
                .cookie("quarkus-credential", sessionId)
                .when()
                .post("/user/change-password")
                .then()
                .statusCode(HttpStatus.SC_OK);

        // Log in with new password
        given()
                .contentType(ContentType.URLENC)
                .formParam("j_username", username)
                .formParam("j_password", newPassword)
                .post("/user/login")
                .then()
                .statusCode(HttpStatus.SC_OK);
    }

    @Test
    void login() {
        given().auth().form("NewUser", "password", formAuthConfig)
                .when()
                .get("/user/me")
                .then()
                .statusCode(HttpStatus.SC_OK)
                .body(is("NewUser"));
    }

    @Test
    void loginFailed() {
        given()
                .contentType(ContentType.URLENC)
                .formParam("j_username", "NewUser")
                .formParam("j_password", "wrongpassword")
                .post("/user/login")
                .then()
                .statusCode(HttpStatus.SC_UNAUTHORIZED);
    }

    @Test
    void logout() {
        // 0. Register a user to ensure it exists
        String username = "LogoutUser-" + System.currentTimeMillis();
        String password = "password";
        UserController.Register register = new UserController.Register(username, password, "logout@example.com");

        given().body(register)
                .contentType(MediaType.APPLICATION_JSON)
                .post("/user/register")
                .then()
                .statusCode(HttpStatus.SC_CREATED);

        // 1. Log in to obtain a session cookie
        Response loginResponse = given()
                .contentType(ContentType.URLENC)
                .formParam("j_username", username)
                .formParam("j_password", password)
                .post("/user/login");

        String sessionId = loginResponse.cookie("quarkus-credential"); // Get the session cookie

        // 2. Perform logout using the session cookie
        given()
                .cookie("quarkus-credential", sessionId)
                .when()
                .post("/user/logout")
                .then()
                .statusCode(HttpStatus.SC_NO_CONTENT);
    }

    @Test
    void logoutNotLoggedIn() {
        given()
                .when()
                .post("/user/logout")
                .then()
                .statusCode(HttpStatus.SC_UNAUTHORIZED);

    }

}
