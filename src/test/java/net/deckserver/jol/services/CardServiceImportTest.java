package net.deckserver.jol.services;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import net.deckserver.jol.dto.ImportPreviewDto;
import org.junit.jupiter.api.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for DeckImportService.preview() covering JOL text import and KRCG JSON import.
 * Uses real card data loaded from CSV, so assertions are against actual card names/IDs.
 */
@QuarkusTest
class CardServiceImportTest {

    @Inject
    DeckImportService service;

    // ── JOL format ────────────────────────────────────────────────────────────

    /**
     * A crypt card whose base name is unique across all groups (e.g. "Isabel Giovanni")
     * should resolve without any group qualifier.
     */
    @Test
    void jol_unambiguousCryptByNameAlone() {
        ImportPreviewDto result = service.preview("1 x Isabel Giovanni");

        assertEquals("jol", result.format());
        assertThat(result.errors(), empty());
        assertThat(result.resolved(), hasSize(1));
        assertEquals("Isabel Giovanni", result.resolved().getFirst().card().name());
        assertTrue(result.resolved().getFirst().card().crypt());
        assertEquals(1, result.resolved().getFirst().count());
    }

    /**
     * A crypt card with group ANY (e.g. "Anarch Convert") has no suffix in the lookup map,
     * so it should resolve by bare name regardless of the unambiguous-name fix.
     */
    @Test
    void jol_cryptGroupAnyResolvesByName() {
        ImportPreviewDto result = service.preview("5 x Anarch Convert");

        assertThat(result.errors(), empty());
        assertThat(result.resolved(), hasSize(1));
        assertEquals("Anarch Convert", result.resolved().getFirst().card().name());
        assertEquals(5, result.resolved().getFirst().count());
    }

    /**
     * Library cards have no group suffix so they should always resolve by bare name.
     */
    @Test
    void jol_libraryCardResolvesByName() {
        ImportPreviewDto result = service.preview("6 x Deflection");

        assertThat(result.errors(), empty());
        assertThat(result.resolved(), hasSize(1));
        assertEquals("Deflection", result.resolved().getFirst().card().name());
        assertFalse(result.resolved().getFirst().card().crypt());
        assertEquals(6, result.resolved().getFirst().count());
    }

    /**
     * Library card names containing parentheses (disambiguation text in the name itself)
     * must resolve correctly.
     */
    @Test
    void jol_libraryCardWithParenthesesInName() {
        ImportPreviewDto result = service.preview("8 x Khazar's Diary (Endless Night)");

        assertThat(result.errors(), empty());
        assertThat(result.resolved(), hasSize(1));
        assertEquals("Khazar's Diary (Endless Night)", result.resolved().getFirst().card().name());
    }

    /**
     * Count formats "N x Name", "Nx Name", and "N Name" should all parse correctly.
     */
    @Test
    void jol_countFormatVariants() {
        String deck = """
                3 x Vessel
                3X Vessel
                3 Vessel
                """;
        ImportPreviewDto result = service.preview(deck);

        assertThat(result.errors(), empty());
        assertThat(result.resolved(), hasSize(3));
        for (ImportPreviewDto.ResolvedEntry r : result.resolved()) {
            assertEquals("Vessel", r.card().name());
            assertEquals(3, r.count());
        }
    }

    /**
     * An unrecognised card name should produce an error and no resolved entry.
     */
    @Test
    void jol_unknownCardProducesError() {
        ImportPreviewDto result = service.preview("1 x Not A Real Card");

        assertThat(result.resolved(), empty());
        assertThat(result.errors(), hasSize(1));
        assertThat(result.errors().getFirst().reason(), containsStringIgnoringCase("not found"));
    }

    /**
     * A line that doesn't start with a number should produce a parse error.
     */
    @Test
    void jol_malformedLineProducesError() {
        ImportPreviewDto result = service.preview("Deflection x 3");

        assertThat(result.resolved(), empty());
        assertThat(result.errors(), hasSize(1));
    }

    /**
     * Blank lines and comment lines (#, //) are silently ignored.
     */
    @Test
    void jol_blankAndCommentLinesIgnored() {
        String deck = """
                // This is a crypt section
                1 x Deflection

                # another comment
                1 x Vessel
                """;
        ImportPreviewDto result = service.preview(deck);

        assertThat(result.errors(), empty());
        assertThat(result.resolved(), hasSize(2));
    }

    /**
     * Full Giovanni deck list from real JOL data — all lines should resolve without errors.
     */
    @Test
    void jol_fullGiovanniDeck() {
        String deck = """
                1 x Isabel Giovanni
                1 x Lia Milliner
                1 x Marciana Giovanni, Investigator
                1 x Mario Giovanni
                1 x Francesca Giovanni
                1 x Rudolfo Giovanni
                1 x Gloria Giovanni
                1 x Cristofero Giovanni
                5 x Anarch Convert

                3 x Vessel
                2 x Tribute to the Master
                1 x Barrens, The
                1 x Anarch Railroad
                1 x Powerbase: Cape Verde
                3 x Piper
                1 x Powerbase: Los Angeles
                1 x KRCG News Radio
                4 x Jake Washington
                3 x Sudario Refraction
                8 x Khazar's Diary (Endless Night)
                1 x Haunt
                1 x Far Mastery
                1 x Heart of Nizchetus
                7 x Spectral Divination
                7 x Call of the Hungry Dead
                1 x Fractured Armament
                2 x Cold Aura
                7 x Spiritual Intervention
                1 x Leonardo, Mortician
                8 x Cry Wolf
                1 x Grey Thorne
                1 x Carlton Van Wyk
                1 x Unmasking, The
                2 x Delaying Tactics
                6 x Deflection
                5 x On the Qui Vive
                """;

        ImportPreviewDto result = service.preview(deck);

        assertThat("Expected all cards to resolve; errors: " + result.errors(),
                result.errors(), empty());
        assertThat(result.resolved(), hasSize(36));
    }

    // ── KRCG JSON format ──────────────────────────────────────────────────────

    /**
     * KRCG JSON that starts with '{' should be auto-detected as krcg format.
     */
    @Test
    void krcg_autoDetectedByLeadingBrace() {
        // Minimal valid KRCG structure with one library card (Deflection = 100518)
        String json = """
                {
                  "crypt": { "count": 0, "cards": [] },
                  "library": {
                    "count": 1,
                    "cards": [
                      { "type": "Reaction", "count": 1, "cards": [
                        { "id": "100518", "count": 3, "name": "Deflection" }
                      ]}
                    ]
                  }
                }
                """;

        ImportPreviewDto result = service.preview(json);

        assertEquals("krcg", result.format());
        assertThat(result.errors(), empty());
        assertThat(result.resolved(), hasSize(1));
        assertEquals("Deflection", result.resolved().getFirst().card().name());
        assertEquals(3, result.resolved().getFirst().count());
    }

    @Test
    void krcg_extractsDeckName() {
        String json = """
                {
                  "meta": { "name": "My Test Deck" },
                  "crypt": { "count": 0, "cards": [] },
                  "library": { "count": 0, "cards": [] }
                }
                """;

        ImportPreviewDto result = service.preview(json);

        assertEquals("My Test Deck", result.deckName());
    }

    @Test
    void krcg_unknownIdProducesError() {
        String json = """
                {
                  "crypt": { "count": 1, "cards": [
                    { "id": "999999", "count": 1, "name": "Fake Card" }
                  ]},
                  "library": { "count": 0, "cards": [] }
                }
                """;

        ImportPreviewDto result = service.preview(json);

        assertThat(result.resolved(), empty());
        assertThat(result.errors(), hasSize(1));
        assertThat(result.errors().getFirst().reason(), containsString("999999"));
    }
}
