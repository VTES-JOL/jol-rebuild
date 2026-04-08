export interface Deck {
    id: number;
    name: string;
    summary: string | null;
    comments: string | null;
    timestamp: string; // ISO-8601 instant
}

export interface DeckEntry {
    cardId: string;
    name: string;
    count: number;
    isCrypt: boolean;
    /** For crypt: ["Vampire"] or ["Imbued"]. For library: the card's type list. */
    types: string[];
    /** Crypt only: "1"–"7" | "ANY". */
    group?: string;
    banned: boolean;
}

export interface CardSearchResult {
    cardId: string;
    name: string;
    isCrypt: boolean;
    types: string[];
    group?: string;
    banned: boolean;
}