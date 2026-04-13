import type { Tournament, TournamentStatus } from './types';

const OPTS = { credentials: 'include' as const };

async function json<T>(res: Response): Promise<T> {
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    return res.json();
}

const tournamentApi = {
    async list(status?: TournamentStatus): Promise<Tournament[]> {
        const url = status ? `/api/tournaments?status=${status}` : '/api/tournaments';
        return json(await fetch(url, OPTS));
    },

    async get(id: number): Promise<Tournament> {
        return json(await fetch(`/api/tournaments/${id}`, OPTS));
    },

    async create(payload: Partial<Tournament>): Promise<Tournament> {
        const res = await fetch('/api/tournaments', {
            ...OPTS, method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return json(res);
    },

    async update(id: number, payload: Partial<Tournament>): Promise<Tournament> {
        const res = await fetch(`/api/tournaments/${id}`, {
            ...OPTS, method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        return json(res);
    },

    async delete(id: number): Promise<void> {
        const res = await fetch(`/api/tournaments/${id}`, { ...OPTS, method: 'DELETE' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    },
};

export default tournamentApi;
