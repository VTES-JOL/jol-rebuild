package net.deckserver.jol.entity;

import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class UserTest {

    @Test
    @TestTransaction
    public void createUser() {
        User.add("ShanDow", "password", "shannon.dowley@gmail.com", "USER");
        User.flush();
        assertThrows(IllegalArgumentException.class, () -> User.add("ShanDow", "password", "shannon.dowley@gmail.com", "USER"));
    }

    @Test
    @TestTransaction
    public void validateUserConstruction() {
        String username = "TestConstruct";
        String password = "password123";
        User.add(username, password, "test@test.com", "USER", "ADMIN");

        User user = User.findByUsername(username);
        assertNotNull(user);
        // Verify password is hashed and matches
        assertNotEquals(password, user.password);
        assertTrue(BcryptUtil.matches(password, user.password));
        // Verify roles
        assertTrue(user.roles.contains("USER"));
        assertTrue(user.roles.contains("ADMIN"));
    }
}
