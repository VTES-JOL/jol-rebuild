export interface Deck {
    id: number;
    name: string;
    summary: string | null;
    comments: string | null;
    timestamp: string; // ISO-8601 instant
}