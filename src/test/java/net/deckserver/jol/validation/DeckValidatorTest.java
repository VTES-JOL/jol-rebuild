package net.deckserver.jol.validation;

import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import net.deckserver.jol.enums.GameFormat;
import net.deckserver.jol.model.krcg.*;
import net.deckserver.jol.validation.DeckValidator.ValidationResult;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Integration tests for all three DeckValidator implementations.
 * Uses real card data from the CSV registry — all card IDs reference real cards.
 *
 * Card fixtures used:
 *   200076 - Anarch Convert      (non-banned, NOT in duel/V5 whitelists)
 *   201634 - Abraham Mellon      (non-banned, duel whitelist, V5 via FOL set)
 *   201663 - Abaddon             (non-banned, NOT in duel whitelist, V5 via V5C set)
 *   100518 - Deflection          (non-banned, duel whitelist, NOT in V5 whitelists)
 *   100046 - Ambush              (non-banned, duel + V5 card whitelists)
 *   201343 - Tarbaby Jack        (banned)
 *   100074 - Anthelios, The Red Star (banned)
 */
@QuarkusTest
class DeckValidatorTest {

    @Inject StandardDeckValidator standard;
    @Inject DuelDeckValidator duel;
    @Inject V5DeckValidator v5;

    // ── Helpers ───────────────────────────────────────────────────────────────

    /** Single-card deck: one KrcgCard entry with the given total copy count. */
    private KrcgDeck deck(String cryptId, String cryptName, int cryptCopies,
                          String libId, String libName, int libCopies) {
        var crypt = new KrcgCrypt(cryptCopies,
                List.of(new KrcgCard(cryptId, cryptCopies, cryptName)));
        var library = new KrcgLibrary(libCopies,
                List.of(new KrcgLibraryGroup("Action", libCopies,
                        List.of(new KrcgCard(libId, libCopies, libName)))));
        return new KrcgDeck(null, crypt, library);
    }

    /** Multi-crypt-card deck — lets us mix cards in the crypt. */
    private KrcgDeck deckMultiCrypt(List<KrcgCard> cryptCards, String libId, String libName, int libCopies) {
        int cryptTotal = cryptCards.stream().mapToInt(KrcgCard::count).sum();
        var crypt = new KrcgCrypt(cryptTotal, cryptCards);
        var library = new KrcgLibrary(libCopies,
                List.of(new KrcgLibraryGroup("Action", libCopies,
                        List.of(new KrcgCard(libId, libCopies, libName)))));
        return new KrcgDeck(null, crypt, library);
    }

    // ── StandardDeckValidator ─────────────────────────────────────────────────

    @Test
    void standard_valid() {
        // 12 crypt, 60 library, no banned cards
        KrcgDeck deck = deck("200076", "Anarch Convert", 12, "100518", "Deflection", 60);
        ValidationResult result = standard.validate(deck, GameFormat.STANDARD);

        assertTrue(result.valid());
        assertThat(result.errors(), empty());
    }

    @Test
    void standard_isValid_shorthand() {
        KrcgDeck deck = deck("200076", "Anarch Convert", 12, "100518", "Deflection", 60);
        assertTrue(standard.isValid(deck, GameFormat.STANDARD));

        KrcgDeck tooSmall = deck("200076", "Anarch Convert", 5, "100518", "Deflection", 60);
        assertFalse(standard.isValid(tooSmall, GameFormat.STANDARD));
    }

    @Test
    void standard_cryptTooSmall() {
        KrcgDeck deck = deck("200076", "Anarch Convert", 11, "100518", "Deflection", 60);
        ValidationResult result = standard.validate(deck, GameFormat.STANDARD);

        assertFalse(result.valid());
        assertThat(result.errors(), hasSize(1));
        assertThat(result.errors().getFirst(), containsString("12"));
    }

    @Test
    void standard_libraryTooSmall() {
        KrcgDeck deck = deck("200076", "Anarch Convert", 12, "100518", "Deflection", 59);
        ValidationResult result = standard.validate(deck, GameFormat.STANDARD);

        assertFalse(result.valid());
        assertThat(result.errors(), hasSize(1));
        assertThat(result.errors().getFirst(), containsString("60"));
    }

    @Test
    void standard_libraryTooLarge() {
        KrcgDeck deck = deck("200076", "Anarch Convert", 12, "100518", "Deflection", 91);
        ValidationResult result = standard.validate(deck, GameFormat.STANDARD);

        assertFalse(result.valid());
        assertThat(result.errors(), hasSize(1));
        assertThat(result.errors().getFirst(), containsString("90"));
    }

    @Test
    void standard_bannedCryptCard() {
        KrcgDeck deck = deckMultiCrypt(
                List.of(new KrcgCard("200076", 12, "Anarch Convert"),
                        new KrcgCard("201343", 1, "Tarbaby Jack")),
                "100518", "Deflection", 60);

        ValidationResult result = standard.validate(deck, GameFormat.STANDARD);

        assertFalse(result.valid());
        assertThat(result.errors(), hasSize(1));
        assertThat(result.errors().getFirst(), containsString("Tarbaby Jack"));
        assertThat(result.errors().getFirst(), containsStringIgnoringCase("banned"));
    }

    @Test
    void standard_bannedLibraryCard() {
        // Library with a banned card (100074 = Anthelios, The Red Star)
        var crypt = new KrcgCrypt(12, List.of(new KrcgCard("200076", 12, "Anarch Convert")));
        var library = new KrcgLibrary(60, List.of(
                new KrcgLibraryGroup("Action", 60, List.of(
                        new KrcgCard("100518", 59, "Deflection"),
                        new KrcgCard("100074", 1, "Anthelios, The Red Star")))));
        KrcgDeck deck = new KrcgDeck(null, crypt, library);

        ValidationResult result = standard.validate(deck, GameFormat.STANDARD);

        assertFalse(result.valid());
        assertThat(result.errors(), hasSize(1));
        assertThat(result.errors().getFirst(), containsString("Anthelios"));
    }

    @Test
    void standard_multipleErrors() {
        // Crypt too small AND library too small
        KrcgDeck deck = deck("200076", "Anarch Convert", 5, "100518", "Deflection", 30);
        ValidationResult result = standard.validate(deck, GameFormat.STANDARD);

        assertFalse(result.valid());
        assertThat(result.errors(), hasSize(2));
    }

    @Test
    void standard_resultCarriesFormat() {
        KrcgDeck deck = deck("200076", "Anarch Convert", 12, "100518", "Deflection", 60);
        assertEquals(GameFormat.STANDARD, standard.validate(deck, GameFormat.STANDARD).format());
    }

    // ── DuelDeckValidator ─────────────────────────────────────────────────────

    @Test
    void duel_valid() {
        // 4 crypt, 40 library, all cards in duel whitelist
        // Abraham Mellon (201634) and Deflection (100518) are both in the duel whitelist
        KrcgDeck deck = deck("201634", "Abraham Mellon", 4, "100518", "Deflection", 40);
        ValidationResult result = duel.validate(deck, GameFormat.DUEL);

        assertTrue(result.valid());
        assertThat(result.errors(), empty());
    }

    @Test
    void duel_cryptTooSmall() {
        KrcgDeck deck = deck("201634", "Abraham Mellon", 3, "100518", "Deflection", 40);
        ValidationResult result = duel.validate(deck, GameFormat.DUEL);

        assertFalse(result.valid());
        assertThat(result.errors(), hasSize(1));
        assertThat(result.errors().getFirst(), containsString("4"));
    }

    @Test
    void duel_libraryTooSmall() {
        KrcgDeck deck = deck("201634", "Abraham Mellon", 4, "100518", "Deflection", 39);
        ValidationResult result = duel.validate(deck, GameFormat.DUEL);

        assertFalse(result.valid());
        assertThat(result.errors().getFirst(), containsString("40"));
    }

    @Test
    void duel_libraryTooLarge() {
        KrcgDeck deck = deck("201634", "Abraham Mellon", 4, "100518", "Deflection", 61);
        ValidationResult result = duel.validate(deck, GameFormat.DUEL);

        assertFalse(result.valid());
        assertThat(result.errors().getFirst(), containsString("60"));
    }

    @Test
    void duel_cardNotInWhitelist() {
        // Anarch Convert (200076) is NOT in the duel whitelist
        KrcgDeck deck = deck("200076", "Anarch Convert", 4, "100518", "Deflection", 40);
        ValidationResult result = duel.validate(deck, GameFormat.DUEL);

        assertFalse(result.valid());
        assertThat(result.errors(), hasSize(1));
        assertThat(result.errors().getFirst(), containsString("Anarch Convert"));
    }

    @Test
    void duel_multipleInvalidCards() {
        // Both Anarch Convert (200076) and Govern the Unaligned (100845) are NOT in duel whitelist
        var crypt = new KrcgCrypt(4, List.of(new KrcgCard("200076", 4, "Anarch Convert")));
        var library = new KrcgLibrary(40, List.of(
                new KrcgLibraryGroup("Action", 40, List.of(
                        new KrcgCard("100518", 30, "Deflection"),
                        new KrcgCard("100845", 10, "Govern the Unaligned")))));
        KrcgDeck deck = new KrcgDeck(null, crypt, library);

        ValidationResult result = duel.validate(deck, GameFormat.DUEL);

        assertFalse(result.valid());
        // Crypt invalid + library card invalid
        assertThat(result.errors(), hasSize(2));
        assertThat(result.errors(), hasItem(containsString("Anarch Convert")));
        assertThat(result.errors(), hasItem(containsString("Govern the Unaligned")));
    }

    @Test
    void duel_resultCarriesFormat() {
        KrcgDeck deck = deck("201634", "Abraham Mellon", 4, "100518", "Deflection", 40);
        assertEquals(GameFormat.DUEL, duel.validate(deck, GameFormat.DUEL).format());
    }

    // ── V5DeckValidator ───────────────────────────────────────────────────────

    @Test
    void v5_validByIdWhitelist() {
        // Ambush (100046) is in the V5 card ID whitelist
        // Abraham Mellon (201634) is in V5 via FOL set
        KrcgDeck deck = deck("201634", "Abraham Mellon", 12, "100046", "Ambush", 60);
        ValidationResult result = v5.validate(deck, GameFormat.V5);

        assertTrue(result.valid());
        assertThat(result.errors(), empty());
    }

    @Test
    void v5_validBySetWhitelist() {
        // Abaddon (201663) is NOT in the V5 card ID whitelist, but IS in V5C set (which is whitelisted)
        KrcgDeck deck = deck("201663", "Abaddon", 12, "100046", "Ambush", 60);
        ValidationResult result = v5.validate(deck, GameFormat.V5);

        assertTrue(result.valid());
        assertThat(result.errors(), empty());
    }

    @Test
    void v5_invalidNotInEitherWhitelist() {
        // Aaron's Feeding Razor (100003) is only in JYHAD/VTES/CE/KOT sets — NOT in V5 card or set whitelist
        KrcgDeck deck = deck("201634", "Abraham Mellon", 12, "100003", "Aaron's Feeding Razor", 60);
        ValidationResult result = v5.validate(deck, GameFormat.V5);

        assertFalse(result.valid());
        assertThat(result.errors(), hasSize(1));
        assertThat(result.errors().getFirst(), containsString("Aaron's Feeding Razor"));
        assertThat(result.errors().getFirst(), containsStringIgnoringCase("V5"));
    }

    @Test
    void v5_cryptCardNotInWhitelist() {
        // Anarch Convert (200076) printed in TR/ANTHOLOGY sets — not in V5 whitelists
        KrcgDeck deck = deck("200076", "Anarch Convert", 12, "100046", "Ambush", 60);
        ValidationResult result = v5.validate(deck, GameFormat.V5);

        assertFalse(result.valid());
        assertThat(result.errors(), hasSize(1));
        assertThat(result.errors().getFirst(), containsString("Anarch Convert"));
    }

    @Test
    void v5_cryptTooSmall() {
        KrcgDeck deck = deck("201634", "Abraham Mellon", 11, "100046", "Ambush", 60);
        ValidationResult result = v5.validate(deck, GameFormat.V5);

        assertFalse(result.valid());
        assertThat(result.errors().getFirst(), containsString("12"));
    }

    @Test
    void v5_libraryOutOfRange() {
        KrcgDeck smallLib = deck("201634", "Abraham Mellon", 12, "100046", "Ambush", 59);
        assertFalse(v5.validate(smallLib, GameFormat.V5).valid());

        KrcgDeck bigLib = deck("201634", "Abraham Mellon", 12, "100046", "Ambush", 91);
        assertFalse(v5.validate(bigLib, GameFormat.V5).valid());
    }

    @Test
    void v5_resultCarriesFormat() {
        KrcgDeck deck = deck("201634", "Abraham Mellon", 12, "100046", "Ambush", 60);
        assertEquals(GameFormat.V5, v5.validate(deck, GameFormat.V5).format());
    }
}
