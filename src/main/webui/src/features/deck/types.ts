export interface Deck {
    id: number;
    name: string;
    /** Compact summary stored as "{crypt},{library},{groups}" e.g. "12,80,4/5" */
    summary: string | null;
    comments: string | null;
    timestamp: string; // ISO-8601 instant
}

export interface DeckSummary {
    crypt: number;
    library: number;
    /** Sorted group numbers joined by "/", e.g. "4/5". Null when all crypt are ANY-group. */
    groups: string | null;
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

/** Matches CardSuggestionDto from the backend /cards/autocomplete endpoint. */
export interface CardSearchResult {
    id: string;
    name: string;
    crypt: boolean;
    group: string | null;
    cryptType: string | null;  // "Vampire" | "Imbued" for crypt, null for library
    types: string[];           // library types; empty array for crypt
    banned: boolean;
}