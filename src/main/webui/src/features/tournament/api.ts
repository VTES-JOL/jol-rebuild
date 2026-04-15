import type {SeatingDto, Tournament, TournamentGame, TournamentRegistration, TournamentStatus} from './types';
import {baseFetch, json} from "@/shared/api/client.ts";

const OPTS = { credentials: 'include' as const };
const JSON_OPTS = { ...OPTS, headers: { 'Content-Type': 'application/json' } };

const tournamentApi = {
    // ── Core CRUD ──────────────────────────────────────────────────────────────

    async list(status?: TournamentStatus): Promise<Tournament[]> {
        const url = status ? `/api/tournaments?status=${status}` : '/api/tournaments';
        return json(await baseFetch(url, OPTS));
    },

    async get(id: number): Promise<Tournament> {
        return json(await baseFetch(`/api/tournaments/${id}`, OPTS));
    },

    async create(payload: Partial<Tournament>): Promise<Tournament> {
        return json(await baseFetch('/api/tournaments', { ...JSON_OPTS, method: 'POST', body: JSON.stringify(payload) }));
    },

    async update(id: number, payload: Partial<Tournament>): Promise<Tournament> {
        return json(await baseFetch(`/api/tournaments/${id}`, { ...JSON_OPTS, method: 'PUT', body: JSON.stringify(payload) }));
    },

    async remove(id: number): Promise<void> {
        const res = await baseFetch(`/api/tournaments/${id}`, { ...OPTS, method: 'DELETE' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    },

    // ── Status Transitions ─────────────────────────────────────────────────────

    async publish(id: number): Promise<Tournament> {
        return json(await baseFetch(`/api/tournaments/${id}/publish`, { ...JSON_OPTS, method: 'POST' }));
    },

    async unpublish(id: number): Promise<Tournament> {
        return json(await baseFetch(`/api/tournaments/${id}/unpublish`, { ...JSON_OPTS, method: 'POST' }));
    },

    async beginSeating(id: number): Promise<Tournament> {
        return json(await baseFetch(`/api/tournaments/${id}/seat`, { ...JSON_OPTS, method: 'POST' }));
    },

    async activate(id: number): Promise<Tournament> {
        return json(await baseFetch(`/api/tournaments/${id}/activate`, { ...JSON_OPTS, method: 'POST' }));
    },

    // ── Player Registration ────────────────────────────────────────────────────

    async getRegistrations(id: number): Promise<TournamentRegistration[]> {
        return json(await baseFetch(`/api/tournaments/${id}/registrations`, OPTS));
    },

    async register(id: number, deckIds: number[]): Promise<TournamentRegistration> {
        return json(await baseFetch(`/api/tournaments/${id}/registrations`, {
            ...JSON_OPTS, method: 'POST', body: JSON.stringify({ deckIds }),
        }));
    },

    async unregister(id: number): Promise<void> {
        const res = await baseFetch(`/api/tournaments/${id}/registrations`, { ...OPTS, method: 'DELETE' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    },

    // ── Seating Management ─────────────────────────────────────────────────────

    async getSeating(id: number): Promise<SeatingDto> {
        return json(await baseFetch(`/api/tournaments/${id}/seating`, OPTS));
    },

    async addTable(id: number, roundNumber: number): Promise<{ id: number }> {
        return json(await baseFetch(`/api/tournaments/${id}/tables`, {
            ...JSON_OPTS, method: 'POST', body: JSON.stringify({ roundNumber }),
        }));
    },

    async removeTable(id: number, tableId: number): Promise<void> {
        const res = await baseFetch(`/api/tournaments/${id}/tables/${tableId}`, { ...OPTS, method: 'DELETE' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    },

    async addSeat(id: number, tableId: number, registrationId: number, seatPosition: number): Promise<void> {
        const res = await baseFetch(`/api/tournaments/${id}/tables/${tableId}/seats`, {
            ...JSON_OPTS, method: 'POST', body: JSON.stringify({ registrationId, seatPosition }),
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    },

    async removeSeat(id: number, tableId: number, seatId: number): Promise<void> {
        const res = await baseFetch(`/api/tournaments/${id}/tables/${tableId}/seats/${seatId}`, { ...OPTS, method: 'DELETE' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    },

    async addBye(id: number, roundNumber: number, registrationId: number): Promise<void> {
        const res = await baseFetch(`/api/tournaments/${id}/rounds/${roundNumber}/byes`, {
            ...JSON_OPTS, method: 'POST', body: JSON.stringify({ registrationId }),
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    },

    async removeSeatOrBye(id: number, seatId: number): Promise<void> {
        const res = await baseFetch(`/api/tournaments/${id}/seats/${seatId}`, { ...OPTS, method: 'DELETE' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    },

    async addExtraRound(id: number): Promise<Tournament> {
        return json(await baseFetch(`/api/tournaments/${id}/extra-round`, { ...JSON_OPTS, method: 'POST' }));
    },

    // ── Active Tournament ──────────────────────────────────────────────────────

    async getTournamentGames(id: number): Promise<TournamentGame[]> {
        return json(await baseFetch(`/api/tournaments/${id}/games`, OPTS));
    },
};

export default tournamentApi;
