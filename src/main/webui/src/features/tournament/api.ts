import type {Tournament, TournamentStatus} from './types';
import {baseFetch, json} from "@/shared/api/client.ts";

const OPTS = { credentials: 'include' as const };

const tournamentApi = {
    async list(status?: TournamentStatus): Promise<Tournament[]> {
        const url = status ? `/api/tournaments?status=${status}` : '/api/tournaments';
        return json(await baseFetch(url, OPTS));
    },

    async get(id: number): Promise<Tournament> {
        return json(await baseFetch(`/api/tournaments/${id}`, OPTS));
    },

    async create(payload: Partial<Tournament>): Promise<Tournament> {
        const res = await baseFetch('/api/tournaments', {
            ...OPTS, method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return json(res);
    },

    async update(id: number, payload: Partial<Tournament>): Promise<Tournament> {
        const res = await baseFetch(`/api/tournaments/${id}`, {
            ...OPTS, method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return json(res);
    },

    async remove(id: number): Promise<void> {
        const res = await baseFetch(`/api/tournaments/${id}`, { ...OPTS, method: 'DELETE' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    },
};

export default tournamentApi;
