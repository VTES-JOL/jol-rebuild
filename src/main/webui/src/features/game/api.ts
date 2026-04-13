import {baseFetch, json} from "@/shared/api/client.ts";

export interface GameDto {
    id: number;
    name: string;
    status: 'OPEN' | 'ACTIVE' | 'FINISHED' | 'ABANDONED';
    format: 'STANDARD' | 'DUEL' | 'V5';
    owner: string | null;
    visibility: 'PUBLIC' | 'PRIVATE';
    registrationCount: number;
    maxPlayers: number;
}

export interface RegistrationInfo {
    username: string;
    deckName: string | null;
}

export interface InviteInfo {
    username: string;
}

export interface GameDetail extends GameDto {
    registrations: RegistrationInfo[];
    invites: InviteInfo[];
}

const OPTS = { credentials: 'include' as const };

const gameApi = {
    async getGame(id: number): Promise<GameDto> {
        return json(await baseFetch(`/api/games/${id}`, OPTS));
    },

    async listActive(): Promise<GameDto[]> {
        return json(await baseFetch('/api/games/active', OPTS));
    },

    async listOpen(): Promise<GameDto[]> {
        return json(await baseFetch('/api/games/open', OPTS));
    },

    async listMyActive(): Promise<GameDto[]> {
        return json(await baseFetch('/api/games/active/me', OPTS));
    },

    async listMyInvited(): Promise<GameDto[]> {
        return json(await baseFetch('/api/games/invited/me', OPTS));
    },

    async listMyRegistered(): Promise<GameDto[]> {
        return json(await baseFetch('/api/games/registered/me', OPTS));
    },

    async listMyOwned(): Promise<GameDto[]> {
        return json(await baseFetch('/api/games/owned/me', OPTS));
    },

    async getGameDetail(id: number): Promise<GameDetail> {
        return json(await baseFetch(`/api/games/${id}/registrations`, OPTS));
    },

    async createGame(payload: { name?: string; visibility: 'PUBLIC' | 'PRIVATE'; format: 'STANDARD' | 'DUEL' | 'V5' }): Promise<void> {
        const res = await baseFetch('/api/games', {
            ...OPTS, method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    },

    async deleteGame(id: number): Promise<void> {
        const res = await baseFetch(`/api/games/${id}`, { ...OPTS, method: 'DELETE' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    },

    async registerForGame(id: number, deckId: number): Promise<void> {
        const res = await baseFetch(`/api/games/${id}/register`, {
            ...OPTS, method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ deckId }),
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    },

    async leaveGame(id: number): Promise<void> {
        const res = await baseFetch(`/api/games/${id}/register`, { ...OPTS, method: 'DELETE' });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    },

    async updateGame(id: number, payload: { name?: string; visibility?: 'PUBLIC' | 'PRIVATE'; format?: 'STANDARD' | 'DUEL' | 'V5' }): Promise<GameDto> {
        return json(await baseFetch(`/api/games/${id}`, {
            ...OPTS, method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        }));
    },

    async updateGameFormat(id: number, format: 'STANDARD' | 'DUEL' | 'V5'): Promise<GameDto> {
        return json(await baseFetch(`/api/games/${id}/format`, {
            ...OPTS, method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ format }),
        }));
    },

    async invitePlayer(gameId: number, username: string): Promise<void> {
        const res = await baseFetch(`/api/games/${gameId}/invite`, {
            ...OPTS, method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
        });
        if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    },
};

export default gameApi;
