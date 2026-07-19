import type {CardData} from './types.ts';

/** Default card width in px — the fallback wherever the `--card-w` custom property is not set. */
export const CARD_WIDTH = 96;

export const CRYPT_BACK = 'https://static.deckserver.net/images/crypt.jpg';
export const LIBRARY_BACK = 'https://static.deckserver.net/images/library.jpg';
export const CARD_IMAGE_BASE = 'https://static.deckserver.net/images/';

export function isCryptCard({type, crypt}: Pick<CardData, 'type' | 'crypt'>): boolean {
    return type === 'Vampire' || type === 'Imbued' || crypt === true;
}

/** The card's face image, or the appropriate back for face-down/hidden cards. */
export function cardImage(card: CardData): string {
    if (card.faceDown || !card.cardId) return isCryptCard(card) ? CRYPT_BACK : LIBRARY_BACK;
    return `${CARD_IMAGE_BASE}${card.cardId}`;
}

/** Text description of a card and its physical state — the redundant encoding behind beads/rotation/ribbon. */
export function describeCard({name, cardId, id, crypt, type, faceDown, locked, contested, counters, capacity}: CardData): string {
    const isCrypt = isCryptCard({type, crypt});
    const base = faceDown
        ? `Face-down ${isCrypt ? 'crypt' : 'library'} card`
        : (name ?? `Card ${cardId ?? id}`);
    const state = [
        locked && 'locked',
        contested && 'contested',
        counters != null && counters > 0 && `${counters} ${isCrypt ? 'blood' : (counters === 1 ? 'counter' : 'counters')}`,
        capacity != null && isCrypt && !faceDown && `capacity ${capacity}`,
    ].filter(Boolean);
    return [base, ...state].join(', ');
}
