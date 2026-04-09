import type { CardIconData, CardSearchResult, Deck, KrcgContents } from './types';

const BASE = '/api/decks';
const OPTS = { credentials: 'include' as const };

async function json<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}

const deckApi = {
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

    async autocomplete(q: string): Promise<CardSearchResult[]> {
        if (!q.trim()) return [];
        return json(await fetch(`/cards/autocomplete?q=${encodeURIComponent(q)}`, OPTS));
    },

    async cardIcons(ids: string[]): Promise<CardIconData[]> {
        if (!ids.length) return [];
        return json(await fetch(`/cards/icons?ids=${ids.join(',')}`, OPTS));
    },
};

export default deckApi;