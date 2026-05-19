package net.deckserver.jol.services;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

@QuarkusTest
class NameServiceTest {

    @Inject
    NameService service;

    @Test
    void generateName_producesThreeWordPattern() {
        String name = service.generateName();

        assertNotNull(name);
        String[] parts = name.split(" ");
        assertEquals(3, parts.length, "Expected 'adjective verb noun' but got: " + name);
    }

    @Test
    void generateName_noBlankComponents() {
        for (int i = 0; i < 20; i++) {
            String name = service.generateName();
            for (String part : name.split(" ")) {
                assertFalse(part.isBlank(), "Blank word in generated name: " + name);
            }
        }
    }

    @Test
    void getAdjective_returnsNonBlank() {
        assertFalse(service.getAdjective().isBlank());
    }

    @Test
    void getVerb_returnsNonBlank() {
        assertFalse(service.getVerb().isBlank());
    }

    @Test
    void getNoun_returnsNonBlank() {
        assertFalse(service.getNoun().isBlank());
    }

    @Test
    void generateName_isNonDeterministic() {
        // Extremely unlikely to produce the same name 10 times in a row
        String first = service.generateName();
        boolean seenDifferent = false;
        for (int i = 0; i < 10; i++) {
            if (!service.generateName().equals(first)) {
                seenDifferent = true;
                break;
            }
        }
        assertTrue(seenDifferent, "generateName() appears to be deterministic");
    }
}
