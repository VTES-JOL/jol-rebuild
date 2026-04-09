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

// ── KRCG deck format (with extensions for round-tripping DeckEntry) ──────────

interface KrcgCard {
    id: string;
    count: number;
    name: string;
    // Extensions: stored alongside KRCG fields so we can restore DeckEntry metadata
    group?: string;
    banned?: boolean;
    types?: string[];
}

interface KrcgLibraryGroup {
    type: string;
    count: number;
    cards: KrcgCard[];
}

export interface KrcgContents {
    crypt:   { count: number; cards: KrcgCard[] };
    library: { count: number; cards: KrcgLibraryGroup[] };
}

/** Matches CardIconDto from the backend /cards/icons endpoint. */
export interface CardIconData {
    id: string;
    crypt: boolean;
    // Crypt
    clan: string | null;
    path: string | null;
    capacity: number | null;
    disciplines: string[];
    // Library
    andDisciplines: string[];
    orDisciplines: string[];
    requirementClans: string[];
    requirementPath: string | null;
    poolCost: number | null;
    bloodCost: number | null;
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