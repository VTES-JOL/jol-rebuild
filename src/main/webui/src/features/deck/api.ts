import type {CardDetailData, Deck, FormatValidity, ImportPreview, KrcgContents} from './types';
import {baseFetch, json} from "@/shared/api/client.ts";

const BASE  = '/api/decks';
const CARDS = '/api/cards';
const OPTS  = { credentials: 'include' as const };

const deckApi = {
    // ── Deck CRUD ─────────────────────────────────────────────────────────────

    async list(filter?: { format?: string; cardId?: string }): Promise<Deck[]> {
        const params = new URLSearchParams();
        if (filter?.format) params.set('format', filter.format);
        if (filter?.cardId) params.set('card', filter.cardId);
        const qs = params.size ? `?${params}` : '';
        return json(await baseFetch(`${BASE}${qs}`, OPTS));
    },

    async create(name: string): Promise<Deck> {
        return json(await baseFetch(BASE, {
            ...OPTS, method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        }));
    },

    async getContents(id: string): Promise<KrcgContents> {
        return json(await baseFetch(`${BASE}/${id}/contents`, OPTS));
    },

    async save(id: string, patch: { name?: string; contents?: KrcgContents; summary?: string | null; comments?: string | null }): Promise<Deck> {
        return json(await baseFetch(`${BASE}/${id}`, {
            ...OPTS, method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(patch),
        }));
    },

    async validityAll(id: string): Promise<Record<string, boolean>> {
        return json(await baseFetch(`${BASE}/${id}/validity`, OPTS));
    },

    async validity(id: string, format: string): Promise<FormatValidity> {
        return json(await baseFetch(`${BASE}/${id}/validity/${format}`, OPTS));
    },

    async remove(id: string): Promise<void> {
        const res = await baseFetch(`${BASE}/${id}`, { ...OPTS, method: 'DELETE' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    },

    // ── Card data ─────────────────────────────────────────────────────────────

    async autocomplete(q: string): Promise<CardDetailData[]> {
        if (!q.trim()) return [];
        return json(await baseFetch(`${CARDS}/autocomplete?q=${encodeURIComponent(q)}`, OPTS));
    },

    /** Batch detail fetch — used on deck load to enrich all entries at once. */
    async cardDetails(ids: string[]): Promise<CardDetailData[]> {
        if (!ids.length) return [];
        return json(await baseFetch(`${CARDS}/details?ids=${ids.join(',')}`, OPTS));
    },

    /** Single card detail — used when adding a card via the editor search box. */
    async cardDetail(id: string): Promise<CardDetailData | null> {
        const res = await baseFetch(`${CARDS}/${encodeURIComponent(id)}/detail`, OPTS);
        if (res.status === 404) return null;
        return json(res);
    },

    // ── Import ────────────────────────────────────────────────────────────────

    /** Send raw text (KRCG JSON or JOL) to the server for parsing and name resolution. */
    async previewImport(text: string): Promise<ImportPreview> {
        return json(await baseFetch(`${CARDS}/preview`, {
            ...OPTS, method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: text,
        }));
    },

    /** Create a new deck from a confirmed import preview. */
    async importDeck(name: string, entries: { cardId: string; count: number }[], comments?: string | null): Promise<Deck> {
        return json(await baseFetch(`${BASE}/import`, {
            ...OPTS, method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, comments: comments ?? null, entries }),
        }));
    },
};

export default deckApi;
