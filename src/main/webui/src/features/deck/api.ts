import type { CardDetailData, CardSearchResult, Deck, ImportPreview, KrcgContents } from './types';

const BASE  = '/api/decks';
const CARDS = '/cards';
const OPTS  = { credentials: 'include' as const };

async function json<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}

const deckApi = {
    // ── Deck CRUD ─────────────────────────────────────────────────────────────

    async list(): Promise<Deck[]> {
        return json(await fetch(BASE, OPTS));
    },

    async create(name: string): Promise<Deck> {
        return json(await fetch(BASE, {
            ...OPTS, method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        }));
    },

    async getContents(id: number): Promise<KrcgContents> {
        return json(await fetch(`${BASE}/${id}/contents`, OPTS));
    },

    async save(id: number, patch: { name?: string; contents?: KrcgContents; summary?: string | null; comments?: string | null }): Promise<Deck> {
        return json(await fetch(`${BASE}/${id}`, {
            ...OPTS, method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
        }));
    },

    async remove(id: number): Promise<void> {
        const res = await fetch(`${BASE}/${id}`, { ...OPTS, method: 'DELETE' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    },

    // ── Card data ─────────────────────────────────────────────────────────────

    async autocomplete(q: string): Promise<CardSearchResult[]> {
        if (!q.trim()) return [];
        return json(await fetch(`${CARDS}/autocomplete?q=${encodeURIComponent(q)}`, OPTS));
    },

    /** Batch detail fetch — used on deck load to enrich all entries at once. */
    async cardDetails(ids: string[]): Promise<CardDetailData[]> {
        if (!ids.length) return [];
        return json(await fetch(`${CARDS}/details?ids=${ids.join(',')}`, OPTS));
    },

    /** Single card detail — used when adding a card via the editor search box. */
    async cardDetail(id: string): Promise<CardDetailData | null> {
        const res = await fetch(`${CARDS}/${encodeURIComponent(id)}/detail`, OPTS);
        if (res.status === 404) return null;
        return json(res);
    },

    // ── Import ────────────────────────────────────────────────────────────────

    /** Send raw text (KRCG JSON or JOL) to the server for parsing and name resolution. */
    async previewImport(text: string): Promise<ImportPreview> {
        return json(await fetch(`${CARDS}/preview`, {
            ...OPTS, method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: text,
        }));
    },

    /** Create a new deck from a confirmed import preview. */
    async importDeck(name: string, entries: { cardId: string; count: number }[]): Promise<Deck> {
        return json(await fetch(`${BASE}/import`, {
            ...OPTS, method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, entries }),
        }));
    },
};

export default deckApi;
