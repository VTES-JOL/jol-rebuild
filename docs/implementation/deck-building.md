# Deck Building — Implementation

Documents JOL's deck storage format, import parsers, and validation services.

See [VTES Rules — Deck Building](../rules/deck-building.md) for the official group restriction and format size limits.

---

## Storage Format

Decks are stored in JSON format following the [KRCG API](https://api.krcg.org/) schema.

---

## Summary Format

An additional compact summary string is generated in the format `(crypt size),(library size),(crypt groupings)`:
- Crypt and library sizes are counts of all cards in the respective sections.
- Crypt groupings is the integer value of the non-`ANY`-grouped crypt cards, with a `/` separator.

---

## Deck Importing

Decks for import are accepted in either the JOL text format or the KRCG JSON format.

### JOL Text Format

- Each line represents one entry.
- An entry consists of an amount followed by the card name, with an optional `x` or `X` character between them.
- The card name can be any valid name as determined by the card search rules in [cards.md](./cards.md).
- If the amount is not present it is assumed to be 1.
- The same card name may appear on more than one line; it is accumulated at the end.
- Whitespace is optional around the `x` or `X` separator.

### KRCG JSON Format

The KRCG deck format is a structured document where cards are listed with their identifying ID and a count.

---

## Deck Validation

Decks are validated on import or save against the format rules defined in [VTES Rules — Deck Building](../rules/deck-building.md). Satisfying the criteria allows the deck to be registered in a game created with the matching format. Any errors are reported back to the user with an explanation of the reason.

### Duel Format

Card eligibility is checked against the allowlist `valid-duel-cards.txt`.

### V5 Format

Cards must either be present in `valid-v5-cards.txt` or have a `set` item present in `valid-v5-sets.txt`.
