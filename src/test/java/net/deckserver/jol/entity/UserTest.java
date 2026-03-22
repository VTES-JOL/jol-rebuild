package net.deckserver.jol.entity;

import io.quarkus.elytron.security.common.BcryptUtil;
import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import net.deckserver.jol.enums.Role;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class UserTest {

    @Test
    @TestTransaction
    public void createUser() {
        User.add("ShanDow", "password", "shannon.dowley@gmail.com", Role.USER);
        User.flush();
        assertThrows(IllegalArgumentException.class, () -> User.add("ShanDow", "password", "shannon.dowley@gmail.com", Role.USER));
    }

    @Test
    @TestTransaction
    public void validateUserConstruction() {
        String username = "TestConstruct";
        String password = "password123";
        User user = User.add(username, password, "test@test.com", Role.USER, Role.ADMIN);

        assertNotNull(user);
        // Verify password is hashed and matches
        assertNotEquals(password, user.password);
        assertTrue(BcryptUtil.matches(password, user.password));
        // Verify roles
        assertTrue(user.roles.contains("USER"));
        assertTrue(user.roles.contains("ADMIN"));
    }
}
