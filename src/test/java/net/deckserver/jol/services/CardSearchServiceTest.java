package net.deckserver.jol.services;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import net.deckserver.jol.dto.CardDetailDto;
import net.deckserver.jol.model.Card;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for CardSearchService using real card data from CSV.
 * Card IDs used (same fixtures as DeckValidatorTest):
 *   200076 - Anarch Convert  (non-banned, group ANY)
 *   100518 - Deflection      (non-banned, Reaction library card)
 *   201343 - Tarbaby Jack    (banned)
 *   201634 - Abraham Mellon  (non-banned, vampire with capacity + disciplines)
 */
@QuarkusTest
class CardSearchServiceTest {

    @Inject
    CardSearchService service;

    // ── findAll ───────────────────────────────────────────────────────────────

    @Test
    void findAll_returnsNonEmptyList() {
        List<Card> all = service.findAll();

        assertThat(all, not(empty()));
    }

    @Test
    void findAll_isSortedByNameCaseInsensitive() {
        List<Card> all = service.findAll();

        List<String> names = all.stream().map(Card::name).toList();
        for (int i = 0; i < Math.min(names.size() - 1, 200); i++) {
            assertTrue(names.get(i).compareToIgnoreCase(names.get(i + 1)) <= 0,
                    "Not sorted at index " + i + ": '" + names.get(i) + "' > '" + names.get(i + 1) + "'");
        }
    }

    // ── findDetailById ────────────────────────────────────────────────────────

    @Test
    void findDetailById_cryptCard_hasCorrectFields() {
        CardDetailDto dto = service.findDetailById("200076"); // Anarch Convert

        assertNotNull(dto);
        assertEquals("200076", dto.id());
        assertEquals("Anarch Convert", dto.name());
        assertTrue(dto.crypt());
    }

    @Test
    void findDetailById_libraryCard_hasCorrectFields() {
        CardDetailDto dto = service.findDetailById("100518"); // Deflection

        assertNotNull(dto);
        assertEquals("100518", dto.id());
        assertEquals("Deflection", dto.name());
        assertFalse(dto.crypt());
        assertThat(dto.types(), not(empty()));
    }

    @Test
    void findDetailById_unknownId_returnsNull() {
        assertNull(service.findDetailById("000000"));
    }

    // ── findDetailsByIds ──────────────────────────────────────────────────────

    @Test
    void findDetailsByIds_returnsMatchedCardsInOrder() {
        List<CardDetailDto> result = service.findDetailsByIds(List.of("200076", "100518"));

        assertThat(result, hasSize(2));
        assertEquals("Anarch Convert", result.get(0).name());
        assertEquals("Deflection", result.get(1).name());
    }

    @Test
    void findDetailsByIds_silentlySkipsUnknownIds() {
        List<CardDetailDto> result = service.findDetailsByIds(List.of("200076", "000000", "100518"));

        assertThat(result, hasSize(2));
        assertThat(result.stream().map(CardDetailDto::name).toList(),
                containsInAnyOrder("Anarch Convert", "Deflection"));
    }

    @Test
    void findDetailsByIds_emptyList_returnsEmpty() {
        assertThat(service.findDetailsByIds(List.of()), empty());
    }

    // ── isBanned ──────────────────────────────────────────────────────────────

    @Test
    void isBanned_bannedCard_returnsTrue() {
        assertTrue(service.isBanned("201343")); // Tarbaby Jack
    }

    @Test
    void isBanned_nonBannedCard_returnsFalse() {
        assertFalse(service.isBanned("200076")); // Anarch Convert
    }

    @Test
    void isBanned_unknownId_returnsFalse() {
        assertFalse(service.isBanned("000000"));
    }

    // ── autocomplete ──────────────────────────────────────────────────────────

    @Test
    void autocomplete_exactMatch_appearsWith0Score() {
        List<CardDetailDto> results = service.autocomplete("Deflection");

        assertThat(results, not(empty()));
        assertEquals("Deflection", results.getFirst().name());
    }

    @Test
    void autocomplete_wordPrefix_resolvesCard() {
        // "Deflec" is a prefix of "Deflection" — should score 1 or 2
        List<CardDetailDto> results = service.autocomplete("Deflec");

        assertThat(results, not(empty()));
        assertThat(results.stream().map(CardDetailDto::name).toList(),
                hasItem("Deflection"));
    }

    @Test
    void autocomplete_capped_atFiveResults() {
        // Very short query that matches many cards
        List<CardDetailDto> results = service.autocomplete("The");

        assertThat(results.size(), lessThanOrEqualTo(5));
    }

    @Test
    void autocomplete_noMatch_returnsEmpty() {
        List<CardDetailDto> results = service.autocomplete("zzzzzzzzzzzzzzzzz");

        assertThat(results, empty());
    }

    // ── toDetailDto field coverage ────────────────────────────────────────────

    @Test
    void toDetailDto_cryptCard_hasCapacityAndGroup() {
        // Abraham Mellon (201634) is a vampire with capacity, group, disciplines
        CardDetailDto dto = service.findDetailById("201634");

        assertNotNull(dto);
        assertTrue(dto.crypt());
        assertNotNull(dto.group());
        assertNotNull(dto.capacity());
        assertThat(dto.capacity(), greaterThan(0));
    }

    @Test
    void toDetailDto_libraryCard_hasTypeListAndNullCryptFields() {
        // Deflection (100518) is a Reaction library card
        CardDetailDto dto = service.findDetailById("100518");

        assertNotNull(dto);
        assertFalse(dto.crypt());
        assertThat(dto.types(), not(empty()));
        assertThat(dto.types(), hasItem(containsStringIgnoringCase("Reaction")));
        // Crypt-only fields should be null/empty for library cards
        assertNull(dto.capacity());
        assertNull(dto.group());
    }
}
