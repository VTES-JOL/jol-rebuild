package net.deckserver.jol.controller;

import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.test.junit.QuarkusTest;
import io.quarkus.test.security.SecurityAttribute;
import io.quarkus.test.security.TestSecurity;
import io.restassured.authentication.FormAuthConfig;
import io.restassured.http.ContentType;
import io.restassured.response.Response;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.core.MediaType;
import net.deckserver.jol.entity.User;
import org.apache.http.HttpStatus;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static io.restassured.RestAssured.given;
import static org.hamcrest.Matchers.equalTo;

@QuarkusTest
public class UserControllerTest {

    private final FormAuthConfig formAuthConfig = new FormAuthConfig("/user/login", "j_username", "j_password");

    @BeforeEach
    @Transactional
    void setup() {
        String passwordHash = BcryptUtil.bcryptHash("password");
        User.getEntityManager().createNativeQuery("INSERT INTO users (id, username, password, email, enableImages, zoneId) VALUES ('9999', 'existingUser', '" + passwordHash + "', 'test@example.org', true, 'UTC')").executeUpdate();
    }

    @AfterEach
    @Transactional
    void cleanup() {
        User.deleteAll();
    }

    @Test
    void register() {
        UserController.Register register = new UserController.Register("NewUser", "password", "shannon.dowley@gmail.com");
        given().body(register)
                .contentType(MediaType.APPLICATION_JSON)
                .post("/user/register")
                .then()
                .statusCode(HttpStatus.SC_CREATED);
    }

    @Test
    void registerInvalidEmail() {
        given().body(new UserController.Register("NewUser", "password", "invalid_email"))
                .contentType(MediaType.APPLICATION_JSON)
                .post("/user/register")
                .then()
                .statusCode(HttpStatus.SC_BAD_REQUEST);
    }

    @Test
    void registerInvalidPassword() {
        given().body(new UserController.Register("NewUser", "short", "valie@example.org"))
                .contentType(MediaType.APPLICATION_JSON)
                .post("/user/register")
                .then()
                .statusCode(HttpStatus.SC_BAD_REQUEST);

        given().body(new UserController.Register("NewUser", "          ", "valie@example.org"))
                .contentType(MediaType.APPLICATION_JSON)
                .post("/user/register")
                .then()
                .statusCode(HttpStatus.SC_BAD_REQUEST);
    }

    @Test
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
    @TestSecurity(user = "existingUser", attributes = {@SecurityAttribute(key = "id", value = "9999")})
    void changePassword() {
        given().auth().form("existingUser", "password", formAuthConfig)
                .when()
                .body("newPassword")
                .post("/user/change-password")
                .then()
                .statusCode(HttpStatus.SC_OK);

        given().auth().form("existingUser", "newPassword", formAuthConfig)
                .when()
                .get("/user/profile")
                .then()
                .statusCode(HttpStatus.SC_OK)
                .body("username", equalTo("existingUser"));
    }

    @Test
    void login() {
        String randomUser = "LoginUser" + System.currentTimeMillis();
        UserController.Register register = new UserController.Register(randomUser, "password", "shannon.dowley@gmail.com");
        given().body(register)
                .contentType(MediaType.APPLICATION_JSON)
                .post("/user/register")
                .then()
                .statusCode(HttpStatus.SC_CREATED);
        given().auth().form(randomUser, "password", formAuthConfig)
                .when()
                .get("/user/profile")
                .then()
                .statusCode(HttpStatus.SC_OK)
                .body("username", equalTo(randomUser));
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

    @Test
    @TestSecurity(user = "existingUser", attributes = {@SecurityAttribute(key = "id", value = "9999")})
    void updateCountryCode() {
        given()
                .body("AU")
                .put("/user/profile/country")
                .then()
                .statusCode(HttpStatus.SC_NO_CONTENT);

        given()
                .body("AUX")
                .put("/user/profile/country")
                .then()
                .statusCode(HttpStatus.SC_BAD_REQUEST);
    }

    @Test
    @TestSecurity(user = "existingUser", attributes = {@SecurityAttribute(key = "id", value = "9999")})
    void updateTimeZone() {
        given()
                .body("Australia/Brisbane")
                .put("/user/profile/timeZone")
                .then()
                .statusCode(HttpStatus.SC_NO_CONTENT);

        given()
                .body("UTC")
                .put("/user/profile/timeZone")
                .then()
                .statusCode(HttpStatus.SC_BAD_REQUEST);
    }

}
