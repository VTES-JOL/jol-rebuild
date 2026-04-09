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

// ── KRCG deck format (pure — no extension fields) ────────────────────────────

interface KrcgCard {
    id: string;
    count: number;
    name: string;
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

/**
 * Matches CardDetailDto from the backend /cards/details endpoint.
 * Combines entry metadata (types, group, banned) with icon display data
 * so a single fetch covers everything the deck editor needs.
 */
export interface CardDetailData {
    id: string;
    name: string;
    crypt: boolean;
    // Entry metadata
    types: string[];
    group: string | null;
    banned: boolean;
    // Crypt display
    clan: string | null;
    path: string | null;
    capacity: number | null;
    disciplines: string[];
    // Library display
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

/** Resolved card entry returned by POST /cards/preview. */
export interface ImportPreview {
    format:   'krcg' | 'jol';
    deckName: string | null;
    resolved: Array<{ count: number; card: CardDetailData }>;
    errors:   Array<{ line: string; reason: string }>;
}
