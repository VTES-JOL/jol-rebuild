package net.deckserver.jol.entity;

import io.quarkus.test.TestTransaction;
import io.quarkus.test.junit.QuarkusTest;
import net.deckserver.jol.enums.Role;
import org.junit.jupiter.api.Test;

import java.time.ZoneId;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
public class PreferencesTest {

    @Test
    @TestTransaction
    public void preferencesCreatedWithUser() {
        User user = User.create("prefuser", "password", "pref@test.com", Role.USER);
        
        assertNotNull(user.preferences);
        assertNotNull(user.preferences.zoneId);
        assertTrue(user.preferences.enableImages);
    }

    @Test
    @TestTransaction
    public void updatePreferences() {
        User user = User.create("prefuser2", "password", "pref2@test.com", Role.USER);
        Preferences prefs = user.preferences;
        
        prefs.countryCode = "US";
        prefs.zoneId = ZoneId.of("America/New_York");
        prefs.enableImages = false;
        prefs.persist();

        User retrieved = User.findByUsername("prefuser2");
        assertEquals("US", retrieved.preferences.countryCode);
        assertEquals(ZoneId.of("America/New_York"), retrieved.preferences.zoneId);
        assertFalse(retrieved.preferences.enableImages);
    }
}
