# Deck Building and Importing

## Deck Format
The storage format for a JOL deck is JSON format, according to the KRCG API schema for decks [KRCG API](https://api.krcg.org/)

## Summary Format
An additional summary format in the format `(crypt size),(library size),(crypt groupings)` is also used.
Crypt and Library sizes are counts of all cards in the crypt or library respectfully.
Crypt groupings is the integer value of the non `ANY` grouped crypt cards with a `/` seperator.

## Deck importing
Decks for import are either the text based JOL format, or the JSON based KRCG format

### JOL Text format
- Each line represents one entry.
- An entry consists of an amount followed by the card name, with an optional `x` or `X` character between them.
- The card name can be any valid name as determined by the card search rules located [here](./cards.md)
- If the amount is not present it is assumed to be 1
- The same card name may appear on more than one line, if it does it's accumulated together at the end.
- Whitespace is optional around the `x` or `X` seperator

### KRCG JSON format
- The KRCG deck format is a structured document, where cards are listed with their identifying id, and a count

## Deck Validation
Decks are validated on import or save against the following criteria.
Satisfying the criteria will allow that deck to be registered in a game created with the same format.
Any errors will be reported back to the user in a way that explains the reason for the error.

### Standard format rules
- Crypt must have a minimum of 12 cards, no maximum size
- Library must be between 60–90 cards
- No banned cards

### Duel format rules
- Crypt must have a minimum of 6 cards, no maximum size
- Library must be between 40–60 cards
- Cards must be present in the list `valid-duel-cards.txt`

### V5 format rules
- Standard rules apply for deck size and banned cards
- Cards must be either present in the list `valid-v5-cards.txt`
- or have a `set` item that's present in the list `valid-v5-sets.txt`